# Team_13_demo_gui

Farm Village Simulator is a cozy farm-management adventure where the player builds a small village into a lively elemental farm.
Grow fire, water, and grass crops, raise animals for useful products, and use the harvest to train heroes for stage-based battles.
Each day brings new choices: manage crops, visit the shop, upgrade the training center, or jump into the battle portal for rewards.

# Run

(1) Clone this repository

```sh
git clone https://github.com/2026-Spring-PM/Team_13_demo_gui.git
cd Team_13_demo_gui
```

(2) Run the local demo server

```sh
bash scripts/run.sh
```

The script starts a local web server and prints the game URL:

```text
http://127.0.0.1:8000/web/farm_village.html
```

Open that URL in your browser.

If you do not want to run the server, you can also open this file directly:

```text
index.html
```

# Game System

### (1) Controls

- Move the character with `W/A/S/D`
- Click farm plots to plant or harvest crops
- Click ranch slots to check animals and collect products
- Click the shop, training center, and battle portal directly to open each screen
- Use on-screen buttons to buy items, train heroes, and start battles

### (2) Farm Village

- Plant and harvest elemental crops
- Buy seeds and livestock from the shop
- Collect milk, eggs, and wool from animals
- Progress days with weather events and daily support gold
- One in-game day lasts 5 minutes

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

One of the following weather events occurs each day.

| Weather | Effect |
| --- | --- |
| Clear | Crops grow normally. |
| Drought | Harvest yield is reduced. |
| Typhoon | All animals in the ranch are lost. |
| Flood | All planted crops in the field are washed away. |
