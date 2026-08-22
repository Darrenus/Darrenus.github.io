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

function createSphereGeometry(count: number): THREE.BufferGeometry {
  const positions = new Float32Array(count * 3);
  const depths = new Float32Array(count);
  const seeds = new Float32Array(count);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i += 1) {
    const y = 1 - (i / (count - 1)) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;
    const x = Math.cos(theta) * ring;
    const z = Math.sin(theta) * ring;
    const offset = i * 3;
    positions[offset] = x * RADIUS;
    positions[offset + 1] = y * RADIUS;
    positions[offset + 2] = z * RADIUS;
    depths[i] = 0.35 + ((z / RADIUS + 1) / 2) * 0.65;
    seeds[i] = (i * 0.61803398875) % 1;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aDepth", new THREE.BufferAttribute(depths, 1));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  return geometry;
}

function createMeshGeometry(source: THREE.BufferGeometry): THREE.BufferGeometry {
  const positions = source.getAttribute("position");
  const values = positions.array as Float32Array;
  const edges: number[] = [];
  const neighborCount = 3;

  // Connect each particle to a few nearest surface neighbors. This keeps the mesh
  // fine-grained without the visual weight of a full wireframe or an O(n^2) edge list.
  for (let i = 0; i < positions.count; i += 1) {
    const nearestIndices = Array.from({ length: neighborCount }, () => -1);
    const nearestDistances = Array.from({ length: neighborCount }, () => Number.POSITIVE_INFINITY);
    const offset = i * 3;
    const x = values[offset]!;
    const y = values[offset + 1]!;
    const z = values[offset + 2]!;

    for (let j = 0; j < positions.count; j += 1) {
      if (j === i) continue;
      const candidateOffset = j * 3;
      const dx = x - values[candidateOffset]!;
      const dy = y - values[candidateOffset + 1]!;
      const dz = z - values[candidateOffset + 2]!;
      const distance = dx * dx + dy * dy + dz * dz;
      const slot = nearestDistances.findIndex((current) => distance < current);
      if (slot === -1) continue;

      for (let k = neighborCount - 1; k > slot; k -= 1) {
        nearestDistances[k] = nearestDistances[k - 1]!;
        nearestIndices[k] = nearestIndices[k - 1]!;
      }
      nearestDistances[slot] = distance;
      nearestIndices[slot] = j;
    }

    for (const neighbor of nearestIndices) {
      if (neighbor === -1 || neighbor < i) continue;
      const neighborOffset = neighbor * 3;
      edges.push(
        x,
        y,
        z,
        values[neighborOffset]!,
        values[neighborOffset + 1]!,
        values[neighborOffset + 2]!,
      );
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

    const geometry = createSphereGeometry(particleCount());
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
    const meshGeometry = createMeshGeometry(geometry);
    const meshMaterial = new THREE.LineBasicMaterial({
      color: 0x3bbd63,
      transparent: true,
      opacity: 0.34,
      linewidth: 1.7,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geometry, material);
    const mesh = new THREE.LineSegments(meshGeometry, meshMaterial);
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
    sphereGroup.add(points, mesh, knowledgePoints);
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

    const updateKnowledge = (time: number) => {
      if (nodes.length === 0) return;
      const glow = knowledge.geometry.getAttribute("aGlow") as THREE.BufferAttribute;
      const cycleLength = 3200;
      const cyclePosition = (time % cycleLength) / cycleLength;
      const sequenceIndex = Math.min(nodes.length - 1, Math.floor((time / cycleLength) % nodes.length));
      const sequenceGlow = cyclePosition < 0.48
        ? Math.sin((cyclePosition / 0.48) * Math.PI) * 0.88
        : 0;
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
        const nodeGlow = index === hoveredIndex ? 1 : index === sequenceIndex ? sequenceGlow : 0.06;
        glow.setX(index, nodeGlow);
      }
      glow.needsUpdate = true;

      const activeIndex = hoveredIndex >= 0 || sequenceGlow > 0 ? hoveredIndex >= 0 ? hoveredIndex : sequenceIndex : -1;
      if (activeIndex < 0) {
        if (labelRef.current) labelRef.current.style.opacity = "0";
        return;
      }
      const labelPosition = screenPositions[activeIndex]!;
      if (labelRef.current) {
        labelRef.current.textContent = nodes[activeIndex]!.label;
        labelRef.current.style.left = `${labelPosition.x}px`;
        labelRef.current.style.top = `${labelPosition.y}px`;
        labelRef.current.style.opacity = hoveredIndex >= 0 ? "1" : String(Math.min(1, sequenceGlow));
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
      knowledge.geometry.dispose();
      material.dispose();
      meshMaterial.dispose();
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
