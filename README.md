<div align='center'>

<img src='https://img.shields.io/badge/VIRTUAL-DEFENCE%20MUSEUM-06121d?style=for-the-badge&labelColor=07101b&color=48d8ef' alt='Virtual Defence Museum' />

### A futuristic, walkable museum with original 3D exhibits and optional spatial services.

[**▶ Open the live museum**](https://akumbar1999.github.io/XR_VR/)

![Three.js](https://img.shields.io/badge/Three.js-0.180-07101b?style=for-the-badge&logo=threedotjs&logoColor=59e3f7)
![Vite](https://img.shields.io/badge/Vite-7-07101b?style=for-the-badge&logo=vite&logoColor=9deeff)
![WebXR](https://img.shields.io/badge/WebXR-VR%20%2B%20Experimental%20AR-07101b?style=for-the-badge&logo=meta&logoColor=59e3f7)
![Exhibits](https://img.shields.io/badge/ORIGINAL%20EXHIBITS-11-07101b?style=for-the-badge&labelColor=0b202d&color=48d8ef)

</div>

---

## Project description

**XR_VR — Virtual Defence Museum** is a browser-based, interactive 3D museum built with Three.js and WebXR. Visitors can walk through five themed galleries, inspect the project’s original GLB exhibits, and explore their historical and technical context. It combines a futuristic command-centre aesthetic with desktop navigation, optional VR/AR experiences, educational missions, and a built-in museum guide.

## Explore the museum

Walk through five collection zones in a futuristic, cyan-lit exhibition hall. Original GLB models stream in as you approach. Inspect each artifact, read the museum notes, and rotate it. Cinematic intro, emissive holograms, adaptive rendering, and existing desktop/WebXR navigation remain part of the same museum.

### Collections

| Zone | Original exhibits |
|---|---|
| Armoured Forces | T-80U / T-80UM-2, Leclerc AZUR, Centauro II, 2S40 Floks |
| Air Power | J-8F Interceptor |
| Personal Arms | Heckler & Koch G3 |
| Ordnance | FAB-3000 UMPK, B-28FI, RDS-37 |
| Defence & Field Technology | Centurion / SeaRAM, Field Observer |

## Experiences

- **Museum guide:** The guide answers from bundled exhibit descriptions and controls. Click **NARRATE** to hear an answer or stop active narration. It is not connected to an AI service.
- **Voice questions:** Click **ASK BY VOICE** to start browser speech recognition and click again to stop. When supported and permitted, the guide shows the recognized question and reads its built-in answer aloud. Browser and speech-service support varies; clear permission, microphone, and service error messages appear when recognition cannot start. Typed questions remain available as a fallback.
- **Virtual War Room:** A 3D holographic command display with toggleable front-line, terrain, and timeline layers.
- **Historical scenarios:** Scrub or play staged notes for the Somme (1916) and Battle of Britain (1940). The map is a schematic teaching aid, not an accurate tactical map. No combat, casualties, or weapon effects are simulated. Sources are linked in the scenario panel.
- **Missions:** Visit the five zones, inspect three distinct exhibits, and answer three knowledge questions. Earn badges and a score out of 100.
- **Audio:** Opt-in procedural ambience, spatialized in the 3D scene, and positional exhibit locator cues. Spoken narration uses the browser’s text-to-speech and is not spatialized. Audio starts only after a visitor enables it.
- **Experimental AR:** Where `immersive-ar` and hit-test are supported, place a selected original GLB on a real surface. AR support is checked honestly; unsupported devices retain desktop and VR modes.
- **Multiplayer:** Real visitor presence and 8 Hz position broadcasts over Supabase Realtime, with smoothly moving visitor avatars. This is disabled until a Supabase project URL and publishable key are configured. Rooms are public and ephemeral; anyone who knows a room name may join.

## Controls

| Input | Action |
|---|---|
| **W A S D** | Walk through the galleries |
| **Mouse** | Look around |
| **Click an exhibit** | Read museum notes |
| **Drag / scroll** | Rotate / zoom the selected model |
| **Escape** | Release the mouse |
| **Quest left stick** | Walk |
| **Quest right stick** | Snap turn |
| **Quest trigger on exhibit** | Select or hold to rotate |
| **Quest trigger aimed at open floor** | Teleport |
| **AR place control / controller trigger** | Place the selected exhibit at the visible hit-test reticle |

Quest controller grips, tracked hands, and pointer rays follow the live WebXR input poses. They share the museum’s player rig, so they stay aligned with the visitor during physical movement, stick locomotion, snap turns, and teleportation.

## Run locally

Requires Node.js 20 or later.

```bash
git clone https://github.com/akumbar1999/XR_VR.git
cd XR_VR
npm ci
npm run dev
```

Open the local URL printed by Vite. To create and preview the production build:

```bash
npm run build
npm run preview
```

Most museum features need no configuration. Real multiplayer needs a Supabase project with Realtime enabled:

1. Copy `.env.example` to `.env.local` and enter the Supabase project URL and **publishable** key.
2. Restart Vite or rebuild after changing the values.
3. Use the same room name in two browsers to see real visitor presence and synchronized positions.

The client uses public Realtime channels without user accounts or a database. Do not place private data in room names; the public channel has no access control. Never expose a service-role/secret key in the website. Supabase usage is subject to the project’s plan and current limits; the app does not subscribe you to any service.

## Deploy to GitHub Pages

The project already has a GitHub Actions Pages workflow and Vite base path configured for `/XR_VR/`.

1. In GitHub **Settings → Pages**, select **GitHub Actions** as the deployment source.
2. For multiplayer, add repository **Variables** named `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. The publishable key is public browser configuration; do not set a service-role key.
3. Push to `main` or manually run **Build and deploy museum** in Actions. Without those variables, the site still builds and deploys, and multiplayer reports that setup is required.

The production site is published at `https://akumbar1999.github.io/XR_VR/`.

## Dependencies and integrations

- **Three.js** — renderer, models, WebXR VR/AR buttons, hit testing, and positional audio.
- **Supabase JS** — optional Realtime presence and broadcast for multiplayer; requires a separately configured Supabase project.
- **Browser APIs** — Web Speech recognition/synthesis, Web Audio, WebXR, and microphone access where supported.
- **Vite** — local development and GitHub Pages build.

The existing GLB files are kept unchanged in the repository root. Exhibits continue to load on approach; static gallery geometry remains merged and render resolution adapts to frame time.
