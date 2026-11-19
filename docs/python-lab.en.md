[🇬🇧 English](python-lab.en.md) | [🇵🇹 Português](python-lab.md)

# Teacher's Guide — Python Lab

This guide accompanies **AERO-SIM 1.10.1** and the **Python Code** mode. The goal is to use the simulator to teach programming with Python, drones and concrete objectives, without needing real hardware.

## 1. What students learn

The lab allows students to work, progressively, on:

- sequences of instructions;
- variables and values;
- `print()` and sensor reading;
- `for` and `while` loops;
- functions;
- conditionals;
- debugging and reading errors;
- notions of spatial orientation, distance and angle.

The Python API is compatible with the subset of **djitellopy**. The code can be reused on a real Tello, provided the student switches to the real library and a physical drone.

## Mission path

| Level | Concept | Gates | Landing pad |
|---|---|---|---|
| Python Playground | Sequence | 3 | Green, at the end |
| Loop Lagoon | `for` loops | 4 | Back to start |
| Function Forge | Functions | 8 (two laps) | Back to start |
| Obstacle Alley | Obstacles and direction | 3 | Green, at the end |
| Variable Valley | Variables and parameters | 3 | Green, at the end |
| Conditional Canyon | Conditionals and sensors | 3 | Green, at the end |
| Sensor Summit | `while` loops and sensors | 3 | Green, at the end |

The **Training Course** and **Ring Gauntlet** levels remain available as free flight and manual challenges.

## 2. Requirements

- Node.js `^20.19.0` or `>=22.12.0` to serve the application.
- A modern browser with **JSPI**:
  - Chrome/Edge 137+
  - Firefox 153+
  - Safari 27+

In browsers without JSPI, Manual mode keeps working, but Python does not start.

## 3. Preparation

```bash
npm install
npm run dev
```

To prepare a version for the school:

```bash
npm run build
```

The contents of `dist/` can be served by a static server. The reference online version is at:

```text
https://franc-pedro.github.io/Aero-Sim/
```

Deployment is automatic on GitHub Pages for every push to the main branch. Pyodide and CodeMirror are served locally; no CDNs are needed. The first load is larger (Pyodide + CodeMirror); subsequent visits reuse the browser cache.

Student code is stored in the browser's `localStorage`, per level. It is never sent to any server.

## 4. First lesson — first flight

1. Open the application.
2. Choose **Python Code**.
3. Wait for **Python ready**.
4. Select the **First Flight** example.
5. Run it with **Run Script** or `Ctrl+Enter`.

Base code:

```python
from djitellopy import Tello

tello = Tello()
tello.connect()
print("Battery:", tello.get_battery(), "%")

tello.takeoff()
tello.move_up(50)
print("Height:", tello.get_height(), "cm")
tello.land()
tello.end()
```

Questions for the class:

- What happens if we remove `tello.takeoff()`?
- What changes if we use `move_up(100)`?
- Why does `Height: 0` appear before takeoff?

> **Tablet/phone:** when the script runs, the simulator goes full screen to follow the flight. The top bar allows **Stop** or returning to the lab; when the run ends, the editor comes back automatically. In Manual mode, the joysticks use the **Smooth** profile by default, with progressive response and limits to avoid abrupt movements.

## 5. Guided mission — Playground Circuit

The **Python Playground** level is the starting level and includes the **Playground Circuit** mission.

Objective:

> Take off, fly through the three gates and land on the green pad.

Success criteria:

1. The drone takes off.
2. It flies through the three gates.
3. It lands on the green pad after the third gate.
4. It does not collide with the gate frames.

The lab shows the progress (`Gates 0/3`), the landing state and the hints. The mission is marked as completed when all three gates are passed and the landing happens on the green pad.

### Lesson, quiz and progress

- The **Lesson** button opens the objectives, the explanation, the syntax, the keywords and a quick check.
- The **Progress** button shows completed missions, hints used and quiz results.
- Check marks ✓ appear in the level selector.
- Progress is kept only in the browser and can be reset in the **Progress** panel.
- Hints are revealed one at a time; the **Show all** button only appears after the first one.

### Reference solution

```python
from djitellopy import Tello

tello = Tello()
tello.connect()
tello.set_speed(100)
tello.takeoff()

tello.move_up(300)
tello.move_forward(400)
tello.move_up(100)
tello.move_forward(400)
tello.move_up(100)
tello.move_forward(400)

tello.move_forward(300)

tello.land()
tello.end()
```

Notes:

- `move_up(300)` takes the drone from takeoff height up to the first gate.
- The next two `move_up(100)` calls follow the gates as they rise.
- The last `move_forward(300)` takes the drone from the third gate to the green pad.
- `set_speed(100)` speeds up the demonstration; for a first exploration it can be left at the default value.

### Progressive hints

The **Hints** button reveals the four hints one at a time. A good intervention sequence:

1. Let the student try without hints.
2. Open the first hint.
3. Ask the student to break the path into steps: go up, go forward, go up, go forward…
4. Only afterwards show the complete solution.

## 6. Loop Lagoon — loops

The **Loop Lagoon** level introduces the `for` loop with a square of four sides and four gates.

Objective:

> Take off, fly the 6 m square and land on the green pad.

Reference solution:

```python
from djitellopy import Tello

tello = Tello()
tello.connect()
tello.takeoff()
tello.move_up(300)
tello.set_speed(100)

for _ in range(4):
    tello.move_forward(300)
    tello.move_forward(300)
    tello.rotate_clockwise(90)

tello.land()
tello.end()
```

Progression:

1. Write one side of the square without a loop.
2. Identify the repetition and introduce `for _ in range(4):`.
3. Ask for a `square()` function that performs the loop.
4. Swap the order of `move_forward` and `rotate_clockwise` and discuss the result.

Questions:

- How many times does the loop run?
- What happens if we use `range(3)`?
- Why do we need to rotate 90 degrees?
- Why are two `move_forward(300)` calls needed on each side?

## 7. Function Forge — functions

The **Function Forge** level repeats the square at two altitudes. The same function is called twice.

Objective:

> Use a reusable function to repeat the square at 4 m and 11 m and land on the pad.

Reference solution:

```python
from djitellopy import Tello

tello = Tello()
tello.connect()
tello.takeoff()
tello.move_up(300)
tello.set_speed(100)

def fly_square():
    for _ in range(4):
        tello.move_forward(300)
        tello.move_forward(300)
        tello.rotate_clockwise(90)

fly_square()

tello.move_up(500)
tello.move_up(200)
fly_square()

tello.land()
tello.end()
```

Progression:

1. Complete the first lap without a function.
2. Extract the repeated block into `fly_square()`.
3. Call the function once and confirm the four gates.
4. Climb 700 cm and call the function again.
5. Discuss what would happen if the function were written out twice.

Questions:

- What is the advantage of defining the function?
- What happens if we change the side length inside the function?
- Does the function change the drone's position or merely describe the steps?

## 8. Obstacle Alley — obstacles

The **Obstacle Alley** level adds towers and a zig-zag of three gates. The student must adjust direction and land on the green pad at the end.

Objective:

> Follow the zig-zag between the towers and land on the green pad after the third gate.

Reference solution:

```python
from djitellopy import Tello

tello = Tello()
tello.connect()
tello.takeoff()
tello.move_up(300)
tello.set_speed(100)

tello.move_forward(500)
tello.rotate_clockwise(45)

tello.move_forward(500)
tello.move_forward(200)
tello.rotate_counter_clockwise(45)

tello.move_forward(500)
tello.move_forward(300)

tello.land()
tello.end()
```

Progression:

1. Fly through the first gate in a straight line.
2. Introduce the 45-degree rotation and the second gate.
3. Correct the next rotation and explain why we do not rotate 90 degrees.
4. Adjust the distance to the green pad.
5. Compare a trajectory that passes close to the towers with the central trajectory.

Questions:

- Why can't we rotate 90 degrees at the second gate?
- What happens if we advance too far?
- How can we confirm the direction before advancing?

## 9. Variable Valley — variables

The **Variable Valley** level introduces variables with a straight course of three gates at different altitudes. Instead of repeating numbers, the student names them and reuses them in commands.

Objective:

> Use variables for altitude and distance, fly through the three gates and land on the green pad.

Reference solution:

```python
from djitellopy import Tello

tello = Tello()
tello.connect()
tello.set_speed(100)
tello.takeoff()

altitude = 300
step = 100
distance = 400

tello.move_up(altitude)
tello.move_forward(distance)
tello.move_up(step)
tello.move_forward(distance)
tello.move_up(step)
tello.move_forward(distance)
tello.move_forward(distance)

tello.land()
tello.end()
```

Progression:

1. Fly the course with numbers written directly into the commands.
2. Replace the numbers with `altitude`, `step` and `distance`.
3. Change `altitude` to 350 and compare the result.
4. Ask for a new variable, for example `pad_distance = 400`, and use it on the last advance.
5. As an extension, turn the sequence into a `fly_gate(height, distance)` function.

Questions:

- Why is it better to use `distance` than to repeat `400` several times?
- What happens if we change `step` to 50?
- What should a variable's name explain? Give an example.
- What is the difference between a variable and an instruction?

Quiz answer: the first option — the drone climbs 200 cm instead of 300 cm, because `move_up(altitude)` reads the current value of the variable.

## 10. Conditional Canyon — conditionals

The **Conditional Canyon** level introduces `if`. The student reads altitude with `get_height()` and only climbs when below the target.

Objective:

> Check altitude before each gate, climb only when necessary and land on the green pad.

Reference solution:

```python
from djitellopy import Tello

tello = Tello()
tello.connect()
tello.set_speed(100)
tello.takeoff()

target = 400
if tello.get_height() < target:
    tello.move_up(target - tello.get_height())
tello.move_forward(400)

target = 500
if tello.get_height() < target:
    tello.move_up(target - tello.get_height())
tello.move_forward(400)

target = 600
if tello.get_height() < target:
    tello.move_up(target - tello.get_height())
tello.move_forward(400)

tello.move_forward(400)

tello.land()
tello.end()
```

Progression:

1. Perform the first climb with a fixed value and compare it with the `get_height()` reading.
2. Introduce `if tello.get_height() < target:`.
3. Reuse the same block before the three gates, changing `target`.
4. Discuss what happens if `target` is lower than the current altitude.
5. As an extension, add `else: print("Enough height")`.

Questions:

- Why does the block have to be indented?
- What happens if we use `>` instead of `<`?
- Why is it better to compute `target - tello.get_height()` than to always use `move_up(100)`?
- What other sensors could drive a decision?

Quiz answer: the first option — 400 is less than 500, so the drone climbs 100 cm.

## 11. Sensor Summit — while and sensors

The **Sensor Summit** level closes the path with `while` loops and sensor reading. The student climbs in small steps up to each gate, checking `get_height()` on every iteration.

Objective:

> Climb to each gate using `get_height()` in a `while` loop and land on the green pad.

Reference solution:

```python
from djitellopy import Tello
import time

tello = Tello()
tello.connect()
tello.set_speed(100)
tello.takeoff()

target = 400
while tello.get_height() < target:
    tello.move_up(50)
    time.sleep(0.1)
tello.move_forward(300)
tello.move_forward(300)

target = 700
while tello.get_height() < target:
    tello.move_up(50)
    time.sleep(0.1)
tello.move_forward(400)

target = 1000
while tello.get_height() < target:
    tello.move_up(50)
    time.sleep(0.1)
tello.move_forward(400)

tello.move_forward(200)

tello.land()
tello.end()
```

Progression:

1. Climb with a fixed number of steps and compare with the `get_height()` reading.
2. Introduce `while tello.get_height() < target:`.
3. Place `move_up(50)` and `time.sleep(0.1)` inside the loop.
4. Repeat for 400, 700 and 1000, advancing out of each gate's plane before climbing.
5. Discuss what happens if the condition never becomes false.
6. As an extension, print the height on every iteration with `print(tello.get_height())`.

Questions:

- Why is the condition checked before each climb?
- What happens if `move_up(50)` is left outside the loop?
- Why do we need `time.sleep()`?
- How can we avoid an infinite loop?
- What other sensors can drive the mission?

Quiz answer: the first option — if the height is already 400 and the target is 400, the condition `400 < 400` is false and the block does not run.

## 12. Sensors and conditionals

**Sensors** example:

```python
from djitellopy import Tello

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
tello.end()
```

Challenges:

- Climb to a target height using a loop and `get_height()`.
- Land if the battery is below a value.
- Print the height every second.

Example of a loop with a condition:

```python
import time

while tello.get_height() < 150:
    tello.move_up(20)
    time.sleep(0.2)
```

`time.sleep()` does not block the simulator and can be interrupted with **Stop**.

## 13. Continuous control

`send_rc_control(left_right, forward_backward, up_down, yaw)` sends values between -100 and 100. It must be called repeatedly in a loop:

```python
import time

for _ in range(20):
    tello.send_rc_control(0, 40, 0, 0)
    time.sleep(0.1)

tello.send_rc_control(0, 0, 0, 0)
```

Activities:

- draw a circle;
- fly a slalom;
- compare `move_forward()` with `send_rc_control()`.

## 14. Common errors and help

The editor marks the line and shows a hint. The console keeps the full traceback for reference.

| Error | Likely cause | Help |
|---|---|---|
| `SyntaxError` | missing parentheses, quotes, commas or `:` | check the marked line |
| `IndentationError` | blocks with different spacing | use 4 spaces per level |
| `NameError` | misspelled or undefined variable | confirm the name and its creation |
| `ModuleNotFoundError` | external package not available | use only the stdlib |
| `TelloError` | invalid command, drone stopped or out of range | check `takeoff()` and the limits |
| Timeout | long distance or repeated command | split into smaller steps |
| Crash | collision with a pillar or frame | **Reset Pos** and correct the route |

The **Stop** button interrupts the script. If the drone is flying, it lands automatically. **Reset Pos** restores the mission and the drone to the start.

## 15. Classroom management

- Each student can use their own browser; the code is stored in that browser.
- There are no accounts and no data is sent.
- To share a project, use **Download .py** and then **Open .py**.
- To clear the code on a workstation, change the example or clear the browser's `localStorage`.
- Progress and quizzes are kept in the browser's `localStorage`; the **Reset progress** button clears only progress, not code.
- The **API** button opens the reference of available methods.
- Autocomplete appears when typing `tello.`.

If Python does not load:

1. confirm that `public/pyodide/` was generated with `npm run setup:pyodide`;
2. confirm that the browser has JSPI;
3. reload the page;
4. check the development console.

## 16. Suggested assessment

| Criterion | Indicator |
|---|---|
| Sequence | The script executes the instructions in the correct order |
| Accuracy | The drone passes the gates without colliding |
| Variables | The student uses meaningful names and changes a value without duplicating commands |
| Conditionals and sensors | The student uses if/while and get_height() to adapt the flight |
| Debugging | The student identifies and fixes an error with the editor's help |
| Abstraction | The student uses a loop or function to avoid repetition |
| Verification | The student explains the quiz answer and the effect of changing a variable |
| Autonomy | The student consults the API and the hints before asking for the solution |

## 17. Current limitations

- Only the Python standard library is available.
- Video, swarms, mission pads and `control_step(state, dt)` are not implemented.
- `input()` is not yet available.
- Python requires a modern browser with JSPI.
- The simulator is local; it does not replace the safety training needed to fly a real Tello.
