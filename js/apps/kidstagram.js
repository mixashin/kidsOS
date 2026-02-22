/* ===== Kidstagram ===== */

/* ---- User profiles ---- */
const KG_USERS = {
  'Emma_Stars':  { av:'👧', color:'#e91e8c', bio:'I love art & rainbows 🌈' },
  'MaxCool':     { av:'👦', color:'#1976d2', bio:'Gamer for life 🎮' },
  'Luna_Paws':   { av:'👧', color:'#7b1fa2', bio:'All animals are my friends 🐱' },
  'DinoBoy':     { av:'👦', color:'#388e3c', bio:'Dinos are the coolest 🦕' },
  'SunnyArt':    { av:'👧', color:'#f57c00', bio:'Drawing is my superpower ✏️' },
  'PixelKid':    { av:'👦', color:'#00838f', bio:'Pixels & games 🕹️' },
  'FluffyPets':  { av:'👧', color:'#ad1457', bio:'Pet lover forever 🐰' },
  'NatureKid':   { av:'👦', color:'#00695c', bio:'Outside every day 🌳' },
  'RainbowGirl': { av:'👧', color:'#c62828', bio:'Colors make me happy 🌈' },
  'GameMaster':  { av:'👦', color:'#1a237e', bio:'I will beat every game 🏆' },
};

/* ---- 30 posts ---- */
const KG_POSTS = [
  /* ---- DRAWING posts ---- */
  { id:1,  user:'Emma_Stars',  type:'drawing', seed:1,
    caption:'My rainbow drawing, I worked SO hard on it! 🌈✨',
    tags:'#kidsart #drawing #rainbow',  time:'2h ago', likes:47,
    comments:[{u:'Luna_Paws',t:'So beautiful!! 😍'},{u:'MaxCool',t:'That rainbow looks real 🌈'}] },

  { id:2,  user:'SunnyArt',    type:'drawing', seed:2,
    caption:'Drew a magical castle today! Can you spot the dragon? 🏰🐉',
    tags:'#castle #fantasy #drawing',   time:'3h ago', likes:62,
    comments:[{u:'RainbowGirl',t:'The dragon is my fav part 🔥'},{u:'DinoBoy',t:'EPIC!! 👏'}] },

  { id:3,  user:'RainbowGirl', type:'drawing', seed:3,
    caption:'My butterfly took me all afternoon 🦋💜 Worth it!',
    tags:'#butterfly #art #purple',     time:'5h ago', likes:38,
    comments:[{u:'Emma_Stars',t:'Purple is perfect! 💜'},{u:'FluffyPets',t:'Adorable 🦋'}] },

  { id:4,  user:'Emma_Stars',  type:'drawing', seed:4,
    caption:"Family portrait for Mom's birthday! 👨‍👩‍👧‍👦❤️",
    tags:'#family #love #portrait',     time:'1d ago', likes:91,
    comments:[{u:'SunnyArt',t:'Your mom will love it! 🥰'},{u:'NatureKid',t:'So sweet! ❤️'},{u:'Luna_Paws',t:'Best gift ever!'}] },

  { id:5,  user:'SunnyArt',    type:'drawing', seed:5,
    caption:'My first ever dragon drawing! RAWR 🐉🔥',
    tags:'#dragon #fire #drawing',      time:'1d ago', likes:54,
    comments:[{u:'GameMaster',t:'That dragon is fierce! 🔥'},{u:'DinoBoy',t:'Dino cousin! 🦕'}] },

  { id:6,  user:'RainbowGirl', type:'drawing', seed:6,
    caption:'Flower garden in springtime! 🌸🌷🌼',
    tags:'#flowers #spring #garden',    time:'2d ago', likes:73,
    comments:[{u:'NatureKid',t:'I want to walk in that garden! 🌸'},{u:'Emma_Stars',t:'So colorful! 🌈'}] },

  { id:7,  user:'Luna_Paws',   type:'drawing', seed:7,
    caption:'Drew my cat Whiskers from memory! Did I get it right? 🐱🎨',
    tags:'#cat #drawing #pets',         time:'2d ago', likes:85,
    comments:[{u:'FluffyPets',t:'Perfect! 😻'},{u:'MaxCool',t:'Whiskers would be proud 😂'}] },

  { id:8,  user:'DinoBoy',     type:'drawing', seed:8,
    caption:'T-REX ATTACK!! My best drawing ever 🦖💥',
    tags:'#dinosaur #trex #roar',       time:'3d ago', likes:66,
    comments:[{u:'GameMaster',t:'ROAAAR 🦖'},{u:'PixelKid',t:'So intense!! 💥'},{u:'SunnyArt',t:'The teeth! wow!'}] },

  { id:9,  user:'Emma_Stars',  type:'drawing', seed:9,
    caption:'Blasting off to outer space! 🚀🌟🪐',
    tags:'#space #rocket #stars',       time:'3d ago', likes:49,
    comments:[{u:'PixelKid',t:'To infinity!! 🚀'},{u:'RainbowGirl',t:'Love the planets! 🪐'}] },

  /* ---- PET posts ---- */
  { id:10, user:'Luna_Paws',   type:'pet', seed:10,
    caption:'Whiskers found my homework again 📚🐱😅 Cat: 1, Homework: 0',
    tags:'#cats #whiskers #homework',   time:'1h ago', likes:134,
    comments:[{u:'FluffyPets',t:'HAHAHA 😂😂'},{u:'MaxCool',t:'Classic cat move 😹'},{u:'NatureKid',t:'Best excuse ever! 📚'}] },

  { id:11, user:'FluffyPets',  type:'pet', seed:11,
    caption:'Bunnies are SO fluffy I cannot handle it 🐰💕',
    tags:'#bunny #fluffy #cute',        time:'4h ago', likes:88,
    comments:[{u:'Luna_Paws',t:'I need one!! 🐰'},{u:'Emma_Stars',t:'SO CUTE 😍'}] },

  { id:12, user:'Luna_Paws',   type:'pet', seed:12,
    caption:'Feeding time! Goldie loves her new food 🐟🌊',
    tags:'#fish #goldfish #pet',        time:'6h ago', likes:55,
    comments:[{u:'NatureKid',t:'Happy fishy! 🐟'},{u:'DinoBoy',t:'She looks tasty... I mean cute! 😅'}] },

  { id:13, user:'FluffyPets',  type:'pet', seed:13,
    caption:'Max learned a new trick today — SIT! 🐶🏅',
    tags:'#dog #training #goodboy',     time:'8h ago', likes:112,
    comments:[{u:'Luna_Paws',t:'Good boy Max!! 🐶'},{u:'GameMaster',t:'Unlocked: Sit achievement 🏅'},{u:'RainbowGirl',t:'So clever! 🥰'}] },

  { id:14, user:'NatureKid',   type:'pet', seed:14,
    caption:'A butterfly LANDED ON MY HAND!! I stayed so still 🦋😱',
    tags:'#butterfly #nature #wow',     time:'10h ago', likes:203,
    comments:[{u:'Emma_Stars',t:'YOU ARE SO LUCKY!! 🦋'},{u:'RainbowGirl',t:'Nature chose you! 🌿'},{u:'SunnyArt',t:'Amazing!! 😱'}] },

  { id:15, user:'Luna_Paws',   type:'pet', seed:15,
    caption:'Hammy running so fast on his wheel 🐹💨 Little champion!',
    tags:'#hamster #pets #speed',       time:'1d ago', likes:77,
    comments:[{u:'FluffyPets',t:'Go Hammy go!! 🐹'},{u:'PixelKid',t:'Needs a speed upgrade 💨'}] },

  { id:16, user:'FluffyPets',  type:'pet', seed:16,
    caption:'Baby chicks hatched this morning!! 🐣🥚✨ Welcome to the world!',
    tags:'#chicks #baby #hatching',     time:'1d ago', likes:167,
    comments:[{u:'Luna_Paws',t:'BABIES!! 🐣🐣🐣'},{u:'Emma_Stars',t:'I am crying happy tears 😭💛'},{u:'NatureKid',t:'So magical! 🥚'}] },

  { id:17, user:'MaxCool',     type:'pet', seed:17,
    caption:'My turtle is faster than my little brother 🐢😂 (not really)',
    tags:'#turtle #pets #funny',        time:'2d ago', likes:93,
    comments:[{u:'GameMaster',t:'HAHA poor brother 😂'},{u:'PixelKid',t:'Slow and steady wins! 🐢'},{u:'DinoBoy',t:'Brother has been defeated 😄'}] },

  /* ---- GAME posts ---- */
  { id:18, user:'MaxCool',     type:'game', seed:18,
    caption:'NEW HIGH SCORE!! 999,999 points!!! 🎮🏆🔥 IMPOSSIBLE!!',
    tags:'#gaming #highscore #epic',    time:'30m ago', likes:158,
    comments:[{u:'GameMaster',t:'NO WAY!! How?? 😱'},{u:'PixelKid',t:'I bow to you 🙏'},{u:'DinoBoy',t:'LEGENDARY 🔥🔥🔥'}] },

  { id:19, user:'PixelKid',    type:'game', seed:19,
    caption:'Finally reached Level 50! Only took 3 weeks 😤⭐',
    tags:'#level50 #gaming #achievement', time:'2h ago', likes:89,
    comments:[{u:'MaxCool',t:'LETS GOOO!! ⭐'},{u:'GameMaster',t:'Welcome to the club 🏆'},{u:'Luna_Paws',t:'So dedicated! 😮'}] },

  { id:20, user:'MaxCool',     type:'game', seed:20,
    caption:'Final boss battle was INSANE!! Nearly died 5 times 😅⚔️👾',
    tags:'#boss #battle #games',        time:'5h ago', likes:74,
    comments:[{u:'PixelKid',t:'That boss is the worst! 😤'},{u:'GameMaster',t:'Did you win tho?? 👀'}] },

  { id:21, user:'GameMaster',  type:'game', seed:21,
    caption:'FIRST PLACE on the global leaderboard!! 🥇👑🎉',
    tags:'#firstplace #winner #gaming', time:'7h ago', likes:201,
    comments:[{u:'MaxCool',t:'KING!! 👑'},{u:'PixelKid',t:'I challenge you!! 🎮'},{u:'Emma_Stars',t:'So proud of you! 🎉'},{u:'DinoBoy',t:'Unstoppable!! 🏆'}] },

  { id:22, user:'PixelKid',    type:'game', seed:22,
    caption:'Unlocked the SECRET character!! I found the hidden code 🎮✨',
    tags:'#secret #unlock #gaming',     time:'12h ago', likes:66,
    comments:[{u:'MaxCool',t:'WHATS THE CODE TELL ME 😤'},{u:'GameMaster',t:'I already knew it 😎'}] },

  { id:23, user:'GameMaster',  type:'game', seed:23,
    caption:'Found the hidden treasure room!! 💎🗝️ Nobody knew this existed!',
    tags:'#secret #treasure #gaming',   time:'1d ago', likes:143,
    comments:[{u:'PixelKid',t:'How did you even find that?!'},{u:'MaxCool',t:'Secret hunter! 🗝️'},{u:'SunnyArt',t:'This is amazing! 💎'}] },

  { id:24, user:'MaxCool',     type:'game', seed:24,
    caption:'ALL 100 STARS COLLECTED!! Nothing can stop me now ⭐⭐⭐',
    tags:'#100stars #complete #gaming', time:'2d ago', likes:117,
    comments:[{u:'GameMaster',t:'The grind pays off! ⭐'},{u:'PixelKid',t:'Same bro! Did it last month 💪'}] },

  /* ---- OUTDOOR posts ---- */
  { id:25, user:'NatureKid',   type:'outdoor', seed:25,
    caption:'Best day at the park with my friends! Nothing beats sunshine 🌳⛅',
    tags:'#park #friends #fun',         time:'3h ago', likes:96,
    comments:[{u:'DinoBoy',t:'Park gang!! 🌳'},{u:'Emma_Stars',t:'Should have come! 😭'},{u:'RainbowGirl',t:'So much fun! ⛅'}] },

  { id:26, user:'DinoBoy',     type:'outdoor', seed:26,
    caption:'Found the coolest rock EVER at the creek 🪨💎 It sparkles!',
    tags:'#rocks #nature #exploring',   time:'6h ago', likes:44,
    comments:[{u:'NatureKid',t:'Rock collector!! 🪨'},{u:'GameMaster',t:'Side quest: Rock Finding completed ✅'}] },

  { id:27, user:'NatureKid',   type:'outdoor', seed:27,
    caption:'DOUBLE RAINBOW after the storm!! 🌈🌈✨ I screamed so loud!',
    tags:'#rainbow #nature #wow',       time:'8h ago', likes:289,
    comments:[{u:'RainbowGirl',t:'DOUBLE!! My dream!! 🌈🌈'},{u:'Emma_Stars',t:'LUCKY!! 😭'},{u:'SunnyArt',t:'What does it MEAN?? 😂'},{u:'FluffyPets',t:'Nature is amazing! ✨'}] },

  { id:28, user:'DinoBoy',     type:'outdoor', seed:28,
    caption:"Beach day with Dad! Built the world's biggest sandcastle 🏖️🏰",
    tags:'#beach #sandcastle #summer',  time:'1d ago', likes:181,
    comments:[{u:'NatureKid',t:'Beach squad! 🏖️'},{u:'MaxCool',t:'Epic sandcastle! 🏰'},{u:'Emma_Stars',t:'Take me next time!! 🌊'}] },

  { id:29, user:'NatureKid',   type:'outdoor', seed:29,
    caption:'Picked wildflowers for Mom. She cried happy tears 🌸💐❤️',
    tags:'#flowers #mom #nature',       time:'2d ago', likes:156,
    comments:[{u:'Emma_Stars',t:'This is the sweetest thing 🥺❤️'},{u:'FluffyPets',t:'Best kid award!! 🌸'},{u:'RainbowGirl',t:'Mom must love you so much! 💐'}] },

  { id:30, user:'DinoBoy',     type:'outdoor', seed:30,
    caption:'Watched the sunset from the top of the hill with Dad 🌅🏔️',
    tags:'#sunset #hiking #beautiful',  time:'3d ago', likes:122,
    comments:[{u:'NatureKid',t:'Best view ever! 🌅'},{u:'SunnyArt',t:'I want to paint this! 🎨'},{u:'Emma_Stars',t:'So beautiful!! 😍'}] },
];

/* ================================================================
   CANVAS DRAWING ENGINE
   ================================================================ */

function kgRng(seed) {
  let s = (seed * 747796405 + 2891336453) >>> 0;
  return () => {
    s ^= s >>> 15; s = Math.imul(s, 0x85ebca6b) >>> 0;
    s ^= s >>> 13; s = Math.imul(s, 0xc2b2ae35) >>> 0;
    s ^= s >>> 16;
    return (s >>> 0) / 4294967295;
  };
}

function kgDraw(canvas, type, seed) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const rng = kgRng(seed);
  const v = seed % 100; // variant
  ctx.clearRect(0, 0, W, H);
  if      (type === 'drawing') kgArt(ctx, W, H, rng, v);
  else if (type === 'pet')     kgPet(ctx, W, H, rng, v);
  else if (type === 'game')    kgGame(ctx, W, H, rng, v);
  else if (type === 'outdoor') kgOutdoor(ctx, W, H, rng, v);
}

/* ---- helpers ---- */
function kgCircle(ctx, x, y, r, fill, stroke, lw) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill)   { ctx.fillStyle = fill;   ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw||2; ctx.stroke(); }
}
function kgRect(ctx, x, y, w, h, fill) {
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
}
function kgCloud(ctx, x, y, s) {
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  [0,s*0.6,s*1.2].forEach((dx,i) => kgCircle(ctx, x+dx, y + (i===1?-s*0.2:0), s*(i===1?0.7:0.5), 'rgba(255,255,255,0.9)'));
}
function kgStar(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    const ri = i % 2 === 0 ? r : r * 0.45;
    i === 0 ? ctx.moveTo(cx + ri*Math.cos(a), cy + ri*Math.sin(a))
            : ctx.lineTo(cx + ri*Math.cos(a), cy + ri*Math.sin(a));
  }
  ctx.closePath(); ctx.fill();
}
function kgGradientBg(ctx, W, H, top, bot) {
  const g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0, top); g.addColorStop(1, bot);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function kgText(ctx, text, x, y, size, color, font) {
  ctx.fillStyle = color; ctx.font = `bold ${size}px ${font||'sans-serif'}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y);
}

/* ---- KIDS ART drawings ---- */
function kgArt(ctx, W, H, rng, v) {
  const style = v % 4;
  // Paper background
  ctx.fillStyle = '#fffef0';
  ctx.fillRect(0, 0, W, H);

  if (style === 0) {
    // Rainbow landscape
    kgGradientBg(ctx, W, H, '#aee4ff', '#d4f5a0');
    // Ground
    kgRect(ctx, 0, H*0.68, W, H*0.32, '#7bc95a');
    // Sun
    kgCircle(ctx, W*0.82, H*0.18, H*0.12, '#ffe03a');
    for (let i=0;i<8;i++) { // sun rays
      const a = (i/8)*Math.PI*2;
      ctx.strokeStyle='#ffd000'; ctx.lineWidth=3; ctx.beginPath();
      ctx.moveTo(W*0.82+Math.cos(a)*H*0.14, H*0.18+Math.sin(a)*H*0.14);
      ctx.lineTo(W*0.82+Math.cos(a)*H*0.2,  H*0.18+Math.sin(a)*H*0.2);
      ctx.stroke();
    }
    // Rainbow
    const rainbowColors = ['#ff4444','#ff9944','#ffee44','#44ee44','#44aaff','#9944ff'];
    rainbowColors.forEach((c,i) => {
      ctx.strokeStyle=c; ctx.lineWidth=5; ctx.beginPath();
      ctx.arc(W*0.5, H*0.85, H*(0.52-i*0.04), Math.PI, 0); ctx.stroke();
    });
    // House
    kgRect(ctx, W*0.1, H*0.48, W*0.25, H*0.22, '#e8a070');
    ctx.fillStyle='#cc4444'; ctx.beginPath();
    ctx.moveTo(W*0.08,H*0.48); ctx.lineTo(W*0.225,H*0.3); ctx.lineTo(W*0.37,H*0.48); ctx.closePath(); ctx.fill();
    kgRect(ctx, W*0.175, H*0.58, W*0.08, H*0.12, '#7a4a2a'); // door
    kgRect(ctx, W*0.13, H*0.52, W*0.06, H*0.06, '#aaddff');  // window
    kgRect(ctx, W*0.28, H*0.52, W*0.06, H*0.06, '#aaddff');
    // Tree
    kgRect(ctx, W*0.55, H*0.56, W*0.04, H*0.15, '#8B5E3C');
    kgCircle(ctx, W*0.57, H*0.5, H*0.14, '#4CAF50');
    kgCircle(ctx, W*0.51, H*0.55, H*0.1, '#388E3C');
    // Clouds
    kgCloud(ctx, W*0.12, H*0.12, H*0.07);
    kgCloud(ctx, W*0.44, H*0.08, H*0.06);
    // Flowers
    [0.42,0.52,0.62,0.72,0.78].forEach((px,i) => {
      const clrs=['#ff69b4','#ff9900','#ffff00','#ff4466','#aa44ff'];
      kgCircle(ctx, W*px, H*0.72, H*0.035, clrs[i]);
      ctx.strokeStyle='#4a8a30'; ctx.lineWidth=2; ctx.beginPath();
      ctx.moveTo(W*px, H*0.755); ctx.lineTo(W*px, H*0.8); ctx.stroke();
    });

  } else if (style === 1) {
    // Space scene
    kgGradientBg(ctx, W, H, '#0d0d2b', '#1a1a4a');
    // Stars
    for(let i=0;i<60;i++) {
      const x=rng()*W, y=rng()*H*0.8, r=rng()*2+0.5;
      kgCircle(ctx, x, y, r, `rgba(255,255,255,${0.4+rng()*0.6})`);
    }
    // Moon / Planet
    kgCircle(ctx, W*0.15, H*0.18, H*0.12, '#ffe88a');
    kgCircle(ctx, W*0.19, H*0.14, H*0.09, '#1a1a4a'); // crescent shadow
    // Planet
    kgCircle(ctx, W*0.75, H*0.3, H*0.1, '#c07aff');
    ctx.strokeStyle='rgba(180,120,255,0.6)'; ctx.lineWidth=4;
    ctx.beginPath(); ctx.ellipse(W*0.75,H*0.3,H*0.18,H*0.04,Math.PI*0.2,0,Math.PI*2); ctx.stroke();
    // Rocket
    ctx.fillStyle='#ff6644'; ctx.beginPath();
    ctx.moveTo(W*0.5, H*0.1); ctx.lineTo(W*0.44,H*0.45); ctx.lineTo(W*0.56,H*0.45); ctx.closePath(); ctx.fill();
    kgRect(ctx, W*0.44, H*0.44, W*0.12, H*0.25, '#ddddff');
    kgCircle(ctx, W*0.5, H*0.52, H*0.07, '#aaddff', '#5599ff', 2);
    // Flame
    ctx.fillStyle='#ff9900'; ctx.beginPath();
    ctx.moveTo(W*0.45,H*0.69); ctx.lineTo(W*0.5,H*0.82); ctx.lineTo(W*0.55,H*0.69); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#ffff44'; ctx.beginPath();
    ctx.moveTo(W*0.47,H*0.69); ctx.lineTo(W*0.5,H*0.77); ctx.lineTo(W*0.53,H*0.69); ctx.closePath(); ctx.fill();
    // Stars decoration
    kgStar(ctx, W*0.85, H*0.65, 12, '#ffee44');
    kgStar(ctx, W*0.2,  H*0.7,  9,  '#ffee44');

  } else if (style === 2) {
    // Garden butterfly
    kgGradientBg(ctx, W, H, '#b3e5fc', '#e8f5e9');
    kgRect(ctx, 0, H*0.65, W, H*0.35, '#66bb6a');
    kgCloud(ctx, W*0.1, H*0.1, H*0.07);
    kgCloud(ctx, W*0.55, H*0.07, H*0.08);
    kgCircle(ctx, W*0.85, H*0.15, H*0.1, '#ffe03a');
    // Trees
    [[0.1,0.45,0.08],[0.88,0.42,0.1]].forEach(([px,py,r]) => {
      kgRect(ctx, W*px-W*0.02, H*py+H*r*0.8, W*0.04, H*0.22, '#8B5E3C');
      kgCircle(ctx, W*px, H*py, H*r, '#4CAF50');
    });
    // Pond
    ctx.fillStyle='rgba(100,180,255,0.6)';
    ctx.beginPath(); ctx.ellipse(W*0.5,H*0.78,W*0.14,H*0.07,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#64b5f6'; ctx.lineWidth=2; ctx.stroke();
    // Flowers
    const fclrs=['#ff69b4','#ff9900','#ffff44','#ff4499','#cc44ff','#ff6644'];
    [0.3,0.42,0.58,0.68,0.78,0.22].forEach((px,i) => {
      kgCircle(ctx, W*px, H*0.72, H*0.04, fclrs[i]);
      kgCircle(ctx, W*px, H*0.72, H*0.018, '#fff176');
      ctx.strokeStyle='#388e3c'; ctx.lineWidth=2;
      ctx.beginPath(); ctx.moveTo(W*px,H*0.76); ctx.lineTo(W*px,H*0.82); ctx.stroke();
    });
    // Big butterfly
    const bx=W*0.5, by=H*0.38;
    ctx.fillStyle='#ff6b6b';
    ctx.beginPath(); ctx.ellipse(bx-W*0.09,by-H*0.04,W*0.09,H*0.1,-0.3,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(bx+W*0.09,by-H*0.04,W*0.09,H*0.1,0.3,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ff9999';
    ctx.beginPath(); ctx.ellipse(bx-W*0.07,by+H*0.06,W*0.07,H*0.07,-0.5,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(bx+W*0.07,by+H*0.06,W*0.07,H*0.07,0.5,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#333'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(bx,by-H*0.12); ctx.lineTo(bx,by+H*0.12); ctx.stroke();
    // Antennae
    ctx.beginPath(); ctx.moveTo(bx,by-H*0.12); ctx.quadraticCurveTo(bx-W*0.05,by-H*0.22,bx-W*0.04,by-H*0.2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(bx,by-H*0.12); ctx.quadraticCurveTo(bx+W*0.05,by-H*0.22,bx+W*0.04,by-H*0.2); ctx.stroke();

  } else {
    // Fantasy castle scene
    kgGradientBg(ctx, W, H, '#d4aaff', '#ffd4aa');
    // Mountains
    ctx.fillStyle='#9966cc';
    [[0.15,0.55],[0.4,0.42],[0.65,0.5],[0.88,0.48]].forEach(([px,py]) => {
      ctx.beginPath();
      ctx.moveTo(W*(px-0.2),H*0.75); ctx.lineTo(W*px,H*py); ctx.lineTo(W*(px+0.2),H*0.75);
      ctx.closePath(); ctx.fill();
    });
    kgRect(ctx, 0, H*0.72, W, H*0.28, '#7a4a9a');
    // Castle
    ctx.fillStyle='#ccbbff';
    kgRect(ctx, W*0.32, H*0.38, W*0.36, H*0.36, '#ccbbff');
    // Towers
    [[0.32,0.24],[0.58,0.24],[0.42,0.2],[0.48,0.2]].forEach(([px,py]) => {
      kgRect(ctx, W*px, H*py, W*0.08, H*0.18, '#bbaaee');
      kgRect(ctx, W*px-W*0.005, H*py-H*0.04, W*0.09, H*0.04, '#9988cc'); // battlement
    });
    // Gate
    ctx.fillStyle='#554466';
    ctx.beginPath(); ctx.arc(W*0.5,H*0.62,W*0.05,Math.PI,0); ctx.rect(W*0.45,H*0.62,W*0.1,H*0.12); ctx.fill();
    // Flag
    ctx.strokeStyle='#888'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(W*0.5,H*0.2); ctx.lineTo(W*0.5,H*0.05); ctx.stroke();
    ctx.fillStyle='#ff4444';
    ctx.beginPath(); ctx.moveTo(W*0.5,H*0.05); ctx.lineTo(W*0.62,H*0.1); ctx.lineTo(W*0.5,H*0.15); ctx.fill();
    // Dragon silhouette
    ctx.fillStyle='#ff6a00';
    kgCircle(ctx, W*0.78, H*0.35, H*0.06, '#ff6a00');
    kgCircle(ctx, W*0.88, H*0.33, H*0.045, '#ff6a00');
    ctx.fillStyle='#ff4400'; ctx.beginPath();
    ctx.moveTo(W*0.84,H*0.29); ctx.lineTo(W*0.91,H*0.22); ctx.lineTo(W*0.87,H*0.32); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#ffaa00'; // fire
    ctx.beginPath(); ctx.moveTo(W*0.92,H*0.33); ctx.quadraticCurveTo(W,H*0.25,W*0.98,H*0.38); ctx.lineTo(W*0.9,H*0.36); ctx.closePath(); ctx.fill();
    // Stars
    for(let i=0;i<8;i++) kgStar(ctx, rng()*W, rng()*H*0.4, 5+rng()*6, '#ffee44');
  }

  // Crayon-style border
  ctx.strokeStyle = 'rgba(0,0,0,0.12)';
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, W-4, H-4);
}

/* ---- PET drawings ---- */
function kgPet(ctx, W, H, rng, v) {
  const style = v % 5;
  const warmBgs = [
    ['#fff8e1','#ffe0b2'],['#f3e5f5','#e1bee7'],
    ['#e8f5e9','#c8e6c9'],['#e3f2fd','#bbdefb'],['#fce4ec','#f8bbd9']
  ];
  const [top,bot] = warmBgs[style];
  kgGradientBg(ctx, W, H, top, bot);

  if (style === 0) {
    // Cat face
    kgCircle(ctx, W*0.5, H*0.48, H*0.3, '#f5a623', null);
    // Ears
    ctx.fillStyle='#e8941a';
    ctx.beginPath(); ctx.moveTo(W*0.27,H*0.28); ctx.lineTo(W*0.32,H*0.14); ctx.lineTo(W*0.42,H*0.26); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(W*0.73,H*0.28); ctx.lineTo(W*0.68,H*0.14); ctx.lineTo(W*0.58,H*0.26); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#ffccaa';
    ctx.beginPath(); ctx.moveTo(W*0.29,H*0.26); ctx.lineTo(W*0.33,H*0.17); ctx.lineTo(W*0.41,H*0.27); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(W*0.71,H*0.26); ctx.lineTo(W*0.67,H*0.17); ctx.lineTo(W*0.59,H*0.27); ctx.closePath(); ctx.fill();
    // Eyes
    kgCircle(ctx, W*0.38, H*0.42, H*0.07, '#2e7d32');
    kgCircle(ctx, W*0.62, H*0.42, H*0.07, '#2e7d32');
    kgCircle(ctx, W*0.38, H*0.42, H*0.04, '#111');
    kgCircle(ctx, W*0.62, H*0.42, H*0.04, '#111');
    kgCircle(ctx, W*0.36, H*0.4,  H*0.015,'#fff');
    kgCircle(ctx, W*0.6,  H*0.4,  H*0.015,'#fff');
    // Nose
    ctx.fillStyle='#ff80ab'; ctx.beginPath();
    ctx.moveTo(W*0.5,H*0.52); ctx.lineTo(W*0.46,H*0.49); ctx.lineTo(W*0.54,H*0.49); ctx.closePath(); ctx.fill();
    // Mouth
    ctx.strokeStyle='#c2185b'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(W*0.5,H*0.52); ctx.quadraticCurveTo(W*0.43,H*0.58,W*0.38,H*0.55); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W*0.5,H*0.52); ctx.quadraticCurveTo(W*0.57,H*0.58,W*0.62,H*0.55); ctx.stroke();
    // Whiskers
    ctx.strokeStyle='rgba(0,0,0,0.4)'; ctx.lineWidth=1.5;
    [[-1,0.43,-1,0.44],[- 1,0.47,-1,0.49],[1,0.43,1,0.44],[1,0.47,1,0.49]].forEach(([sx,sy,ex,ey]) => {
      ctx.beginPath();
      ctx.moveTo(W*(0.5+sx*0.02), H*sy); ctx.lineTo(W*(0.5+sx*0.22), H*(sy+ey*0.01)); ctx.stroke();
    });
    // Paw prints + hearts
    ['#ff80ab','#f48fb1','#ff4081'].forEach((c,i) => {
      kgCircle(ctx, W*(0.1+i*0.06), H*0.85, 8, c);
      kgCircle(ctx, W*(0.1+i*0.06)-7, H*0.85-7, 5, c);
      kgCircle(ctx, W*(0.1+i*0.06)+7, H*0.85-7, 5, c);
    });
    kgText(ctx, '❤️', W*0.85, H*0.2, 28);
    kgText(ctx, '❤️', W*0.15, H*0.2, 22);
    kgText(ctx, '😻', W*0.5, H*0.85, 34);

  } else if (style === 1) {
    // Dog face
    kgCircle(ctx, W*0.5, H*0.45, H*0.28, '#d2935a', null);
    // Ears (floppy)
    ctx.fillStyle='#b87333';
    ctx.beginPath(); ctx.ellipse(W*0.28,H*0.46,W*0.1,H*0.2,0.3,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(W*0.72,H*0.46,W*0.1,H*0.2,-0.3,0,Math.PI*2); ctx.fill();
    kgCircle(ctx, W*0.5, H*0.45, H*0.28, '#d2935a', null); // redraw face over ears
    // Eyes
    kgCircle(ctx, W*0.38, H*0.4, H*0.06, '#5d4037');
    kgCircle(ctx, W*0.62, H*0.4, H*0.06, '#5d4037');
    kgCircle(ctx, W*0.38, H*0.4, H*0.03, '#111');
    kgCircle(ctx, W*0.62, H*0.4, H*0.03, '#111');
    kgCircle(ctx, W*0.365,H*0.385,H*0.012,'#fff');
    kgCircle(ctx, W*0.605,H*0.385,H*0.012,'#fff');
    // Snout
    kgCircle(ctx, W*0.5, H*0.54, H*0.1, '#e8b87a');
    kgCircle(ctx, W*0.5, H*0.5, H*0.045,'#5d2e0c'); // nose
    // Mouth
    ctx.strokeStyle='#5d2e0c'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(W*0.5,H*0.545); ctx.quadraticCurveTo(W*0.42,H*0.62,W*0.38,H*0.59); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W*0.5,H*0.545); ctx.quadraticCurveTo(W*0.58,H*0.62,W*0.62,H*0.59); ctx.stroke();
    // Tongue
    ctx.fillStyle='#ff80ab';
    ctx.beginPath(); ctx.ellipse(W*0.5,H*0.615,W*0.055,H*0.06,0,0,Math.PI*2); ctx.fill();
    // Collar + tag
    ctx.fillStyle='#e53935'; ctx.fillRect(W*0.34, H*0.67, W*0.32, H*0.05);
    kgCircle(ctx, W*0.5, H*0.72, H*0.04, '#ffd600');
    kgText(ctx, '🐾', W*0.2, H*0.8, 28);
    kgText(ctx, '🐾', W*0.8, H*0.8, 28);
    kgText(ctx, '🦴', W*0.5, H*0.88, 30);

  } else if (style === 2) {
    // Bunny
    kgCircle(ctx, W*0.5, H*0.55, H*0.26, '#f5f5f5', '#eee', 2);
    // Ears
    ctx.fillStyle='#f5f5f5';
    ctx.beginPath(); ctx.ellipse(W*0.38,H*0.26,W*0.055,H*0.16,-0.2,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(W*0.62,H*0.26,W*0.055,H*0.16,0.2,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ffb3c1';
    ctx.beginPath(); ctx.ellipse(W*0.38,H*0.26,W*0.03,H*0.11,-0.2,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(W*0.62,H*0.26,W*0.03,H*0.11,0.2,0,Math.PI*2); ctx.fill();
    // Eyes
    kgCircle(ctx, W*0.4, H*0.49, H*0.05, '#111');
    kgCircle(ctx, W*0.6, H*0.49, H*0.05, '#111');
    kgCircle(ctx, W*0.39,H*0.477,H*0.015,'#fff');
    kgCircle(ctx, W*0.59,H*0.477,H*0.015,'#fff');
    // Nose + mouth
    kgCircle(ctx, W*0.5, H*0.57, H*0.025, '#ffb3c1');
    ctx.strokeStyle='#d81b60'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(W*0.5,H*0.595); ctx.quadraticCurveTo(W*0.44,H*0.64,W*0.4,H*0.62); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W*0.5,H*0.595); ctx.quadraticCurveTo(W*0.56,H*0.64,W*0.6,H*0.62); ctx.stroke();
    // Cheeks
    kgCircle(ctx, W*0.32, H*0.58, H*0.055,'rgba(255,150,180,0.35)');
    kgCircle(ctx, W*0.68, H*0.58, H*0.055,'rgba(255,150,180,0.35)');
    kgText(ctx, '🥕', W*0.2, H*0.82, 32);
    kgText(ctx, '🥕', W*0.8, H*0.82, 32);
    kgText(ctx, '🐰', W*0.5, H*0.88, 34);

  } else if (style === 3) {
    // Fish in bowl
    kgGradientBg(ctx, W, H, '#e3f2fd', '#bbdefb');
    // Bowl
    ctx.fillStyle='rgba(144,202,249,0.3)';
    ctx.beginPath(); ctx.ellipse(W*0.5,H*0.55,W*0.3,H*0.32,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(100,180,255,0.6)'; ctx.lineWidth=4; ctx.stroke();
    // Water top
    ctx.fillStyle='rgba(100,181,246,0.4)';
    ctx.beginPath(); ctx.ellipse(W*0.5,H*0.28,W*0.3,H*0.06,0,0,Math.PI*2); ctx.fill();
    // Gravel
    ctx.fillStyle='rgba(180,160,120,0.7)';
    ctx.beginPath(); ctx.ellipse(W*0.5,H*0.82,W*0.26,H*0.06,0,0,Math.PI*2); ctx.fill();
    // Plants
    ctx.strokeStyle='#4caf50'; ctx.lineWidth=3;
    [[W*0.28,H*0.78,W*0.22,H*0.55],[W*0.72,H*0.78,W*0.78,H*0.6]].forEach(([x1,y1,x2,y2]) => {
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.quadraticCurveTo((x1+x2)/2,y1-H*0.1,x2,y2); ctx.stroke();
    });
    // Fish (orange with blue fins)
    ctx.fillStyle='#ff8c00';
    ctx.beginPath(); ctx.ellipse(W*0.5,H*0.55,W*0.1,H*0.07,0.1,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ff6200';
    ctx.beginPath(); ctx.moveTo(W*0.62,H*0.55); ctx.lineTo(W*0.7,H*0.47); ctx.lineTo(W*0.7,H*0.63); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#3399ff';
    ctx.beginPath(); ctx.moveTo(W*0.46,H*0.49); ctx.lineTo(W*0.38,H*0.43); ctx.lineTo(W*0.44,H*0.55); ctx.closePath(); ctx.fill();
    kgCircle(ctx, W*0.44, H*0.54, H*0.018, '#111');
    // Bubbles
    [0.52,0.56,0.51].forEach((px,i) => {
      kgCircle(ctx, W*px, H*(0.38-i*0.05), H*0.02, 'rgba(200,230,255,0.6)', 'rgba(100,180,255,0.5)', 1.5);
    });
    kgText(ctx, '🐟', W*0.5, H*0.88, 30);

  } else {
    // Hamster
    kgGradientBg(ctx, W, H, '#fff8e1', '#ffecb3');
    // Wheel
    ctx.strokeStyle='#aaa'; ctx.lineWidth=4;
    kgCircle(ctx, W*0.5, H*0.5, H*0.3, null, '#bbb', 6);
    kgCircle(ctx, W*0.5, H*0.5, H*0.05, '#ddd', '#bbb', 3);
    for(let i=0;i<8;i++) {
      const a=(i/8)*Math.PI*2;
      ctx.beginPath(); ctx.moveTo(W*0.5+H*0.05*Math.cos(a),H*0.5+H*0.05*Math.sin(a));
      ctx.lineTo(W*0.5+H*0.28*Math.cos(a),H*0.5+H*0.28*Math.sin(a)); ctx.stroke();
    }
    // Hamster
    kgCircle(ctx, W*0.5, H*0.48, H*0.22, '#f5a623');
    // Chubby cheeks
    kgCircle(ctx, W*0.33, H*0.54, H*0.1, '#e8941a');
    kgCircle(ctx, W*0.67, H*0.54, H*0.1, '#e8941a');
    // Ears
    kgCircle(ctx, W*0.36, H*0.3, H*0.07, '#f5a623');
    kgCircle(ctx, W*0.64, H*0.3, H*0.07, '#f5a623');
    kgCircle(ctx, W*0.36, H*0.3, H*0.04, '#ffccaa');
    kgCircle(ctx, W*0.64, H*0.3, H*0.04, '#ffccaa');
    // Eyes
    kgCircle(ctx, W*0.42, H*0.44, H*0.04, '#111');
    kgCircle(ctx, W*0.58, H*0.44, H*0.04, '#111');
    kgCircle(ctx, W*0.41, H*0.43, H*0.012,'#fff');
    kgCircle(ctx, W*0.57, H*0.43, H*0.012,'#fff');
    // Nose
    kgCircle(ctx, W*0.5, H*0.52, H*0.02, '#ff80ab');
    // Speed lines
    ctx.strokeStyle='rgba(200,150,50,0.3)'; ctx.lineWidth=2;
    [0.7,0.75,0.8].forEach(py => {
      ctx.beginPath(); ctx.moveTo(W*0.82,H*py); ctx.lineTo(W,H*py); ctx.stroke();
    });
    kgText(ctx, '💨', W*0.88, H*0.5, 28);
    kgText(ctx, '🐹', W*0.5, H*0.85, 34);
  }
}

/* ---- GAME drawings ---- */
function kgGame(ctx, W, H, rng, v) {
  const style = v % 3;

  if (style === 0) {
    // Platform game
    kgGradientBg(ctx, W, H, '#1a237e', '#283593');
    // Stars
    for(let i=0;i<40;i++) kgCircle(ctx, rng()*W, rng()*H*0.6, rng()*1.5+0.5, '#fff');
    // HUD bar
    kgRect(ctx, 0, 0, W, H*0.12, 'rgba(0,0,0,0.5)');
    kgText(ctx, 'SCORE: 42,800', W*0.38, H*0.06, 14, '#fff');
    kgText(ctx, '❤️❤️❤️', W*0.82, H*0.06, 12);
    // Platforms
    [[0.05,0.75,0.25,0.05],[0.35,0.6,0.2,0.05],[0.62,0.72,0.22,0.05],[0.18,0.48,0.18,0.05],[0.55,0.42,0.15,0.05]].forEach(([x,y,w,h]) => {
      const g = ctx.createLinearGradient(0,H*y,0,H*(y+h));
      g.addColorStop(0,'#66bb6a'); g.addColorStop(1,'#388e3c');
      kgRect(ctx, W*x, H*y, W*w, H*h, g);
      kgRect(ctx, W*x, H*y, W*w, H*h*0.35, '#81c784');
    });
    // Coins
    [[0.42,0.54],[0.46,0.54],[0.5,0.54],[0.25,0.42],[0.3,0.42]].forEach(([px,py]) => {
      kgCircle(ctx, W*px, H*py, H*0.025, '#ffd600');
      kgText(ctx, '$', W*px, H*py, 10, '#ff8f00');
    });
    // Character (pixel style)
    const cx=W*0.22, cy=H*0.64;
    kgRect(ctx, cx-8,  cy-28, 16, 16, '#ff7043'); // head
    kgRect(ctx, cx-10, cy-12, 20, 18, '#1565c0'); // body
    kgRect(ctx, cx-8,  cy+6,  8,  14, '#1565c0'); // legs
    kgRect(ctx, cx+0,  cy+6,  8,  14, '#1565c0');
    kgRect(ctx, cx-16, cy-8,  8,  14, '#1565c0'); // arms
    kgRect(ctx, cx+8,  cy-8,  8,  14, '#1565c0');
    kgCircle(ctx, cx-2, cy-24, 4, '#ffd54f'); // eyes
    kgCircle(ctx, cx+6, cy-24, 4, '#ffd54f');
    // Ground
    kgRect(ctx, 0, H*0.88, W, H*0.12, '#33691e');
    kgRect(ctx, 0, H*0.88, W, H*0.03, '#558b2f');

  } else if (style === 1) {
    // Space shooter
    kgGradientBg(ctx, W, H, '#000011', '#001133');
    // Nebula
    const ng = ctx.createRadialGradient(W*0.3,H*0.4,10,W*0.3,H*0.4,W*0.4);
    ng.addColorStop(0,'rgba(100,0,200,0.3)'); ng.addColorStop(1,'transparent');
    ctx.fillStyle=ng; ctx.fillRect(0,0,W,H);
    // Stars
    for(let i=0;i<60;i++) kgCircle(ctx, rng()*W, rng()*H, rng()*2, `rgba(255,255,255,${0.3+rng()*0.7})`);
    // HUD
    kgRect(ctx, 0, 0, W, H*0.1, 'rgba(0,0,0,0.6)');
    kgText(ctx, '⭐ 8,250', W*0.22, H*0.05, 13, '#ffd600');
    kgText(ctx, 'LEVEL 7', W*0.5, H*0.05, 13, '#fff');
    kgText(ctx, '❤️❤️', W*0.82, H*0.05, 12);
    // Enemies
    [[0.2,0.28],[0.45,0.22],[0.7,0.3],[0.35,0.38],[0.6,0.18]].forEach(([px,py]) => {
      kgCircle(ctx, W*px, H*py, H*0.04, '#ff1744');
      kgCircle(ctx, W*px-H*0.02, H*py-H*0.01, H*0.012, '#ff8a80');
      kgCircle(ctx, W*px+H*0.02, H*py-H*0.01, H*0.012, '#ff8a80');
    });
    // Bullets
    [[0.5,0.55],[0.5,0.45],[0.5,0.35]].forEach(([px,py]) => {
      kgRect(ctx, W*px-2, H*py, 4, H*0.04, '#ffee58');
    });
    // Player ship
    ctx.fillStyle='#29b6f6';
    ctx.beginPath();
    ctx.moveTo(W*0.5,H*0.82); ctx.lineTo(W*0.43,H*0.92); ctx.lineTo(W*0.57,H*0.92); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#4dd0e1';
    ctx.beginPath();
    ctx.moveTo(W*0.5,H*0.78); ctx.lineTo(W*0.46,H*0.88); ctx.lineTo(W*0.54,H*0.88); ctx.closePath(); ctx.fill();
    // Engine flame
    ctx.fillStyle='#ff6f00';
    ctx.beginPath(); ctx.moveTo(W*0.46,H*0.92); ctx.lineTo(W*0.5,H*1.0); ctx.lineTo(W*0.54,H*0.92); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#ffee58';
    ctx.beginPath(); ctx.moveTo(W*0.47,H*0.92); ctx.lineTo(W*0.5,H*0.97); ctx.lineTo(W*0.53,H*0.92); ctx.closePath(); ctx.fill();

  } else {
    // Treasure/RPG map
    kgGradientBg(ctx, W, H, '#efebe9', '#d7ccc8');
    // Parchment texture
    ctx.fillStyle='rgba(180,140,80,0.08)';
    for(let i=0;i<8;i++) {
      ctx.beginPath(); ctx.arc(rng()*W,rng()*H,20+rng()*60,0,Math.PI*2); ctx.fill();
    }
    // Map border
    ctx.strokeStyle='#795548'; ctx.lineWidth=4;
    ctx.strokeRect(8,8,W-16,H-16);
    ctx.strokeStyle='#a1887f'; ctx.lineWidth=2;
    ctx.strokeRect(14,14,W-28,H-28);
    // Path
    ctx.strokeStyle='rgba(121,85,72,0.5)'; ctx.lineWidth=3; ctx.setLineDash([8,6]);
    ctx.beginPath(); ctx.moveTo(W*0.15,H*0.8); ctx.lineTo(W*0.3,H*0.6); ctx.lineTo(W*0.5,H*0.7); ctx.lineTo(W*0.65,H*0.45); ctx.lineTo(W*0.8,H*0.35);
    ctx.stroke(); ctx.setLineDash([]);
    // Mountains
    ctx.fillStyle='rgba(121,85,72,0.4)';
    [[0.72,0.5],[0.82,0.42],[0.9,0.5]].forEach(([px,py]) => {
      ctx.beginPath(); ctx.moveTo(W*(px-0.1),H*0.7); ctx.lineTo(W*px,H*py); ctx.lineTo(W*(px+0.1),H*0.7); ctx.closePath(); ctx.fill();
    });
    // Trees
    ctx.fillStyle='rgba(76,175,80,0.6)';
    [[0.18,0.35],[0.25,0.4],[0.32,0.32]].forEach(([px,py]) => {
      ctx.beginPath(); ctx.moveTo(W*(px-0.04),H*(py+0.12)); ctx.lineTo(W*px,H*py); ctx.lineTo(W*(px+0.04),H*(py+0.12)); ctx.closePath(); ctx.fill();
    });
    // Character
    kgText(ctx, '🧙', W*0.15, H*0.75, 28);
    // Treasure chest
    kgRect(ctx, W*0.74, H*0.28, W*0.1, H*0.08, '#ffa000');
    kgRect(ctx, W*0.74, H*0.28, W*0.1, H*0.04, '#ff8f00');
    kgRect(ctx, W*0.787,H*0.3,  W*0.025,H*0.04, '#ffd54f');
    // X marks the spot
    ctx.strokeStyle='#c62828'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(W*0.77,H*0.22); ctx.lineTo(W*0.83,H*0.27); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W*0.83,H*0.22); ctx.lineTo(W*0.77,H*0.27); ctx.stroke();
    // Score/HUD
    kgRect(ctx, 0, 0, W, H*0.1, 'rgba(121,85,72,0.3)');
    kgText(ctx, '💎 1,450    ⚔️ LVL 12    ❤️❤️❤️', W*0.5, H*0.055, 12, '#4e342e');
  }
}

/* ---- OUTDOOR drawings ---- */
function kgOutdoor(ctx, W, H, rng, v) {
  const style = v % 4;

  if (style === 0) {
    // Park / meadow
    kgGradientBg(ctx, W, H, '#87ceeb', '#b3e5fc');
    // Ground
    kgRect(ctx, 0, H*0.65, W, H*0.35, '#66bb6a');
    kgRect(ctx, 0, H*0.65, W, H*0.04, '#81c784');
    // Sun
    kgCircle(ctx, W*0.88, H*0.14, H*0.1, '#ffe03a');
    // Clouds
    kgCloud(ctx, W*0.1, H*0.14, H*0.08); kgCloud(ctx, W*0.42, H*0.1, H*0.07);
    // Trees
    [[0.12,0.5,0.1],[0.28,0.45,0.12],[0.7,0.48,0.11],[0.82,0.52,0.09]].forEach(([px,py,r]) => {
      kgRect(ctx, W*px-W*0.02, H*(py+r*0.7), W*0.04, H*0.18, '#8D6E63');
      kgCircle(ctx, W*px, H*py, H*r, '#4CAF50');
      kgCircle(ctx, W*(px-0.04), H*(py+r*0.3), H*r*0.6, '#388E3C');
    });
    // Pond
    ctx.fillStyle='rgba(100,181,246,0.7)';
    ctx.beginPath(); ctx.ellipse(W*0.5,H*0.8,W*0.14,H*0.07,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='rgba(30,136,229,0.5)'; ctx.lineWidth=2; ctx.stroke();
    // Duck
    kgText(ctx, '🦆', W*0.48, H*0.79, 22);
    // Flowers
    const flrC=['#ff69b4','#ffeb3b','#ff7043','#e040fb','#00bcd4'];
    [0.4,0.5,0.57,0.63,0.42,0.55,0.48].forEach((px,i) => {
      kgCircle(ctx, W*px, H*(0.72+rng()*0.08), H*0.025, flrC[i%5]);
    });
    // Bench
    ctx.fillStyle='#a1887f';
    kgRect(ctx, W*0.35, H*0.72, W*0.12, H*0.02, '#795548');
    kgRect(ctx, W*0.36, H*0.72, W*0.018, H*0.05, '#795548');
    kgRect(ctx, W*0.44, H*0.72, W*0.018, H*0.05, '#795548');
    // Child silhouette on bench
    kgCircle(ctx, W*0.415, H*0.68, H*0.03, '#ff8a65');
    kgRect(ctx, W*0.405, H*0.71, W*0.02, H*0.03, '#42a5f5');
    // Kite
    ctx.strokeStyle='#ff4081'; ctx.lineWidth=1.5; ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.moveTo(W*0.415,H*0.68); ctx.lineTo(W*0.6,H*0.3); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle='#ff4081';
    ctx.beginPath(); ctx.moveTo(W*0.6,H*0.24); ctx.lineTo(W*0.64,H*0.3); ctx.lineTo(W*0.6,H*0.36); ctx.lineTo(W*0.56,H*0.3); ctx.closePath(); ctx.fill();

  } else if (style === 1) {
    // Beach
    kgGradientBg(ctx, W, H, '#87ceeb', '#b3e5fc');
    // Sea
    const sg = ctx.createLinearGradient(0,H*0.5,0,H*0.75);
    sg.addColorStop(0,'#0288d1'); sg.addColorStop(1,'#29b6f6');
    kgRect(ctx, 0, H*0.5, W, H*0.25, sg);
    // Waves
    ctx.strokeStyle='rgba(255,255,255,0.5)'; ctx.lineWidth=2;
    [0.55,0.62,0.69].forEach(py => {
      ctx.beginPath();
      for(let x=0;x<W;x+=20) { ctx.moveTo(x,H*py); ctx.quadraticCurveTo(x+10,H*py-H*0.02,x+20,H*py); }
      ctx.stroke();
    });
    // Sand
    const sand = ctx.createLinearGradient(0,H*0.72,0,H);
    sand.addColorStop(0,'#f5deb3'); sand.addColorStop(1,'#deb887');
    kgRect(ctx, 0, H*0.72, W, H*0.28, sand);
    // Sun
    kgCircle(ctx, W*0.85, H*0.16, H*0.1, '#ffd600');
    for(let i=0;i<8;i++) {
      const a=(i/8)*Math.PI*2;
      ctx.strokeStyle='#ffcc00'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(W*0.85+H*0.12*Math.cos(a),H*0.16+H*0.12*Math.sin(a));
      ctx.lineTo(W*0.85+H*0.16*Math.cos(a),H*0.16+H*0.16*Math.sin(a)); ctx.stroke();
    }
    kgCloud(ctx, W*0.1,H*0.12,H*0.07); kgCloud(ctx, W*0.42,H*0.08,H*0.06);
    // Beach umbrella
    ctx.strokeStyle='#616161'; ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(W*0.3,H*0.9); ctx.lineTo(W*0.34,H*0.55); ctx.stroke();
    ctx.fillStyle='#ff5722';
    ctx.beginPath(); ctx.arc(W*0.34,H*0.55,W*0.14,Math.PI,0); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#fff176';
    ctx.beginPath(); ctx.arc(W*0.34,H*0.55,W*0.14,Math.PI*1.25,Math.PI*1.5); ctx.lineTo(W*0.34,H*0.55); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(W*0.34,H*0.55,W*0.14,Math.PI*1.75,Math.PI*2); ctx.lineTo(W*0.34,H*0.55); ctx.closePath(); ctx.fill();
    // Sandcastle
    kgRect(ctx, W*0.6, H*0.74, W*0.08, H*0.08, '#deb887');
    kgRect(ctx, W*0.68,H*0.77, W*0.05, H*0.05, '#deb887');
    kgRect(ctx, W*0.55,H*0.77, W*0.05, H*0.05, '#deb887');
    // Tower battlements
    [0.6,0.63,0.66,0.68,0.71].forEach(px => kgRect(ctx,W*px,H*0.72,W*0.015,H*0.025,'#c9a96e'));
    // Bucket + shovel
    kgText(ctx, '🪣', W*0.8, H*0.82, 26);
    kgText(ctx, '⛱️', W*0.5, H*0.5, 10); // seagull
    kgText(ctx, '🦀', W*0.18, H*0.85, 22);

  } else if (style === 2) {
    // Forest
    kgGradientBg(ctx, W, H, '#1b5e20', '#2e7d32');
    kgGradientBg(ctx, W, H, '#e8f5e9', '#c8e6c9');
    // Sky
    const sk = ctx.createLinearGradient(0,0,0,H*0.55);
    sk.addColorStop(0,'#b3e5fc'); sk.addColorStop(1,'#e8f5e9');
    kgRect(ctx, 0, 0, W, H*0.55, sk);
    // Ground
    kgRect(ctx, 0, H*0.7, W, H*0.3, '#4e342e');
    kgRect(ctx, 0, H*0.68, W, H*0.05, '#558b2f');
    // Big trees
    [[0.08,0.18,0.22],[0.22,0.08,0.2],[0.5,0.06,0.22],[0.78,0.1,0.2],[0.92,0.2,0.18]].forEach(([px,py,r]) => {
      kgRect(ctx, W*px-W*0.025, H*(py+r*1.1), W*0.05, H*0.32, '#5d4037');
      kgCircle(ctx, W*px, H*py, H*r, '#2e7d32');
      kgCircle(ctx, W*(px-0.04),H*(py+r*0.4),H*r*0.65,'#1b5e20');
    });
    // Sunbeams through trees
    ctx.fillStyle='rgba(255,255,200,0.07)';
    [[0.35,0],[0.5,0],[0.65,0]].forEach(([px]) => {
      ctx.beginPath(); ctx.moveTo(W*px,0); ctx.lineTo(W*(px-0.06),H*0.7); ctx.lineTo(W*(px+0.06),H*0.7); ctx.closePath(); ctx.fill();
    });
    // Bushes
    [[0.3,0.68,0.06],[0.55,0.66,0.07],[0.7,0.67,0.06]].forEach(([px,py,r]) => {
      kgCircle(ctx, W*px, H*py, H*r, '#388e3c');
    });
    // Animals
    kgText(ctx, '🦊', W*0.38, H*0.74, 28);
    kgText(ctx, '🦋', W*0.6,  H*0.5,  22);
    kgText(ctx, '🌸', W*0.25, H*0.7,  18);
    kgText(ctx, '🍄', W*0.72, H*0.72, 20);
    // Clouds peeking through
    kgCloud(ctx, W*0.32, H*0.1, H*0.06);

  } else {
    // Sunset / mountain hike
    const sky = ctx.createLinearGradient(0,0,0,H*0.65);
    sky.addColorStop(0,'#1a237e'); sky.addColorStop(0.4,'#ff6f00'); sky.addColorStop(0.7,'#ff8f00'); sky.addColorStop(1,'#ffd54f');
    kgRect(ctx, 0, 0, W, H*0.65, sky);
    // Sun on horizon
    kgCircle(ctx, W*0.5, H*0.64, H*0.12, '#ffd600');
    const sunGlow = ctx.createRadialGradient(W*0.5,H*0.64,H*0.12,W*0.5,H*0.64,H*0.4);
    sunGlow.addColorStop(0,'rgba(255,220,0,0.3)'); sunGlow.addColorStop(1,'transparent');
    ctx.fillStyle=sunGlow; ctx.fillRect(0,0,W,H);
    // Mountains (silhouettes)
    ctx.fillStyle='#37474f';
    [[0,0.45],[0.15,0.3],[0.35,0.22],[0.55,0.35],[0.75,0.25],[0.9,0.38],[1.05,0.45]].reduce((prev,cur,i,arr) => {
      if(i===0) { ctx.beginPath(); ctx.moveTo(W*cur[0],H*cur[1]); }
      else { ctx.lineTo(W*cur[0],H*cur[1]); }
      if(i===arr.length-1) { ctx.lineTo(W,H*0.65); ctx.lineTo(0,H*0.65); ctx.closePath(); ctx.fill(); }
      return cur;
    });
    // Foreground hills
    ctx.fillStyle='#1b5e20';
    ctx.beginPath(); ctx.moveTo(0,H*0.75);
    ctx.quadraticCurveTo(W*0.25,H*0.55,W*0.5,H*0.7);
    ctx.quadraticCurveTo(W*0.75,H*0.85,W,H*0.7);
    ctx.lineTo(W,H); ctx.lineTo(0,H); ctx.closePath(); ctx.fill();
    // Trail path
    ctx.strokeStyle='rgba(255,220,100,0.6)'; ctx.lineWidth=3; ctx.setLineDash([6,4]);
    ctx.beginPath(); ctx.moveTo(W*0.45,H*0.96); ctx.quadraticCurveTo(W*0.5,H*0.8,W*0.55,H*0.68); ctx.stroke();
    ctx.setLineDash([]);
    // Hiker silhouette
    ctx.fillStyle='#212121';
    kgCircle(ctx, W*0.5, H*0.73, H*0.03, '#212121');
    kgRect(ctx, W*0.487,H*0.76, W*0.026,H*0.05,'#212121');
    ctx.strokeStyle='#212121'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.moveTo(W*0.5,H*0.77); ctx.lineTo(W*0.48,H*0.83); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W*0.5,H*0.77); ctx.lineTo(W*0.52,H*0.83); ctx.stroke();
    // Stars appearing
    [[0.1,0.08],[0.25,0.12],[0.7,0.06],[0.85,0.14],[0.95,0.08]].forEach(([px,py]) => {
      kgStar(ctx, W*px, H*py, 5, '#fff9c4');
    });
    // Birds
    ctx.strokeStyle='rgba(0,0,0,0.5)'; ctx.lineWidth=1.5;
    [[0.3,0.18],[0.38,0.14],[0.42,0.2]].forEach(([px,py]) => {
      ctx.beginPath(); ctx.moveTo(W*px,H*py); ctx.quadraticCurveTo(W*(px+0.02),H*(py-0.02),W*(px+0.04),H*py); ctx.stroke();
    });
  }
}

/* ================================================================
   APP REGISTRATION & CONTROLLER
   ================================================================ */
OS.registerApp('kidstagram', {
  singleInstance: true,

  getWindowOpts() {
    return {
      id: 'kidstagram',
      title: 'Kidstagram',
      icon: '📸',
      width: 460,
      height: 580,
      content: this.getHTML(),
    };
  },

  getHTML() {
    return `
    <div class="kg-wrap">
      <!-- Top nav -->
      <div class="kg-nav">
        <span class="kg-nav-logo">📸 Kidstagram</span>
        <span class="kg-nav-count" id="kg-like-total"></span>
      </div>
      <!-- Stories -->
      <div class="kg-stories" id="kg-stories"></div>
      <!-- Feed -->
      <div class="kg-feed" id="kg-feed"></div>
    </div>`;
  },

  onOpen()  { KidsGram.init(); },
  onClose() {},
});

/* ---- App controller ---- */
const KidsGram = (() => {
  const STORE = 'kidsOS_kidstagram';
  let state = {};   // { liked: Set, comments: { id: [...extra] } }

  function loadState() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE) || '{}');
      state.liked    = new Set(s.liked || []);
      state.comments = s.comments || {};
    } catch(e) {
      state.liked = new Set();
      state.comments = {};
    }
  }

  function saveState() {
    localStorage.setItem(STORE, JSON.stringify({
      liked: [...state.liked],
      comments: state.comments,
    }));
  }

  function init() {
    loadState();
    setTimeout(() => {
      renderStories();
      renderFeed();
      updateLikeTotal();
    }, 40);
  }

  /* ---- Stories ---- */
  function renderStories() {
    const wrap = document.getElementById('kg-stories');
    if (!wrap) return;
    const users = Object.entries(KG_USERS);
    wrap.innerHTML = users.map(([name, u]) => `
      <div class="kg-story">
        <div class="kg-story-ring">
          <div class="kg-story-av" style="background:${u.color}">${u.av}</div>
        </div>
        <div class="kg-story-name">${name.replace('_',' ')}</div>
      </div>`).join('');
  }

  /* ---- Feed ---- */
  function renderFeed() {
    const feed = document.getElementById('kg-feed');
    if (!feed) return;
    feed.innerHTML = '';

    KG_POSTS.forEach(post => {
      const u = KG_USERS[post.user];
      const liked = state.liked.has(post.id);
      const extraComments = state.comments[post.id] || [];
      const allComments = [...post.comments, ...extraComments];
      const likeCount = post.likes + (liked ? 1 : 0);

      const card = document.createElement('div');
      card.className = 'kg-post';
      card.id = 'kg-post-' + post.id;
      card.innerHTML = `
        <div class="kg-post-header">
          <div class="kg-post-av" style="background:${u.color}">${u.av}</div>
          <div class="kg-post-info">
            <div class="kg-post-username">${post.user.replace('_',' ')}</div>
            <div class="kg-post-time">${post.time}</div>
          </div>
          <span class="kg-post-type-badge kg-type-${post.type}">${
            {drawing:'🎨 Drawing',pet:'🐾 Pet',game:'🎮 Game',outdoor:'🌳 Outdoor'}[post.type]
          }</span>
        </div>
        <div class="kg-img-wrap">
          <canvas class="kg-canvas" id="kg-canvas-${post.id}" width="440" height="240"></canvas>
        </div>
        <div class="kg-actions">
          <button class="kg-like-btn ${liked?'liked':''}" onclick="KidsGram.toggleLike(${post.id})">
            ${liked?'❤️':'🤍'} <span id="kg-lc-${post.id}">${likeCount}</span>
          </button>
          <button class="kg-comment-toggle" onclick="KidsGram.toggleComments(${post.id})">
            💬 ${allComments.length}
          </button>
        </div>
        <div class="kg-caption">
          <b>${post.user.replace('_',' ')}</b> ${post.caption}
          <span class="kg-tags">${post.tags}</span>
        </div>
        <div class="kg-comments" id="kg-comments-${post.id}" style="display:none">
          <div class="kg-comments-list" id="kg-cl-${post.id}">
            ${allComments.map(c => `
              <div class="kg-comment">
                <span class="kg-comment-av">${KG_USERS[c.u]?.av||'😊'}</span>
                <span><b>${c.u.replace('_',' ')}</b> ${c.t}</span>
              </div>`).join('')}
          </div>
          <div class="kg-comment-input-row">
            <input class="kg-comment-input" id="kg-ci-${post.id}" placeholder="Add a comment… 😊"
                   onkeydown="if(event.key==='Enter') KidsGram.addComment(${post.id})">
            <button class="kg-comment-send" onclick="KidsGram.addComment(${post.id})">Post</button>
          </div>
        </div>`;
      feed.appendChild(card);
    });

    // Draw canvases after render
    requestAnimationFrame(() => {
      KG_POSTS.forEach(post => {
        const canvas = document.getElementById('kg-canvas-' + post.id);
        if (canvas) kgDraw(canvas, post.type, post.seed);
      });
    });
  }

  function toggleLike(id) {
    const post = KG_POSTS.find(p => p.id === id);
    if (!post) return;
    const btn  = document.querySelector(`#kg-post-${id} .kg-like-btn`);
    const cnt  = document.getElementById('kg-lc-' + id);
    const liked = state.liked.has(id);

    if (liked) {
      state.liked.delete(id);
      btn.classList.remove('liked');
      btn.innerHTML = `🤍 <span id="kg-lc-${id}">${post.likes}</span>`;
    } else {
      state.liked.add(id);
      btn.classList.add('liked');
      btn.innerHTML = `❤️ <span id="kg-lc-${id}">${post.likes + 1}</span>`;
      // Heart burst animation
      btn.style.transform = 'scale(1.4)';
      setTimeout(() => btn.style.transform = '', 200);
    }
    saveState();
    updateLikeTotal();
  }

  function toggleComments(id) {
    const box = document.getElementById('kg-comments-' + id);
    if (!box) return;
    const open = box.style.display !== 'none';
    box.style.display = open ? 'none' : 'block';
    if (!open) {
      const input = document.getElementById('kg-ci-' + id);
      if (input) setTimeout(() => input.focus(), 50);
    }
  }

  function addComment(id) {
    const input = document.getElementById('kg-ci-' + id);
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    const s = OS.getSettings();
    const username = (s.username || 'Me').replace(/\s/g,'_');

    if (!state.comments[id]) state.comments[id] = [];
    state.comments[id].push({ u: username, t: text });
    saveState();

    const list = document.getElementById('kg-cl-' + id);
    if (list) {
      const div = document.createElement('div');
      div.className = 'kg-comment kg-comment-new';
      div.innerHTML = `<span class="kg-comment-av">😊</span><span><b>${username}</b> ${text}</span>`;
      list.appendChild(div);
      list.scrollTop = list.scrollHeight;
    }
    // Update comment count button
    const btn = document.querySelector(`#kg-post-${id} .kg-comment-toggle`);
    if (btn) {
      const total = (KG_POSTS.find(p=>p.id===id)?.comments.length||0) + (state.comments[id]?.length||0);
      btn.textContent = `💬 ${total}`;
    }
  }

  function updateLikeTotal() {
    const el = document.getElementById('kg-like-total');
    if (el) el.textContent = state.liked.size > 0 ? `❤️ ${state.liked.size}` : '';
  }

  return { init, toggleLike, toggleComments, addComment };
})();
