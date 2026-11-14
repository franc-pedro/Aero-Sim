import * as THREE from 'three';
import { droneState } from '../core/state.js';
import { GROUND_HEIGHT } from '../simulation/constants.js';

const DEFAULT_SPEED_CM_S = 50;
const MIN_SPEED_CM_S = 10;
const MAX_SPEED_CM_S = 100;
const MIN_DISTANCE_CM = 20;
const MAX_DISTANCE_CM = 500;
const MAX_ROTATION_DEG = 360;
const RC_TTL_SECONDS = 0.5;
const HOVER_THROTTLE = 50;
const CONTROL_AUTHORITY = 18;

const _euler = new THREE.Euler(0, 0, 0, 'YXZ');
const _yawQuat = new THREE.Quaternion();
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _upAxis = new THREE.Vector3(0, 1, 0);

let activeCommand = null;
let speedCmS = DEFAULT_SPEED_CM_S;
let flightActive = false;
let flightTime = 0;
let rcState = { throttle: HOVER_THROTTLE, pitch: 0, roll: 0, yaw: 0, ttl: 0 };

export class TelloCommandError extends Error {
    constructor(message, code = 'tello_error') {
        super(message);
        this.name = 'TelloCommandError';
        this.code = code;
    }
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function normalizeYawDegrees() {
    let degrees = THREE.MathUtils.radToDeg(droneState.heading) % 360;
    if (degrees > 180) degrees -= 360;
    if (degrees < -180) degrees += 360;
    return degrees;
}

function getHeightCm() {
    return Math.max(0, (droneState.pos.y - GROUND_HEIGHT) * 100);
}

function setHoverSticks() {
    droneState.throttle = HOVER_THROTTLE;
    droneState.pitch = 0;
    droneState.roll = 0;
    droneState.yaw = 0;
}

function updateHeadingVectors() {
    _yawQuat.setFromAxisAngle(_upAxis, droneState.heading);
    _forward.set(0, 0, 1).applyQuaternion(_yawQuat);
    _right.set(-1, 0, 0).applyQuaternion(_yawQuat);
}

function readNumber(args, index, label) {
    const value = Number(args?.[index]);
    if (!Number.isFinite(value)) {
        throw new TelloCommandError(`${label} must be a number.`, 'value_error');
    }
    return value;
}

function validateDistance(distance) {
    if (distance < MIN_DISTANCE_CM || distance > MAX_DISTANCE_CM) {
        throw new TelloCommandError(
            `Distance must be between ${MIN_DISTANCE_CM} and ${MAX_DISTANCE_CM} cm.`,
            'value_error'
        );
    }
}

function validateRotation(degrees) {
    if (degrees <= 0 || degrees > MAX_ROTATION_DEG) {
        throw new TelloCommandError(
            `Rotation must be between 1 and ${MAX_ROTATION_DEG} degrees.`,
            'value_error'
        );
    }
}

function validateRcValue(value, label) {
    if (value < -100 || value > 100) {
        throw new TelloCommandError(`${label} must be between -100 and 100.`, 'value_error');
    }
}

function beginCommand(type, options) {
    if (activeCommand) {
        return Promise.reject(new TelloCommandError('Another command is already running.', 'busy'));
    }

    return new Promise((resolve, reject) => {
        activeCommand = {
            type,
            resolve,
            reject,
            elapsed: 0,
            ...options,
        };
    });
}

function finishCommand(value = 'ok') {
    if (!activeCommand) return;
    const { resolve } = activeCommand;
    activeCommand = null;
    resolve(value);
}

function failCommand(message, code = 'tello_error') {
    if (!activeCommand) return;
    const { reject } = activeCommand;
    activeCommand = null;
    reject(new TelloCommandError(message, code));
}

function applyVerticalHold(targetY) {
    const error = targetY - droneState.pos.y;
    const command = clamp(error * 30 - droneState.vel.y * 10, -50, 50);
    droneState.throttle = clamp(HOVER_THROTTLE + command, 0, 100);
}

function applyHorizontalPosition(target, maxSpeed) {
    updateHeadingVectors();

    const errorX = target.x - droneState.pos.x;
    const errorZ = target.z - droneState.pos.z;
    const distance = Math.hypot(errorX, errorZ);

    // Trapezoidal speed profile: cruise at the configured speed and slow down
    // smoothly over the final centimetres instead of crawling the whole move.
    const brakeSpeed = Math.sqrt(2 * 2.5 * Math.max(0, distance));
    const speedLimit = Math.min(maxSpeed, brakeSpeed);
    const desiredX = distance > 1e-6 ? (errorX / distance) * speedLimit : 0;
    const desiredZ = distance > 1e-6 ? (errorZ / distance) * speedLimit : 0;

    // The feed-forward term compensates for the simulator's horizontal drag,
    // so the cruise speed matches set_speed() instead of settling below it.
    const accelX = (desiredX - droneState.vel.x) * 4.0 + desiredX * 1.8;
    const accelZ = (desiredZ - droneState.vel.z) * 4.0 + desiredZ * 1.8;

    // Convert the world-frame acceleration request into body-frame pitch/roll.
    const forwardAccel = accelX * _forward.x + accelZ * _forward.z;
    const rightAccel = accelX * _right.x + accelZ * _right.z;

    droneState.pitch = clamp(forwardAccel / CONTROL_AUTHORITY, -0.7, 0.7);
    droneState.roll = clamp(rightAccel / CONTROL_AUTHORITY, -0.7, 0.7);
    droneState.yaw = 0;
}

function horizontalDistanceTo(target) {
    return Math.hypot(target.x - droneState.pos.x, target.z - droneState.pos.z);
}

function horizontalSpeed() {
    return Math.hypot(droneState.vel.x, droneState.vel.z);
}

function startTakeoff() {
    if (flightActive) {
        throw new TelloCommandError('Drone is already flying.', 'state_error');
    }

    // If the simulation starts airborne (for example after a manual flight),
    // treat takeoff as an already-completed takeoff instead of descending.
    if (droneState.pos.y > GROUND_HEIGHT + 0.35) {
        flightActive = true;
        return Promise.resolve('ok');
    }

    flightActive = true;
    return beginCommand('takeoff', {
        targetY: GROUND_HEIGHT + 1.0,
        timeout: 8,
    });
}

function startLand() {
    if (!flightActive && droneState.pos.y <= GROUND_HEIGHT + 0.1) {
        throw new TelloCommandError('Drone is not flying.', 'state_error');
    }

    flightActive = true;
    return beginCommand('land', {
        targetY: GROUND_HEIGHT,
        timeout: 12,
    });
}

function startMove(direction, distanceCm) {
    if (!flightActive) {
        throw new TelloCommandError('Drone is not flying. Call takeoff() first.', 'state_error');
    }

    validateDistance(distanceCm);
    updateHeadingVectors();

    const distance = distanceCm / 100;
    const target = droneState.pos.clone();
    const targetY = droneState.pos.y;

    switch (direction) {
        case 'forward':
            target.addScaledVector(_forward, distance);
            break;
        case 'back':
            target.addScaledVector(_forward, -distance);
            break;
        case 'right':
            target.addScaledVector(_right, distance);
            break;
        case 'left':
            target.addScaledVector(_right, -distance);
            break;
        case 'up':
            target.y += distance;
            break;
        case 'down':
            target.y = Math.max(GROUND_HEIGHT, target.y - distance);
            break;
        default:
            throw new TelloCommandError(`Unknown movement direction: ${direction}`, 'unsupported');
    }

    const verticalOnly = direction === 'up' || direction === 'down';
    const maxSpeed = speedCmS / 100;
    const duration = verticalOnly ? Math.abs(distance) / 0.5 : distance / maxSpeed;

    return beginCommand('move', {
        target,
        targetY: verticalOnly ? target.y : targetY,
        maxSpeed,
        verticalOnly,
        timeout: Math.max(4, duration * 2 + 3),
    });
}

function startRotate(direction, degrees) {
    if (!flightActive) {
        throw new TelloCommandError('Drone is not flying. Call takeoff() first.', 'state_error');
    }

    validateRotation(degrees);

    const delta = THREE.MathUtils.degToRad(degrees) * (direction === 'clockwise' ? -1 : 1);

    return beginCommand('rotate', {
        delta,
        turned: 0,
        lastHeading: droneState.heading,
        timeout: Math.max(3, Math.abs(delta) / 2.0 + 2),
    });
}

function updateActiveCommand(dt) {
    activeCommand.elapsed += dt;

    const command = activeCommand;
    setHoverSticks();
    applyVerticalHold(command.targetY ?? droneState.pos.y);

    if (command.type === 'takeoff') {
        const altitudeError = Math.abs(command.targetY - droneState.pos.y);
        if (altitudeError < 0.1 && Math.abs(droneState.vel.y) < 0.2) {
            finishCommand();
            return;
        }
    } else if (command.type === 'land') {
        applyVerticalHold(GROUND_HEIGHT);
        if (droneState.pos.y <= GROUND_HEIGHT + 0.035 && Math.abs(droneState.vel.y) < 0.25) {
            droneState.pos.y = GROUND_HEIGHT;
            droneState.vel.set(0, 0, 0);
            droneState.throttle = 0;
            flightActive = false;
            finishCommand();
            return;
        }
    } else if (command.type === 'move') {
        if (!command.verticalOnly) {
            applyHorizontalPosition(command.target, command.maxSpeed);
        }
        const target = command.target;
        const reached = command.verticalOnly
            ? Math.abs(target.y - droneState.pos.y) < 0.1 && Math.abs(droneState.vel.y) < 0.2
            : horizontalDistanceTo(target) < 0.1 && horizontalSpeed() < 0.18;

        if (reached) {
            finishCommand();
            return;
        }
    } else if (command.type === 'rotate') {
        // Accumulate the actual signed heading change. This keeps working when
        // heading wraps at +/-pi and also supports a full 360-degree turn.
        const currentHeading = droneState.heading;
        const stepDelta = Math.atan2(
            Math.sin(currentHeading - command.lastHeading),
            Math.cos(currentHeading - command.lastHeading)
        );
        command.turned += stepDelta;
        command.lastHeading = currentHeading;

        const remaining = command.delta - command.turned;
        if (Math.abs(remaining) < 0.02) {
            droneState.yaw = 0;
            finishCommand();
            return;
        }
        droneState.yaw = clamp(remaining * 1.8, -1, 1);
    }

    if (command.elapsed > command.timeout) {
        failCommand(`Command timed out: ${command.type}.`, 'timeout');
    }
}

export function executeTelloCommand(method, args = []) {
    try {
        switch (method) {
            case 'connect':
                return Promise.resolve(Math.round(droneState.battery));

            case 'takeoff':
                return startTakeoff();

            case 'land':
                return startLand();

            case 'end':
                if (flightActive || droneState.pos.y > GROUND_HEIGHT + 0.1) {
                    return startLand();
                }
                return Promise.resolve('ok');

            case 'emergency':
                flightActive = false;
                rcState.ttl = 0;
                setHoverSticks();
                droneState.throttle = 0;
                droneState.flight.status = 'crashed';
                droneState.flight.cause = 'emergency';
                droneState.flight.impactSpeed = 0;
                droneState.flight.time = 0;
                droneState.flight.resting = false;
                return Promise.resolve('ok');

            case 'move_forward': {
                const distance = readNumber(args, 0, 'distance');
                return startMove('forward', distance);
            }
            case 'move_back': {
                const distance = readNumber(args, 0, 'distance');
                return startMove('back', distance);
            }
            case 'move_left': {
                const distance = readNumber(args, 0, 'distance');
                return startMove('left', distance);
            }
            case 'move_right': {
                const distance = readNumber(args, 0, 'distance');
                return startMove('right', distance);
            }
            case 'move_up': {
                const distance = readNumber(args, 0, 'distance');
                return startMove('up', distance);
            }
            case 'move_down': {
                const distance = readNumber(args, 0, 'distance');
                return startMove('down', distance);
            }

            case 'rotate_clockwise': {
                const degrees = readNumber(args, 0, 'degrees');
                return startRotate('clockwise', degrees);
            }
            case 'rotate_counter_clockwise': {
                const degrees = readNumber(args, 0, 'degrees');
                return startRotate('counter_clockwise', degrees);
            }

            case 'set_speed': {
                const speed = readNumber(args, 0, 'speed');
                if (speed < MIN_SPEED_CM_S || speed > MAX_SPEED_CM_S) {
                    throw new TelloCommandError(
                        `Speed must be between ${MIN_SPEED_CM_S} and ${MAX_SPEED_CM_S} cm/s.`,
                        'value_error'
                    );
                }
                speedCmS = speed;
                return Promise.resolve('ok');
            }

            case 'get_speed':
                return Promise.resolve(speedCmS);

            case 'send_rc_control': {
                if (!flightActive) {
                    throw new TelloCommandError('Drone is not flying. Call takeoff() first.', 'state_error');
                }
                const leftRight = readNumber(args, 0, 'left_right');
                const forwardBackward = readNumber(args, 1, 'forward_backward');
                const upDown = readNumber(args, 2, 'up_down');
                const yaw = readNumber(args, 3, 'yaw');
                validateRcValue(leftRight, 'left_right');
                validateRcValue(forwardBackward, 'forward_backward');
                validateRcValue(upDown, 'up_down');
                validateRcValue(yaw, 'yaw');

                rcState = {
                    throttle: clamp(HOVER_THROTTLE + upDown / 2, 0, 100),
                    pitch: forwardBackward / 100,
                    roll: leftRight / 100,
                    yaw: -yaw / 100,
                    ttl: RC_TTL_SECONDS,
                };
                return Promise.resolve('ok');
            }

            case 'get_battery':
                return Promise.resolve(Math.round(droneState.battery));

            case 'get_height':
            case 'get_distance_tof':
                return Promise.resolve(Math.round(getHeightCm()));

            case 'get_baro':
                return Promise.resolve(Math.round(getHeightCm()));

            case 'get_temperature':
                return Promise.resolve(Math.round((30 + droneState.throttle * 0.02) * 10) / 10);

            case 'get_attitude':
                _euler.setFromQuaternion(droneState.quaternion, 'YXZ');
                return Promise.resolve([
                    THREE.MathUtils.radToDeg(_euler.x),
                    THREE.MathUtils.radToDeg(_euler.z),
                    normalizeYawDegrees(),
                ]);

            case 'get_yaw':
                return Promise.resolve(normalizeYawDegrees());

            case 'get_pitch':
                _euler.setFromQuaternion(droneState.quaternion, 'YXZ');
                return Promise.resolve(THREE.MathUtils.radToDeg(_euler.x));

            case 'get_roll':
                _euler.setFromQuaternion(droneState.quaternion, 'YXZ');
                return Promise.resolve(THREE.MathUtils.radToDeg(_euler.z));

            case 'get_velocity_x':
            case 'get_velocity_y':
            case 'get_velocity_z': {
                updateHeadingVectors();
                const forwardSpeed = droneState.vel.dot(_forward) * 100;
                const rightSpeed = droneState.vel.dot(_right) * 100;
                if (method === 'get_velocity_x') return Promise.resolve(Math.round(forwardSpeed));
                if (method === 'get_velocity_y') return Promise.resolve(Math.round(rightSpeed));
                return Promise.resolve(Math.round(droneState.vel.y * 100));
            }

            case 'get_flight_time':
                return Promise.resolve(Math.round(flightTime));

            default:
                throw new TelloCommandError(
                    `Command not supported in this phase: ${method}`,
                    'unsupported'
                );
        }
    } catch (error) {
        if (error instanceof TelloCommandError) return Promise.reject(error);
        return Promise.reject(new TelloCommandError(error?.message || String(error)));
    }
}

export function updateTelloCommand(dt) {
    if (droneState.flight.status === 'crashed') {
        abortTelloCommand(new TelloCommandError('The drone crashed.', 'crashed'));
        return;
    }

    if (flightActive) {
        flightTime += dt;
    }

    if (activeCommand) {
        updateActiveCommand(dt);
        return;
    }

    if (rcState.ttl > 0) {
        rcState.ttl = Math.max(0, rcState.ttl - dt);
        droneState.throttle = rcState.throttle;
        droneState.pitch = rcState.pitch;
        droneState.roll = rcState.roll;
        droneState.yaw = rcState.yaw;
        return;
    }

    setHoverSticks();
}

export function abortTelloCommand(error = new TelloCommandError('Flight aborted.', 'aborted')) {
    rcState.ttl = 0;
    if (!activeCommand) return;
    const { reject } = activeCommand;
    activeCommand = null;
    reject(error);
}

export function resetTelloCommandState() {
    abortTelloCommand(new TelloCommandError('Flight reset.', 'aborted'));
    speedCmS = DEFAULT_SPEED_CM_S;
    flightActive = false;
    flightTime = 0;
    rcState = { throttle: HOVER_THROTTLE, pitch: 0, roll: 0, yaw: 0, ttl: 0 };
    setHoverSticks();
}

export function isTelloFlightActive() {
    return flightActive;
}
