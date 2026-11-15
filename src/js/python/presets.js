export const PYTHON_PRESETS = {
    loop: `from djitellopy import Tello

# Mission: fly a square through four gates using a loop.
tello = Tello()
tello.connect()
tello.takeoff()
tello.move_up(300)
tello.set_speed(100)

for _ in range(4):
    # TODO: move forward 600 cm (two move_forward(300)) and rotate 90 degrees.
    pass

tello.land()
tello.end()`,
    functions: `from djitellopy import Tello

# Mission: reuse a square function at two altitudes.
tello = Tello()
tello.connect()
tello.takeoff()
tello.move_up(300)
tello.set_speed(100)

def fly_square():
    for _ in range(4):
        # TODO: draw one 600 cm side (two move_forward(300)).
        pass

fly_square()

# TODO: climb 700 cm and call fly_square() again.
# tello.move_up(500)
# tello.move_up(200)
# fly_square()

tello.land()
tello.end()`,
    variables: `from djitellopy import Tello

# Mission: use variables for the heights and distances.
tello = Tello()
tello.connect()
tello.takeoff()
tello.set_speed(100)

altitude = 300
step = 100
distance = 400

# TODO: use the variables in move_up() and move_forward().
# The route climbs 300, moves 400, climbs 100, moves 400,
# climbs 100, moves 400, then moves 400 to the pad.
# tello.move_up(altitude)
# tello.move_forward(distance)

tello.land()
tello.end()`,
    conditionals: `from djitellopy import Tello

# Mission: use conditions to check the height before each gate.
tello = Tello()
tello.connect()
tello.takeoff()
tello.set_speed(100)

target = 400

if tello.get_height() < target:
    tello.move_up(target - tello.get_height())

tello.move_forward(400)

# TODO: check the height before the next two gates.
# Update target to 500 and 600, climb only when needed,
# then move forward 400 after each check.
# After the third gate, move forward 400 to the pad.

tello.land()
tello.end()`,
    summit: `from djitellopy import Tello
import time

# Mission: climb to each gate with a while loop and the height sensor.
tello = Tello()
tello.connect()
tello.takeoff()
tello.set_speed(100)

target = 400

while tello.get_height() < target:
    tello.move_up(50)
    time.sleep(0.1)

# The two forward moves cross the first gate and clear its ring
# before the next climb.
tello.move_forward(300)
tello.move_forward(300)

# TODO: repeat the same pattern for target 700 and target 1000.
# Move forward 400 after each of the next two gates.
# After the third gate, move forward 200 to the pad.

tello.land()
tello.end()`,
    obstacles: `from djitellopy import Tello

# Mission: follow the zig-zag between the towers.
tello = Tello()
tello.connect()
tello.takeoff()
tello.move_up(300)
tello.set_speed(100)

# TODO: fly through the three gates.
# Hint: turn 45 degrees after the first ring.
# tello.move_forward(500)
# tello.rotate_clockwise(45)

tello.land()
tello.end()`,
    playground: `from djitellopy import Tello

# Mission: pass through all three rings and land back on the pad.
tello = Tello()
tello.connect()
tello.set_speed(100)
tello.takeoff()

# TODO: fly through the three rings and land on the green pad.
# Hint: climb to the ring height before moving forward.
# tello.move_up(300)
# tello.move_forward(400)
# After the third ring:
# tello.move_forward(300)

tello.land()
tello.end()`,
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
