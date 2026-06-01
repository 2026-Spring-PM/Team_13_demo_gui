# Team_13_demo_gui

Farm Village Simulator is a farm-management game where the player grows elemental crops, raises livestock, trains heroes, and explores battle stages.

# Run

(1) Pull Docker Image

```sh
docker pull --platform linux/amd64 chwoong/team_00_project:0.1.0
```

(2) Run the app

Option A - Run automatically:

```sh
bash scripts/run.sh
```

This starts the container, opens the VNC desktop, and immediately launches `build/main`.

Option B - Enter the container first, then run manually:

```sh
bash scripts/run_shell.sh
```

From inside the container, run:

```sh
./build/main
```

(3) Web browser

```text
http://localhost:6080/vnc.html
```

The game window should appear inside the VNC browser session.

# Game System

### (1) Controls

- Move the character with `W/A/S/D`
- Click farm plots to plant or harvest crops
- Click ranch slots to check animals and collect products
- Click the shop, training center, and battle portal directly to open each screen
- Use on-screen buttons and cards to buy items, train heroes, and start battles

### (2) Farm Village

- Plant and harvest elemental crops
- Buy seeds and livestock from the shop
- Collect milk, eggs, and wool from animals
- Progress days with weather events and daily support gold

### (3) Training Center

- Build and upgrade the training center
- Train fire, water, and grass heroes using harvested crops
- Hero levels affect battle strength

### (4) Battle

- Enter the battle portal from the village
- Select battle stages on map 1 and map 2
- Choose heroes based on element matchups
- Battle rewards are saved back to the farm session

### (5) Weather Events

- Clear: crops grow normally.
- Drought: harvest yield is reduced.
- Typhoon: all animals in the ranch are lost.
- Flood: all planted crops in the field are washed away.
