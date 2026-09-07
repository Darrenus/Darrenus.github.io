# RONG — A world in motion

This homepage follows the owner's revised direction: an immersive Earth that moves
continuously from a complete rotating globe to a close hemispherical horizon.
The previous content-first observatory homepage is superseded. Existing project,
resume and Ragent routes remain available from the floating navigation.

## Spatial direction

- [Lusion About](https://lusion.co/about/) informs the balance of an enveloping
  scene, sparse typography and small navigation controls.
- [Awwwards 2022 workshop](https://awwwards-2022-workshop.vercel.app/) informs
  depth, scale and uninterrupted motion. Its black-hole subject, assets and code
  are not reused.
- The accepted astrolabe / Pantheon direction persists in subdued brass,
  fine geographical measurement lines and a single upper-left light source.

The globe uses real coastlines from public-domain Natural Earth 1:50m land data,
with no political borders. See `public/globe/NOTICE.md`. A locally generated mask,
procedural surface grain and evenly distributed land points create the material;
no third-party rendering service or remote texture is required at runtime.

## Executable decisions

| Principle | Implementation |
| --- | --- |
| Space surrounds the object | Full viewport, background `#070a0c`; lettering recedes behind the globe. No stacked homepage cards. |
| Aged brass, restrained light | Interface brass `#b09a72`, text `#e4e0d5`, muted `#9b9c95`; these are artistic material approximations, not measured samples. Surface shader uses dark brass under a light from `(-3, 2.4, 3.4)`. |
| Scale reveals detail | FOV 38°, sphere radius 1.4; camera moves from 5.3 on desktop to 2.68. Portrait distance adapts to fit the whole globe. Near view lowers the globe by 0.76 units to bring the horizon into view. |
| Motion carries weight | Frame-independent exponential damping `1-exp(-5.5*dt)` gives a quick response and gradual settling. Drag inertia decays at `exp(-5*dt)`; auto-rotation is 0.03–0.045 rad/s. |
| A light responds to presence | Pointer intersection with the globe reveals a quiet travelling light ripple over the land, with slight camera parallax. The light is spatial, not a cursor decoration. |
| Typography yields to the journey | IBM Plex Sans 400/500 + Plex Mono 400, with system Chinese fallback. Identity fades over the first 40% of approach; near-view text enters after 50%. |
| Content is entered deliberately | One circular portal opens a native modal with four selectable project records and links to the existing details. Escape closes it and restores focus. |

## Input and resilience

- Wheel down approaches Earth; at maximum approach it turns the surface. Wheel up
  retreats. Trackpad and line/page wheel input are normalized and bounded.
- Drag rotates; two-finger spread/pinch zooms. Buttons offer zoom, reset and pause.
- Focus the globe and use Left/Right to rotate, Up/Down to zoom, Home to reset.
  Browser Ctrl/Command wheel zoom remains available.
- Reduced-motion preference starts with auto-rotation paused and removes inertia,
  parallax and decorative transitions. Visitors can explicitly resume rotation.
- Rendering suspends in hidden tabs. WebGL or geography-load failure shows a
  static material sphere while navigation remains usable.
- Mobile uses lower sphere geometry, point count, texture size and capped pixel
  ratio. The Three.js scene is lazy loaded; interior routes do not load its module.

## Validation

The navigation tests cover wheel units, input bounds, monotonic zoom, camera
clearance and portrait whole-globe framing. Browser QA covers full/near views,
wheel and drag, project switching and Escape focus, fixed navigation during zoom,
and responsive viewport layouts. Existing content, routes, Markdown and corpus
tests remain part of the release checks.
