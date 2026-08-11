import * as THREE from "three";
import { makeHeartGeometry } from "./instagram-game";

// Floating 3D hearts behind the hero section of the /instagram page.
// Purely decorative: parallax follows the pointer, drifts on its own
// for touch devices, and pauses whenever the tab is hidden.

const HEART_COLORS = [0xff2d78, 0xf59e0b, 0x8b5cf6, 0xec4899, 0x22d3ee];

export function createHeroBackground(canvas) {
  const reduceMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 60);

  camera.position.set(0, 0, 9);

  scene.add(new THREE.AmbientLight(0xa78bfa, 1.0));

  const key = new THREE.DirectionalLight(0xffffff, 1.1);

  key.position.set(4, 6, 8);
  scene.add(key);

  const heartGeo = makeHeartGeometry();
  const materials = HEART_COLORS.map(
    (color) =>
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.35,
        metalness: 0.3,
        roughness: 0.35,
        flatShading: false,
      })
  );

  const hearts = [];

  for (let i = 0; i < 16; i += 1) {
    const mesh = new THREE.Mesh(heartGeo, materials[i % materials.length]);
    const scale = 0.25 + Math.random() * 0.5;

    mesh.scale.setScalar(scale);
    mesh.position.set(
      (Math.random() - 0.5) * 13,
      (Math.random() - 0.5) * 11,
      -2 - Math.random() * 10
    );
    mesh.rotation.set(Math.random() * 2, Math.random() * 2, 0);

    hearts.push({
      mesh,
      spinX: (Math.random() - 0.5) * 0.7,
      spinY: 0.3 + Math.random() * 0.7,
      bobPhase: Math.random() * Math.PI * 2,
      bobAmp: 0.25 + Math.random() * 0.4,
      baseY: mesh.position.y,
    });

    scene.add(mesh);
  }

  // Sparse glitter points behind the hearts.
  const glitterCount = 130;
  const glitterPositions = new Float32Array(glitterCount * 3);

  for (let i = 0; i < glitterCount; i += 1) {
    glitterPositions[i * 3] = (Math.random() - 0.5) * 26;
    glitterPositions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    glitterPositions[i * 3 + 2] = -6 - Math.random() * 18;
  }

  const glitterGeo = new THREE.BufferGeometry();

  glitterGeo.setAttribute(
    "position",
    new THREE.BufferAttribute(glitterPositions, 3)
  );

  const glitterMat = new THREE.PointsMaterial({
    color: 0xf9a8d4,
    size: 0.08,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
  });

  scene.add(new THREE.Points(glitterGeo, glitterMat));

  const pointer = { x: 0, y: 0 };

  const onPointerMove = (event) => {
    pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
  };

  window.addEventListener("pointermove", onPointerMove, { passive: true });

  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;

    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };

  resize();

  const resizeObserver = new ResizeObserver(resize);

  resizeObserver.observe(canvas);

  const clock = new THREE.Clock();
  let raf = 0;
  let destroyed = false;

  const frame = () => {
    if (destroyed) return;

    raf = requestAnimationFrame(frame);

    if (document.hidden) return;

    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    hearts.forEach((heart) => {
      heart.mesh.rotation.x += heart.spinX * dt;
      heart.mesh.rotation.y += heart.spinY * dt;
      heart.mesh.position.y =
        heart.baseY + Math.sin(t * 0.8 + heart.bobPhase) * heart.bobAmp;
    });

    // Pointer parallax on desktop, slow autonomous drift on touch.
    const targetX = pointer.x * 1.1 + Math.sin(t * 0.22) * 0.35;
    const targetY = -pointer.y * 0.8 + Math.cos(t * 0.18) * 0.3;

    camera.position.x += (targetX - camera.position.x) * Math.min(dt * 2.4, 1);
    camera.position.y += (targetY - camera.position.y) * Math.min(dt * 2.4, 1);
    camera.lookAt(0, 0, -6);

    renderer.render(scene, camera);
  };

  if (reduceMotion) {
    // One static frame — no animation loop at all.
    renderer.render(scene, camera);
  } else {
    frame();
  }

  return {
    destroy() {
      destroyed = true;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      heartGeo.dispose();
      materials.forEach((material) => material.dispose());
      glitterGeo.dispose();
      glitterMat.dispose();
      renderer.dispose();
    },
  };
}
