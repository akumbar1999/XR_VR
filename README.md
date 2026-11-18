<div align='center'>

<img src='https://img.shields.io/badge/VIRTUAL-DEFENCE%20MUSEUM-06121d?style=for-the-badge&labelColor=07101b&color=48d8ef' alt='Virtual Defence Museum' />

### An interactive, futuristic museum built around the original GLB collection.

[**▶ Open the live museum**](https://akumbar1999.github.io/XR_VR/)

![Three.js](https://img.shields.io/badge/Three.js-0.180-07101b?style=for-the-badge&logo=threedotjs&logoColor=59e3f7)
![Vite](https://img.shields.io/badge/Vite-7-07101b?style=for-the-badge&logo=vite&logoColor=9deeff)
![WebXR](https://img.shields.io/badge/WebXR-Meta%20Quest%20ready-07101b?style=for-the-badge&logo=meta&logoColor=59e3f7)
![Exhibits](https://img.shields.io/badge/ORIGINAL%20EXHIBITS-11-07101b?style=for-the-badge&labelColor=0b202d&color=48d8ef)

</div>

---

## Explore the museum

Walk through five collection zones in a futuristic, cyan-lit exhibition hall. Original GLB models stream in as you approach. Inspect each object, read the museum notes, and rotate the model.

### Collections

| Zone | Original exhibits |
|---|---|
| Armoured Forces | T-80U / T-80UM-2, Leclerc AZUR, Centauro II, 2S40 Floks |
| Air Power | J-8F Interceptor |
| Personal Arms | Heckler & Koch G3 |
| Ordnance | FAB-3000 UMPK, B-28FI, RDS-37 |
| Defence & Field Technology | Centurion / SeaRAM, Field Observer |

## Learn as you explore

- **Offline museum guide:** Ask about exhibit names and museum controls. Replies come from bundled museum notes, with optional browser speech synthesis; there is no remote AI service.
- **Missions:** Visit all five zones, inspect three unique exhibits, and answer three archive questions. Earn badges and a score out of 100.
- **History timeline:** Select an event for a historical note, then visit its related collection. Reference links are shown in the timeline.

## Controls

| Input | Action |
|---|---|
| **W A S D** | Walk through the galleries |
| **Mouse** | Look around |
| **Click an exhibit** | Read its museum notes |
| **Drag / scroll** | Rotate / zoom the selected model |
| **Escape** | Release the mouse |
| **Quest left stick** | Walk |
| **Quest right stick** | Snap turn |
| **Quest trigger on exhibit** | Select or hold to rotate |
| **Quest trigger aimed at open floor** | Teleport |

Enter VR is enabled by the browser’s actual `immersive-vr` support report. Use HTTPS and a WebXR-compatible headset browser such as Meta Quest Browser.

## Run locally

Requires Node.js 20 or later.

```bash
git clone https://github.com/akumbar1999/XR_VR.git
cd XR_VR
npm ci
npm run dev
```

Open the local Vite URL printed in the terminal. To verify the production output locally:

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

The repository includes a GitHub Actions workflow that builds and deploys on every push to `main`.

1. In GitHub, open **Settings → Pages** and choose **GitHub Actions** as the build and deployment source.
2. Push your changes to `main` (or run **Build and deploy museum** from the Actions tab).
3. Wait for the workflow’s build and deploy jobs to succeed. The site is published at `https://akumbar1999.github.io/XR_VR/`.

The Vite base path is already configured for `/XR_VR/`, which is required for this project page.

## Performance

- Exhibits load on approach rather than all at startup.
- Static gallery geometry is merged to reduce draw calls.
- Render resolution adapts to frame time; detailed GLB meshes avoid expensive dynamic shadows.
- Holograms use lightweight emissive geometry and CSS motion; no additional runtime dependencies are needed.
- Original GLB assets are kept unchanged in the repository root.

## Stack

**Three.js** · **GLTFLoader** · **WebXR / VRButton** · **PointerLockControls** · **Vite** · **GitHub Pages**

---

<div align='center'>Made for curious visitors and students of military history.</div>
