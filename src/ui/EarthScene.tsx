import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import * as THREE from "three";
import { cameraDistance, clampZoom, wheelStep } from "./earth-navigation";

export interface EarthControls {
  zoomBy: (amount: number) => void;
  reset: () => void;
}
interface Props {
  paused: boolean;
  onZoom: (value: number) => void;
  onReady: (status: "ready" | "fallback") => void;
}
type Land = number[][][][];
const RADIUS = 1.4;
const vertex = /* glsl */ `
 varying vec2 vUv;
 varying vec3 vWorld;
 varying vec3 vNormal;
 void main() {
  vUv = uv;
  vWorld = (modelMatrix * vec4(position,1.)).xyz;
  vNormal = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * vec4(vWorld,1.);
 }
`;
const noise = /* glsl */ `
 float hash(vec3 p) { p=fract(p*.3183099+vec3(.1,.2,.3)); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
 float noise3(vec3 p) {
  vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
 }
 float fbm(vec3 p) { return noise3(p)*.5+noise3(p*2.03)*.25+noise3(p*4.01)*.125+noise3(p*8.02)*.0625; }
`;
const surfaceFragment = /* glsl */ `
 uniform sampler2D uLand;
 uniform float uTime;
 uniform vec3 uTouch;
 uniform float uHover;
 varying vec2 vUv;
 varying vec3 vWorld;
 varying vec3 vNormal;
 ${noise}
 void main() {
  vec3 N=normalize(vNormal), V=normalize(cameraPosition-vWorld);
  vec3 L=normalize(vec3(-3.,2.4,3.4));
  float light=dot(N,L);
  float land=texture2D(uLand,vUv).r;
  float terrain=fbm(vec3(vUv*vec2(32.,16.),2.));
  float grain=hash(vec3(vUv*vec2(4600.,2300.),.5));
  vec3 ocean=vec3(.009,.014,.016);
  vec3 brass=mix(vec3(.061,.038,.016),vec3(.23,.15,.066),terrain);
  brass*=.82+grain*.28;
  vec3 base=mix(ocean,brass,land);
  float diffuse=smoothstep(-.25,.85,light);
  vec3 color=base*(.12+diffuse*.92);
  float spec=pow(max(dot(N,normalize(L+V)),0.),mix(90.,24.,land));
  color+=vec3(.40,.31,.18)*spec*mix(.24,.045,land)*diffuse;
  float coast=abs(land-texture2D(uLand,vUv+vec2(.0005,0)).r)+abs(land-texture2D(uLand,vUv+vec2(0,.0005)).r);
  color+=vec3(.31,.21,.085)*coast*.3*diffuse;
  float gridX=1.-smoothstep(.0,.032,abs(sin(vUv.x*3.14159265*36.)));
  float gridY=1.-smoothstep(.0,.032,abs(sin(vUv.y*3.14159265*18.)));
  color+=vec3(.12,.095,.055)*max(gridX,gridY)*.055*diffuse;
  float fresnel=pow(1.-max(dot(N,V),0.),3.8);
  color+=vec3(.38,.27,.12)*fresnel*smoothstep(-.25,.7,light)*.8;
  float d=distance(vWorld,uTouch);
  float touch=exp(-d*d*16.)*uHover;
  color+=vec3(.12,.08,.025)*touch*(.5+.5*sin(d*36.-uTime*3.))*land;
  gl_FragColor=vec4(color,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }
`;
const atmosphereFragment = /* glsl */ `
 varying vec3 vWorld;
 varying vec3 vNormal;
 void main() {
  vec3 N=normalize(vNormal), V=normalize(cameraPosition-vWorld);
  float rim=pow(1.-abs(dot(N,V)),5.);
  float sun=smoothstep(-.5,.7,dot(N,normalize(vec3(-3.,2.4,3.4))));
  vec3 color=mix(vec3(.045,.10,.12),vec3(.52,.34,.13),sun);
  gl_FragColor=vec4(color,rim*(.08+sun*.45));
  #include <colorspace_fragment>
 }
`;
const pointVertex = /* glsl */ `
 uniform float uPixelRatio;
 varying float vLight;
 void main(){
  vec3 world=(modelMatrix*vec4(position,1.)).xyz;
  vLight=smoothstep(-.3,.8,dot(normalize(mat3(modelMatrix)*normalize(position)),normalize(vec3(-3.,2.4,3.4))));
  vec4 mv=viewMatrix*vec4(world,1.);
  gl_Position=projectionMatrix*mv;
  gl_PointSize=clamp(3.6/-mv.z,.55,2.2)*uPixelRatio;
 }
`;
const pointFragment = /* glsl */ `
 varying float vLight;
 void main(){
  float d=length(gl_PointCoord-.5);
  float a=(1.-smoothstep(.15,.5,d))*(.10+vLight*.48);
  gl_FragColor=vec4(vec3(.63,.46,.23),a);
  #include <colorspace_fragment>
 }
`;

function buildLandTexture(data: Land, width: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = width / 2;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#fff";
  for (const polygon of data) {
    ctx.beginPath();
    for (const ring of polygon) {
      ring.forEach(([lon, lat], i) => {
        const x = ((lon + 180) / 360) * canvas.width,
          y = ((90 - lat) / 180) * canvas.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
    }
    ctx.fill("evenodd");
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return { texture, canvas, ctx };
}
function landPoints(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  count: number,
) {
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  const vertices: number[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (2 * (i + 0.5)) / count,
      a = i * golden,
      r = Math.sqrt(1 - y * y);
    const x = Math.cos(a) * r,
      z = Math.sin(a) * r;
    const u = (Math.atan2(z, -x) / (Math.PI * 2) + 1) % 1,
      v = Math.acos(y) / Math.PI;
    const px = Math.min(canvas.width - 1, Math.floor(u * canvas.width)),
      py = Math.min(canvas.height - 1, Math.floor(v * canvas.height));
    if (pixels[(py * canvas.width + px) * 4] > 128)
      vertices.push(x * 1.402, y * 1.402, z * 1.402);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  return geo;
}

export default forwardRef<EarthControls, Props>(function EarthScene(
  { paused, onZoom, onReady },
  ref,
) {
  const mount = useRef<HTMLDivElement>(null);
  const api = useRef<EarthControls>({ zoomBy: () => {}, reset: () => {} });
  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useImperativeHandle(
    ref,
    () => ({
      zoomBy: (amount) => api.current.zoomBy(amount),
      reset: () => api.current.reset(),
    }),
    [],
  );
  useEffect(() => {
    const host = mount.current!;
    const abort = new AbortController();
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      onReady("fallback");
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    const mobile = window.matchMedia("(max-width: 760px)").matches;
    renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 1.75));
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.05, 60);
    const planet = new THREE.Group();
    scene.add(planet);
    planet.rotation.set(0.1, 2.65, -0.13);
    const uniforms = {
      uLand: {
        value: new THREE.DataTexture(
          new Uint8Array([0, 0, 0, 255]),
          1,
          1,
        ) as THREE.Texture,
      },
      uTime: { value: 0 },
      uTouch: { value: new THREE.Vector3(0, 0, 10) },
      uHover: { value: 0 },
    };
    uniforms.uLand.value.needsUpdate = true;
    const geometry = new THREE.SphereGeometry(
      RADIUS,
      mobile ? 96 : 160,
      mobile ? 64 : 96,
    );
    const material = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: surfaceFragment,
      uniforms,
    });
    const surface = new THREE.Mesh(geometry, material);
    planet.add(surface);
    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(RADIUS * 1.035, 64, 48),
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: atmosphereFragment,
        transparent: true,
        side: THREE.BackSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    planet.add(atmosphere);
    const starsGeo = new THREE.BufferGeometry();
    const starPositions: number[] = [],
      starColors: number[] = [];
    let seed = 27;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < (mobile ? 180 : 440); i++) {
      starPositions.push(
        (random() - 0.5) * 28,
        (random() - 0.5) * 20,
        -7 - random() * 12,
      );
      const v = 0.25 + random() * 0.35;
      starColors.push(v, v * 0.84, v * 0.65);
    }
    starsGeo.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starPositions, 3),
    );
    starsGeo.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(starColors, 3),
    );
    const stars = new THREE.Points(
      starsGeo,
      new THREE.PointsMaterial({
        size: 0.013,
        vertexColors: true,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
      }),
    );
    scene.add(stars);
    let disposed = false,
      failed = false,
      frame = 0,
      targetZoom = 0,
      zoom = 0,
      targetYaw = 2.65,
      targetPitch = 0.1,
      yaw = 2.65,
      pitch = 0.1,
      velocity = 0;
    let pointerX = 0,
      pointerY = 0,
      parallaxX = 0,
      parallaxY = 0,
      hover = 0,
      lastTime = 0,
      lastReport = -1,
      lastPointerTime = 0;
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = motion.matches;
    const pointers = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    const sphere = new THREE.Sphere(new THREE.Vector3(), RADIUS);
    const ray = new THREE.Raycaster();
    const point = new THREE.Vector3();
    const updateZoom = (value: number) => {
      targetZoom = clampZoom(value);
    };
    api.current = {
      zoomBy: (amount) => updateZoom(targetZoom + amount),
      reset: () => {
        targetZoom = 0;
        targetYaw = 2.65;
        targetPitch = 0.1;
        velocity = 0;
      },
    };
    const size = () => {
      const { width, height } = host.getBoundingClientRect();
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    const observer = new ResizeObserver(size);
    observer.observe(host);
    size();
    fetch("/globe/land.json", { signal: abort.signal })
      .then((r) => {
        if (!r.ok) throw new Error("land data unavailable");
        return r.json();
      })
      .then((data: Land) => {
        if (disposed) return;
        const mask = buildLandTexture(data, mobile ? 2048 : 4096);
        uniforms.uLand.value.dispose();
        uniforms.uLand.value = mask.texture;
        const dots = new THREE.Points(
          landPoints(mask.canvas, mask.ctx, mobile ? 45000 : 90000),
          new THREE.ShaderMaterial({
            vertexShader: pointVertex,
            fragmentShader: pointFragment,
            uniforms: { uPixelRatio: { value: renderer.getPixelRatio() } },
            transparent: true,
            depthWrite: false,
          }),
        );
        planet.add(dots);
        onReady("ready");
      })
      .catch(() => {
        if (!disposed) {
          failed = true;
          cancelAnimationFrame(frame);
          onReady("fallback");
        }
      });
    const wheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) return;
      e.preventDefault();
      const delta = wheelStep(e.deltaY, e.deltaMode, host.clientHeight);
      if (targetZoom > 0.995 && delta > 0) targetYaw += delta * 0.0013;
      else updateZoom(targetZoom + delta * 0.0011);
    };
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      host.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      lastPointerTime = performance.now();
      velocity = 0;
      hover = 0;
      host.dataset.dragging = "true";
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinch = Math.hypot(a.x - b.x, a.y - b.y);
      }
    };
    const move = (e: PointerEvent) => {
      const previous = pointers.get(e.pointerId);
      const rect = host.getBoundingClientRect();
      pointerX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      if (previous) {
        if (pointers.size === 1) {
          const dx = e.clientX - previous.x,
            dy = e.clientY - previous.y;
          targetYaw += dx * 0.004;
          targetPitch = THREE.MathUtils.clamp(
            targetPitch + dy * 0.003,
            -1.2,
            1.2,
          );
          velocity = THREE.MathUtils.clamp(dx * 0.004, -0.06, 0.06);
          lastPointerTime = performance.now();
        }
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.size === 2) {
          const [a, b] = [...pointers.values()];
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          updateZoom(targetZoom + (distance - pinch) * 0.004);
          pinch = distance;
        }
      } else {
        ray.setFromCamera(new THREE.Vector2(pointerX, -pointerY), camera);
        sphere.center.copy(planet.position);
        if (ray.ray.intersectSphere(sphere, point)) {
          uniforms.uTouch.value.copy(point);
          hover = 1;
        } else hover = 0;
      }
    };
    const up = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size === 0) {
        host.dataset.dragging = "false";
        if (performance.now() - lastPointerTime > 90) velocity = 0;
      }
      if (host.hasPointerCapture(e.pointerId))
        host.releasePointerCapture(e.pointerId);
    };
    const leave = () => {
      hover = 0;
      pointerX = 0;
      pointerY = 0;
    };
    const keys = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault();
        targetYaw += (e.key === "ArrowRight" ? 1 : -1) * 0.18;
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault();
        updateZoom(targetZoom + (e.key === "ArrowUp" ? 0.12 : -0.12));
      } else if (e.key === "Home") {
        e.preventDefault();
        api.current.reset();
      }
    };
    host.addEventListener("wheel", wheel, { passive: false });
    host.addEventListener("pointerdown", down);
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerup", up);
    host.addEventListener("pointercancel", up);
    host.addEventListener("pointerleave", leave);
    host.addEventListener("keydown", keys);
    const draw = (time: number) => {
      if (disposed || failed) return;
      const dt = Math.min((time - lastTime) / 1000 || 0.016, 0.045);
      lastTime = time;
      const ease = reduced ? 1 : 1 - Math.exp(-dt * 5.5);
      zoom += (targetZoom - zoom) * ease;
      if (!pointers.size) {
        if (!pausedRef.current) targetYaw += dt * (0.045 - zoom * 0.015);
        if (!reduced) {
          targetYaw += velocity * dt * 40;
          velocity *= Math.exp(-dt * 5);
        }
      }
      yaw += (targetYaw - yaw) * ease;
      pitch += (targetPitch - pitch) * ease;
      parallaxX += (pointerX * 0.07 - parallaxX) * ease;
      parallaxY += (pointerY * 0.04 - parallaxY) * ease;
      planet.rotation.set(pitch, yaw, -0.13);
      planet.position.set(
        camera.aspect < 1 ? 0 : 0.26 * (1 - zoom),
        -0.05 - zoom * 0.76,
        0,
      );
      camera.position.set(
        reduced ? 0 : parallaxX,
        reduced ? 0 : -parallaxY,
        cameraDistance(zoom, camera.aspect),
      );
      camera.lookAt(0, 0, 0);
      uniforms.uTime.value = reduced ? 0 : time * 0.001;
      uniforms.uHover.value +=
        ((reduced ? 0 : hover) - uniforms.uHover.value) * ease;
      stars.position.x = reduced ? 0 : parallaxX * 0.4;
      if (Math.abs(zoom - lastReport) > 0.005) {
        lastReport = zoom;
        onZoom(zoom);
      }
      renderer.render(scene, camera);
      frame = requestAnimationFrame(draw);
    };
    const visibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden && !failed) {
        lastTime = performance.now();
        frame = requestAnimationFrame(draw);
      }
    };
    const motionChange = () => {
      reduced = motion.matches;
      velocity = 0;
    };
    const lost = (e: Event) => {
      e.preventDefault();
      failed = true;
      cancelAnimationFrame(frame);
      onReady("fallback");
    };
    document.addEventListener("visibilitychange", visibility);
    motion.addEventListener("change", motionChange);
    renderer.domElement.addEventListener("webglcontextlost", lost);
    frame = requestAnimationFrame(draw);
    return () => {
      disposed = true;
      abort.abort();
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      motion.removeEventListener("change", motionChange);
      host.removeEventListener("wheel", wheel);
      host.removeEventListener("pointerdown", down);
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerup", up);
      host.removeEventListener("pointercancel", up);
      host.removeEventListener("pointerleave", leave);
      host.removeEventListener("keydown", keys);
      renderer.domElement.removeEventListener("webglcontextlost", lost);
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points) {
          obj.geometry.dispose();
          const mats = Array.isArray(obj.material)
            ? obj.material
            : [obj.material];
          mats.forEach((m) => m.dispose());
        }
      });
      uniforms.uLand.value.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [onZoom, onReady]);
  return (
    <div
      className="earth-canvas"
      ref={mount}
      tabIndex={0}
      role="group"
      aria-label="交互地球：滚轮靠近或远离，拖动旋转；方向键转动与缩放，Home 复位"
    />
  );
});
