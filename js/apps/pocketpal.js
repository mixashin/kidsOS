/* ===== Pocket Pal 3D — Virtual Pet Corgi ===== */
(() => {
  const STORE_KEY = 'kidsOS_pocketpal';

  /* ── Constants ── */
  const FOODS = [
    { id: 'snack',  name: 'Kibble',      emoji: '🦴', hunger: 20, happy: 5,  desc: 'Crunchy!' },
    { id: 'meal',   name: 'Dog Bowl',     emoji: '🍖', hunger: 50, happy: 10, desc: 'Yummy meal!' },
    { id: 'treat',  name: 'Pupcake',      emoji: '🧁', hunger: 10, happy: 30, desc: 'So tasty!' },
    { id: 'water',  name: 'Water Bowl',   emoji: '💧', hunger: 5,  happy: 5,  desc: 'Refreshing!' },
  ];

  const GAMES = [
    { id: 'bubble', name: 'Bubble Pop',  emoji: '🫧', desc: 'Pop the bubbles!',     happy: 30, energy: -15 },
    { id: 'ball',   name: 'Ball Roll',   emoji: '⚽', desc: 'Roll the ball!',        happy: 25, energy: -20 },
    { id: 'copyme', name: 'Copy Me',     emoji: '🪞', desc: 'Match the poses!',      happy: 20, energy: -10 },
  ];

  const CLEAN_TOOLS = [
    { id: 'soap',  name: 'Bubble Bath', emoji: '🧼', clean: 40, desc: 'Squeaky clean!' },
    { id: 'brush', name: 'Brush',       emoji: '🪮', clean: 25, desc: 'So fluffy!' },
  ];

  const PET_NAMES = [
    'Biscuit', 'Nugget', 'Waffles', 'Mochi', 'Peanut', 'Cinnamon',
    'Butterscotch', 'Toffee', 'Maple', 'Cookie', 'Pudding', 'Caramel',
  ];

  const THOUGHTS = {
    happy:   ['Life is great!', 'I love you!', 'Best day ever!', 'Woof woof!', 'Tail wag!'],
    content: ['This is nice.', 'Hmm hmm~', 'Feeling good!', '*stretches*'],
    meh:     ['Could be better...', '*yawn*', 'Hmm...', 'A bit bored...'],
    needy:   ['Hey... notice me?', 'I need something...', '*whimper*'],
    sad:     ['Please help me...', '*sad puppy eyes*', 'I miss you...'],
  };

  const DECAY_PER_HOUR = { hunger: 3, happiness: 2, cleanliness: 1, energy: 2 };

  /* ── Three.js references (loaded dynamically) ── */
  let THREE = null;
  let GLTFLoader = null;
  let OrbitControls = null;

  async function loadThreeJS() {
    if (THREE) return true; // already loaded
    try {
      const threeModule = await import('three');
      THREE = threeModule;
      const [gltf, orbit] = await Promise.all([
        import('three/addons/loaders/GLTFLoader.js'),
        import('three/addons/controls/OrbitControls.js'),
      ]);
      GLTFLoader = gltf.GLTFLoader;
      OrbitControls = orbit.OrbitControls;
      return true;
    } catch (err) {
      console.error('Pocket Pal: Failed to load Three.js:', err);
      return false;
    }
  }

  /* ── State ── */
  let state = null;
  let ui = {
    screen: 'home',
    winId: null,
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    mixer: null,
    clock: null,
    animFrame: null,
    corgi: null,
    animations: {},
    currentAnim: null,
    morphs: {},
    bubbleTimeout: null,
    miniGame: null,
    gameObjects: [],
    raycaster: null,
    mouse: null,
    resizeObs: null,
    decayInterval: null,
    thoughtTimeout: null,
    sleepInterval: null,
  };

  /* ── localStorage ── */
  function defaultState() {
    return {
      name: '',
      hunger: 80,
      happiness: 80,
      cleanliness: 90,
      energy: 80,
      lastUpdate: Date.now(),
      totalFeeds: 0,
      totalPlays: 0,
      totalCleans: 0,
      totalSleeps: 0,
      isSleeping: false,
      sleepStart: null,
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      state = raw ? JSON.parse(raw) : defaultState();
    } catch (e) { state = defaultState(); }
    // Apply time-based decay since last update
    applyDecay();
  }

  function save() {
    if (!state) return;
    state.lastUpdate = Date.now();
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  }

  function applyDecay() {
    if (!state) return;
    const elapsed = (Date.now() - (state.lastUpdate || Date.now())) / 3600000; // hours
    if (elapsed <= 0) return;

    // If sleeping, recover energy instead of decaying
    if (state.isSleeping) {
      state.energy = clamp(state.energy + elapsed * 60);
      // Still decay hunger/cleanliness slowly while sleeping
      state.hunger = clamp(state.hunger - elapsed * DECAY_PER_HOUR.hunger * 0.3);
      state.cleanliness = clamp(state.cleanliness - elapsed * DECAY_PER_HOUR.cleanliness * 0.3);
    } else {
      state.hunger = clamp(state.hunger - elapsed * DECAY_PER_HOUR.hunger);
      state.happiness = clamp(state.happiness - elapsed * DECAY_PER_HOUR.happiness);
      state.cleanliness = clamp(state.cleanliness - elapsed * DECAY_PER_HOUR.cleanliness);
      state.energy = clamp(state.energy - elapsed * DECAY_PER_HOUR.energy);
    }
    state.lastUpdate = Date.now();
  }

  function clamp(v) { return Math.max(0, Math.min(100, v)); }

  /* ── Mood ── */
  function getMood() {
    const min = Math.min(state.hunger, state.happiness, state.cleanliness, state.energy);
    if (min >= 70) return 'happy';
    if (min >= 40) return 'content';
    if (min >= 20) return 'meh';
    if (min >= 10) return 'needy';
    return 'sad';
  }

  function getMoodEmoji() {
    const m = getMood();
    return { happy: '😃', content: '😊', meh: '😐', needy: '😟', sad: '😢' }[m];
  }

  function getLowestNeed() {
    const stats = { hunger: state.hunger, happiness: state.happiness, cleanliness: state.cleanliness, energy: state.energy };
    let lowest = 'hunger', min = 101;
    for (const k in stats) { if (stats[k] < min) { min = stats[k]; lowest = k; } }
    return lowest;
  }

  /* ── Three.js Setup ── */
  function initScene(container) {
    if (!THREE) {
      container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;text-align:center;padding:20px;">Three.js failed to load.<br>Please check your internet connection.</div>';
      return false;
    }

    const w = container.clientWidth;
    const h = container.clientHeight;

    // Renderer
    ui.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    ui.renderer.setSize(w, h);
    ui.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    ui.renderer.shadowMap.enabled = true;
    ui.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    // r149: use outputEncoding (outputColorSpace was added in r152)
    if ('outputColorSpace' in ui.renderer) {
      ui.renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else {
      ui.renderer.outputEncoding = THREE.sRGBEncoding;
    }
    container.appendChild(ui.renderer.domElement);

    // Scene
    ui.scene = new THREE.Scene();

    // Camera
    ui.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    ui.camera.position.set(0, 1.5, 3.5);

    // Controls
    if (OrbitControls) {
      ui.controls = new OrbitControls(ui.camera, ui.renderer.domElement);
      ui.controls.target.set(0, 0.5, 0);
      ui.controls.enableDamping = true;
      ui.controls.dampingFactor = 0.08;
      ui.controls.minDistance = 2;
      ui.controls.maxDistance = 6;
      ui.controls.maxPolarAngle = Math.PI / 2 + 0.3;
      ui.controls.minPolarAngle = 0.2;
      ui.controls.update();
    }

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    ui.scene.add(ambient);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(3, 5, 4);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(512, 512);
    ui.scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0xaaccff, 0.3);
    fillLight.position.set(-3, 2, -2);
    ui.scene.add(fillLight);

    // Ground plane
    const groundGeo = new THREE.CircleGeometry(2.5, 32);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x88cc88, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ui.scene.add(ground);

    // Sky gradient (background)
    ui.scene.background = new THREE.Color(0x87ceeb);

    // Raycaster for pet taps
    ui.raycaster = new THREE.Raycaster();
    ui.mouse = new THREE.Vector2();

    // Clock for animation mixer
    ui.clock = new THREE.Clock();

    // Try to load GLB model, fall back to procedural corgi
    loadGLBModel();

    // Resize observer
    ui.resizeObs = new ResizeObserver(() => resizeRenderer(container));
    ui.resizeObs.observe(container);

    return true;
  }

  /* ── GLB Model Loader ── */
  function loadGLBModel() {
    if (!GLTFLoader) {
      console.warn('Pocket Pal: GLTFLoader not available, using procedural corgi');
      buildProceduralCorgi();
      return;
    }
    const loader = new GLTFLoader();
    loader.load(
      'media/corgi.glb',
      (gltf) => {
        const model = gltf.scene;
        model.name = 'corgi';

        // Auto-scale: normalize model to roughly fit our scene
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetHeight = 1.4; // desired height in scene units
        const scale = targetHeight / maxDim;
        model.scale.setScalar(scale);

        // Center model on ground
        const scaledBox = new THREE.Box3().setFromObject(model);
        const center = scaledBox.getCenter(new THREE.Vector3());
        model.position.x = -center.x;
        model.position.z = -center.z;
        model.position.y = -scaledBox.min.y; // sit on ground plane

        // Enable shadows on all meshes
        model.traverse(child => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        ui.scene.add(model);
        ui.corgi = model;
        ui.corgi._isGLB = true;

        // Set up AnimationMixer if model has animation clips
        if (gltf.animations && gltf.animations.length > 0) {
          ui.mixer = new THREE.AnimationMixer(model);
          ui.animations = {};
          gltf.animations.forEach(clip => {
            ui.animations[clip.name.toLowerCase()] = clip;
          });
          console.log('Pocket Pal: Loaded animations:', Object.keys(ui.animations).join(', '));
          // Play idle if available
          playGLBAnimation('idle');
        }

        // Adjust camera to look at model center
        const modelCenter = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
        if (ui.controls) {
          ui.controls.target.copy(modelCenter);
          ui.controls.update();
        }
        ui.camera.position.set(0, modelCenter.y + 0.5, 3);
      },
      undefined, // progress
      (err) => {
        console.warn('Pocket Pal: Could not load corgi.glb, using procedural corgi:', err);
        buildProceduralCorgi();
      }
    );
  }

  /* ── GLB Animation Playback ── */
  let currentGLBAction = null;

  function playGLBAnimation(name) {
    if (!ui.mixer || !ui.animations) return false;
    const clip = ui.animations[name] || ui.animations[name.replace('_', '')];
    if (!clip) return false;

    const action = ui.mixer.clipAction(clip);
    if (currentGLBAction && currentGLBAction !== action) {
      currentGLBAction.fadeOut(0.3);
    }
    action.reset().fadeIn(0.3).play();
    // One-shot animations: clamp on finish
    const onceAnims = ['eat', 'shake', 'wave', 'boop', 'dizzy', 'refuse_food', 'sleep_enter'];
    if (onceAnims.includes(name)) {
      action.setLoop(THREE.LoopOnce);
      action.clampWhenFinished = true;
    } else {
      action.setLoop(THREE.LoopRepeat);
    }
    currentGLBAction = action;
    return true;
  }

  function buildProceduralCorgi() {
    const group = new THREE.Group();
    group.name = 'corgi';

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xf4a460, roughness: 0.7 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xfff8dc, roughness: 0.7 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x3d2b1f, roughness: 0.5 });
    const noseMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.4 });
    const tongueMat = new THREE.MeshStandardMaterial({ color: 0xff6b81, roughness: 0.6 });

    // Body (elongated sphere)
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 12), bodyMat);
    body.scale.set(1, 0.85, 1.3);
    body.position.set(0, 0.55, 0);
    body.castShadow = true;
    group.add(body);

    // White belly
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 10), whiteMat);
    belly.scale.set(0.9, 0.75, 1.1);
    belly.position.set(0, 0.48, 0.05);
    group.add(belly);

    // Head (large sphere — chibi style)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 14), bodyMat);
    head.position.set(0, 1.05, 0.35);
    head.castShadow = true;
    head.name = 'head';
    group.add(head);

    // Face (white patch)
    const facePatch = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10), whiteMat);
    facePatch.position.set(0, 1.0, 0.6);
    facePatch.scale.set(0.8, 0.75, 0.5);
    group.add(facePatch);

    // Eyes
    const eyeGeo = new THREE.SphereGeometry(0.06, 10, 10);
    const eyeL = new THREE.Mesh(eyeGeo, darkMat);
    eyeL.position.set(-0.13, 1.1, 0.7);
    eyeL.name = 'eyeL';
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, darkMat);
    eyeR.position.set(0.13, 1.1, 0.7);
    eyeR.name = 'eyeR';
    group.add(eyeR);

    // Eye shine
    const shineGeo = new THREE.SphereGeometry(0.02, 8, 8);
    const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const shineL = new THREE.Mesh(shineGeo, shineMat);
    shineL.position.set(-0.11, 1.12, 0.75);
    group.add(shineL);
    const shineR = new THREE.Mesh(shineGeo, shineMat);
    shineR.position.set(0.15, 1.12, 0.75);
    group.add(shineR);

    // Nose
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 10), noseMat);
    nose.position.set(0, 1.0, 0.77);
    nose.scale.set(1.2, 0.9, 0.8);
    group.add(nose);

    // Mouth (small smile curve via torus)
    const mouth = new THREE.Mesh(
      new THREE.TorusGeometry(0.06, 0.012, 8, 12, Math.PI),
      darkMat
    );
    mouth.position.set(0, 0.93, 0.73);
    mouth.rotation.x = 0.2;
    mouth.rotation.z = Math.PI;
    group.add(mouth);

    // Tongue (hidden by default — toggled for expressions)
    const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), tongueMat);
    tongue.position.set(0, 0.91, 0.75);
    tongue.scale.set(0.8, 0.5, 1);
    tongue.visible = false;
    tongue.name = 'tongue';
    group.add(tongue);

    // Ears
    const earGeo = new THREE.ConeGeometry(0.13, 0.25, 8);
    const earL = new THREE.Mesh(earGeo, bodyMat);
    earL.position.set(-0.28, 1.38, 0.3);
    earL.rotation.z = 0.3;
    earL.rotation.x = 0.15;
    earL.castShadow = true;
    group.add(earL);
    const earR = new THREE.Mesh(earGeo, bodyMat);
    earR.position.set(0.28, 1.38, 0.3);
    earR.rotation.z = -0.3;
    earR.rotation.x = 0.15;
    earR.castShadow = true;
    group.add(earR);

    // Legs (4 stubby cylinders)
    const legGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.35, 8);
    const legPositions = [
      [-0.2, 0.17, -0.25], [0.2, 0.17, -0.25],
      [-0.2, 0.17, 0.25],  [0.2, 0.17, 0.25],
    ];
    legPositions.forEach((pos, i) => {
      const leg = new THREE.Mesh(legGeo, bodyMat);
      leg.position.set(...pos);
      leg.castShadow = true;
      leg.name = 'leg' + i;
      group.add(leg);
      // White paw at bottom
      const paw = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), whiteMat);
      paw.position.set(pos[0], 0.02, pos[2]);
      paw.scale.set(1, 0.5, 1.1);
      group.add(paw);
    });

    // Tail (small curved shape)
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), bodyMat);
    tail.position.set(0, 0.75, -0.55);
    tail.scale.set(0.6, 0.6, 1);
    tail.name = 'tail';
    group.add(tail);
    const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), whiteMat);
    tailTip.position.set(0, 0.85, -0.65);
    tailTip.name = 'tailTip';
    group.add(tailTip);

    group.position.y = 0;
    ui.scene.add(group);
    ui.corgi = group;

    // Store refs for animations
    ui.corgi._parts = {
      body, head, eyeL, eyeR, shineL, shineR, nose, mouth, tongue,
      earL, earR, tail, tailTip, belly, facePatch,
      legs: group.children.filter(c => c.name && c.name.startsWith('leg')),
    };
  }

  /* ── Procedural Animation ── */
  let animTime = 0;
  let currentProceduralAnim = 'idle';
  let animTransition = null; // { from, to, progress, duration }
  let tailWagSpeed = 3;
  let bounceAmount = 0;
  let breatheAmount = 1;

  function animateCorgi(delta) {
    if (!ui.corgi) return;
    // Skip procedural animation for GLB models (AnimationMixer handles it)
    if (ui.corgi._isGLB) return;
    if (!ui.corgi._parts) return;
    const p = ui.corgi._parts;
    animTime += delta;

    // Breathing
    const breathe = Math.sin(animTime * 1.5) * 0.015 * breatheAmount;
    p.body.scale.y = 0.85 + breathe;

    // Tail wag
    const wagAngle = Math.sin(animTime * tailWagSpeed) * 0.4;
    p.tail.position.x = Math.sin(animTime * tailWagSpeed) * 0.08;
    p.tailTip.position.x = Math.sin(animTime * tailWagSpeed) * 0.12;
    p.tail.rotation.y = wagAngle;
    p.tailTip.rotation.y = wagAngle * 1.3;

    // Ear twitch
    const earTwitch = Math.sin(animTime * 0.7) * 0.05;
    p.earL.rotation.z = 0.3 + earTwitch;
    p.earR.rotation.z = -0.3 - earTwitch;

    // Eye blink (every ~4 seconds)
    const blinkCycle = animTime % 4;
    const blinkScale = (blinkCycle > 3.8 && blinkCycle < 3.95) ? 0.1 : 1;
    p.eyeL.scale.y = blinkScale;
    p.eyeR.scale.y = blinkScale;

    // Animation-specific behavior
    if (currentProceduralAnim === 'idle') {
      tailWagSpeed = 3;
      bounceAmount = 0;
      breatheAmount = 1;
      // Subtle look-around
      p.head.rotation.y = Math.sin(animTime * 0.3) * 0.1;
      p.head.rotation.x = Math.sin(animTime * 0.5) * 0.03;
      ui.corgi.position.y = 0;
    } else if (currentProceduralAnim === 'happy') {
      tailWagSpeed = 12;
      breatheAmount = 1.5;
      // Bouncy hop
      ui.corgi.position.y = Math.abs(Math.sin(animTime * 5)) * 0.15;
      p.head.rotation.y = Math.sin(animTime * 2) * 0.15;
      p.tongue.visible = true;
      // Leg bounce
      p.legs.forEach((leg, i) => {
        leg.position.y = 0.17 + Math.abs(Math.sin(animTime * 5 + i * 0.5)) * 0.05;
      });
    } else if (currentProceduralAnim === 'eat') {
      tailWagSpeed = 6;
      // Head bob down (eating motion)
      p.head.position.y = 1.05 + Math.sin(animTime * 8) * 0.08 - 0.15;
      p.head.rotation.x = 0.2 + Math.sin(animTime * 8) * 0.1;
    } else if (currentProceduralAnim === 'play_bounce') {
      tailWagSpeed = 10;
      ui.corgi.position.y = Math.abs(Math.sin(animTime * 6)) * 0.2;
      ui.corgi.rotation.y = Math.sin(animTime * 2) * 0.3;
      p.tongue.visible = true;
    } else if (currentProceduralAnim === 'sleep') {
      tailWagSpeed = 0.5;
      breatheAmount = 2;
      // Corgi lies down
      ui.corgi.rotation.x = 0;
      ui.corgi.position.y = -0.2;
      p.head.position.y = 0.7;
      p.head.position.z = 0.2;
      p.eyeL.scale.y = 0.1;
      p.eyeR.scale.y = 0.1;
      p.tongue.visible = false;
      // Legs tucked
      p.legs.forEach(leg => { leg.scale.y = 0.5; leg.position.y = 0.1; });
    } else if (currentProceduralAnim === 'shake') {
      tailWagSpeed = 15;
      ui.corgi.rotation.y = Math.sin(animTime * 20) * 0.3;
      p.head.rotation.y = Math.sin(animTime * 25) * 0.4;
      // Subtle scale wobble
      ui.corgi.scale.x = 1 + Math.sin(animTime * 20) * 0.05;
    } else if (currentProceduralAnim === 'boop') {
      p.head.position.z = 0.35 + Math.sin(animTime * 6) * 0.15;
      p.head.rotation.x = Math.sin(animTime * 6) * 0.2;
      tailWagSpeed = 8;
    } else if (currentProceduralAnim === 'wave') {
      // Lift front-left leg
      if (p.legs[2]) {
        p.legs[2].rotation.x = Math.sin(animTime * 4) * 0.5 - 0.6;
        p.legs[2].position.y = 0.35;
      }
      tailWagSpeed = 6;
      p.head.rotation.y = -0.2;
    } else if (currentProceduralAnim === 'hungry') {
      tailWagSpeed = 1;
      // Pleading look up
      p.head.rotation.x = -0.2;
      p.head.position.y = 1.05 + Math.sin(animTime * 1.5) * 0.03;
      // Subtle body sway
      ui.corgi.position.x = Math.sin(animTime * 1) * 0.05;
    } else if (currentProceduralAnim === 'dirty') {
      tailWagSpeed = 1;
      p.head.rotation.y = Math.sin(animTime * 0.8) * 0.3 + 0.3;
      ui.corgi.position.x = Math.sin(animTime * 0.5) * 0.1;
    } else if (currentProceduralAnim === 'sleepy') {
      tailWagSpeed = 0.5;
      breatheAmount = 2.5;
      p.eyeL.scale.y = 0.3;
      p.eyeR.scale.y = 0.3;
      p.head.position.y = 1.0 + Math.sin(animTime * 0.8) * 0.02;
      // Yawn cycle
      p.tongue.visible = (Math.sin(animTime * 0.5) > 0.7);
    }
  }

  function resetCorgiPose() {
    if (!ui.corgi || !ui.corgi._parts) return;
    const p = ui.corgi._parts;
    ui.corgi.position.set(0, 0, 0);
    ui.corgi.rotation.set(0, 0, 0);
    ui.corgi.scale.set(1, 1, 1);
    p.head.position.set(0, 1.05, 0.35);
    p.head.rotation.set(0, 0, 0);
    p.tongue.visible = false;
    p.legs.forEach((leg, i) => {
      const positions = [[-0.2, 0.17, -0.25], [0.2, 0.17, -0.25], [-0.2, 0.17, 0.25], [0.2, 0.17, 0.25]];
      leg.position.set(...positions[i]);
      leg.rotation.set(0, 0, 0);
      leg.scale.set(1, 1, 1);
    });
  }

  function playAnim(name) {
    // Try GLB animation first
    if (ui.corgi && ui.corgi._isGLB) {
      playGLBAnimation(name);
      return;
    }
    resetCorgiPose();
    currentProceduralAnim = name;
  }

  function playAnimOnce(name, duration, thenAnim) {
    if (ui.corgi && ui.corgi._isGLB) {
      playGLBAnimation(name);
      setTimeout(() => playGLBAnimation(thenAnim || getIdleAnimForMood()), duration || 1500);
      return;
    }
    resetCorgiPose();
    currentProceduralAnim = name;
    setTimeout(() => {
      resetCorgiPose();
      currentProceduralAnim = thenAnim || getIdleAnimForMood();
    }, (duration || 1500));
  }

  function getIdleAnimForMood() {
    if (state.isSleeping) return 'sleep';
    const mood = getMood();
    if (mood === 'happy') return 'happy';
    const need = getLowestNeed();
    if (state[need] <= 20) {
      if (need === 'hunger') return 'hungry';
      if (need === 'cleanliness') return 'dirty';
      if (need === 'energy') return 'sleepy';
    }
    return 'idle';
  }

  /* ── Render Loop ── */
  function startRenderLoop() {
    if (ui.animFrame) return;
    function loop() {
      ui.animFrame = requestAnimationFrame(loop);
      const delta = ui.clock ? ui.clock.getDelta() : 0.016;
      if (ui.mixer) ui.mixer.update(delta);
      animateCorgi(delta);
      if (ui.controls) ui.controls.update();
      // Animate mini-game objects
      if (ui.miniGame) updateMiniGame(delta);
      if (ui.renderer && ui.scene && ui.camera) {
        ui.renderer.render(ui.scene, ui.camera);
      }
    }
    loop();
  }

  function stopRenderLoop() {
    if (ui.animFrame) {
      cancelAnimationFrame(ui.animFrame);
      ui.animFrame = null;
    }
  }

  function resizeRenderer(container) {
    if (!ui.renderer || !ui.camera || !container) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    ui.renderer.setSize(w, h);
    ui.camera.aspect = w / h;
    ui.camera.updateProjectionMatrix();
  }

  /* ── Thought Bubbles ── */
  function showThought(text) {
    const bubble = document.getElementById('pp-thought');
    if (!bubble) return;
    bubble.textContent = text;
    bubble.classList.add('pp-thought-show');
    clearTimeout(ui.thoughtTimeout);
    ui.thoughtTimeout = setTimeout(() => {
      bubble.classList.remove('pp-thought-show');
    }, 2500);
  }

  function randomThought() {
    const mood = getMood();
    const pool = THOUGHTS[mood] || THOUGHTS.content;
    showThought(pool[Math.floor(Math.random() * pool.length)]);
  }

  /* ── Action Handlers ── */
  function doFeed(foodId) {
    const food = FOODS.find(f => f.id === foodId);
    if (!food) return;
    // Too full?
    if (state.hunger >= 95) {
      playAnimOnce('boop', 1200);
      showThought("I'm so full! 🤭");
      return;
    }
    state.hunger = clamp(state.hunger + food.hunger);
    state.happiness = clamp(state.happiness + food.happy);
    state.totalFeeds++;
    save();
    playAnimOnce('eat', 2000, 'happy');
    showThought(food.desc);
    updateHUD();
    // Award coins occasionally
    if (state.totalFeeds % 5 === 0) {
      OS.awardCoins(2, 'Pocket Pal', '🐶', 'Fed your pet ' + state.totalFeeds + ' times!');
    }
  }

  function doClean(toolId) {
    const tool = CLEAN_TOOLS.find(t => t.id === toolId);
    if (!tool) return;
    state.cleanliness = clamp(state.cleanliness + tool.clean);
    state.totalCleans++;
    save();
    playAnimOnce('shake', 2000, getIdleAnimForMood());
    showThought(tool.desc);
    // Add soap bubbles to scene
    addBubbleBurst();
    updateHUD();
    if (state.totalCleans % 5 === 0) {
      OS.awardCoins(2, 'Pocket Pal', '🧼', 'Kept your pet squeaky clean!');
    }
  }

  function doSleep() {
    if (state.isSleeping) {
      // Wake up
      state.isSleeping = false;
      state.sleepStart = null;
      save();
      playAnimOnce('shake', 1000, getIdleAnimForMood());
      showThought('Good morning! ☀️');
      clearInterval(ui.sleepInterval);
      ui.sleepInterval = null;
    } else {
      state.isSleeping = true;
      state.sleepStart = Date.now();
      state.totalSleeps++;
      save();
      playAnim('sleep');
      showThought('Zzz... 💤');
      // Recover energy over time while window is open
      ui.sleepInterval = setInterval(() => {
        if (state.isSleeping) {
          state.energy = clamp(state.energy + 1);
          save();
          updateHUD();
        }
      }, 3000); // +1 energy every 3 seconds while sleeping
    }
    updateHUD();
    renderScreen();
  }

  function doPetTap() {
    if (state.isSleeping) {
      // Wake up on tap
      doSleep();
      return;
    }
    const rand = Math.random();
    if (rand < 0.3) {
      playAnimOnce('boop', 1200);
      showThought('Boop! 👃');
    } else if (rand < 0.6) {
      playAnimOnce('wave', 1500);
      showThought('Hi there! 🐾');
    } else {
      playAnimOnce('happy', 1500);
      showThought('Yay! 💕');
    }
    state.happiness = clamp(state.happiness + 2);
    save();
    updateHUD();
  }

  /* ── Soap Bubbles Burst Effect ── */
  function addBubbleBurst() {
    if (!ui.scene) return;
    const bubbles = [];
    for (let i = 0; i < 15; i++) {
      const geo = new THREE.SphereGeometry(0.05 + Math.random() * 0.06, 8, 8);
      const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(0.5 + Math.random() * 0.2, 0.6, 0.7),
        transparent: true, opacity: 0.6, roughness: 0.1, metalness: 0.3,
      });
      const bubble = new THREE.Mesh(geo, mat);
      bubble.position.set(
        (Math.random() - 0.5) * 1.5,
        0.5 + Math.random() * 1,
        (Math.random() - 0.5) * 1.5
      );
      bubble._vel = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        1 + Math.random() * 2,
        (Math.random() - 0.5) * 0.5
      );
      bubble._life = 1.5 + Math.random();
      ui.scene.add(bubble);
      bubbles.push(bubble);
    }
    // Animate bubbles
    const startTime = Date.now();
    function animBubbles() {
      const elapsed = (Date.now() - startTime) / 1000;
      let alive = false;
      bubbles.forEach(b => {
        if (elapsed < b._life) {
          alive = true;
          b.position.x += b._vel.x * 0.01;
          b.position.y += b._vel.y * 0.01;
          b.position.z += b._vel.z * 0.01;
          b.material.opacity = Math.max(0, 0.6 * (1 - elapsed / b._life));
        } else {
          b.visible = false;
        }
      });
      if (alive) requestAnimationFrame(animBubbles);
      else bubbles.forEach(b => { ui.scene.remove(b); b.geometry.dispose(); b.material.dispose(); });
    }
    requestAnimationFrame(animBubbles);
  }

  /* ── Mini-Games ── */
  let mgState = null;

  function startMiniGame(gameId) {
    const game = GAMES.find(g => g.id === gameId);
    if (!game) return;
    ui.miniGame = gameId;
    mgState = { score: 0, timeLeft: 15, active: true, objects: [], game };
    playAnim('play_bounce');

    if (gameId === 'bubble') startBubblePop();
    else if (gameId === 'ball') startBallRoll();
    else if (gameId === 'copyme') startCopyMe();

    renderScreen();
  }

  function startBubblePop() {
    mgState.timeLeft = 15;
    mgState.score = 0;
    // Spawn bubbles in 3D
    spawnGameBubble();
    mgState._spawnInterval = setInterval(() => {
      if (mgState && mgState.active) spawnGameBubble();
    }, 800);
    mgState._timer = setInterval(() => {
      if (!mgState) return;
      mgState.timeLeft--;
      updateGameHUD();
      if (mgState.timeLeft <= 0) endMiniGame();
    }, 1000);
  }

  function spawnGameBubble() {
    if (!ui.scene || !mgState) return;
    const geo = new THREE.SphereGeometry(0.15 + Math.random() * 0.1, 12, 12);
    const hue = Math.random();
    const mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 0.8, 0.6),
      transparent: true, opacity: 0.7, roughness: 0.1, metalness: 0.2,
    });
    const bubble = new THREE.Mesh(geo, mat);
    bubble.position.set(
      (Math.random() - 0.5) * 2,
      0.3,
      (Math.random() - 0.5) * 2
    );
    bubble._vel = 0.5 + Math.random() * 0.8;
    bubble._isGameBubble = true;
    bubble.name = 'gameBubble';
    ui.scene.add(bubble);
    if (mgState) mgState.objects.push(bubble);
  }

  function startBallRoll() {
    mgState.timeLeft = 20;
    mgState.score = 0;
    mgState._catches = 0;
    // Create a ball
    const geo = new THREE.SphereGeometry(0.12, 12, 12);
    const mat = new THREE.MeshStandardMaterial({ color: 0xff4444, roughness: 0.4 });
    const ball = new THREE.Mesh(geo, mat);
    ball.position.set(1.5, 0.12, 0);
    ball.name = 'gameBall';
    ball._isGameBall = true;
    ball._velX = -0.03;
    ball._velZ = (Math.random() - 0.5) * 0.02;
    ui.scene.add(ball);
    if (mgState) mgState.objects.push(ball);
    mgState._timer = setInterval(() => {
      if (!mgState) return;
      mgState.timeLeft--;
      updateGameHUD();
      if (mgState.timeLeft <= 0) endMiniGame();
    }, 1000);
  }

  function startCopyMe() {
    const poses = ['happy', 'wave', 'boop', 'shake'];
    mgState.timeLeft = 20;
    mgState.score = 0;
    mgState._poses = poses;
    mgState._currentPose = null;
    mgState._waitingForInput = false;
    mgState._poseIndex = 0;
    showNextPose();
    mgState._timer = setInterval(() => {
      if (!mgState) return;
      mgState.timeLeft--;
      updateGameHUD();
      if (mgState.timeLeft <= 0) endMiniGame();
    }, 1000);
  }

  function showNextPose() {
    if (!mgState || !mgState._poses) return;
    const poses = mgState._poses;
    mgState._currentPose = poses[Math.floor(Math.random() * poses.length)];
    mgState._waitingForInput = true;
    playAnim(mgState._currentPose);
    showThought('Copy this pose!');
    updateGameHUD();
  }

  function handleCopyMeGuess(pose) {
    if (!mgState || !mgState._waitingForInput) return;
    if (pose === mgState._currentPose) {
      mgState.score += 10;
      showThought('Correct! 🎉');
      playAnimOnce('happy', 800);
    } else {
      showThought('Not quite! 😅');
      playAnimOnce('boop', 800);
    }
    mgState._waitingForInput = false;
    updateGameHUD();
    setTimeout(() => { if (mgState && mgState.active) showNextPose(); }, 1200);
  }

  function updateMiniGame(delta) {
    if (!mgState || !mgState.active) return;
    // Move bubbles upward
    if (ui.miniGame === 'bubble') {
      mgState.objects.forEach(obj => {
        if (obj.visible) {
          obj.position.y += obj._vel * delta;
          if (obj.position.y > 3) {
            obj.visible = false;
          }
        }
      });
    }
    // Move ball
    if (ui.miniGame === 'ball') {
      mgState.objects.forEach(obj => {
        if (obj._isGameBall && obj.visible) {
          obj.position.x += obj._velX;
          obj.position.z += obj._velZ;
          // Bounce off walls
          if (Math.abs(obj.position.x) > 2) { obj._velX *= -1; mgState.score += 5; updateGameHUD(); }
          if (Math.abs(obj.position.z) > 2) { obj._velZ *= -1; mgState.score += 5; updateGameHUD(); }
        }
      });
    }
  }

  function updateGameHUD() {
    const hud = document.getElementById('pp-game-hud');
    if (!hud || !mgState) return;
    let extra = '';
    if (ui.miniGame === 'copyme' && mgState._waitingForInput) {
      const poseEmojis = { happy: '😃', wave: '👋', boop: '👃', shake: '🐕' };
      extra = `<div class="pp-copyme-btns">
        ${mgState._poses.map(p => `<button class="pp-copyme-btn" onclick="window._ppCopyGuess('${p}')">${poseEmojis[p] || '❓'} ${p}</button>`).join('')}
      </div>`;
    }
    hud.innerHTML = `<span>⭐ ${mgState.score}</span><span>⏱️ ${mgState.timeLeft}s</span>${extra}`;
  }

  function endMiniGame() {
    if (!mgState) return;
    mgState.active = false;
    clearInterval(mgState._timer);
    clearInterval(mgState._spawnInterval);
    // Clean up 3D objects
    mgState.objects.forEach(obj => {
      ui.scene.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) obj.material.dispose();
    });
    const game = mgState.game;
    const score = mgState.score;
    // Apply stat changes
    state.happiness = clamp(state.happiness + game.happy);
    state.energy = clamp(state.energy + game.energy);
    state.totalPlays++;
    save();

    // Award coins based on score
    if (score >= 30) {
      OS.awardCoins(3, 'Pocket Pal', '🫧', 'Great game with ' + (state.name || 'your pet') + '!');
    } else if (score >= 10) {
      OS.awardCoins(1, 'Pocket Pal', '⚽', 'Played with ' + (state.name || 'your pet') + '!');
    }

    showThought('That was fun! Score: ' + score + ' ⭐');
    playAnimOnce('happy', 2000, getIdleAnimForMood());
    ui.miniGame = null;
    mgState = null;
    setTimeout(() => {
      ui.screen = 'home';
      renderScreen();
      updateHUD();
    }, 2500);
  }

  /* ── Canvas Click/Tap Handler (with drag detection) ── */
  let _pointerStart = null;

  function onPointerDown(e) {
    const t = e.touches ? e.touches[0] : e;
    _pointerStart = { x: t.clientX, y: t.clientY, time: Date.now() };
  }

  function onPointerUp(e) {
    if (!_pointerStart) return;
    const t = e.changedTouches ? e.changedTouches[0] : e;
    const dx = t.clientX - _pointerStart.x;
    const dy = t.clientY - _pointerStart.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const elapsed = Date.now() - _pointerStart.time;
    _pointerStart = null;
    // Only treat as tap if short duration and small distance (not a drag/orbit)
    if (dist > 10 || elapsed > 300) return;
    handleTap(t.clientX, t.clientY);
  }

  function handleTap(cx, cy) {
    if (!ui.renderer || !ui.camera || !ui.corgi) return;
    const rect = ui.renderer.domElement.getBoundingClientRect();
    ui.mouse.x = ((cx - rect.left) / rect.width) * 2 - 1;
    ui.mouse.y = -((cy - rect.top) / rect.height) * 2 + 1;
    ui.raycaster.setFromCamera(ui.mouse, ui.camera);

    // Check mini-game bubble clicks
    if (ui.miniGame === 'bubble' && mgState) {
      const hits = ui.raycaster.intersectObjects(mgState.objects.filter(o => o.visible));
      if (hits.length > 0) {
        const hit = hits[0].object;
        hit.visible = false;
        mgState.score += 10;
        updateGameHUD();
        showThought('Pop! 🫧');
        return;
      }
    }

    // Check mini-game ball clicks
    if (ui.miniGame === 'ball' && mgState) {
      const hits = ui.raycaster.intersectObjects(mgState.objects.filter(o => o.visible && o._isGameBall));
      if (hits.length > 0) {
        const ball = hits[0].object;
        ball._velX = (Math.random() - 0.5) * 0.06;
        ball._velZ = (Math.random() - 0.5) * 0.06;
        mgState.score += 10;
        updateGameHUD();
        showThought('Nice throw! ⚽');
        return;
      }
    }

    // Pet tap
    if (!ui.miniGame) {
      const corgiChildren = [];
      ui.corgi.traverse(c => { if (c.isMesh) corgiChildren.push(c); });
      const hits = ui.raycaster.intersectObjects(corgiChildren);
      if (hits.length > 0) {
        doPetTap();
      }
    }
  }

  /* ── Screen Rendering ── */
  function renderScreen() {
    const body = document.getElementById('win-body-' + ui.winId);
    if (!body) return;

    if (!state.name) {
      renderNamePicker(body);
      return;
    }

    const canvas = body.querySelector('.pp-canvas-wrap');
    const overlay = body.querySelector('.pp-overlay');
    if (!overlay) return;

    if (state.isSleeping && ui.screen === 'home') {
      overlay.innerHTML = renderSleepOverlay();
    } else if (ui.screen === 'feed') {
      overlay.innerHTML = renderFeedTray();
    } else if (ui.screen === 'play') {
      if (ui.miniGame) {
        overlay.innerHTML = renderMiniGameOverlay();
      } else {
        overlay.innerHTML = renderPlayMenu();
      }
    } else if (ui.screen === 'clean') {
      overlay.innerHTML = renderCleanTray();
    } else {
      overlay.innerHTML = '';
    }
  }

  function renderNamePicker(body) {
    body.innerHTML = `
      <div class="pp-name-picker">
        <div class="pp-name-title">🐶 Name Your Corgi!</div>
        <div class="pp-name-subtitle">Pick a name for your new best friend</div>
        <div class="pp-name-grid">
          ${PET_NAMES.map(n => `<button class="pp-name-btn" onclick="window._ppName('${n}')">${n}</button>`).join('')}
        </div>
        <div class="pp-name-custom">
          <input type="text" id="pp-custom-name" class="pp-name-input" placeholder="Or type a custom name..." maxlength="14">
          <button class="pp-name-go" onclick="window._ppCustomName()">Go!</button>
        </div>
      </div>
    `;
  }

  function getMainHTML() {
    return `
      <div class="pp-wrap">
        <div class="pp-hud" id="pp-hud">
          <div class="pp-pet-name">${state.name || 'Corgi'} ${getMoodEmoji()}</div>
          <div class="pp-stats">
            <div class="pp-stat">
              <span class="pp-stat-icon">🍖</span>
              <div class="pp-stat-bar"><div class="pp-stat-fill pp-fill-hunger" style="width:${state.hunger}%"></div></div>
            </div>
            <div class="pp-stat">
              <span class="pp-stat-icon">😊</span>
              <div class="pp-stat-bar"><div class="pp-stat-fill pp-fill-happy" style="width:${state.happiness}%"></div></div>
            </div>
            <div class="pp-stat">
              <span class="pp-stat-icon">✨</span>
              <div class="pp-stat-bar"><div class="pp-stat-fill pp-fill-clean" style="width:${state.cleanliness}%"></div></div>
            </div>
            <div class="pp-stat">
              <span class="pp-stat-icon">💤</span>
              <div class="pp-stat-bar"><div class="pp-stat-fill pp-fill-energy" style="width:${state.energy}%"></div></div>
            </div>
          </div>
        </div>
        <div class="pp-canvas-wrap" id="pp-canvas"></div>
        <div class="pp-thought" id="pp-thought"></div>
        <div class="pp-overlay" id="pp-overlay"></div>
        <div class="pp-game-hud pp-hidden" id="pp-game-hud"></div>
        <div class="pp-controls" id="pp-controls">
          <button class="pp-btn pp-btn-feed" onclick="window._ppGo('feed')">🍖<span>Feed</span></button>
          <button class="pp-btn pp-btn-play" onclick="window._ppGo('play')">⚽<span>Play</span></button>
          <button class="pp-btn pp-btn-clean" onclick="window._ppGo('clean')">🧼<span>Clean</span></button>
          <button class="pp-btn pp-btn-sleep" onclick="window._ppGo('sleep')">💤<span>${state.isSleeping ? 'Wake' : 'Sleep'}</span></button>
        </div>
      </div>
    `;
  }

  function renderFeedTray() {
    return `
      <div class="pp-tray">
        <div class="pp-tray-title">🍖 Feed ${state.name}</div>
        <div class="pp-tray-grid">
          ${FOODS.map(f => `
            <button class="pp-tray-item" onclick="window._ppFeed('${f.id}')">
              <span class="pp-tray-emoji">${f.emoji}</span>
              <span class="pp-tray-name">${f.name}</span>
              <span class="pp-tray-desc">+${f.hunger} hunger</span>
            </button>
          `).join('')}
        </div>
        <button class="pp-tray-back" onclick="window._ppGo('home')">← Back</button>
      </div>
    `;
  }

  function renderPlayMenu() {
    return `
      <div class="pp-tray">
        <div class="pp-tray-title">⚽ Play with ${state.name}</div>
        <div class="pp-tray-grid">
          ${GAMES.map(g => `
            <button class="pp-tray-item" onclick="window._ppPlay('${g.id}')">
              <span class="pp-tray-emoji">${g.emoji}</span>
              <span class="pp-tray-name">${g.name}</span>
              <span class="pp-tray-desc">${g.desc}</span>
            </button>
          `).join('')}
        </div>
        <button class="pp-tray-back" onclick="window._ppGo('home')">← Back</button>
      </div>
    `;
  }

  function renderCleanTray() {
    return `
      <div class="pp-tray">
        <div class="pp-tray-title">🧼 Clean ${state.name}</div>
        <div class="pp-tray-grid">
          ${CLEAN_TOOLS.map(t => `
            <button class="pp-tray-item" onclick="window._ppClean('${t.id}')">
              <span class="pp-tray-emoji">${t.emoji}</span>
              <span class="pp-tray-name">${t.name}</span>
              <span class="pp-tray-desc">+${t.clean} clean</span>
            </button>
          `).join('')}
        </div>
        <button class="pp-tray-back" onclick="window._ppGo('home')">← Back</button>
      </div>
    `;
  }

  function renderSleepOverlay() {
    return `
      <div class="pp-sleep-overlay">
        <div class="pp-sleep-stars">
          ${'⭐'.repeat(5)} 🌙 ${'⭐'.repeat(5)}
        </div>
        <div class="pp-sleep-text">💤 ${state.name} is sleeping... 💤</div>
        <div class="pp-sleep-hint">Tap to wake up</div>
      </div>
    `;
  }

  function renderMiniGameOverlay() {
    return `<div class="pp-game-overlay">
      <div class="pp-game-info">Tap the 3D objects!</div>
    </div>`;
  }

  /* ── HUD Update ── */
  function updateHUD() {
    const hud = document.getElementById('pp-hud');
    if (!hud) return;
    const nameEl = hud.querySelector('.pp-pet-name');
    if (nameEl) nameEl.textContent = (state.name || 'Corgi') + ' ' + getMoodEmoji();
    // Update stat bars
    const fills = hud.querySelectorAll('.pp-stat-fill');
    if (fills.length >= 4) {
      fills[0].style.width = state.hunger + '%';
      fills[1].style.width = state.happiness + '%';
      fills[2].style.width = state.cleanliness + '%';
      fills[3].style.width = state.energy + '%';
    }
    // Update sleep button text
    const sleepBtn = document.querySelector('.pp-btn-sleep span');
    if (sleepBtn) sleepBtn.textContent = state.isSleeping ? 'Wake' : 'Sleep';
  }

  /* ── Window Handlers (global) ── */
  window._ppGo = function(screen) {
    if (screen === 'sleep') {
      doSleep();
      return;
    }
    if (screen === 'home') {
      ui.screen = 'home';
      playAnim(getIdleAnimForMood());
    } else {
      ui.screen = screen;
    }
    renderScreen();
  };

  window._ppFeed = function(id) { doFeed(id); };
  window._ppPlay = function(id) { startMiniGame(id); };
  window._ppClean = function(id) { doClean(id); };
  window._ppTap = function() { doPetTap(); };
  window._ppCopyGuess = function(pose) { handleCopyMeGuess(pose); };

  window._ppName = function(name) {
    state.name = name;
    save();
    initMainView();
  };

  window._ppCustomName = function() {
    const input = document.getElementById('pp-custom-name');
    const name = (input ? input.value.trim() : '') || 'Buddy';
    state.name = name.slice(0, 14);
    save();
    initMainView();
  };

  /* ── Init Main View (after naming) ── */
  async function initMainView() {
    const body = document.getElementById('win-body-' + ui.winId);
    if (!body) return;
    body.innerHTML = getMainHTML();
    const canvasWrap = document.getElementById('pp-canvas');
    if (canvasWrap) {
      // Load Three.js dynamically
      const loaded = await loadThreeJS();
      if (!loaded) {
        canvasWrap.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#999;text-align:center;padding:20px;">Could not load 3D engine.<br>Check your internet connection and try again.</div>';
        return;
      }
      const ok = initScene(canvasWrap);
      if (ok) {
        startRenderLoop();
        // Attach tap listeners (pointer down/up to distinguish taps from drags)
        ui.renderer.domElement.addEventListener('mousedown', onPointerDown);
        ui.renderer.domElement.addEventListener('mouseup', onPointerUp);
        ui.renderer.domElement.addEventListener('touchstart', onPointerDown, { passive: true });
        ui.renderer.domElement.addEventListener('touchend', onPointerUp, { passive: true });
        playAnim(getIdleAnimForMood());
      }
    }
    // Start periodic stat decay
    ui.decayInterval = setInterval(() => {
      applyDecay();
      save();
      updateHUD();
      playAnim(getIdleAnimForMood());
    }, 60000); // every minute
    // Random thoughts
    ui.thoughtTimeout = setTimeout(function think() {
      if (!state.isSleeping) randomThought();
      ui.thoughtTimeout = setTimeout(think, 10000 + Math.random() * 15000);
    }, 5000);
  }

  /* ── Cleanup ── */
  function cleanup() {
    stopRenderLoop();
    clearInterval(ui.decayInterval);
    clearInterval(ui.sleepInterval);
    clearTimeout(ui.thoughtTimeout);
    if (ui.resizeObs) ui.resizeObs.disconnect();
    if (mgState) {
      clearInterval(mgState._timer);
      clearInterval(mgState._spawnInterval);
    }
    // Dispose Three.js
    if (ui.renderer) {
      ui.renderer.dispose();
      ui.renderer.forceContextLoss();
    }
    if (ui.scene) {
      ui.scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
    }
    ui = {
      screen: 'home', winId: null, renderer: null, scene: null, camera: null,
      controls: null, mixer: null, clock: null, animFrame: null, corgi: null,
      animations: {}, currentAnim: null, morphs: {}, bubbleTimeout: null,
      miniGame: null, gameObjects: [], raycaster: null, mouse: null,
      resizeObs: null, decayInterval: null, thoughtTimeout: null, sleepInterval: null,
    };
    mgState = null;
    currentProceduralAnim = 'idle';
    animTime = 0;
  }

  /* ── App Registration ── */
  OS.registerApp('pocketpal', {
    singleInstance: true,
    getWindowOpts() {
      return {
        id: 'pocketpal',
        title: 'Pocket Pal',
        icon: '🐶',
        width: 420,
        height: 560,
        content: '<div class="pp-loading">Loading Pocket Pal...</div>',
      };
    },
    onOpen(id) {
      ui.winId = id;
      load();
      if (!state.name) {
        const body = document.getElementById('win-body-' + id);
        if (body) renderNamePicker(body);
      } else {
        initMainView();
      }
    },
    onClose() {
      if (state) save();
      cleanup();
    },
  });
})();
