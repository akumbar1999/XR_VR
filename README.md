<div align='center'>

<img src='https://readme-typing-svg.demolab.com?font=Barlow+Condensed&weight=700&size=38&pause=850&color=C5A566&center=true&vCenter=true&width=780&height=72&lines=VIRTUAL+ARMY+MUSEUM;WALK+THROUGH+MILITARY+HISTORY;11+ORIGINAL+3D+EXHIBITS' alt='Animated Virtual Army Museum headline' />

### A first-person 3D museum built around the original GLB collection.

[**▶ Open the live museum**](https://akumbar1999.github.io/XR_VR/)

<br />

![Three.js](https://img.shields.io/badge/Three.js-0.180-1b211a?style=for-the-badge&logo=threedotjs&logoColor=c5a566)
![Vite](https://img.shields.io/badge/Vite-7-1b211a?style=for-the-badge&logo=vite&logoColor=c5a566)
![Exhibits](https://img.shields.io/badge/EXHIBITS-11-1b211a?style=for-the-badge&labelColor=263127&color=c5a566)
![Deployment](https://img.shields.io/badge/DEPLOYMENT-GITHUB%20PAGES-1b211a?style=for-the-badge&logo=githubpages&logoColor=c5a566)

</div>

---

## Enter the galleries

Explore an atmospheric, walkable exhibition hall in first person. Move between five collections, inspect the original 3D models on display, and open an information card for each artifact.

### Collections

| Collection | Exhibits |
|---|---|
| Armoured Forces | T-80U / T-80UM-2, Leclerc AZUR, Centauro II, 2S40 Floks |
| Air Power | J-8F Interceptor |
| Personal Arms | Heckler & Koch G3 |
| Ordnance | FAB-3000 UMPK, B-28FI, RDS-37 |
| Defence & Field Technology | Centurion / SeaRAM, Field Observer |

## Explore

| Input | Action |
|---|---|
| **W A S D** | Walk through the museum |
| **Mouse** | Look around |
| **Click an exhibit** | Read its collection notes and inspect it |
| **Drag** | Rotate the selected model |
| **Scroll** | Zoom the selected model |
| **Esc** | Release the mouse |

## Run locally

Requires Node.js 20 or later.

```bash
git clone https://github.com/akumbar1999/XR_VR.git
cd XR_VR
npm ci
npm run dev
```

Open the local URL printed by Vite. To create a production build:

```bash
npm run build
npm run preview
```

## Performance notes

- Exhibits load as visitors approach their display areas.
- Static gallery geometry is merged to reduce draw calls.
- Render resolution adapts to frame time, and detailed exhibit meshes skip costly real-time shadow rendering.
- Original GLB files are kept in the repository root and are never rewritten by the build.

## Built with

**Three.js** · **GLTFLoader** · **PointerLockControls** · **Vite** · **GitHub Pages**

---

<div align='center'>

Made for curious visitors and military history enthusiasts.

</div>
