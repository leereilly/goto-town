1. Product definition
Working title: eyebrow bike road trip

Format: short web-based arcade game using webcam + microphone

Core fantasy: ride a bike across multiple color-themed stages toward town, dodge traffic with eyebrow raises and winks, and shout to bully vehicles out of your lane.

Tone: absurd party game with retro arcade presentation and webcam-performance comedy.

Primary platform: desktop browser first
Secondary platform: laptop browsers with webcam/mic
Not recommended for MVP: mobile browsers

2. Player-facing rules
The player is always moving forward from left to right. The bike stays near the left-middle of the screen while the road scrolls.

The player can:

move up one lane by raising eyebrows

move down one lane by winking either eye

shout, scream, or say “pew” to make the nearest movable vehicle ahead in the same lane jump into an adjacent lane

The player cannot move police cars.

The player has 3 health points.

On collision:

lose 1 health

wobble comedically

keep moving forward

still allowed to fire during wobble

brief invulnerability prevents instant chain damage

Goal: survive to the end of each stage and eventually reach town.

3. MVP scope
The MVP should be intentionally modest.

Build this first:

4 lanes

1 biome/stage

player bike

4 obstacle types:

car

bus

police car

oil slick

webcam control:

eyebrow raise = up

wink either eye = down

microphone control:

shout/scream/“pew” = fire

keyboard fallback

3 HP

wobble on hit

stage completion distance meter

title, permissions, calibration, gameplay, game-over, stage-complete screens

Do not add yet:

ramps

jumps

advanced enemy AI

voice command recognition by exact word

multiplayer

online leaderboard

procedural endless mode

4. Polished version 1 scope
After the MVP works, add:

3 biomes/stages with different colors and traffic density

improved pixel art

HUD polish

stage intro cards

stronger animations

town arrival ending

difficulty scaling per stage

audio effects and music

sensitivity settings

optional practice/input test screen

Colors and density change between stages; hazards remain the same for version 1.

5. Game design spec
5.1 Core playfield
Use a lane-based faux-perspective road.

Recommended lane count: 4

Reason:

3 lanes is too simple

5 lanes increases control burden too much for eyebrow/wink input

4 gives enough tactical space without overloading the player

5.2 Camera model
Player bike is fixed at roughly 30–35% from the left side of screen and vertically aligned to lane centers.

Road and traffic move from right to left to simulate forward travel.

5.3 Player state
The player entity should track:

type PlayerState = {
  lane: number;
  targetLane: number;
  x: number;
  y: number;
  hp: number;
  isWobbling: boolean;
  wobbleUntil: number;
  invulnerableUntil: number;
  canFire: boolean;
  fireCooldownUntil: number;
};
5.4 Lane change rules
Movement is discrete, not analog.

eyebrow raise triggers move from lane N to N-1

wink triggers move from lane N to N+1

clamp to road bounds

animate lane shift over 150–220 ms

ignore repeated move inputs during lane-shift animation

Recommended lane indexing:

lane 0 = top

lane 3 = bottom

5.5 Fire/shout rules
When fire is triggered:

find nearest obstacle ahead of player in same lane within range

if obstacle type is movable:

car or bus

try left/right adjacent lane

choose a free adjacent lane

if both free, choose randomly

animate an exaggerated dodge into that lane

if obstacle is police:

no movement

show resistance feedback

if obstacle is oil:

do nothing

Player can fire while wobbling.

Fire cooldown: 1000–1500 ms
Start at 1200 ms.

5.6 Collision rules
On collision with car, bus, police, or oil:

if current time < invulnerableUntil, ignore

else:

hp -= 1

set isWobbling = true

set wobbleUntil = now + 800ms

set invulnerableUntil = now + 1200ms

During wobble:

player still moves forward

lane changes may still be allowed, but make them visually unstable

firing remains allowed

When hp reaches 0:

crash sequence

game over

5.7 Stage completion
Each stage has a distance meter from 0 to 100%.

Distance advances continuously over time unless you want collisions to reduce forward speed later. For the first version, keep forward speed constant to avoid making the pacing feel muddy.

At 100%:

stage complete

transition to next biome

after final stage, show town arrival / victory

6. Obstacle spec
Use one base obstacle interface.

type ObstacleType = "car" | "bus" | "police" | "oil";

type ObstacleState = {
  id: string;
  type: ObstacleType;
  lane: number;
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  movableByShout: boolean;
  isChangingLane: boolean;
  targetLane?: number;
  hitbox: Rectangle;
};
Car
movable by shout

normal speed

standard sprite size

most common obstacle

Bus
movable by shout

larger hitbox

slightly slower dodge animation

less frequent

Police car
not movable by shout

medium or slightly high speed

rare enough to feel special

should visually signal “immune to shout”

Oil slick
static hazard

small hitbox but dangerous

no lane-switch behavior

7. Stage/biome spec
Version 1 should have 3 short stages.

Stage 1: Green outskirts
bright greens and tan road

light traffic density

mostly cars, occasional oil

tutorial-like pace

Stage 2: Sunburn highway
warm orange/yellow palette

more buses

higher density

more oil

Stage 3: Neon city approach
purple/blue dusk colors

highest traffic density

more police appearances

skyline/town destination visible

Only colors, scenery, spawn density, and speed ramp change. Hazard types stay the same.

8. Input system spec
This is the most important technical layer.

The game should never read webcam or audio directly. Everything passes through an intent abstraction.

type GameIntent = {
  moveUpPressed: boolean;
  moveDownPressed: boolean;
  firePressed: boolean;
};
Each frame, the game consumes the current GameIntent.

Input sources:

keyboard

face tracker

audio detector

These feed an InputManager.

8.1 Input priority
If multiple inputs happen at once:

fire can happen alongside movement

moveUp and moveDown should never both execute in same frame

if both appear, ignore both or prioritize the freshest input timestamp

Use timestamps for each intent.

9. Face tracking spec
Use facial landmarks via MediaPipe Face Landmarker.

9.1 Eyebrow raise detection
Measure eyebrow-to-eye vertical distance for both eyes. Average them.

Compute normalized value relative to the user’s neutral baseline.

Recommended model:

eyebrowRaiseScore = smoothedCurrentBrowEyeDistance / neutralBrowEyeDistance
Trigger moveUp if:

score > calibratedUpperThreshold

not in cooldown

not already in a lane change

Eyebrow cooldown: 300 ms

9.2 Wink detection
Measure eye openness separately for left and right eye using eyelid landmarks.

Define:

leftEyeOpen

rightEyeOpen

A wink is:

one eye below closed threshold

the other above open threshold

condition held for at least 80–150 ms

Trigger moveDown if:

left wink or right wink detected

not in cooldown

not already in lane change

Wink cooldown: 350 ms

9.3 Blink rejection
Ignore events where:

both eyes close at once

closure duration is too short and symmetric

That filters normal blinking.

9.4 Face input smoothing
Apply smoothing over a short recent window:

5–8 landmark samples

or ~100–150 ms

Don’t oversmooth or the game will feel laggy.

10. Audio detection spec
Use Web Audio API, not exact speech parsing, for MVP.

10.1 Shout detection
Calculate:

RMS loudness

maybe peak amplitude

optional onset speed

A fire event triggers when:

current loudness exceeds shout threshold

attack rises rapidly enough

fire cooldown has expired

This lets screaming, shouting, and saying “pew” all work naturally.

10.2 Audio calibration
Record:

ambient noise floor

normal speaking level

intentional shout level

Set threshold somewhere above speaking, below shout max.

A decent starting heuristic:

threshold = noiseFloor + 60–70% of the gap toward shout sample peak

10.3 Fire cooldown
Start with:

1200 ms cooldown

You can lower later if playtests feel sluggish.

11. Calibration screen spec
This is required, not optional.

Calibration sequence
ask for camera and mic permissions

neutral face capture

eyebrow raise capture

wink test

normal speech capture

shout / “pew” capture

live input test

Data stored
type CalibrationProfile = {
  browNeutral: number;
  browRaiseThreshold: number;
  leftEyeOpenNeutral: number;
  rightEyeOpenNeutral: number;
  winkClosedThreshold: number;
  winkOpenThreshold: number;
  audioNoiseFloor: number;
  audioSpeechLevel: number;
  audioShoutThreshold: number;
};
Live verification screen
Show:

eyebrow meter

left/right eye openness bars

mic level meter

text indicators:

UP detected

DOWN detected

FIRE detected

Player confirms when controls work.

12. Keyboard fallback spec
Keyboard exists for:

debugging

unsupported browsers

permission denial

accessibility fallback

Suggested mapping:

Up arrow / W = move up

Down arrow / S = move down

Space = fire

On permission denial:

game should remain playable with keyboard only

show a small message that webcam/mic mode is unavailable

13. UI / screen flow
Boot
load assets

initialize Phaser

detect device support

Title screen
logo

start button

how it works in one sentence

Permissions screen
request webcam

request microphone

fallback notice

Calibration screen
guided setup flow

live test

Stage intro
short card with stage name and colors

Gameplay
HUD shows:

3 health icons

distance meter

fire cooldown indicator

optional small camera/mic status icons

Stage complete
short celebration

continue button

Game over
crash summary

retry stage

recalibrate option

Victory
arrive at town

goofy ending splash

14. Art direction spec
Not copying Excitebike directly, but borrowing the era feel.

Visual rules
low-resolution pixel art

clean nearest-neighbor scaling

bright flat colors

simple faux perspective road

large readable sprites

exaggerated dodge and wobble animation

Sprite list for MVP
player bike: idle + wobble + crash

car

bus

police car

oil slick

roadside scenery tiles

lane markers

HUD heart/helmet icons

distance meter assets

simple town skyline silhouette

Animation list
bike lane shift

bike wobble

vehicle dodge lane-switch

police “immune” flash

collision bump

stage transition

victory arrival

15. Audio spec
SFX
lane move tick/skid

wobble hit sound

crash sound

shout fire feedback

vehicle dodge swoosh

police refusal siren chirp

stage complete sting

victory sting

Music
one looping chiptune track for MVP

later: one per biome

Audio feedback matters a lot because the player needs confirmation that weird inputs were recognized.

16. Technical stack spec
Recommended stack:

Phaser 3

TypeScript

Vite

MediaPipe Face Landmarker

Web Audio API

Directory structure
src/
  main.ts
  config/
    gameConfig.ts
  scenes/
    BootScene.ts
    TitleScene.ts
    PermissionScene.ts
    CalibrationScene.ts
    GameScene.ts
    StageCompleteScene.ts
    GameOverScene.ts
    VictoryScene.ts
  entities/
    PlayerBike.ts
    Vehicle.ts
    OilSlick.ts
  systems/
    InputManager.ts
    FaceInput.ts
    AudioInput.ts
    KeyboardInput.ts
    CalibrationManager.ts
    TrafficSystem.ts
    SpawnSystem.ts
    CollisionSystem.ts
    StageSystem.ts
    HudSystem.ts
  data/
    stages.ts
    constants.ts
  utils/
    math.ts
    smoothing.ts
    timers.ts
    random.ts
17. Class responsibility spec
GameScene
Owns the main loop:

update systems

resolve input

move player

update traffic

detect collisions

update HUD

check win/loss

PlayerBike
Handles:

lane state

lane-switch animation

wobble

hit response

fire cooldown

TrafficSystem
Owns active vehicles/hazards:

movement

lane changes

despawn

shout reaction behavior

SpawnSystem
Spawns traffic by stage rules:

density

spawn intervals

lane occupancy sanity

police rarity

CollisionSystem
Checks:

player vs vehicles

player vs oil

invulnerability state

StageSystem
Tracks:

current stage

distance progress

stage-specific speeds/density/colors

InputManager
Merges:

keyboard

face

audio
into final frame intent

FaceInput
Reads webcam landmarks and emits:

moveUpPressed

moveDownPressed

AudioInput
Reads mic level and emits:

firePressed

CalibrationManager
Runs calibration flow and stores profile data

18. Spawn logic spec
Spawn logic must avoid impossible walls too often.

Rules
do not fully block all lanes for long stretches

occasionally create near-blocks that encourage shouting

keep police rare

oil should create tactical pressure, not random punishment

Initial spawn targets per stage
Stage 1

car: high

bus: low

police: very low

oil: low

Stage 2

car: high

bus: medium

police: low

oil: medium

Stage 3

car: high

bus: medium

police: medium

oil: medium

Traffic density
Represent density as:

minimum spawn gap

maximum simultaneous obstacles

speed multiplier

19. Difficulty tuning defaults
Start with these:

lane switch animation: 180 ms

eyebrow cooldown: 300 ms

wink cooldown: 350 ms

fire cooldown: 1200 ms

wobble duration: 800 ms

invulnerability duration: 1200 ms

stage duration: 45–75 seconds each

total full run: about 3–4 minutes

That matches the “short absurd party game” target.

20. Browser support spec
Target:

Chrome desktop first

Edge desktop likely good

Safari and Firefox may need extra testing, especially mic/camera APIs

At startup, detect:

webcam access support

mic access support

getUserMedia availability

If not supported:

default to keyboard mode and explain it

21. Telemetry / debugging spec
For development, add a hidden debug overlay.

Show:

eyebrow score

left eye openness

right eye openness

audio loudness

triggered intents

cooldown timers

current lane

collision state

This will save a ton of time.

22. Implementation milestones
Milestone 1: Keyboard-only playable slice
Deliver:

one stage

bike movement by keyboard

car/bus/police/oil

3 HP

wobble

fire mechanic

win/lose loop

Acceptance criteria:

playable and fun without webcam/mic

no fatal soft locks

lane changes and collisions feel readable

Milestone 2: Audio fire integration
Deliver:

mic permissions

loudness-based fire

calibration for speaking/shouting

fire cooldown

dodge animation

police immunity

Acceptance criteria:

shouting reliably triggers fire

normal speech does not trigger too often

police clearly resist

Milestone 3: Eyebrow-up integration
Deliver:

webcam permissions

face landmark detection

eyebrow raise calibration

smoothing and cooldown

move-up works in gameplay

Acceptance criteria:

eyebrow raise works with normal lighting

accidental triggers are limited

latency feels acceptable

Milestone 4: Wink-down integration
Deliver:

eye openness detection

blink rejection

either-eye wink support

down cooldown

Acceptance criteria:

normal blinking does not move the player

winks reliably trigger down for most testers

low false-positive rate

Milestone 5: Full calibration and UX pass
Deliver:

guided setup

live test mode

fallback to keyboard

support/error messaging

Acceptance criteria:

player can understand setup without outside help

permission denial does not break the game

Milestone 6: Multi-stage polish
Deliver:

3 biomes

color palette changes

density scaling

better sprites

HUD polish

ending sequence

Acceptance criteria:

full run feels like a complete small game

total session length fits party-game target

23. Testing checklist
Gameplay
can finish a stage

hp decreases correctly

no double-hit during invulnerability

fire works during wobble

police are immune

cars/buses move only into adjacent free lanes

Face input
eyebrow raise works for multiple users

blink does not trigger down

either-eye wink works

recalibration fixes bad thresholds

Audio
loud room doesn’t constantly fire

normal talking doesn’t trigger too often

shout does trigger consistently

cooldown prevents spam chaos

Browser behavior
permission denied path works

webcam missing path works

keyboard fallback always works

24. Risks and mitigation
Biggest risk: wink detection
Mitigation:

make it a short lane-based game

include recalibration

include keyboard fallback

optionally add alternate “down mode” later if needed

Biggest risk: noisy audio environments
Mitigation:

shout threshold calibration

cooldown

optional mic sensitivity slider

Biggest risk: novelty wears off
Mitigation:

keep full run short

strong visual/audio feedback

fast restarts

escalating density across stages

25. Suggested first task breakdown
If I were assigning tickets, I’d start with these:

Set up Vite + Phaser + TypeScript project

Create road scene with 4 lane coordinates

Implement PlayerBike with lane switching

Implement obstacle base class and spawn system

Add collisions, HP, wobble, invulnerability

Implement shout/fire effect with keyboard trigger

Add stage distance meter and win/lose flow

Integrate microphone loudness fire

Integrate face landmarks and eyebrow-up

Integrate wink-down

Build calibration flow

Add biome system and palette swaps

Add pixel art polish and SFX

Add fallback/settings/debug overlay

26. Bottom-line recommendation
The smart path is:

First make a tight keyboard-controlled lane dodger.
Then add shout.
Then eyebrow up.
Then wink down.
Then content and polish.

That order protects the project from the webcam/mic novelty swallowing the actual game design.




