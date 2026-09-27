# KidsOS

A fun browser-based OS simulator for kids learning to use computers. Built with vanilla HTML, CSS, and JavaScript — no frameworks, no dependencies.

<img src="media/screenshot1.jpg" alt="KidsOS Screenshot 1" width="400">

[![Demo Video](media/screenshot2.jpg)](https://youtu.be/ifZQ23GNZSk)

## Features

- **Home screen for touch** — On a tablet or phone, all apps are on one painted home screen. An app opens in full screen, with a Home button and a Close button
- **Desktop for mouse** — On a PC, apps open in windows that you can move and resize, with a taskbar and an app menu
- **25 Apps** — Games, creativity tools, and silly parody apps
- **Painted pictures** — Each app has its own picture in a hand-painted style. Each device shows the same pictures
- **Private** — No trackers, no telemetry, no requests to other servers. All data stays on the device
- **Day and Night** — Two themes, 6 painted wallpapers, 6 accent colors
- **PWA Support** — Installable on Android and iOS, works offline
- **Virtual Filesystem** — Save files in localStorage
- **Fits the device** — The app selects its layout by the kind of pointer and the size of the screen

## Apps

| App | Description |
|-----|-------------|
| **Files** | Virtual file manager with folders and file preview |
| **Notepad** | Rich text editor with font/size/color and save to OS |
| **Calculator** | 4-function calculator with %, square root, and more |
| **Paint** | Canvas drawing app, save to Pictures folder or download |
| **Snake** | Classic snake game with high score tracking |
| **Memory** | Card-flip matching game |
| **Minesweeper** | Simplified kids version with 3 difficulty levels |
| **Kidstagram** | Fake social network with procedural canvas art |
| **KidsChat** | Fake messaging app with auto-replying contacts |
| **eJob** | Executive email simulator — mash keys to send corporate replies |
| **SnackDash** | Fake food delivery app with silly restaurants and delivery tracking |
| **Kidflix** | Netflix-style movie browser with funny parody titles |
| **Soundboard** | 4x4 grid of fun sound effect buttons |
| **TinyBank** | Parody banking app with Giggle Coins currency |
| **ChoreQuest** | Chore checklist with timer and streaks |
| **TreasureMapper** | Parody maps app with silly navigation |
| **Zoomer** | Parody ride-hailing app with funny vehicles |
| **TinyScanner** | Object scanner with real camera and silly results |
| **SillySkies** | Parody weather app for silly places |
| **Breakout** | Classic brick breaker game |
| **Pong** | Ball game for one player against the computer, for two players on one device, or for two players on two devices in the same Wi-Fi. Classic style, and Pong+ with spin trick shots and power-ups |
| **Captain Cardio** | Starship fitness app with exercise moves |
| **Pebbles** | Virtual pet rock |
| **Pocket Pal** | Virtual pet corgi in 3D |
| **Settings** | Username, wallpaper, theme, and update management |

## Installation

### Mobile (recommended)

Go to **https://mixashin.github.io/kidsOS/** on your phone's browser and install as an app:

**Android (Chrome):**
1. Open the link in Chrome
2. Tap the **three-dot menu** (top right)
3. Tap **"Add to Home screen"** or **"Install app"**
4. Tap **Install** to confirm
5. KidsOS will appear on your home screen as a full-screen app

**iPhone / iPad (Safari):**
1. Open the link in Safari
2. Tap the **Share button** (square with arrow at the bottom)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **Add** to confirm
5. KidsOS will appear on your home screen as a full-screen app

### Desktop

Open **https://mixashin.github.io/kidsOS/** in any browser — it runs as a desktop windowed experience. No install needed.

## Tech Stack

- Vanilla HTML/CSS/JavaScript
- localStorage for persistence
- Service Worker for offline PWA support
- Canvas API for Paint and Kidstagram
- getUserMedia API (optional) — used in TinyScanner as a camera passthrough for the fake object scanner, and in Pong to scan the QR code of the other device. Camera access is requested only when the child opens that function and only if the user grants permission. No photos are stored, uploaded, or sent anywhere. The apps work without camera access, except the game on two devices.
- WebRTC data channel for the game on two devices. The list of ICE servers is empty, so the connection uses addresses of the local network only
- QR code encoder and lockstep code are part of this repo (`js/lib/`), no library

- three.js (r149) for Pocket Pal, stored in `vendor/`, not loaded from a CDN

## Privacy

KidsOS is made for children. The app contacts only the server it was loaded from, and only to load its own files and to check for a new release. It has no analytics, no ads, no accounts, and no third-party scripts. Everything a child makes or types stays in the browser storage of the device.

Game on two devices: the two devices connect directly in the home Wi-Fi. There is no server between them, no STUN or TURN server, and no discovery service. The children pair the devices with a QR code that one screen shows and the other camera reads. The code holds a local network address and a certificate fingerprint. It is valid for one connection. The devices send paddle positions only.

## Development

Needs Node.js 20.12 or later. No packages to install.

```
python -m http.server 8080 --bind 127.0.0.1   # run the source files, no service worker
node build.mjs                                # build the deployable site into dist/
```

- The version number lives in `version.json` only. The build puts it everywhere else.
- `sw.js` is a template. The build fills in the file list, so offline mode covers every file.
- A push to `main` starts the GitHub Actions workflow, which builds `dist/` and publishes it to GitHub Pages.

## Art

The app pictures, the penguin, the wallpapers, the coin, and the home screen icon are original pictures in a hand-painted style. An AI image tool made them for KidsOS. They use no stock picture and no character of a film, a game, or a book. The files are in `art/` and `icons/`. They are free to use under the license of this project.

## Font

The text font is Nunito (SIL Open Font License 1.1). The file is in `fonts/`, with the license text. The app loads it from its own site.

## License

MIT
