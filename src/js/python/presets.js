export const PYTHON_PRESETS = {
    square: `from djitellopy import Tello

# Fly a square and land. Distances are in centimetres.
tello = Tello()
tello.connect()
print("Battery:", tello.get_battery(), "%")

tello.takeoff()

for _ in range(4):
    tello.move_forward(100)
    tello.rotate_clockwise(90)

tello.land()
tello.end()`,
    hello: `from djitellopy import Tello

# First flight: connect, take off, climb and land.
tello = Tello()
tello.connect()
print("Battery:", tello.get_battery(), "%")
print("Height:", tello.get_height(), "cm")

tello.takeoff()
tello.move_up(50)
print("Height:", tello.get_height(), "cm")
tello.land()
tello.end()`,
    sensors: `from djitellopy import Tello

# Read the simulated sensors while flying.
tello = Tello()
tello.connect()
print("Battery:", tello.get_battery(), "%")

tello.takeoff()
tello.move_forward(100)

pitch, roll, yaw = tello.get_attitude()
print("Attitude:", round(pitch, 1), round(roll, 1), round(yaw, 1))
print("Height:", tello.get_height(), "cm")
print("Time:", tello.get_flight_time(), "s")

tello.land()
tello.end()`,
};
