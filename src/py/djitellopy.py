"""Simulator-backed subset of the djitellopy API for AERO-SIM.

Student code can keep using the familiar ``from djitellopy import Tello``
import. Every command is sent to the browser simulation instead of a real
drone over UDP.
"""

import json

import aero_bridge
from pyodide.ffi import run_sync

AERO_SIM = True


class TelloError(Exception):
    """Raised when a simulated Tello command cannot be completed."""


class Tello:
    def __init__(self, *args, **kwargs):
        # Arguments are accepted for source compatibility with djitellopy.
        # The simulator does not use a host or retry configuration.
        self.is_flying = False
        self.connected = False
        self._speed = 50

    def _call(self, method, *args):
        payload = json.dumps(list(args))
        raw = run_sync(aero_bridge.call(method, payload))
        result = json.loads(raw)

        if not result.get("ok"):
            error = result.get("error") or {}
            message = error.get("message") or "Tello command failed."
            # Do not raise KeyboardInterrupt inside a suspended JSPI call:
            # Pyodide can surface that as an unhandled worker error. The worker
            # still marks the run as stopped from its own stop flag.
            raise TelloError(message)

        return result.get("value")

    def _require_flying(self):
        if not self.is_flying:
            raise TelloError("Drone is not flying. Call takeoff() first.")

    def connect(self):
        self._call("connect")
        self.connected = True
        return "ok"

    def end(self):
        if self.is_flying:
            self.land()
        self.connected = False
        return "ok"

    def takeoff(self):
        self._call("takeoff")
        self.is_flying = True
        return "ok"

    def land(self):
        self._call("land")
        self.is_flying = False
        return "ok"

    def emergency(self):
        self._call("emergency")
        self.is_flying = False
        return "ok"

    def move_forward(self, distance):
        self._require_flying()
        self._call("move_forward", distance)
        return "ok"

    def move_back(self, distance):
        self._require_flying()
        self._call("move_back", distance)
        return "ok"

    def move_left(self, distance):
        self._require_flying()
        self._call("move_left", distance)
        return "ok"

    def move_right(self, distance):
        self._require_flying()
        self._call("move_right", distance)
        return "ok"

    def move_up(self, distance):
        self._require_flying()
        self._call("move_up", distance)
        return "ok"

    def move_down(self, distance):
        self._require_flying()
        self._call("move_down", distance)
        return "ok"

    def rotate_clockwise(self, degrees):
        self._require_flying()
        self._call("rotate_clockwise", degrees)
        return "ok"

    def rotate_counter_clockwise(self, degrees):
        self._require_flying()
        self._call("rotate_counter_clockwise", degrees)
        return "ok"

    def set_speed(self, speed):
        self._call("set_speed", speed)
        self._speed = speed
        return "ok"

    def get_speed(self):
        return self._call("get_speed")

    def send_rc_control(self, left_right_velocity, forward_backward_velocity,
                        up_down_velocity, yaw_velocity):
        self._require_flying()
        self._call(
            "send_rc_control",
            left_right_velocity,
            forward_backward_velocity,
            up_down_velocity,
            yaw_velocity,
        )
        return "ok"

    def get_battery(self):
        return self._call("get_battery")

    def get_height(self):
        return self._call("get_height")

    def get_distance_tof(self):
        return self._call("get_distance_tof")

    def get_baro(self):
        return self._call("get_baro")

    def get_temperature(self):
        return self._call("get_temperature")

    def get_attitude(self):
        pitch, roll, yaw = self._call("get_attitude")
        return pitch, roll, yaw

    def get_yaw(self):
        return self._call("get_yaw")

    def get_pitch(self):
        return self._call("get_pitch")

    def get_roll(self):
        return self._call("get_roll")

    def get_velocity_x(self):
        return self._call("get_velocity_x")

    def get_velocity_y(self):
        return self._call("get_velocity_y")

    def get_velocity_z(self):
        return self._call("get_velocity_z")

    def get_flight_time(self):
        return self._call("get_flight_time")

    # Video is intentionally out of scope for the simulator.
    def streamon(self):
        raise NotImplementedError("Video streaming is not available in AERO-SIM.")

    def streamoff(self):
        raise NotImplementedError("Video streaming is not available in AERO-SIM.")

    def get_frame_read(self):
        raise NotImplementedError("Video streaming is not available in AERO-SIM.")


class TelloSwarm:
    def __init__(self, *args, **kwargs):
        raise NotImplementedError("TelloSwarm is not available in AERO-SIM.")
