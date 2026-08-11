import * as THREE from "three";

// RED FLAG RUN — a synthwave endless runner for the unlisted /instagram
// page. Collect likes (hearts), dodge red flags. Three lanes, swipe or
// arrow keys to move, swipe up / space to jump.

const LANES = [-2.2, 0, 2.2];
const GRAVITY = -32;
const JUMP_VELOCITY = 11.2;
const START_SPEED = 14;
const MAX_SPEED = 34;
const SPEED_RAMP = 0.28;

// Distance from the runner's origin down to the soles of their shoes.
// Resting the origin exactly this high puts the soles on the floor, and
// it is what the "did I clear that bar?" check measures against.
const FEET_OFFSET = 0.7;
const GROUND_Y = FEET_OFFSET;

// Beat this score once and the portfolio link unlocks for good.
export const GOAL_SCORE = 500;

const BEST_KEY = "redflag-run-best";
export const UNLOCK_KEY = "redflag-run-unlocked";

export const makeHeartGeometry = () => {
  const shape = new THREE.Shape();

  shape.moveTo(0, 0.5);
  shape.bezierCurveTo(0, 0.8, -0.5, 0.8, -0.5, 0.5);
  shape.bezierCurveTo(-0.5, 0.2, 0, 0.12, 0, -0.35);
  shape.bezierCurveTo(0, 0.12, 0.5, 0.2, 0.5, 0.5);
  shape.bezierCurveTo(0.5, 0.8, 0, 0.8, 0, 0.5);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.22,
    bevelEnabled: true,
    bevelSize: 0.06,
    bevelThickness: 0.06,
    bevelSegments: 2,
    curveSegments: 10,
  });

  geo.center();
  geo.rotateZ(Math.PI);

  return geo;
};

// A little Sikh kid in a saffron patka, built from simple boxes so the
// limbs can be animated as a proper run cycle. The origin sits at hip
// height and the soles land at -FEET_OFFSET, which is what the
// jump-clearance check measures against.
//
// Exported (and free of any renderer dependency) so the assembly can be
// checked headlessly.
export function createRunner(track = (resource) => resource) {
  const group = new THREE.Group();

  // The world scrolls toward the camera, so the kid faces that way.
  group.rotation.y = Math.PI;

  const material = (color, emissive, intensity) =>
    track(
      new THREE.MeshStandardMaterial({
        color,
        emissive,
        emissiveIntensity: intensity,
        roughness: 0.55,
        metalness: 0.05,
      })
    );

  const skinMat = material(0xb87a4b, 0x6b3f1d, 0.18);
  const patkaMat = material(0xf59e0b, 0xf59e0b, 0.55);
  const kurtaMat = material(0x22d3ee, 0x0e7490, 0.5);
  const pantsMat = material(0x312e81, 0x4338ca, 0.4);
  const shoeMat = material(0xf8fafc, 0x94a3b8, 0.35);

  const geo = {
    torso: track(new THREE.BoxGeometry(0.44, 0.54, 0.28)),
    head: track(new THREE.SphereGeometry(0.17, 16, 14)),
    // A dome rather than a full sphere, so the patka caps the head like
    // real cloth instead of swallowing it.
    patka: track(
      new THREE.SphereGeometry(0.182, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.62)
    ),
    knot: track(new THREE.SphereGeometry(0.078, 12, 10)),
    arm: track(new THREE.BoxGeometry(0.13, 0.4, 0.15)),
    leg: track(new THREE.BoxGeometry(0.16, 0.46, 0.17)),
    shoe: track(new THREE.BoxGeometry(0.18, 0.11, 0.26)),
  };

  const torso = new THREE.Mesh(geo.torso, kurtaMat);

  torso.position.y = 0.14;
  group.add(torso);

  const head = new THREE.Mesh(geo.head, skinMat);

  head.position.y = 0.6;
  group.add(head);

  // Patka capping the head, plus the little joora knot on top that Sikh
  // kids tie their uncut hair into.
  const patka = new THREE.Mesh(geo.patka, patkaMat);

  patka.position.y = 0.6;
  group.add(patka);

  const knot = new THREE.Mesh(geo.knot, patkaMat);

  knot.position.set(0, 0.8, 0);
  group.add(knot);

  // Each limb hangs from a pivot placed at the joint, so rotating the
  // pivot swings the limb from the shoulder/hip instead of its middle.
  const makeLimb = (geometry, mat, x, y, length, withShoe) => {
    const pivot = new THREE.Group();

    pivot.position.set(x, y, 0);

    const mesh = new THREE.Mesh(geometry, mat);

    mesh.position.y = -length / 2;
    pivot.add(mesh);

    if (withShoe) {
      const foot = new THREE.Mesh(geo.shoe, shoeMat);

      foot.position.set(0, -length - 0.045, 0.04);
      pivot.add(foot);
    }

    group.add(pivot);

    return pivot;
  };

  return {
    group,
    torso,
    armL: makeLimb(geo.arm, skinMat, -0.28, 0.34, 0.4, false),
    armR: makeLimb(geo.arm, skinMat, 0.28, 0.34, 0.4, false),
    legL: makeLimb(geo.leg, pantsMat, -0.12, -0.14, 0.46, true),
    legR: makeLimb(geo.leg, pantsMat, 0.12, -0.14, 0.46, true),
  };
}

// Tiny synth sound effects — no audio files needed.
class SFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensure() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;

      if (Ctx) this.ctx = new Ctx();
    }

    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  tone(freqFrom, freqTo, duration, type = "sine", gain = 0.12) {
    if (this.muted || !this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const amp = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freqFrom, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(freqTo, 1), t + duration);
      amp.gain.setValueAtTime(gain, t);
      amp.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      osc.connect(amp).connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + duration + 0.02);
    } catch {
      // Audio is decorative — never let it break the game.
    }
  }

  collect() {
    this.tone(880, 1420, 0.12, "square", 0.07);
  }

  jump() {
    this.tone(280, 620, 0.16, "sine", 0.1);
  }

  crash() {
    this.tone(240, 50, 0.45, "sawtooth", 0.16);
  }

  count() {
    this.tone(660, 660, 0.09, "square", 0.06);
  }

  go() {
    this.tone(880, 1180, 0.22, "square", 0.08);
  }
}

export class RedFlagRun {
  constructor(
    canvas,
    eventTarget,
    { onHud, onCountdown, onGameOver, onUnlock } = {}
  ) {
    this.canvas = canvas;
    this.eventTarget = eventTarget || canvas;
    this.onHud = onHud || (() => {});
    this.onCountdown = onCountdown || (() => {});
    this.onGameOver = onGameOver || (() => {});
    this.onUnlock = onUnlock || (() => {});

    this.state = "idle";
    this.paused = false;
    this.destroyed = false;
    this.sfx = new SFX();

    this.best = Number(localStorage.getItem(BEST_KEY) || 0);
    this.everUnlocked = localStorage.getItem(UNLOCK_KEY) === "1";

    this.reduceMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.disposables = [];
    this.actives = [];
    this.pools = { flag: [], bar: [], wideBar: [], heart: [], pillar: [], arch: [], ring: [] };

    this.initRenderer();
    this.initScene();
    this.initPlayer();
    this.initParticles();
    this.resetRun();
    this.bindInput();

    this.clock = new THREE.Clock();
    this.elapsed = 0;
    this.hudTimer = 0;

    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  track(resource) {
    this.disposables.push(resource);
    return resource;
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Close enough that the kid's patka reads clearly on a phone, still
    // far enough back to see the next obstacle coming.
    this.camera = new THREE.PerspectiveCamera(66, 1, 0.1, 160);
    this.camera.position.set(0, 3.05, 6.1);

    this.resize = () => {
      const w = this.canvas.clientWidth || 1;
      const h = this.canvas.clientHeight || 1;

      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    };

    this.resize();
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(this.canvas);
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d0716);
    this.scene.fog = new THREE.Fog(0x140a24, 20, 105);

    this.scene.add(new THREE.AmbientLight(0x9d8ac9, 0.85));

    const sun = new THREE.DirectionalLight(0xffffff, 1.0);

    sun.position.set(4, 9, 5);
    this.scene.add(sun);

    // Neon grid floor. The grid wraps every 4 units so scrolling it with
    // the world speed reads as seamless forward motion.
    const gridCanvas = document.createElement("canvas");

    gridCanvas.width = 128;
    gridCanvas.height = 128;

    const g = gridCanvas.getContext("2d");

    g.fillStyle = "#150a24";
    g.fillRect(0, 0, 128, 128);
    g.strokeStyle = "rgba(236, 72, 153, 0.6)";
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(0, 126);
    g.lineTo(128, 126);
    g.moveTo(2, 0);
    g.lineTo(2, 128);
    g.stroke();

    const gridTexture = this.track(new THREE.CanvasTexture(gridCanvas));

    gridTexture.wrapS = THREE.RepeatWrapping;
    gridTexture.wrapT = THREE.RepeatWrapping;
    gridTexture.repeat.set(11, 65);

    const groundGeo = this.track(new THREE.PlaneGeometry(44, 260));
    const groundMat = this.track(
      new THREE.MeshBasicMaterial({ map: gridTexture })
    );

    this.ground = new THREE.Mesh(groundGeo, groundMat);
    this.ground.rotation.x = -Math.PI / 2;
    this.groundBaseZ = -92;
    this.groundShift = 0;
    this.ground.position.set(0, 0, this.groundBaseZ);
    this.scene.add(this.ground);

    // Synthwave sun on the horizon, unaffected by fog.
    const sunCanvas = document.createElement("canvas");

    sunCanvas.width = 256;
    sunCanvas.height = 256;

    const s = sunCanvas.getContext("2d");
    const grad = s.createLinearGradient(0, 0, 0, 256);

    grad.addColorStop(0, "#ffc46b");
    grad.addColorStop(0.55, "#ec4899");
    grad.addColorStop(1, "#7c3aed");
    s.fillStyle = grad;
    s.beginPath();
    s.arc(128, 128, 124, 0, Math.PI * 2);
    s.fill();
    s.globalCompositeOperation = "destination-out";

    for (let i = 0; i < 6; i += 1) {
      const y = 150 + i * 18;

      s.fillRect(0, y, 256, 4 + i * 1.4);
    }

    const sunTexture = this.track(new THREE.CanvasTexture(sunCanvas));
    const sunGeo = this.track(new THREE.PlaneGeometry(26, 26));
    const sunMat = this.track(
      new THREE.MeshBasicMaterial({
        map: sunTexture,
        transparent: true,
        fog: false,
        depthWrite: false,
      })
    );

    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);
    this.sunMesh.position.set(0, 7.5, -100);
    this.scene.add(this.sunMesh);

    // Static starfield.
    const starCount = 260;
    const starPositions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i += 1) {
      starPositions[i * 3] = (Math.random() - 0.5) * 170;
      starPositions[i * 3 + 1] = 4 + Math.random() * 55;
      starPositions[i * 3 + 2] = -45 - Math.random() * 70;
    }

    const starGeo = this.track(new THREE.BufferGeometry());

    starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));

    const starMat = this.track(
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.4,
        fog: false,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
      })
    );

    this.scene.add(new THREE.Points(starGeo, starMat));

    // Shared geometries and materials for pooled objects.
    this.geo = {
      flagBlock: this.track(new THREE.BoxGeometry(1.7, 2.4, 0.8)),
      pole: this.track(new THREE.CylinderGeometry(0.05, 0.05, 1.1, 8)),
      flagCloth: this.track(new THREE.PlaneGeometry(0.85, 0.5)),
      bar: this.track(new THREE.BoxGeometry(1.7, 0.9, 0.8)),
      wideBar: this.track(new THREE.BoxGeometry(7.2, 0.9, 0.8)),
      heart: this.track(makeHeartGeometry()),
      pillar: this.track(new THREE.BoxGeometry(0.34, 1, 0.34)),
      arch: this.track(new THREE.TorusGeometry(4.4, 0.1, 10, 48)),
      ring: this.track(new THREE.TorusGeometry(0.72, 0.045, 8, 32)),
    };

    this.mat = {
      flagBlock: this.track(
        new THREE.MeshStandardMaterial({
          color: 0x3b0d1f,
          emissive: 0xdc2626,
          emissiveIntensity: 0.5,
          metalness: 0.3,
          roughness: 0.4,
        })
      ),
      flagCloth: this.track(
        new THREE.MeshStandardMaterial({
          color: 0xef4444,
          emissive: 0xef4444,
          emissiveIntensity: 0.9,
          side: THREE.DoubleSide,
        })
      ),
      bar: this.track(
        new THREE.MeshStandardMaterial({
          color: 0x4a2506,
          emissive: 0xf59e0b,
          emissiveIntensity: 0.6,
          metalness: 0.3,
          roughness: 0.4,
        })
      ),
      heart: this.track(
        new THREE.MeshStandardMaterial({
          color: 0xff2d78,
          emissive: 0xff2d78,
          emissiveIntensity: 0.75,
          metalness: 0.35,
          roughness: 0.3,
        })
      ),
      pillars: [0x22d3ee, 0xe879f9, 0x8b5cf6].map((color) =>
        this.track(
          new THREE.MeshStandardMaterial({
            color: 0x140a24,
            emissive: color,
            emissiveIntensity: 0.9,
          })
        )
      ),
      arch: this.track(
        new THREE.MeshStandardMaterial({
          color: 0x140a24,
          emissive: 0xa855f7,
          emissiveIntensity: 1.1,
        })
      ),
      ring: this.track(
        new THREE.MeshBasicMaterial({
          color: 0xff5fa2,
          transparent: true,
          opacity: 0.5,
          depthWrite: false,
        })
      ),
    };
  }

  initPlayer() {
    this.player = new THREE.Group();

    const runner = createRunner((resource) => this.track(resource));

    this.player.add(runner.group);
    this.runner = runner.group;
    this.torso = runner.torso;
    this.armL = runner.armL;
    this.armR = runner.armR;
    this.legL = runner.legL;
    this.legR = runner.legR;

    const glow = new THREE.PointLight(0xffb347, 22, 9, 1.8);

    glow.position.set(0, 0.8, 0.9);
    this.player.add(glow);

    this.runPhase = 0;
    this.player.position.set(0, GROUND_Y, 0);
    this.scene.add(this.player);
  }

  // Run cycle while grounded, tucked-up pose mid-air.
  animateRunner(dt) {
    const airborne = !this.grounded;
    const moving = this.state === "running" || this.state === "countdown";

    // Stride rate scales with speed so fast running looks frantic.
    this.runPhase += dt * (4.5 + (this.speed / MAX_SPEED) * 9);

    const lerp = (part, axis, target, rate = 12) => {
      part.rotation[axis] += (target - part.rotation[axis]) * Math.min(dt * rate, 1);
    };

    if (airborne) {
      // Legs tucked, arms thrown up — a proper kid's jump.
      lerp(this.legL, "x", -1.15, 14);
      lerp(this.legR, "x", 0.55, 14);
      lerp(this.armL, "x", -2.4, 14);
      lerp(this.armR, "x", -2.4, 14);
      lerp(this.torso, "x", -0.1, 10);
      this.runner.position.y = 0;
    } else if (moving) {
      const swing = Math.sin(this.runPhase);
      const lift = Math.abs(Math.cos(this.runPhase));

      this.legL.rotation.x = swing * 0.95;
      this.legR.rotation.x = -swing * 0.95;
      this.armL.rotation.x = -swing * 0.85;
      this.armR.rotation.x = swing * 0.85;

      // Slight bounce and a forward lean that deepens with speed.
      this.runner.position.y = lift * 0.045;
      this.torso.rotation.x = 0.14 + (this.speed / MAX_SPEED) * 0.12;
    } else {
      lerp(this.legL, "x", 0, 8);
      lerp(this.legR, "x", 0, 8);
      lerp(this.armL, "x", 0, 8);
      lerp(this.armR, "x", 0, 8);
      lerp(this.torso, "x", 0, 8);
      this.runner.position.y = 0;
    }

    // Arms splay out slightly when changing lanes, for balance.
    const drift = this.player.rotation.z;

    this.armL.rotation.z = drift * 1.2;
    this.armR.rotation.z = drift * 1.2;
  }

  initParticles() {
    this.particleCount = 110;
    this.particleData = [];

    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);

    for (let i = 0; i < this.particleCount; i += 1) {
      positions[i * 3 + 1] = -999;
      this.particleData.push({
        life: 0,
        maxLife: 1,
        vx: 0,
        vy: 0,
        vz: 0,
        r: 1,
        g: 1,
        b: 1,
      });
    }

    this.particleGeo = this.track(new THREE.BufferGeometry());
    this.particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    this.particleGeo.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const mat = this.track(
      new THREE.PointsMaterial({
        size: 0.17,
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );

    const points = new THREE.Points(this.particleGeo, mat);

    points.frustumCulled = false;
    this.scene.add(points);
    this.nextParticle = 0;
  }

  burst(x, y, z, color, count, power = 5) {
    const c = new THREE.Color(color);

    for (let i = 0; i < count; i += 1) {
      const p = this.particleData[this.nextParticle];
      const positions = this.particleGeo.attributes.position.array;
      const idx = this.nextParticle * 3;

      positions[idx] = x;
      positions[idx + 1] = y;
      positions[idx + 2] = z;

      p.life = 0.55 + Math.random() * 0.3;
      p.maxLife = p.life;
      p.vx = (Math.random() - 0.5) * power;
      p.vy = Math.random() * power * 0.9;
      p.vz = (Math.random() - 0.5) * power;
      p.r = c.r;
      p.g = c.g;
      p.b = c.b;

      this.nextParticle = (this.nextParticle + 1) % this.particleCount;
    }
  }

  updateParticles(dt) {
    const positions = this.particleGeo.attributes.position.array;
    const colors = this.particleGeo.attributes.color.array;

    for (let i = 0; i < this.particleCount; i += 1) {
      const p = this.particleData[i];
      const idx = i * 3;

      if (p.life <= 0) {
        if (positions[idx + 1] > -900) positions[idx + 1] = -999;
        continue;
      }

      p.life -= dt;
      p.vy += GRAVITY * 0.3 * dt;
      positions[idx] += p.vx * dt;
      positions[idx + 1] += p.vy * dt;
      positions[idx + 2] += p.vz * dt + this.speed * dt * 0.4;

      const fade = Math.max(p.life / p.maxLife, 0);

      colors[idx] = p.r * fade;
      colors[idx + 1] = p.g * fade;
      colors[idx + 2] = p.b * fade;
    }

    this.particleGeo.attributes.position.needsUpdate = true;
    this.particleGeo.attributes.color.needsUpdate = true;
  }

  // ---- Object pools ----

  acquire(kind) {
    const pool = this.pools[kind];
    let entry = pool.find((item) => !item.inUse);

    if (!entry) {
      entry = { inUse: false, obj: this.build(kind) };
      pool.push(entry);
      this.scene.add(entry.obj);
    }

    entry.inUse = true;
    entry.obj.visible = true;

    return entry;
  }

  release(entry) {
    entry.inUse = false;
    entry.obj.visible = false;
    entry.obj.position.y = -999;
  }

  build(kind) {
    switch (kind) {
      case "flag": {
        const group = new THREE.Group();
        const block = new THREE.Mesh(this.geo.flagBlock, this.mat.flagBlock);

        block.position.y = 1.2;

        const pole = new THREE.Mesh(this.geo.pole, this.mat.flagBlock);

        pole.position.y = 2.9;

        const cloth = new THREE.Mesh(this.geo.flagCloth, this.mat.flagCloth);

        cloth.position.set(0.44, 3.18, 0);

        group.add(block, pole, cloth);
        group.userData.cloth = cloth;

        return group;
      }
      case "bar":
        return new THREE.Mesh(this.geo.bar, this.mat.bar);
      case "wideBar":
        return new THREE.Mesh(this.geo.wideBar, this.mat.bar);
      case "heart":
        return new THREE.Mesh(this.geo.heart, this.mat.heart);
      case "pillar": {
        const mat = this.mat.pillars[Math.floor(Math.random() * 3)];

        return new THREE.Mesh(this.geo.pillar, mat);
      }
      case "arch":
        return new THREE.Mesh(this.geo.arch, this.mat.arch);
      case "ring":
        return new THREE.Mesh(this.geo.ring, this.mat.ring.clone());
      default:
        throw new Error(`unknown pool kind: ${kind}`);
    }
  }

  // ---- Spawning ----

  spawnDecor() {
    const pillar = this.acquire("pillar");
    const side = this.decorSide ? 1 : -1;

    this.decorSide = !this.decorSide;

    const height = 3 + Math.random() * 3.5;

    pillar.obj.scale.set(1, height, 1);
    pillar.obj.position.set(side * (5.4 + Math.random() * 2.5), height / 2, -110);
    this.actives.push({ kind: "pillar", entry: pillar });
  }

  spawnArch() {
    const arch = this.acquire("arch");

    arch.obj.position.set(0, 0, -110);
    this.actives.push({ kind: "arch", entry: arch });
  }

  spawnHeartLine(lane, z, arc = false) {
    const count = arc ? 5 : 4;

    for (let i = 0; i < count; i += 1) {
      const heart = this.acquire("heart");
      const spacing = arc ? 1.7 : 2.0;
      const offset = (i - (count - 1) / 2) * spacing;
      const y = arc
        ? 1.0 + Math.sin((i / (count - 1)) * Math.PI) * 1.15
        : 1.05;

      heart.obj.scale.setScalar(0.8);
      heart.obj.position.set(LANES[lane], y, z + offset);
      this.actives.push({
        kind: "heart",
        entry: heart,
        lane,
        baseY: y,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  spawnPattern() {
    const difficulty = Math.min(
      (this.speed - START_SPEED) / (MAX_SPEED - START_SPEED),
      1
    );
    const z = -110;
    const lanes = [0, 1, 2];
    const roll = Math.random();

    const freeLanes = new Set(lanes);
    const place = (kind, lane) => {
      const entry = this.acquire(kind);

      if (kind === "flag") {
        entry.obj.position.set(LANES[lane], 0, z);
      } else {
        entry.obj.position.set(kind === "wideBar" ? 0 : LANES[lane], 0.45, z);
      }

      this.actives.push({ kind, entry, lane });
    };

    if (roll < 0.3) {
      // One red flag.
      const lane = Math.floor(Math.random() * 3);

      place("flag", lane);
      freeLanes.delete(lane);
    } else if (roll < 0.52 && difficulty > 0.12) {
      // Two red flags, one lane free.
      const free = Math.floor(Math.random() * 3);

      lanes
        .filter((lane) => lane !== free)
        .forEach((lane) => {
          place("flag", lane);
          freeLanes.delete(lane);
        });
    } else if (roll < 0.72) {
      // Low bar in one lane — jump it or go around.
      const lane = Math.floor(Math.random() * 3);

      place("bar", lane);
    } else if (roll < 0.86 && difficulty > 0.25) {
      // Full-width bar: jumping is mandatory.
      place("wideBar", 1);
      this.spawnHeartLine(Math.floor(Math.random() * 3), z, true);

      return;
    } else {
      // Flag plus offset bar in another lane.
      const flagLane = Math.floor(Math.random() * 3);
      const others = lanes.filter((lane) => lane !== flagLane);
      const barLane = others[Math.floor(Math.random() * others.length)];

      place("flag", flagLane);
      freeLanes.delete(flagLane);

      const bar = this.acquire("bar");

      bar.obj.position.set(LANES[barLane], 0.45, z - 4);
      this.actives.push({ kind: "bar", entry: bar, lane: barLane });
    }

    if (Math.random() < 0.62) {
      const options = [...freeLanes];
      const lane = options[Math.floor(Math.random() * options.length)];

      this.spawnHeartLine(lane, z - 9);
    }
  }

  // ---- Run lifecycle ----

  resetRun() {
    this.actives.forEach((item) => this.release(item.entry));
    this.actives = [];

    this.speed = 6;
    this.distance = 0;
    this.hearts = 0;
    this.score = 0;
    this.lane = 1;
    this.playerY = GROUND_Y;
    this.velocityY = 0;
    this.grounded = true;
    this.shake = 0;
    this.trailTimer = 0;
    this.decorTimer = 0;
    this.archTimer = 0;
    this.nextSpawnIn = 6;
    this.decorSide = false;
    this.clearedGoal = false;
    this.player.visible = true;
    this.player.position.set(LANES[1], GROUND_Y, 0);
  }

  // Crossing GOAL_SCORE mid-run unlocks the portfolio link for good.
  checkGoal() {
    if (this.clearedGoal || this.score < GOAL_SCORE) return;

    this.clearedGoal = true;
    this.everUnlocked = true;

    try {
      localStorage.setItem(UNLOCK_KEY, "1");
    } catch {
      // Storage unavailable — the unlock still holds for this session.
    }

    this.burst(this.player.position.x, 1.4, 0, 0xfbbf24, 30, 7);
    this.burst(this.player.position.x, 1.4, 0, 0x22d3ee, 18, 5);
    this.sfx.go();
    this.onUnlock();
  }

  start() {
    if (this.state === "countdown" || this.state === "running") return;

    this.sfx.ensure();
    this.resetRun();
    this.state = "countdown";
    this.countdownT = 3.2;
    this.lastCount = 4;
    this.emitHud(true);
  }

  crashNow() {
    this.state = "crashed";
    this.crashTimer = 0;
    this.shake = 1;
    this.player.visible = false;

    const cx = this.player.position.x;
    const cy = this.player.position.y + 0.2;

    this.burst(cx, cy, 0, 0xff3355, 36, 8);
    this.burst(cx, cy, 0, 0xffc46b, 20, 6);
    this.burst(cx, cy + 0.5, 0, 0xf59e0b, 14, 5);
    this.sfx.crash();

    if (this.score > this.best) {
      this.best = Math.floor(this.score);
      this.isRecord = true;

      try {
        localStorage.setItem(BEST_KEY, String(this.best));
      } catch {
        // Storage unavailable — the run still counts.
      }
    } else {
      this.isRecord = false;
    }
  }

  emitHud(force = false) {
    if (!force && this.hudTimer < 0.12) return;

    this.hudTimer = 0;
    this.onHud({
      score: Math.floor(this.score),
      hearts: this.hearts,
      best: this.best,
      speed: this.speed / START_SPEED,
      goalProgress: Math.min(this.score / GOAL_SCORE, 1),
      clearedGoal: this.clearedGoal,
    });
  }

  // ---- Input ----

  bindInput() {
    this.onKeyDown = (event) => {
      const { code } = event;

      if (this.state === "running") {
        if (code === "ArrowLeft" || code === "KeyA") {
          event.preventDefault();
          this.moveLane(-1);
        } else if (code === "ArrowRight" || code === "KeyD") {
          event.preventDefault();
          this.moveLane(1);
        } else if (code === "ArrowUp" || code === "KeyW" || code === "Space") {
          event.preventDefault();
          this.jump();
        }
      } else if (this.state === "over" && (code === "Space" || code === "Enter")) {
        event.preventDefault();
        this.start();
      }
    };

    this.onTouchStart = (event) => {
      const touch = event.changedTouches[0];

      this.touch = { x: touch.clientX, y: touch.clientY };
    };

    this.onTouchMove = (event) => {
      if (this.state === "running") event.preventDefault();
    };

    this.onTouchEnd = (event) => {
      if (!this.touch || this.state !== "running") return;

      const touch = event.changedTouches[0];
      const dx = touch.clientX - this.touch.x;
      const dy = touch.clientY - this.touch.y;

      if (Math.abs(dx) < 26 && Math.abs(dy) < 26) {
        this.jump();
      } else if (Math.abs(dx) > Math.abs(dy)) {
        this.moveLane(dx > 0 ? 1 : -1);
      } else if (dy < 0) {
        this.jump();
      }

      this.touch = null;
    };

    window.addEventListener("keydown", this.onKeyDown);
    this.eventTarget.addEventListener("touchstart", this.onTouchStart, {
      passive: true,
    });
    this.eventTarget.addEventListener("touchmove", this.onTouchMove, {
      passive: false,
    });
    this.eventTarget.addEventListener("touchend", this.onTouchEnd, {
      passive: true,
    });
  }

  moveLane(direction) {
    this.lane = Math.min(Math.max(this.lane + direction, 0), 2);
  }

  jump() {
    if (!this.grounded) return;

    this.grounded = false;
    this.velocityY = JUMP_VELOCITY;
    this.sfx.jump();
  }

  setMuted(muted) {
    this.sfx.muted = muted;
  }

  setPaused(paused) {
    this.paused = paused;

    if (!paused) this.clock.getDelta();
  }

  // ---- Main loop ----

  loop() {
    if (this.destroyed) return;

    this.raf = requestAnimationFrame(this.loop);

    if (this.paused) return;

    const dt = Math.min(this.clock.getDelta(), 0.05);

    this.elapsed += dt;
    this.hudTimer += dt;

    if (this.state === "countdown") {
      this.countdownT -= dt;

      const current = Math.ceil(this.countdownT);

      if (current < this.lastCount) {
        this.lastCount = current;

        if (current > 0) {
          this.onCountdown(current);
          this.sfx.count();
        } else {
          this.onCountdown(0);
          this.sfx.go();
          this.state = "running";
        }
      }
    }

    const runningWorld =
      this.state === "running" ||
      this.state === "crashed" ||
      this.state === "idle" ||
      this.state === "countdown" ||
      this.state === "over";

    if (this.state === "running") {
      this.speed = Math.min(this.speed + SPEED_RAMP * dt * 4, MAX_SPEED);

      if (this.speed < START_SPEED) {
        this.speed = Math.min(this.speed + 14 * dt, START_SPEED);
      }
    } else if (this.state === "crashed" || this.state === "over") {
      this.speed = Math.max(this.speed - 26 * dt, 0);
    } else {
      // Idle attract mode drifts slowly.
      this.speed = 6;
    }

    const dz = this.speed * dt;

    if (runningWorld) {
      this.distance += dz;
      this.groundShift = (this.groundShift + dz) % 4;
      this.ground.position.z = this.groundBaseZ + this.groundShift;

      // Decor cadence is distance-based so density stays constant.
      this.decorTimer -= dz;
      this.archTimer -= dz;

      if (this.decorTimer <= 0) {
        this.spawnDecor();
        this.decorTimer = 9;
      }

      if (this.archTimer <= 0) {
        this.spawnArch();
        this.archTimer = 58;
      }

      if (this.state === "running") {
        this.nextSpawnIn -= dz;

        if (this.nextSpawnIn <= 0) {
          this.spawnPattern();
          this.nextSpawnIn = Math.min(Math.max(this.speed * 0.62, 10), 22);
        }

        this.score += dz;
        this.checkGoal();
      }
    }

    // Move and recycle world objects.
    for (let i = this.actives.length - 1; i >= 0; i -= 1) {
      const item = this.actives[i];
      const obj = item.entry.obj;

      obj.position.z += dz;

      if (item.kind === "heart") {
        obj.rotation.y += dt * 3.2;
        obj.position.y = item.baseY + Math.sin(this.elapsed * 4 + item.phase) * 0.14;
      } else if (item.kind === "flag") {
        const cloth = obj.userData.cloth;

        if (cloth) cloth.rotation.y = Math.sin(this.elapsed * 6 + obj.position.z) * 0.45;
      } else if (item.kind === "ring") {
        item.life -= dt;
        obj.scale.setScalar(1 + (1 - item.life / 0.45) * 0.9);
        obj.material.opacity = Math.max(item.life / 0.45, 0) * 0.5;

        if (item.life <= 0) {
          this.release(item.entry);
          this.actives.splice(i, 1);
          continue;
        }
      }

      if (obj.position.z > 14) {
        this.release(item.entry);
        this.actives.splice(i, 1);
      }
    }

    // Player physics and lane movement.
    if (this.state === "running" || this.state === "countdown" || this.state === "idle") {
      const targetX = LANES[this.lane];

      this.player.position.x +=
        (targetX - this.player.position.x) * Math.min(dt * 11, 1);
      this.player.rotation.z = (this.player.position.x - targetX) * 0.28;

      if (!this.grounded) {
        this.velocityY += GRAVITY * dt;
        this.playerY += this.velocityY * dt;

        if (this.playerY <= GROUND_Y) {
          this.playerY = GROUND_Y;
          this.velocityY = 0;
          this.grounded = true;
          this.burst(this.player.position.x, 0.15, 0, 0x8b5cf6, 6, 2.5);
        }

        this.player.position.y = this.playerY;
      } else {
        this.player.position.y = GROUND_Y;
        this.playerY = GROUND_Y;
      }

      this.animateRunner(dt);

      // Fading trail rings while running.
      if (this.state === "running") {
        this.trailTimer -= dt;

        if (this.trailTimer <= 0) {
          this.trailTimer = 0.09;

          const ring = this.acquire("ring");

          ring.obj.position.copy(this.player.position);
          ring.obj.scale.setScalar(1);
          ring.obj.material.opacity = 0.5;
          this.actives.push({ kind: "ring", entry: ring, life: 0.45 });
        }
      }
    }

    // Collisions.
    if (this.state === "running") {
      const px = this.player.position.x;
      const pBottom = this.playerY - FEET_OFFSET;

      for (let i = this.actives.length - 1; i >= 0; i -= 1) {
        const item = this.actives[i];
        const obj = item.entry.obj;
        const z = obj.position.z;

        if (z < -1.3 || z > 1.3) continue;

        if (item.kind === "heart") {
          if (
            Math.abs(obj.position.x - px) < 1.05 &&
            Math.abs(obj.position.y - this.playerY) < 1.05
          ) {
            this.hearts += 1;
            this.score += 25;
            this.checkGoal();
            this.burst(obj.position.x, obj.position.y, z, 0xff5fa2, 12, 4.5);
            this.sfx.collect();
            this.release(item.entry);
            this.actives.splice(i, 1);
            this.emitHud(true);
          }
        } else if (item.kind === "flag") {
          if (Math.abs(LANES[item.lane] - px) < 1.25) {
            this.crashNow();
            break;
          }
        } else if (item.kind === "bar") {
          if (Math.abs(LANES[item.lane] - px) < 1.25 && pBottom < 0.92) {
            this.crashNow();
            break;
          }
        } else if (item.kind === "wideBar") {
          if (pBottom < 0.92) {
            this.crashNow();
            break;
          }
        }
      }
    }

    if (this.state === "crashed") {
      this.crashTimer += dt;

      if (this.crashTimer > 1.0) {
        this.state = "over";
        this.onGameOver({
          score: Math.floor(this.score),
          hearts: this.hearts,
          best: this.best,
          isRecord: this.isRecord,
          clearedGoal: this.clearedGoal,
          everUnlocked: this.everUnlocked,
        });
      }
    }

    // Camera follows the player with a little lag and shake.
    const camX = this.player.position.x * 0.55;

    this.camera.position.x += (camX - this.camera.position.x) * Math.min(dt * 6, 1);
    this.camera.position.y = 3.05 + (this.playerY - GROUND_Y) * 0.25;

    if (this.shake > 0 && !this.reduceMotion) {
      this.shake = Math.max(this.shake - dt * 1.8, 0);
      this.camera.position.x += (Math.random() - 0.5) * this.shake * 0.5;
      this.camera.position.y += (Math.random() - 0.5) * this.shake * 0.5;
    }

    this.camera.lookAt(this.player.position.x * 0.6, 1.3, -10);

    // Slight FOV push as speed rises.
    const targetFov = 66 + (this.speed / MAX_SPEED) * 8;

    if (Math.abs(this.camera.fov - targetFov) > 0.1) {
      this.camera.fov += (targetFov - this.camera.fov) * Math.min(dt * 3, 1);
      this.camera.updateProjectionMatrix();
    }

    this.updateParticles(dt);

    if (this.state === "running") this.emitHud();

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.raf);
    this.resizeObserver.disconnect();
    window.removeEventListener("keydown", this.onKeyDown);
    this.eventTarget.removeEventListener("touchstart", this.onTouchStart);
    this.eventTarget.removeEventListener("touchmove", this.onTouchMove);
    this.eventTarget.removeEventListener("touchend", this.onTouchEnd);

    Object.values(this.pools).forEach((pool) =>
      pool.forEach((entry) => {
        if (entry.obj.material && entry.obj.material.transparent) {
          entry.obj.material.dispose();
        }
      })
    );

    this.disposables.forEach((resource) => resource.dispose());
    this.renderer.dispose();

    if (this.sfx.ctx) this.sfx.ctx.close().catch(() => {});
  }
}
