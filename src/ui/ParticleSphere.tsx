import { useEffect, useRef } from "react";
import * as THREE from "three";

export type SpherePhase = "sphere" | "expanding" | "expanded" | "collapsing";

export interface KnowledgeNode {
  label: string;
}

interface Props {
  phase: SpherePhase;
  nodes?: KnowledgeNode[];
  onExpand?: () => void;
  onComplete?: () => void;
}

const RADIUS = 1.12;
const DESKTOP_PARTICLES = 1200;
const MOBILE_PARTICLES = 680;
const CLICK_DISTANCE = 6;
const MAX_ROTATION_STEP = 0.12;
const ROTATION_SENSITIVITY = 0.008;
const AUTO_ROTATION_SPEED = 0.075;
const HOVER_RADIUS = 48;

interface GlobeSurface {
  geometry: THREE.BufferGeometry;
  rows: number;
  columns: number;
}

const vertexShader = /* glsl */ `
  attribute float aDepth;
  attribute float aSeed;
  uniform float uProgress;
  uniform float uTime;
  uniform float uActive;
  varying float vDepth;

  void main() {
    vec3 direction = normalize(position);
    float shimmer = sin(aSeed * 41.0 + uTime * (0.8 + aSeed)) * 0.004;
    vec3 point = position + direction * (uProgress * (0.72 + aSeed * 0.46) + shimmer);
    vec4 mvPosition = modelViewMatrix * vec4(point, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    vDepth = clamp(1.0 - ((-mvPosition.z) - 3.55) / 2.55, 0.08, 1.0);
    gl_PointSize = (0.82 + vDepth * 1.05 + uActive * 0.28) * (10.5 / -mvPosition.z);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uActive;
  varying float vDepth;

  void main() {
    float distanceFromCenter = distance(gl_PointCoord, vec2(0.5));
    float alpha = 1.0 - smoothstep(0.2, 0.5, distanceFromCenter);
    vec3 deepGreen = vec3(0.002, 0.035, 0.01);
    vec3 brightGreen = vec3(0.025, 0.2, 0.055);
    vec3 coolHighlight = vec3(0.16, 0.64, 0.72);
    vec3 green = mix(deepGreen, brightGreen, vDepth);
    vec3 color = mix(green, coolHighlight, uActive * 0.16);
    gl_FragColor = vec4(color, alpha * (0.12 + vDepth * 0.18));
  }
`;

const nodeVertexShader = /* glsl */ `
  attribute float aGlow;
  attribute float aSeed;
  uniform float uTime;
  varying float vGlow;

  void main() {
    vec3 direction = normalize(position);
    float breathe = sin(aSeed * 31.0 + uTime * 1.4) * 0.004;
    vec3 point = position + direction * (breathe + aGlow * 0.018);
    vec4 mvPosition = modelViewMatrix * vec4(point, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    vGlow = aGlow;
    gl_PointSize = (1.05 + aGlow * 3.8) * (10.5 / -mvPosition.z);
  }
`;

const nodeFragmentShader = /* glsl */ `
  varying float vGlow;

  void main() {
    float distanceFromCenter = distance(gl_PointCoord, vec2(0.5));
    float alpha = 1.0 - smoothstep(0.18, 0.5, distanceFromCenter);
    vec3 dimNode = vec3(0.004, 0.045, 0.014);
    vec3 brightNode = vec3(0.22, 1.0, 0.38);
    vec3 coolHighlight = vec3(0.16, 0.64, 0.72);
    vec3 color = mix(dimNode, brightNode, smoothstep(0.05, 1.0, vGlow));
    color = mix(color, coolHighlight, smoothstep(0.78, 1.0, vGlow) * 0.28);
    gl_FragColor = vec4(color, alpha * (0.16 + vGlow * 0.84));
  }
`;

function particleCount(): number {
  return window.matchMedia("(max-width: 680px)").matches
    ? MOBILE_PARTICLES
    : DESKTOP_PARTICLES;
}

function createSphereGeometry(count: number): GlobeSurface {
  const columns = count >= 900 ? 40 : 28;
  const rows = Math.max(1, Math.floor(count / columns));
  const actualCount = rows * columns;
  const positions = new Float32Array(actualCount * 3);
  const depths = new Float32Array(actualCount);
  const seeds = new Float32Array(actualCount);

  // A latitude/longitude lattice gives the surface an immediate globe silhouette.
  // Half-step latitude bands keep the poles from becoming unnaturally crowded.
  for (let row = 0; row < rows; row += 1) {
    const latitude = Math.PI / 2 - ((row + 0.5) / rows) * Math.PI;
    const ring = Math.cos(latitude);
    const y = Math.sin(latitude);
    for (let column = 0; column < columns; column += 1) {
      const index = row * columns + column;
      const longitude = (column / columns) * Math.PI * 2;
      const x = Math.cos(longitude) * ring;
      const z = Math.sin(longitude) * ring;
      const offset = index * 3;
      positions[offset] = x * RADIUS;
      positions[offset + 1] = y * RADIUS;
      positions[offset + 2] = z * RADIUS;
      depths[index] = 0.35 + ((z + 1) / 2) * 0.65;
      seeds[index] = (index * 0.61803398875) % 1;
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aDepth", new THREE.BufferAttribute(depths, 1));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  return { geometry, rows, columns };
}

function surfacePoint(longitude: number, latitude: number, scale = 1.006): THREE.Vector3 {
  const lon = THREE.MathUtils.degToRad(longitude);
  const lat = THREE.MathUtils.degToRad(latitude);
  const ring = Math.cos(lat) * RADIUS * scale;
  return new THREE.Vector3(
    Math.cos(lon) * ring,
    Math.sin(lat) * RADIUS * scale,
    Math.sin(lon) * ring,
  );
}

// Simplified but deliberately detailed coast traces. They are visual reference data,
// not a navigational map; the extra vertices preserve recognizable coast silhouettes.
const COAST_TRACES: Array<Array<[number, number]>> = [
  [[-168, 72], [-160, 70], [-153, 63], [-145, 60], [-136, 58], [-130, 54], [-125, 49], [-123, 45], [-119, 38], [-114, 32], [-108, 30], [-103, 25], [-97, 26], [-92, 29], [-88, 30], [-85, 27], [-82, 24], [-80, 28], [-77, 33], [-75, 40], [-70, 44], [-63, 46], [-58, 50], [-53, 55], [-50, 60], [-46, 65], [-45, 71], [-55, 77], [-70, 80], [-90, 82], [-112, 83], [-135, 79], [-152, 76], [-168, 72]],
  [[-81, 12], [-75, 10], [-70, 6], [-65, 4], [-60, 3], [-55, -2], [-50, -8], [-48, -16], [-50, -23], [-54, -30], [-58, -38], [-64, -48], [-70, -54], [-75, -51], [-78, -42], [-80, -30], [-79, -20], [-77, -10], [-80, 0], [-81, 12]],
  [[-10, 36], [-5, 43], [0, 48], [8, 52], [14, 55], [20, 58], [27, 60], [34, 66], [45, 69], [55, 72], [70, 73], [85, 75], [100, 74], [115, 70], [130, 64], [142, 57], [153, 52], [162, 49], [170, 44], [160, 38], [150, 35], [142, 30], [132, 26], [120, 22], [110, 18], [100, 13], [90, 9], [82, 8], [74, 12], [66, 17], [58, 21], [50, 26], [42, 30], [34, 34], [26, 38], [18, 40], [10, 39], [2, 38], [-5, 36], [-10, 36]],
  [[-17, 36], [-8, 37], [0, 36], [8, 35], [17, 32], [25, 31], [33, 27], [39, 20], [43, 12], [40, 4], [38, -4], [35, -12], [32, -20], [28, -28], [22, -34], [14, -35], [6, -34], [-1, -30], [-6, -23], [-10, -14], [-14, -5], [-16, 6], [-17, 18], [-17, 28], [-17, 36]],
  [[68, 23], [76, 26], [82, 22], [88, 20], [87, 13], [82, 8], [77, 6], [73, 10], [70, 17], [68, 23]],
  [[95, 20], [101, 17], [106, 15], [112, 12], [118, 8], [122, 4], [120, -2], [114, -5], [108, 0], [102, 5], [98, 12], [95, 20]],
  [[112, -10], [118, -12], [124, -14], [132, -12], [139, -16], [147, -20], [153, -27], [153, -35], [148, -39], [141, -40], [134, -37], [128, -35], [123, -38], [116, -35], [113, -28], [112, -20], [112, -10]],
  [[-72, 60], [-60, 65], [-48, 70], [-42, 77], [-45, 82], [-60, 84], [-72, 78], [-78, 70], [-72, 60]],
  [[-6, 51], [-3, 55], [2, 58], [5, 55], [3, 51], [-1, 50], [-6, 51]],
  [[138, 36], [142, 40], [145, 36], [143, 32], [138, 36]],
];

function smoothCoastTrace(trace: Array<[number, number]>): Array<[number, number]> {
  const controlPoints = trace[0]?.[0] === trace.at(-1)?.[0] && trace[0]?.[1] === trace.at(-1)?.[1]
    ? trace.slice(0, -1)
    : trace;
  const curve = new THREE.CatmullRomCurve3(
    controlPoints.map(([longitude, latitude]) => new THREE.Vector3(longitude, latitude, 0)),
    true,
    "centripetal",
    0.22,
  );
  const sampleCount = Math.max(32, controlPoints.length * 8);
  return curve.getPoints(sampleCount).slice(0, -1).map((point) => [point.x, point.y]);
}

function createCoastlineGeometry(): THREE.BufferGeometry {
  const edges: number[] = [];
  for (const trace of COAST_TRACES) {
    const smoothTrace = smoothCoastTrace(trace);
    for (let index = 0; index < smoothTrace.length; index += 1) {
      const start = surfacePoint(...smoothTrace[index]!);
      const end = surfacePoint(...smoothTrace[(index + 1) % smoothTrace.length]!);
      edges.push(start.x, start.y, start.z, end.x, end.y, end.z);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(edges, 3));
  return geometry;
}

function createLandGeometry(): THREE.BufferGeometry {
  const positions: number[] = [];
  for (const trace of COAST_TRACES) {
    const contour = smoothCoastTrace(trace).map(([longitude, latitude]) => new THREE.Vector2(longitude, latitude));
    const triangles = THREE.ShapeUtils.triangulateShape(contour, []);
    for (const triangle of triangles) {
      for (const index of triangle) {
        const point = contour[index]!;
        const vertex = surfacePoint(point.x, point.y, 1.002);
        positions.push(vertex.x, vertex.y, vertex.z);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geometry;
}

function createMeshGeometry(surface: GlobeSurface): THREE.BufferGeometry {
  const positions = surface.geometry.getAttribute("position");
  const values = positions.array as Float32Array;
  const edges: number[] = [];

  const addEdge = (first: number, second: number) => {
    const firstOffset = first * 3;
    const secondOffset = second * 3;
    edges.push(
      values[firstOffset]!, values[firstOffset + 1]!, values[firstOffset + 2]!,
      values[secondOffset]!, values[secondOffset + 1]!, values[secondOffset + 2]!,
    );
  };

  for (let row = 0; row < surface.rows; row += 1) {
    for (let column = 0; column < surface.columns; column += 1) {
      const current = row * surface.columns + column;
      const nextColumn = row * surface.columns + ((column + 1) % surface.columns);
      addEdge(current, nextColumn);
      if (row < surface.rows - 1) addEdge(current, current + surface.columns);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(edges, 3));
  return geometry;
}

function createKnowledgeGeometry(nodes: KnowledgeNode[]): {
  geometry: THREE.BufferGeometry;
  positions: THREE.Vector3[];
} {
  const positions = nodes.map((_, index) => {
    const y = 1 - ((index + 0.5) / Math.max(1, nodes.length)) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = Math.PI * (3 - Math.sqrt(5)) * index + 0.42;
    return new THREE.Vector3(
      Math.cos(theta) * ring * RADIUS * 1.018,
      y * RADIUS * 1.018,
      Math.sin(theta) * ring * RADIUS * 1.018,
    );
  });
  const values = new Float32Array(positions.length * 3);
  const seeds = new Float32Array(positions.length);
  const glow = new Float32Array(positions.length);
  positions.forEach((position, index) => {
    values[index * 3] = position.x;
    values[index * 3 + 1] = position.y;
    values[index * 3 + 2] = position.z;
    seeds[index] = (index * 0.61803398875) % 1;
    glow[index] = 0.06;
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(values, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute("aGlow", new THREE.BufferAttribute(glow, 1));
  return { geometry, positions };
}

function nearestDirection(dx: number, dy: number): "horizontal" | "vertical" {
  const angle = Math.atan2(dy, dx);
  const normalized = angle < 0 ? angle + Math.PI * 2 : angle;
  const horizontalDistance = Math.min(normalized, Math.PI * 2 - normalized, Math.abs(normalized - Math.PI));
  const verticalDistance = Math.min(Math.abs(normalized - Math.PI / 2), Math.abs(normalized - Math.PI * 1.5));
  return horizontalDistance <= verticalDistance ? "horizontal" : "vertical";
}

export function ParticleSphere({ phase, nodes = [], onExpand, onComplete }: Props) {
  const host = useRef<HTMLDivElement | null>(null);
  const labelRef = useRef<HTMLSpanElement | null>(null);
  const phaseRef = useRef(phase);
  const onCompleteRef = useRef<(() => void) | undefined>(onComplete);
  const onExpandRef = useRef<(() => void) | undefined>(onExpand);
  phaseRef.current = phase;
  onCompleteRef.current = onComplete;
  onExpandRef.current = onExpand;

  useEffect(() => {
    const node = host.current;
    if (!node) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 20);
    camera.position.z = 4.8;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute("aria-hidden", "true");
    node.appendChild(renderer.domElement);

    const surface = createSphereGeometry(particleCount());
    const geometry = surface.geometry;
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uProgress: { value: phase === "collapsing" ? 1 : 0 },
        uTime: { value: 0 },
        uActive: { value: 0 },
      },
    });
    const meshGeometry = createMeshGeometry(surface);
    const meshMaterial = new THREE.LineBasicMaterial({
      color: 0x3bbd63,
      transparent: true,
      opacity: 0.2,
      linewidth: 1.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const landGeometry = createLandGeometry();
    const landMaterial = new THREE.MeshBasicMaterial({
      color: 0x2f8b58,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    const coastlineGeometry = createCoastlineGeometry();
    const coastlineMaterial = new THREE.LineBasicMaterial({
      color: 0x70d69a,
      transparent: true,
      opacity: 0.68,
      linewidth: 1.2,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const coastlineDotsMaterial = new THREE.PointsMaterial({
      color: 0x9af0bb,
      size: 0.026,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.76,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geometry, material);
    const mesh = new THREE.LineSegments(meshGeometry, meshMaterial);
    const landMass = new THREE.Mesh(landGeometry, landMaterial);
    const coastlines = new THREE.LineSegments(coastlineGeometry, coastlineMaterial);
    const coastlineDots = new THREE.Points(coastlineGeometry, coastlineDotsMaterial);
    const knowledge = createKnowledgeGeometry(nodes);
    const nodeMaterial = new THREE.ShaderMaterial({
      vertexShader: nodeVertexShader,
      fragmentShader: nodeFragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 } },
    });
    const knowledgePoints = new THREE.Points(knowledge.geometry, nodeMaterial);
    const sphereGroup = new THREE.Group();
    // A subtle axial tilt makes the rotating surface read as Earth rather than a perfect grid orb.
    sphereGroup.rotation.z = THREE.MathUtils.degToRad(-23.5);
    sphereGroup.add(points, landMass, mesh, coastlines, coastlineDots, knowledgePoints);
    scene.add(sphereGroup);

    const resize = () => {
      const width = Math.max(1, node.clientWidth);
      const height = Math.max(1, node.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(node);

    let targetProgress = phase === "collapsing" ? 0 : 0;
    let progress = phase === "collapsing" ? 1 : 0;
    let completed = phase === "sphere";
    let active = false;
    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let lastX = 0;
    let lastY = 0;
    let moved = false;
    let axis: "horizontal" | "vertical" = "horizontal";
    let pointerX: number | null = null;
    let pointerY: number | null = null;
    let raf = 0;
    let lastTime = performance.now();
    const projected = new THREE.Vector3();
    const labelElements: HTMLSpanElement[] = [];

    const updateKnowledge = (time: number) => {
      if (nodes.length === 0) return;
      const glow = knowledge.geometry.getAttribute("aGlow") as THREE.BufferAttribute;
      const cycleLength = 3200;
      const batchSize = Math.min(5, nodes.length);
      const batchStart = (Math.floor(time / cycleLength) * batchSize) % nodes.length;
      const sequenceGlow = 0.82 + Math.sin((time / 1000) * 1.8) * 0.08;
      const sequenceIndices = new Set(
        Array.from({ length: batchSize }, (_, offset) => (batchStart + offset) % nodes.length),
      );
      let hoveredIndex = -1;
      let closestDistance = HOVER_RADIUS;
      const screenPositions: Array<{ x: number; y: number }> = [];

      for (let index = 0; index < nodes.length; index += 1) {
        projected.copy(knowledge.positions[index]!);
        projected.applyMatrix4(sphereGroup.matrixWorld).project(camera);
        const screenX = (projected.x * 0.5 + 0.5) * node.clientWidth;
        const screenY = (-projected.y * 0.5 + 0.5) * node.clientHeight;
        screenPositions[index] = { x: screenX, y: screenY };
        const distance = pointerX === null || pointerY === null
          ? Number.POSITIVE_INFINITY
          : Math.hypot(pointerX - screenX, pointerY - screenY);
        if (distance < closestDistance) {
          closestDistance = distance;
          hoveredIndex = index;
        }
      }
      for (let index = 0; index < nodes.length; index += 1) {
        const nodeGlow = index === hoveredIndex ? 1 : sequenceIndices.has(index) ? sequenceGlow : 0.06;
        glow.setX(index, nodeGlow);
      }
      glow.needsUpdate = true;

      const activeIndices = hoveredIndex >= 0 ? [hoveredIndex] : [...sequenceIndices];
      if (activeIndices.length === 0) {
        if (labelRef.current) labelRef.current.style.opacity = "0";
        return;
      }
      if (labelRef.current) {
        while (labelElements.length < activeIndices.length) {
          const label = document.createElement("span");
          labelRef.current.appendChild(label);
          labelElements.push(label);
        }
        while (labelElements.length > activeIndices.length) {
          labelElements.pop()?.remove();
        }
        activeIndices.forEach((index, labelIndex) => {
          const position = screenPositions[index]!;
          const label = labelElements[labelIndex]!;
          label.textContent = nodes[index]!.label;
          label.style.left = `${position.x}px`;
          label.style.top = `${position.y}px`;
        });
        labelRef.current.style.opacity = hoveredIndex >= 0 ? "1" : "0.92";
      }
    };

    const finishTransition = () => {
      if (completed) return;
      const currentPhase = phaseRef.current;
      if (currentPhase === "expanding" && progress > 0.98) {
        completed = true;
        onCompleteRef.current?.();
      } else if (currentPhase === "collapsing" && progress < 0.02) {
        completed = true;
        onCompleteRef.current?.();
      }
    };

    const render = (time: number) => {
      const elapsed = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;
      const currentPhase = phaseRef.current;
      targetProgress = currentPhase === "expanding" ? 1 : currentPhase === "collapsing" ? 0 : 0;
      const transitionEase = 1 - Math.pow(0.001, elapsed / 0.42);
      progress += (targetProgress - progress) * transitionEase;
      material.uniforms.uProgress.value = progress;
      material.uniforms.uTime.value = time / 1000;
      material.uniforms.uActive.value += ((active ? 1 : 0) - material.uniforms.uActive.value) * 0.16;
      nodeMaterial.uniforms.uTime.value = time / 1000;
      updateKnowledge(time);
      if (currentPhase === "sphere" && !active) {
        // Keep the portal alive with a slow clockwise turn; direct manipulation takes priority.
        sphereGroup.rotation.y += AUTO_ROTATION_SPEED * elapsed;
      }
      finishTransition();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    const onPointerDown = (event: PointerEvent) => {
      if (phaseRef.current !== "sphere") return;
      if (event.pointerType === "touch" && event.isPrimary === false) return;
      if (event.pointerType !== "touch") {
        pointerX = event.clientX - node.getBoundingClientRect().left;
        pointerY = event.clientY - node.getBoundingClientRect().top;
      }
      pointerId = event.pointerId;
      startX = lastX = event.clientX;
      startY = lastY = event.clientY;
      moved = false;
      active = true;
      node.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "touch") {
        const bounds = node.getBoundingClientRect();
        pointerX = event.clientX - bounds.left;
        pointerY = event.clientY - bounds.top;
      }
      if (event.pointerId !== pointerId || phaseRef.current !== "sphere") return;
      const totalX = event.clientX - startX;
      const totalY = event.clientY - startY;
      if (!moved && Math.hypot(totalX, totalY) > CLICK_DISTANCE) moved = true;
      if (!moved) return;
      axis = nearestDirection(totalX, totalY);
      const deltaX = event.clientX - lastX;
      const deltaY = event.clientY - lastY;
      if (axis === "horizontal") {
        const step = Math.max(-MAX_ROTATION_STEP, Math.min(MAX_ROTATION_STEP, deltaX * ROTATION_SENSITIVITY));
        sphereGroup.rotation.y -= step;
      } else {
        const step = Math.max(-MAX_ROTATION_STEP, Math.min(MAX_ROTATION_STEP, deltaY * ROTATION_SENSITIVITY));
        sphereGroup.rotation.x += step;
      }
      lastX = event.clientX;
      lastY = event.clientY;
    };

    const endPointer = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      active = false;
      pointerId = null;
      if (!moved && phaseRef.current === "sphere") onExpandRef.current?.();
      if (node.hasPointerCapture(event.pointerId)) node.releasePointerCapture(event.pointerId);
    };

    const onPointerLeave = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) {
        pointerX = null;
        pointerY = null;
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.key === "Enter" || event.key === " ") && phaseRef.current === "sphere") {
        event.preventDefault();
        onExpandRef.current?.();
      }
    };

    node.addEventListener("pointerdown", onPointerDown);
    node.addEventListener("pointermove", onPointerMove);
    node.addEventListener("pointerup", endPointer);
    node.addEventListener("pointercancel", endPointer);
    node.addEventListener("pointerleave", onPointerLeave);
    node.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      node.removeEventListener("pointerdown", onPointerDown);
      node.removeEventListener("pointermove", onPointerMove);
      node.removeEventListener("pointerup", endPointer);
      node.removeEventListener("pointercancel", endPointer);
      node.removeEventListener("pointerleave", onPointerLeave);
      node.removeEventListener("keydown", onKeyDown);
      geometry.dispose();
      meshGeometry.dispose();
      landGeometry.dispose();
      coastlineGeometry.dispose();
      knowledge.geometry.dispose();
      material.dispose();
      meshMaterial.dispose();
      landMaterial.dispose();
      coastlineMaterial.dispose();
      coastlineDotsMaterial.dispose();
      nodeMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [phase]);

  return (
    <div
      ref={host}
      className={`particle-sphere particle-sphere--${phase}`}
      role="button"
      tabIndex={phase === "sphere" ? 0 : -1}
      aria-label={phase === "sphere" ? "拖动旋转粒子球" : "粒子球正在变化"}
    >
      <span ref={labelRef} className="particle-node-label" aria-hidden="true" />
    </div>
  );
}
