export const PYTHON_PRESETS = {
    square: `import math

# Autonomous Waypoint Square Pattern
# state keys: x, y, z, vx, vy, vz, yaw, pitch, roll, time, battery
# return: {'throttle': 0..100 (50=hover), 'pitch': -1..1, 'roll': -1..1, 'yaw': -1..1}

WAYPOINTS = [
    (0.0, 5.0, 15.0),
    (15.0, 5.0, 15.0),
    (15.0, 5.0, 0.0),
    (0.0, 5.0, 0.0),
]

def control_step(state, dt):
    idx = int(state['time'] // 6) % len(WAYPOINTS)
    tx, ty, tz = WAYPOINTS[idx]

    ex = tx - state['x']
    ey = ty - state['y']
    ez = tz - state['z']

    # Altitude PD controller (50 = neutral hover)
    throttle = max(0.0, min(100.0, 50.0 + ey * 10.0 - state['vy'] * 5.0))

    # World-frame desired velocity -> body-frame pitch & roll
    yaw = state['yaw']
    desired_vx = max(-1.0, min(1.0, ex * 0.18 - state['vx'] * 0.25))
    desired_vz = max(-1.0, min(1.0, ez * 0.18 - state['vz'] * 0.25))

    pitch = desired_vz * math.cos(yaw) + desired_vx * math.sin(yaw)
    roll  = -desired_vx * math.cos(yaw) + desired_vz * math.sin(yaw)

    return {
        'throttle': throttle,
        'pitch': max(-0.8, min(0.8, pitch)),
        'roll': max(-0.8, min(0.8, roll)),
        'yaw': 0.0
    }`,
    orbit: `import math

# Smooth Circular Orbit + Sine Altitude Wave
def control_step(state, dt):
    t = state['time']
    radius = 12.0
    omega = 0.45

    tx = math.cos(omega * t) * radius
    tz = math.sin(omega * t) * radius
    ty = 6.0 + math.sin(t * 0.8) * 2.5

    ex, ey, ez = tx - state['x'], ty - state['y'], tz - state['z']
    throttle = max(0.0, min(100.0, 50.0 + ey * 9.0 - state['vy'] * 4.5))

    yaw = state['yaw']
    vx_cmd = max(-1.0, min(1.0, ex * 0.2 - state['vx'] * 0.2))
    vz_cmd = max(-1.0, min(1.0, ez * 0.2 - state['vz'] * 0.2))

    pitch = vz_cmd * math.cos(yaw) + vx_cmd * math.sin(yaw)
    roll  = -vx_cmd * math.cos(yaw) + vz_cmd * math.sin(yaw)

    return {
        'throttle': throttle,
        'pitch': max(-0.85, min(0.85, pitch)),
        'roll': max(-0.85, min(0.85, roll)),
        'yaw': 0.25
    }`,
    slalom: `import math

# Forward Cruise with Lateral Sine Slalom
def control_step(state, dt):
    t = state['time']
    target_alt = 4.5
    ey = target_alt - state['y']

    throttle = max(0.0, min(100.0, 50.0 + ey * 10.0 - state['vy'] * 5.0))
    roll_wave = math.sin(t * 1.4) * 0.55

    return {
        'throttle': throttle,
        'pitch': 0.45,
        'roll': roll_wave,
        'yaw': 0.0
    }`,
};
