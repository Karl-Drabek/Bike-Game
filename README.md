# Bike Game Prototype - Quick Start

## Setup Instructions

### Windows
1. Open PowerShell or Command Prompt
2. Navigate to the game folder
3. Run the batch file: `.\start_server.bat`
4. Open your browser to `http://localhost:8000`

### Mac/Linux
1. Open Terminal
2. Navigate to the game folder
3. Run: `python -m http.server 8000`
4. Open your browser to `http://localhost:8000`

---

## How to Play

### Objective
Reach the finish line before the 60-second timer runs out!

### Controls

**Forward Movement (Pedaling)**
- **W Key**: Press at the TOP of the pedal cycle (green zone at top)
- **S Key**: Press at the BOTTOM of the pedal cycle (green zone at bottom)
- Hold the keys to accelerate continuously while in the correct zones
- Pressing in the wrong zone will slow you down

**Lateral Movement (Dodging)**
- **A Key**: Move left
- **D Key**: Move right

**Gear Shifting**
- **1 Key**: Low gear (easier to time pedals, slower max speed)
- **2 Key**: Medium gear (balanced)
- **3 Key**: High gear (harder to time pedals, faster max speed)

**Other**
- **R Key**: Restart level after winning or losing

### Game Mechanics

**Pedal UI**
- The circle in the bottom-right shows your pedal cycle
- The small circle moving around the big circle is your pedal position
- Green zones (top and bottom) show where you should press W and S
- Timing is everything!

**Obstacles**
- **Traffic Cones** (Orange circles): Slow you down
- **Birds** (Brown circles): Slow you down
- **Pedestrians** (Skin-colored): Slow you down significantly
- **Rocks** (Gray circles): Crash - ends the level
- **Cars** (Blue circles): Crash - ends the level

**Speed Management**
- Speed naturally decreases over time (drag)
- Proper pedal timing increases speed
- Hitting obstacles reduces speed
- Gears don't change speed directly, just the pedal timing difficulty

---

## Tips for Success

1. **Find Your Rhythm**: Practice timing W and S with the pedal indicator
2. **Use Gears Strategically**: Lower gears are easier to pedal but limit speed
3. **Dodge Carefully**: Moving left/right uses energy, so be strategic
4. **Maintain Momentum**: It's easier to maintain speed than recover it

---

## Game Status

This is a prototype with:
- ✅ Pedal rhythm system
- ✅ Gear shifting
- ✅ Multiple obstacle types
- ✅ Top-down scrolling view
- ✅ Lateral movement
- ✅ Timer
- ✅ Win/Lose conditions

Future additions could include:
- Multiple levels with increasing difficulty
- Power-ups and items
- Store/equipment system
- Better pixel art
- Sound effects
- More dynamic obstacles
