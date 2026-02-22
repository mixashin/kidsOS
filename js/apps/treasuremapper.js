/* ===== Treasure Mapper — Parody Maps App ===== */
(() => {
  /* ---- Data Constants ---- */
  const LOCATIONS = [
    { id: 'pillowfort', name: 'The Grand Pillow Fort', emoji: '\u{1F3F0}', category: 'Forts', status: 'Open \u2022 Fluffy',
      desc: 'A legendary fortress built from 847 pillows. Rumor has it, no parent has ever breached its walls.',
      reviews: [
        { user: 'SirNapsALot', stars: 5, text: 'Best nap of my life. 10/10 would pillow again.' },
        { user: 'FortInspector42', stars: 4, text: 'Structural integrity is questionable but the vibes are immaculate.' },
        { user: 'BlanketBoss', stars: 5, text: 'Added my blanket. Now it\'s a pillow-blanket hybrid fortress.' },
      ] },
    { id: 'fridgemore', name: 'Mount Fridgemore', emoji: '\u{1F9CA}', category: 'Landmarks', status: 'Open \u2022 Cold',
      desc: 'A towering fridge carved with the faces of legendary snack presidents. Always cold. Always judging your food choices.',
      reviews: [
        { user: 'SnackHiker', stars: 5, text: 'The view from the top shelf is breathtaking.' },
        { user: 'CheeseExplorer', stars: 4, text: 'Found ancient cheese. Carbon dating says it\'s from last Tuesday.' },
        { user: 'IceCubeKid', stars: 3, text: 'Too cold. Wore three jackets. Would come back.' },
      ] },
    { id: 'couchcanyon', name: 'Couch Cushion Canyon', emoji: '\u{1F6CB}\uFE0F', category: 'Nature', status: 'Open \u2022 Squishy',
      desc: 'A vast canyon formed between couch cushions. Home to lost remote controls, 47 coins, and one very confused sock.',
      reviews: [
        { user: 'CanyonCrawler', stars: 5, text: 'Found my TV remote from 2019. Life-changing expedition.' },
        { user: 'PennyHunter', stars: 4, text: 'Rich vein of loose change in the east cushion.' },
        { user: 'DustBunnyFan', stars: 5, text: 'The dust bunnies here are ENORMOUS. Beautiful wildlife.' },
      ] },
    { id: 'skybase', name: 'Sky Base Alpha', emoji: '\u{1F333}', category: 'Bases', status: 'Open \u2022 High Up',
      desc: 'A treehouse so high, birds ask for directions. Features a rope ladder, lookout tower, and a "No Adults" sign.',
      reviews: [
        { user: 'TreeTopTom', stars: 5, text: 'I can see my house from here. Also my neighbor\'s cat.' },
        { user: 'RopeLadderPro', stars: 4, text: 'The climb is worth it. Bring snacks.' },
        { user: 'BirdWatcher99', stars: 5, text: 'A bird tried to move in. We now have a roommate.' },
      ] },
    { id: 'sanddesert', name: 'The Great Sand Desert', emoji: '\u{1F3D6}\uFE0F', category: 'Nature', status: 'Open \u2022 Sandy',
      desc: 'Also known as "the sandbox." Stretches an entire 6 feet across. Many explorers have gotten sand in their shoes here.',
      reviews: [
        { user: 'SandCastleKing', stars: 5, text: 'Built a 3-story castle. It was glorious for 4 minutes.' },
        { user: 'DesertSurvivor', stars: 4, text: 'Ran out of juice boxes on the expedition. Nearly didn\'t make it.' },
        { user: 'ShoeSandHater', stars: 3, text: 'Sand. In. Everything. Still had fun though.' },
      ] },
    { id: 'garage', name: 'The Forbidden Garage', emoji: '\u{1F527}', category: 'Mystery', status: 'Restricted \u2022 Spooky',
      desc: 'Nobody knows what lurks in the back of the garage. Some say tools. Some say spiders. Some say both.',
      reviews: [
        { user: 'BraveExplorer', stars: 4, text: 'Found dad\'s "secret" candy stash behind the toolbox.' },
        { user: 'SpiderScout', stars: 3, text: 'The spider in the corner is named Gerald. He\'s chill.' },
        { user: 'GarageMyth', stars: 5, text: 'There\'s a bicycle from 1997 in there. It\'s a museum.' },
      ] },
    { id: 'bubblebath', name: 'Lake Bubble Bath', emoji: '\u{1F6C1}', category: 'Water', status: 'Open \u2022 Bubbly',
      desc: 'A serene lake filled entirely with bubbles. Visibility: zero. Fun: maximum. Pruney fingers: guaranteed.',
      reviews: [
        { user: 'BubbleCaptain', stars: 5, text: 'Sailed my rubber duck across the entire lake. Epic voyage.' },
        { user: 'SplashKid', stars: 5, text: 'Made a bubble beard. Became the bubble king.' },
        { user: 'PruneThumb', stars: 4, text: 'My fingers look like raisins now. Worth it.' },
      ] },
    { id: 'narniacloset', name: 'The Narnia Closet', emoji: '\u{1F6AA}', category: 'Mystery', status: 'Open \u2022 Magical',
      desc: 'Step through the coats and you might find a magical land. Or just more coats. Results vary.',
      reviews: [
        { user: 'CoatExplorer', stars: 5, text: 'Didn\'t find Narnia but found my winter jacket. Win!' },
        { user: 'MagicSeeker', stars: 4, text: 'Thought I heard a lion. It was the cat.' },
        { user: 'ClosetKid', stars: 5, text: 'Best hiding spot during hide and seek. Undefeated.' },
      ] },
    { id: 'wildbackyard', name: 'The Wild Backyard', emoji: '\u{1F33F}', category: 'Nature', status: 'Open \u2022 Untamed',
      desc: 'A wilderness of unmowed grass, mysterious bugs, and at least one garden gnome with a suspicious expression.',
      reviews: [
        { user: 'BugCollector', stars: 5, text: 'Found 14 different bugs. Named them all Steve.' },
        { user: 'GnomeWatcher', stars: 4, text: 'That gnome moved. I SWEAR it moved.' },
        { user: 'GrassExplorer', stars: 5, text: 'The tall grass section is basically a jungle safari.' },
      ] },
    { id: 'underbedabyss', name: 'The Underbed Abyss', emoji: '\u{1F6CF}\uFE0F', category: 'Mystery', status: 'Open \u2022 Dark',
      desc: 'A vast, dark void beneath the bed. Contains: missing socks, forgotten toys, and possibly a portal to another dimension.',
      reviews: [
        { user: 'AbyssDiver', stars: 5, text: 'Found my favorite toy from 3 years ago. Emotional reunion.' },
        { user: 'DustExplorer', stars: 3, text: 'The dust bunnies have formed a civilization down here.' },
        { user: 'SockDetective', stars: 4, text: 'Found 23 missing socks. The mystery deepens.' },
      ] },
    { id: 'confroomk', name: 'Conference Room K', emoji: '\u{1F37D}\uFE0F', category: 'Food', status: 'Open \u2022 Delicious',
      desc: 'The kitchen table, rebranded as a very important conference room. All meetings involve cookies.',
      reviews: [
        { user: 'CookieChief', stars: 5, text: 'Best conference ever. Agenda: cookies. Minutes: delicious.' },
        { user: 'MeetingKid', stars: 5, text: 'Proposed more snack breaks. Motion passed unanimously.' },
        { user: 'TableBoss', stars: 4, text: 'The chair is too tall but the cookies make up for it.' },
      ] },
    { id: 'swingstation', name: 'Swing Set Space Station', emoji: '\u{1F3A2}', category: 'Bases', status: 'Open \u2022 Orbiting',
      desc: 'Pump your legs hard enough and you\'ll reach outer space. Scientists say this is false. Scientists are wrong.',
      reviews: [
        { user: 'SpaceSwinger', stars: 5, text: 'Almost touched the sky. My personal best: 47 degrees.' },
        { user: 'OrbitKid', stars: 5, text: 'I definitely left Earth\'s atmosphere for a second there.' },
        { user: 'SwingPhysics', stars: 4, text: 'Gravity is just a suggestion when you swing high enough.' },
      ] },
  ];

  const ROUTE_TYPES = [
    { id: 'sneaky', name: 'Sneaky Route', emoji: '\u{1F977}', desc: 'Tiptoe past sleeping parents. Avoid creaky floorboards.' },
    { id: 'silly', name: 'Silly Walk Route', emoji: '\u{1F92A}', desc: 'Ministry-approved silly walks only. No normal steps allowed.' },
    { id: 'zoom', name: 'Zoom Zoom Route', emoji: '\u{1F3CE}\uFE0F', desc: 'MAXIMUM SPEED. Run everywhere. Slide on socks.' },
    { id: 'scenic', name: 'Scenic Snack Route', emoji: '\u{1F36A}', desc: 'Stops at every snack location on the way. Scenic AND delicious.' },
    { id: 'tunnel', name: 'Secret Tunnel Route', emoji: '\u{1F573}\uFE0F', desc: 'Through blanket tunnels, under tables, behind curtains.' },
  ];

  const VOICES = [
    { id: 'pirate', name: 'Captain Blunderpants', emoji: '\u{1F3F4}\u200D\u2620\uFE0F',
      steps: [
        'Arrr! Set sail straight ahead, ye landlubber! Past the kitchen reef!',
        'Hard to port! That means LEFT, ya soggy biscuit!',
        'Avast! Navigate \'round the laundry pile — there be socks of doom!',
        'Steady as she goes! The treasure be closer, I can smell it! ...Wait, that\'s lunch.',
        'SHARP STARBOARD! That\'s RIGHT for ye non-pirate folk!',
        'Sail through the hallway strait! Mind the cat — she be guarding the passage!',
        'Land ho! Yer destination be right ahead! Drop anchor, matey!',
      ] },
    { id: 'robot', name: 'NavBot 3000', emoji: '\u{1F916}',
      steps: [
        'BEEP BOOP. Proceed forward 12.7 steps. Error margin: plus or minus a wiggle.',
        'CALCULATING... Turn left. LEFT. Your OTHER left. RECALCULATING.',
        'OBSTACLE DETECTED. Recommend evasive maneuver around the toy pile. BEEP.',
        'ROUTE OPTIMAL. Continue straight. Fun levels: increasing. BZZZT.',
        'WARNING: Right turn required. Executing turn.exe... Turn complete. BEEP BOOP.',
        'SCANNING HALLWAY... Clear of hostiles. Proceed with caution. Or don\'t. I\'m a robot.',
        'DESTINATION REACHED. Mission complete. NavBot 3000 powering down celebration mode. PARTY BEEP.',
      ] },
    { id: 'unicorn', name: 'Sparkle McHorn', emoji: '\u{1F984}',
      steps: [
        'OMG hi! Go straight and follow the sparkle trail! It\'s SO pretty! \u2728',
        'Ooh ooh! Turn left here! I left some glitter as a marker! You\'re welcome! \u{1F496}',
        'Watch out for that thing! Jump over it with GRACE and SPARKLES! Wheee!',
        'Keep going, bestie! You\'re doing AMAZING! I believe in you SO much! \u{1F308}',
        'Twirl to the right! Everything is better when you twirl! MAGICAL! \u2728',
        'Almost there! I can feel the rainbow energy getting STRONGER! Gallop faster!',
        'WE MADE IT! Group hug! That was the most magical journey EVER! \u{1F31F}',
      ] },
    { id: 'dramatic', name: 'Sir Overly Dramatic', emoji: '\u{1F3AD}',
      steps: [
        '*gasp* The journey BEGINS! Step forward... into the UNKNOWN! *dramatic music*',
        'A CROSSROADS! Choose LEFT or face eternal— just go left, honestly.',
        'BEWARE! An obstacle of TERRIFYING proportions! (It\'s a shoe.) DRAMATIC DODGE!',
        'Onward, brave soul! Through the VALLEY OF SHADOWS! (The hallway. It\'s the hallway.)',
        'A turn to the RIGHT! Destiny DEMANDS it! *cape swoosh*',
        'The final stretch! Can you FEEL the DRAMA?! The TENSION?! THE SUSPENSE?!',
        'You have ARRIVED! *falls to knees* What a JOURNEY! What a TALE! *single tear*',
      ] },
  ];

  const HAZARDS = [
    { emoji: '\u{1F408}', name: 'Cat Blockade', msg: 'A cat is sitting in the middle of the path. It will not move. Ever.' },
    { emoji: '\u{1F9F1}', name: 'Lego Minefield', msg: 'WARNING: Loose Legos detected. Proceed barefoot at your own risk.' },
    { emoji: '\u{1F9E6}', name: 'Sock Storm', msg: 'A whirlwind of lost socks is blocking the route. Visibility: one sock.' },
    { emoji: '\u{1F6BF}', name: 'Sprinkler Ambush', msg: 'The garden sprinkler has gone rogue. It shows no mercy.' },
    { emoji: '\u{1F4A4}', name: 'Sleeping Parent Zone', msg: 'Extreme quiet required. One creak and it\'s all over.' },
    { emoji: '\u{1F9F9}', name: 'Vacuum Monster Sighting', msg: 'The vacuum has been spotted nearby. RUN.' },
    { emoji: '\u{1F436}', name: 'Excited Dog Alert', msg: 'A very excited dog wants to play RIGHT NOW. Delay expected: 20 min.' },
    { emoji: '\u{1F50A}', name: 'Sibling Radar Active', msg: 'Your sibling knows where you\'re going. Evasive maneuvers advised.' },
  ];

  const TRAFFIC_UPDATES = [
    '\u{1F6A7} Heavy toy traffic on the hallway. Expect delays of 2 giggles.',
    '\u{1F408} Cat congestion near the kitchen. All routes rerouted through the bathroom.',
    '\u{1F9F9} Vacuum monster spotted on Route 3. Seek alternate silly walk path.',
    '\u26A0\uFE0F Lego spill on the living room floor. Barefoot travelers beware!',
    '\u{1F4A8} Strong sock winds from the laundry room. Hold onto your hat.',
    '\u{1F3C3} Speed record broken! Someone ran the hallway in 2.3 seconds!',
    '\u{1F36A} Snack truck overturned near the pantry. Free cookies for everyone!',
    '\u{1F6CC} Nap zone ahead. Volume must be kept to whisper levels.',
  ];

  const BADGES = [
    { id: 'compass', name: 'Compass Boss', emoji: '\u{1F9ED}', condition: s => s.totalTrips >= 1 },
    { id: 'captain', name: 'Captain of Directions', emoji: '\u2693', condition: s => s.totalTrips >= 3 },
    { id: 'explorer', name: 'Grand Explorer', emoji: '\u{1F30D}', condition: s => s.visitedPlaces.length >= 4 },
    { id: 'globetrotter', name: 'Globetrotter', emoji: '\u{1F30F}', condition: s => s.visitedPlaces.length >= 8 },
    { id: 'treasure', name: 'Treasure Hunter', emoji: '\u{1F48E}', condition: s => s.completedHunts >= 1 },
    { id: 'coins', name: 'Map Millionaire', emoji: '\u{1F4B0}', condition: s => s.mapCoins >= 500 },
    { id: 'allroutes', name: 'Route Master', emoji: '\u{1F6E3}\uFE0F', condition: s => s.completedRoutes.length >= 5 },
    { id: 'sneaker', name: 'Sneaker View Pro', emoji: '\u{1F45F}', condition: s => s.totalTrips >= 5 },
  ];

  const DAILY_QUESTS = [
    { emoji: '\u{1F3F0}', task: 'Visit any Forts location', check: s => s.visitedPlaces.some(p => LOCATIONS.find(l => l.id === p && l.category === 'Forts')) },
    { emoji: '\u{1F50D}', task: 'Navigate using the Secret Tunnel Route', check: s => s.completedRoutes.some(r => r.route === 'tunnel') },
    { emoji: '\u{1F984}', task: 'Use Sparkle McHorn as your navigator', check: s => s.completedRoutes.some(r => r.voice === 'unicorn') },
    { emoji: '\u{1F30F}', task: 'Visit 2 different places today', check: s => s.visitedPlaces.length >= 2 },
    { emoji: '\u{1F3F4}\u200D\u2620\uFE0F', task: 'Complete a navigation with Captain Blunderpants', check: s => s.completedRoutes.some(r => r.voice === 'pirate') },
  ];

  const EXPLORE_CATEGORIES = [
    { name: 'Best Hiding Spots', emoji: '\u{1F648}', filter: l => ['pillowfort', 'narniacloset', 'underbedabyss'].includes(l.id) },
    { name: 'Snack Routes', emoji: '\u{1F36A}', filter: l => ['confroomk', 'fridgemore', 'couchcanyon'].includes(l.id) },
    { name: 'Outdoor Adventures', emoji: '\u{1F333}', filter: l => ['skybase', 'sanddesert', 'wildbackyard', 'swingstation'].includes(l.id) },
    { name: 'Spooky Places', emoji: '\u{1F47B}', filter: l => ['garage', 'underbedabyss', 'narniacloset'].includes(l.id) },
    { name: 'Water World', emoji: '\u{1F30A}', filter: l => ['bubblebath', 'sanddesert'].includes(l.id) },
    { name: 'Top Rated', emoji: '\u2B50', filter: () => true },
  ];

  const TREASURE_TYPES = [
    { emoji: '\u{1F48E}', name: 'Diamond of Destiny' },
    { emoji: '\u{1F451}', name: 'Golden Crown' },
    { emoji: '\u{1F36B}', name: 'Chocolate Treasure Chest' },
    { emoji: '\u{1F3C6}', name: 'Trophy of Awesomeness' },
    { emoji: '\u{1F52E}', name: 'Magic Crystal Ball' },
    { emoji: '\u{1F30C}', name: 'Star Map Fragment' },
  ];

  const CLUE_TEMPLATES = [
    'Look under the ___ near the ___',
    'Turn left at the ___ and count 3 steps',
    'Find the ___ that looks like a ___',
    'The next clue is hidden where ___ meets ___',
    'Crawl past the ___ and look up',
    'Spin around twice near the ___ then look down',
  ];

  const SNEAKER_SCENES = [
    { name: 'Pillow Fort Street', elements: ['\u{1F6CB}\uFE0F', '\u{1F3F0}', '\u{1F6CF}\uFE0F', '\u{1F9F8}', '\u{1F6CB}\uFE0F', '\u{1F3F0}', '\u{1F4A4}', '\u{1F6CB}\uFE0F'] },
    { name: 'Kitchen Highway', elements: ['\u{1F9CA}', '\u{1F37D}\uFE0F', '\u{1F373}', '\u{1F36A}', '\u{1F9CA}', '\u{1F37D}\uFE0F', '\u{1F4A7}', '\u{1F373}'] },
    { name: 'Backyard Wilderness', elements: ['\u{1F333}', '\u{1F33F}', '\u{1F41B}', '\u{1F33A}', '\u{1F333}', '\u{1F33F}', '\u2600\uFE0F', '\u{1F33A}'] },
    { name: 'Garage Cave', elements: ['\u{1F527}', '\u{1F6B2}', '\u{1F578}\uFE0F', '\u{1F4E6}', '\u{1F527}', '\u{1F6B2}', '\u{1F526}', '\u{1F4E6}'] },
    { name: 'Bathroom Bay', elements: ['\u{1F6C1}', '\u{1F9F4}', '\u{1F9BD}', '\u{1F9FC}', '\u{1F6C1}', '\u{1F9F4}', '\u{1FAE7}', '\u{1F9FC}'] },
    { name: 'Bedroom Galaxy', elements: ['\u{1F6CF}\uFE0F', '\u{1F9F8}', '\u{1F319}', '\u2B50', '\u{1F6CF}\uFE0F', '\u{1F9F8}', '\u{1F30C}', '\u2B50'] },
  ];

  const BANNER_TIPS = [
    '\u{1F4A1} TIP: Silly Walk Route burns 200% more giggles per step!',
    '\u{1F5FA}\uFE0F FUN FACT: The Underbed Abyss has never been fully mapped.',
    '\u{1F3F0} NEWS: Grand Pillow Fort added a second floor!',
    '\u{1F9ED} PRO TIP: Save places to your list for quick navigation later.',
    '\u{1F3F4}\u200D\u2620\uFE0F ALERT: Captain Blunderpants lost his map again.',
    '\u2728 UPDATE: Sparkle McHorn added extra sparkle to all routes!',
    '\u{1F916} PATCH: NavBot 3000 now 12% less confused by left and right.',
    '\u{1F3AD} REVIEW: Sir Overly Dramatic rated all places "MAGNIFICENT."',
  ];

  /* ---- Helpers ---- */
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function $(sel) { return body ? body.querySelector(sel) : null; }

  /* ---- State ---- */
  let winId = null;
  let body = null;
  let screen = 'home';
  let selectedPlace = null;
  let selectedRoute = null;
  let selectedVoice = null;
  let navStep = 0;
  let searchQuery = '';
  let currentHunt = null;
  let huntStep = 0;
  let sneakerSceneIdx = 0;
  let sneakerSpinning = false;
  let bannerIdx = 0;
  let bannerInterval = null;
  let trafficIdx = 0;
  let exploreCategory = null;

  // Persisted
  let persisted = {
    mapCoins: 0,
    badges: [],
    visitedPlaces: [],
    completedRoutes: [],
    treasureHunts: [],
    savedLists: [],
    totalTrips: 0,
    completedHunts: 0,
  };

  function loadState() {
    try {
      const raw = localStorage.getItem('kidsOS_treasuremapper');
      if (raw) persisted = { ...persisted, ...JSON.parse(raw) };
    } catch (e) { /* ignore */ }
  }

  function saveState() {
    localStorage.setItem('kidsOS_treasuremapper', JSON.stringify(persisted));
  }

  /* ---- Badge Checking ---- */
  function checkBadges() {
    const newBadges = [];
    for (const b of BADGES) {
      if (!persisted.badges.includes(b.id) && b.condition(persisted)) {
        persisted.badges.push(b.id);
        newBadges.push(b);
      }
    }
    return newBadges;
  }

  /* ---- Global Handlers ---- */
  window._tmGo = function(s, data) {
    screen = s;
    if (data !== undefined) {
      if (s === 'place') selectedPlace = LOCATIONS.find(l => l.id === data);
      if (s === 'explore') exploreCategory = data !== null ? EXPLORE_CATEGORIES[data] : null;
    }
    render();
  };

  window._tmSearch = function(val) {
    searchQuery = val.toLowerCase();
    render();
  };

  window._tmSelectRoute = function(id) {
    selectedRoute = id;
    render();
  };

  window._tmSelectVoice = function(id) {
    selectedVoice = id;
    render();
  };

  window._tmStartNav = function() {
    if (!selectedRoute) selectedRoute = ROUTE_TYPES[0].id;
    if (!selectedVoice) selectedVoice = VOICES[0].id;
    navStep = 0;
    screen = 'navigation';
    render();
  };

  window._tmNextStep = function() {
    const voice = VOICES.find(v => v.id === selectedVoice);
    if (navStep < voice.steps.length - 1) {
      navStep++;
      render();
    } else {
      // Arrived!
      const coins = 30 + Math.floor(Math.random() * 30);
      persisted.mapCoins += coins;
      persisted.totalTrips++;
      if (selectedPlace && !persisted.visitedPlaces.includes(selectedPlace.id)) {
        persisted.visitedPlaces.push(selectedPlace.id);
      }
      persisted.completedRoutes.push({
        place: selectedPlace ? selectedPlace.id : '?',
        route: selectedRoute,
        voice: selectedVoice,
        time: Date.now(),
      });
      if (persisted.completedRoutes.length > 5) {
        persisted.completedRoutes = persisted.completedRoutes.slice(-5);
      }
      const newBadges = checkBadges();
      saveState();
      screen = 'arrived';
      window._tmArrivedData = { coins, newBadges };
      render();
    }
  };

  window._tmSavePlace = function(id) {
    if (!persisted.savedLists.includes(id)) {
      persisted.savedLists.push(id);
      saveState();
    }
    render();
  };

  window._tmRemovePlace = function(id) {
    persisted.savedLists = persisted.savedLists.filter(p => p !== id);
    saveState();
    render();
  };

  // Treasure Hunt creator
  window._tmHuntNext = function() {
    huntStep++;
    render();
  };

  window._tmHuntBack = function() {
    if (huntStep > 0) { huntStep--; render(); }
  };

  window._tmHuntStart = function() {
    currentHunt = { name: '', startPlace: null, clues: [], treasureType: null };
    huntStep = 0;
    screen = 'treasure';
    render();
  };

  window._tmHuntSetName = function(val) {
    if (currentHunt) currentHunt.name = val;
  };

  window._tmHuntSetStart = function(id) {
    if (currentHunt) { currentHunt.startPlace = id; render(); }
  };

  window._tmHuntAddClue = function(idx) {
    if (currentHunt && currentHunt.clues.length < 3) {
      currentHunt.clues.push(CLUE_TEMPLATES[idx]);
      render();
    }
  };

  window._tmHuntRemoveClue = function(idx) {
    if (currentHunt) { currentHunt.clues.splice(idx, 1); render(); }
  };

  window._tmHuntSetTreasure = function(idx) {
    if (currentHunt) { currentHunt.treasureType = idx; render(); }
  };

  window._tmHuntSave = function() {
    if (currentHunt && currentHunt.name && currentHunt.clues.length > 0 && currentHunt.treasureType !== null) {
      persisted.treasureHunts.push({
        name: currentHunt.name,
        startPlace: currentHunt.startPlace,
        clues: [...currentHunt.clues],
        treasure: TREASURE_TYPES[currentHunt.treasureType],
        created: Date.now(),
      });
      persisted.completedHunts++;
      persisted.mapCoins += 50;
      checkBadges();
      saveState();
      screen = 'home';
      render();
    }
  };

  // Sneaker View
  window._tmSvLeft = function() {
    sneakerSceneIdx = (sneakerSceneIdx - 1 + SNEAKER_SCENES.length) % SNEAKER_SCENES.length;
    render();
  };

  window._tmSvRight = function() {
    sneakerSceneIdx = (sneakerSceneIdx + 1) % SNEAKER_SCENES.length;
    render();
  };

  window._tmSvSpin = function() {
    sneakerSpinning = true;
    render();
    setTimeout(() => { sneakerSpinning = false; render(); }, 1500);
  };

  /* ---- Screen Renderers ---- */
  function render() {
    if (!body) return;
    switch (screen) {
      case 'home': renderHome(); break;
      case 'place': renderPlace(); break;
      case 'routes': renderRoutes(); break;
      case 'navigation': renderNavigation(); break;
      case 'arrived': renderArrived(); break;
      case 'treasure': renderTreasure(); break;
      case 'sneakerview': renderSneakerView(); break;
      case 'explore': renderExplore(); break;
      case 'lists': renderLists(); break;
      case 'vault': renderVault(); break;
    }
  }

  function renderHome() {
    const places = searchQuery
      ? LOCATIONS.filter(l => l.name.toLowerCase().includes(searchQuery))
      : LOCATIONS.slice(0, 6);
    const earnedBadges = BADGES.filter(b => persisted.badges.includes(b.id));
    body.innerHTML = `
      <div class="tm-wrap">
        <div class="tm-header">
          <span class="tm-logo">\u{1F5FA}\uFE0F Treasure Mapper</span>
          <span class="tm-coins">\u{1FA99} ${persisted.mapCoins}</span>
        </div>
        <div class="tm-content">
          <div class="tm-search-wrap">
            <input class="tm-search" type="text" placeholder="\u{1F50D} Search silly places..."
              value="${searchQuery}" oninput="window._tmSearch(this.value)">
          </div>
          <div class="tm-places-grid">
            ${places.map(l => `
              <div class="tm-place-card" onclick="window._tmGo('place','${l.id}')">
                <div class="tm-place-card-emoji">${l.emoji}</div>
                <div class="tm-place-card-name">${l.name}</div>
                <div class="tm-place-card-status">${l.status}</div>
              </div>
            `).join('')}
          </div>
          ${!searchQuery ? `
          <div class="tm-quick-row">
            <button class="tm-quick-btn" onclick="window._tmGo('explore', null)">
              <span>\u{1F30D}</span> Explore
            </button>
            <button class="tm-quick-btn" onclick="window._tmHuntStart()">
              <span>\u{1F4DC}</span> Treasure Hunt
            </button>
            <button class="tm-quick-btn" onclick="window._tmGo('sneakerview')">
              <span>\u{1F45F}</span> Sneaker View
            </button>
          </div>
          <div class="tm-bottom-row">
            <button class="tm-bottom-btn" onclick="window._tmGo('lists')">
              \u{1F4CB} My Lists
            </button>
            <button class="tm-bottom-btn" onclick="window._tmGo('vault')">
              \u{1F3C6} Vault
            </button>
          </div>
          <div class="tm-banner" id="tm-banner">${BANNER_TIPS[bannerIdx]}</div>
          <div class="tm-traffic">${TRAFFIC_UPDATES[trafficIdx]}</div>
          ${earnedBadges.length > 0 ? `<div class="tm-badges-row">${earnedBadges.map(b => `<span class="tm-badge-small" title="${b.name}">${b.emoji}</span>`).join('')}</div>` : ''}
          ` : ''}
        </div>
      </div>`;
  }

  function renderPlace() {
    if (!selectedPlace) { screen = 'home'; render(); return; }
    const p = selectedPlace;
    const hazard = pick(HAZARDS);
    const isSaved = persisted.savedLists.includes(p.id);
    body.innerHTML = `
      <div class="tm-wrap">
        <div class="tm-header">
          <button class="tm-back" onclick="window._tmGo('home')">\u2190</button>
          <span class="tm-header-title">${p.name}</span>
          <span></span>
        </div>
        <div class="tm-content">
          <div class="tm-place-hero">
            <div class="tm-place-hero-emoji">${p.emoji}</div>
            <div class="tm-place-hero-status">${p.status}</div>
          </div>
          <div class="tm-place-desc">${p.desc}</div>
          <div class="tm-action-row">
            <button class="tm-action-btn tm-action-navigate" onclick="window._tmGo('routes')">
              \u{1F9ED} Navigate
            </button>
            <button class="tm-action-btn tm-action-save" onclick="window._tm${isSaved ? 'Remove' : 'Save'}Place('${p.id}')">
              ${isSaved ? '\u2705 Saved' : '\u{1F4BE} Save'}
            </button>
            <button class="tm-action-btn tm-action-sv" onclick="window._tmGo('sneakerview')">
              \u{1F45F} Sneaker View
            </button>
          </div>
          <div class="tm-hazard">
            <span class="tm-hazard-emoji">${hazard.emoji}</span>
            <div class="tm-hazard-info">
              <div class="tm-hazard-name">\u26A0\uFE0F ${hazard.name}</div>
              <div class="tm-hazard-msg">${hazard.msg}</div>
            </div>
          </div>
          <div class="tm-reviews-title">\u2B50 Reviews</div>
          ${p.reviews.map(r => `
            <div class="tm-review">
              <div class="tm-review-header">
                <span class="tm-review-user">${r.user}</span>
                <span class="tm-review-stars">${'\u2B50'.repeat(r.stars)}</span>
              </div>
              <div class="tm-review-text">${r.text}</div>
            </div>
          `).join('')}
        </div>
      </div>`;
  }

  function renderRoutes() {
    if (!selectedPlace) { screen = 'home'; render(); return; }
    if (!selectedRoute) selectedRoute = ROUTE_TYPES[0].id;
    if (!selectedVoice) selectedVoice = VOICES[0].id;
    body.innerHTML = `
      <div class="tm-wrap">
        <div class="tm-header">
          <button class="tm-back" onclick="window._tmGo('place','${selectedPlace.id}')">\u2190</button>
          <span class="tm-header-title">Choose Route</span>
          <span></span>
        </div>
        <div class="tm-content">
          <div class="tm-dest-banner">
            <span>${selectedPlace.emoji}</span> ${selectedPlace.name}
          </div>
          <div class="tm-section-label">Route</div>
          <div class="tm-routes-list">
            ${ROUTE_TYPES.map(r => `
              <div class="tm-route-card ${selectedRoute === r.id ? 'tm-route-selected' : ''}"
                   onclick="window._tmSelectRoute('${r.id}')">
                <div class="tm-route-emoji">${r.emoji}</div>
                <div class="tm-route-info">
                  <div class="tm-route-name">${r.name}</div>
                  <div class="tm-route-desc">${r.desc}</div>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="tm-section-label">Navigator Voice</div>
          <div class="tm-voice-row">
            ${VOICES.map(v => `
              <button class="tm-voice-btn ${selectedVoice === v.id ? 'tm-voice-selected' : ''}"
                      onclick="window._tmSelectVoice('${v.id}')">
                <span>${v.emoji}</span>
                <small>${v.name.split(' ')[0]}</small>
              </button>
            `).join('')}
          </div>
          <button class="tm-start-btn" onclick="window._tmStartNav()">
            \u{1F680} Start Navigation
          </button>
        </div>
      </div>`;
  }

  function renderNavigation() {
    const voice = VOICES.find(v => v.id === selectedVoice);
    const route = ROUTE_TYPES.find(r => r.id === selectedRoute);
    if (!voice || !route) { screen = 'home'; render(); return; }
    const progress = ((navStep + 1) / voice.steps.length) * 100;
    const showHazard = navStep === 2 || navStep === 4;
    const hazard = showHazard ? pick(HAZARDS) : null;
    body.innerHTML = `
      <div class="tm-wrap">
        <div class="tm-header tm-header-nav">
          <span class="tm-header-title">${route.emoji} ${route.name}</span>
          <span class="tm-nav-step-count">Step ${navStep + 1}/${voice.steps.length}</span>
        </div>
        <div class="tm-content">
          <div class="tm-nav-progress">
            <div class="tm-nav-progress-bar tm-pulse" style="width:${progress}%"></div>
          </div>
          <div class="tm-nav-voice-info">
            <div class="tm-nav-voice-avatar">${voice.emoji}</div>
            <div class="tm-nav-voice-name">${voice.name}</div>
          </div>
          <div class="tm-nav-instruction">
            ${voice.steps[navStep]}
          </div>
          ${hazard ? `
          <div class="tm-nav-hazard">
            <span>${hazard.emoji}</span> ${hazard.name}: ${hazard.msg}
          </div>` : ''}
          <button class="tm-next-btn" onclick="window._tmNextStep()">
            ${navStep < voice.steps.length - 1 ? '\u27A1\uFE0F Next Step' : '\u{1F3C1} Arrive!'}
          </button>
          <div class="tm-traffic tm-traffic-nav">${pick(TRAFFIC_UPDATES)}</div>
        </div>
      </div>`;
  }

  function renderArrived() {
    const data = window._tmArrivedData || { coins: 0, newBadges: [] };
    const place = selectedPlace;
    const route = ROUTE_TYPES.find(r => r.id === selectedRoute);
    const voice = VOICES.find(v => v.id === selectedVoice);
    body.innerHTML = `
      <div class="tm-wrap">
        <div class="tm-content tm-arrived">
          <div class="tm-arrived-emoji tm-bounce">${place ? place.emoji : '\u{1F389}'}</div>
          <div class="tm-arrived-title">You Made It!</div>
          <div class="tm-arrived-place">${place ? place.name : 'Destination'}</div>
          <div class="tm-arrived-details">
            ${route ? `<span>${route.emoji} ${route.name}</span>` : ''}
            ${voice ? `<span>${voice.emoji} ${voice.name}</span>` : ''}
          </div>
          <div class="tm-arrived-coins">\u{1FA99} +${data.coins} Map Coins!</div>
          ${data.newBadges.length > 0 ? `
            <div class="tm-arrived-badges">
              <div>New Badges!</div>
              ${data.newBadges.map(b => `<div class="tm-new-badge">${b.emoji} ${b.name}</div>`).join('')}
            </div>` : ''}
          <button class="tm-start-btn" onclick="window._tmGo('home')">
            \u{1F3E0} Done
          </button>
        </div>
      </div>`;
  }

  function renderTreasure() {
    if (!currentHunt) { screen = 'home'; render(); return; }
    const steps = ['Name & Start', 'Add Clues', 'Pick Treasure', 'Summary'];
    body.innerHTML = `
      <div class="tm-wrap">
        <div class="tm-header">
          <button class="tm-back" onclick="${huntStep > 0 ? 'window._tmHuntBack()' : "window._tmGo('home')"}">\u2190</button>
          <span class="tm-header-title">Treasure Hunt</span>
          <span></span>
        </div>
        <div class="tm-content">
          <div class="tm-hunt-step-indicator">
            ${steps.map((s, i) => `<span class="tm-hunt-dot ${i === huntStep ? 'tm-hunt-dot-active' : (i < huntStep ? 'tm-hunt-dot-done' : '')}">${i + 1}</span>`).join('')}
          </div>
          <div class="tm-hunt-step-title">${steps[huntStep]}</div>
          ${renderTreasureStep()}
        </div>
      </div>`;
  }

  function renderTreasureStep() {
    switch (huntStep) {
      case 0: return `
        <div class="tm-hunt-field">
          <label>Hunt Name</label>
          <input class="tm-input" type="text" placeholder="e.g. Super Secret Treasure Hunt"
            value="${currentHunt.name}" oninput="window._tmHuntSetName(this.value)">
        </div>
        <div class="tm-hunt-field">
          <label>Starting Place</label>
          <div class="tm-hunt-places">
            ${LOCATIONS.slice(0, 6).map(l => `
              <button class="tm-treasure-btn ${currentHunt.startPlace === l.id ? 'tm-treasure-btn-active' : ''}"
                      onclick="window._tmHuntSetStart('${l.id}')">
                ${l.emoji} ${l.name.split(' ').slice(0, 2).join(' ')}
              </button>
            `).join('')}
          </div>
        </div>
        <button class="tm-start-btn" onclick="window._tmHuntNext()" ${!currentHunt.name ? 'disabled' : ''}>
          Next \u27A1\uFE0F
        </button>`;
      case 1: return `
        <div class="tm-hunt-field">
          <label>Clues (${currentHunt.clues.length}/3)</label>
          ${currentHunt.clues.map((c, i) => `
            <div class="tm-clue-item">
              <span>\u{1F4DC} ${c}</span>
              <button class="tm-clue-remove" onclick="window._tmHuntRemoveClue(${i})">\u2716</button>
            </div>
          `).join('')}
          ${currentHunt.clues.length < 3 ? `
          <div class="tm-clue-templates">
            ${CLUE_TEMPLATES.map((c, i) => `
              <button class="tm-treasure-btn" onclick="window._tmHuntAddClue(${i})">+ ${c}</button>
            `).join('')}
          </div>` : ''}
        </div>
        <button class="tm-start-btn" onclick="window._tmHuntNext()" ${currentHunt.clues.length === 0 ? 'disabled' : ''}>
          Next \u27A1\uFE0F
        </button>`;
      case 2: return `
        <div class="tm-hunt-field">
          <label>Choose Treasure</label>
          <div class="tm-treasure-grid">
            ${TREASURE_TYPES.map((t, i) => `
              <button class="tm-treasure-pick ${currentHunt.treasureType === i ? 'tm-treasure-pick-active' : ''}"
                      onclick="window._tmHuntSetTreasure(${i})">
                <span class="tm-treasure-pick-emoji">${t.emoji}</span>
                <span class="tm-treasure-pick-name">${t.name}</span>
              </button>
            `).join('')}
          </div>
        </div>
        <button class="tm-start-btn" onclick="window._tmHuntNext()" ${currentHunt.treasureType === null ? 'disabled' : ''}>
          Next \u27A1\uFE0F
        </button>`;
      case 3: {
        const startLoc = LOCATIONS.find(l => l.id === currentHunt.startPlace);
        const treasure = currentHunt.treasureType !== null ? TREASURE_TYPES[currentHunt.treasureType] : null;
        return `
        <div class="tm-hunt-summary">
          <div class="tm-hunt-summary-row">
            <strong>Name:</strong> ${currentHunt.name || 'Unnamed Hunt'}
          </div>
          <div class="tm-hunt-summary-row">
            <strong>Start:</strong> ${startLoc ? startLoc.emoji + ' ' + startLoc.name : 'Not set'}
          </div>
          <div class="tm-hunt-summary-row">
            <strong>Clues:</strong> ${currentHunt.clues.length}
          </div>
          <div class="tm-hunt-summary-row">
            <strong>Treasure:</strong> ${treasure ? treasure.emoji + ' ' + treasure.name : 'Not set'}
          </div>
        </div>
        <button class="tm-start-btn" onclick="window._tmHuntSave()">
          \u{1F4BE} Save Treasure Hunt (+50 coins!)
        </button>`;
      }
      default: return '';
    }
  }

  function renderSneakerView() {
    const scene = SNEAKER_SCENES[sneakerSceneIdx];
    body.innerHTML = `
      <div class="tm-wrap">
        <div class="tm-header">
          <button class="tm-back" onclick="window._tmGo('home')">\u2190</button>
          <span class="tm-header-title">\u{1F45F} Sneaker View</span>
          <span></span>
        </div>
        <div class="tm-content">
          <div class="tm-sv-title">${scene.name}</div>
          <div class="tm-sv-view ${sneakerSpinning ? 'tm-sv-spinning' : ''}">
            <div class="tm-sv-scene">
              ${scene.elements.map(e => `<span class="tm-sv-element">${e}</span>`).join('')}
            </div>
          </div>
          <div class="tm-sv-controls">
            <button class="tm-sv-arrow" onclick="window._tmSvLeft()">\u2B05\uFE0F</button>
            <button class="tm-sv-spin" onclick="window._tmSvSpin()">\u{1F300} Spin!</button>
            <button class="tm-sv-arrow" onclick="window._tmSvRight()">\u27A1\uFE0F</button>
          </div>
          <div class="tm-sv-dots">
            ${SNEAKER_SCENES.map((_, i) => `<span class="tm-sv-dot ${i === sneakerSceneIdx ? 'tm-sv-dot-active' : ''}"></span>`).join('')}
          </div>
        </div>
      </div>`;
  }

  function renderExplore() {
    if (!exploreCategory) {
      // Show category list
      body.innerHTML = `
        <div class="tm-wrap">
          <div class="tm-header">
            <button class="tm-back" onclick="window._tmGo('home')">\u2190</button>
            <span class="tm-header-title">Explore</span>
            <span></span>
          </div>
          <div class="tm-content">
            <div class="tm-explore-grid">
              ${EXPLORE_CATEGORIES.map((c, i) => `
                <div class="tm-explore-card" onclick="window._tmGo('explore', ${i})">
                  <div class="tm-explore-emoji">${c.emoji}</div>
                  <div class="tm-explore-name">${c.name}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>`;
    } else {
      const filtered = LOCATIONS.filter(exploreCategory.filter);
      body.innerHTML = `
        <div class="tm-wrap">
          <div class="tm-header">
            <button class="tm-back" onclick="window._tmGo('explore', null)">\u2190</button>
            <span class="tm-header-title">${exploreCategory.emoji} ${exploreCategory.name}</span>
            <span></span>
          </div>
          <div class="tm-content">
            <div class="tm-places-grid tm-places-grid-full">
              ${filtered.map(l => `
                <div class="tm-place-card" onclick="window._tmGo('place','${l.id}')">
                  <div class="tm-place-card-emoji">${l.emoji}</div>
                  <div class="tm-place-card-name">${l.name}</div>
                  <div class="tm-place-card-status">${l.status}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>`;
    }
  }

  function renderLists() {
    const savedPlaces = persisted.savedLists.map(id => LOCATIONS.find(l => l.id === id)).filter(Boolean);
    body.innerHTML = `
      <div class="tm-wrap">
        <div class="tm-header">
          <button class="tm-back" onclick="window._tmGo('home')">\u2190</button>
          <span class="tm-header-title">My Lists</span>
          <span></span>
        </div>
        <div class="tm-content">
          <div class="tm-section-label">\u{1F4CD} Saved Places</div>
          ${savedPlaces.length > 0 ? savedPlaces.map(l => `
            <div class="tm-list-item" onclick="window._tmGo('place','${l.id}')">
              <span class="tm-list-emoji">${l.emoji}</span>
              <span class="tm-list-name">${l.name}</span>
              <button class="tm-list-remove" onclick="event.stopPropagation();window._tmRemovePlace('${l.id}')">\u2716</button>
            </div>
          `).join('') : '<div class="tm-empty">No saved places yet. Explore and save some!</div>'}
          <div class="tm-section-label" style="margin-top:16px">\u{1F4DC} Treasure Hunts</div>
          ${persisted.treasureHunts.length > 0 ? persisted.treasureHunts.map(h => `
            <div class="tm-list-item">
              <span class="tm-list-emoji">${h.treasure.emoji}</span>
              <span class="tm-list-name">${h.name}</span>
              <span class="tm-list-clues">${h.clues.length} clues</span>
            </div>
          `).join('') : '<div class="tm-empty">No treasure hunts created yet.</div>'}
        </div>
      </div>`;
  }

  function renderVault() {
    const quest = DAILY_QUESTS[new Date().getDate() % DAILY_QUESTS.length];
    const questDone = quest.check(persisted);
    const recentTrips = persisted.completedRoutes.slice().reverse();
    body.innerHTML = `
      <div class="tm-wrap">
        <div class="tm-header">
          <button class="tm-back" onclick="window._tmGo('home')">\u2190</button>
          <span class="tm-header-title">\u{1F3C6} Vault</span>
          <span></span>
        </div>
        <div class="tm-content">
          <div class="tm-vault-stats">
            <div class="tm-vault-stat">
              <div class="tm-vault-stat-num">${persisted.totalTrips}</div>
              <div class="tm-vault-stat-label">Trips</div>
            </div>
            <div class="tm-vault-stat">
              <div class="tm-vault-stat-num">\u{1FA99} ${persisted.mapCoins}</div>
              <div class="tm-vault-stat-label">Coins</div>
            </div>
            <div class="tm-vault-stat">
              <div class="tm-vault-stat-num">${persisted.visitedPlaces.length}</div>
              <div class="tm-vault-stat-label">Places</div>
            </div>
          </div>
          <div class="tm-section-label">\u{1F4CB} Daily Quest</div>
          <div class="tm-quest-card ${questDone ? 'tm-quest-done' : ''}">
            <span>${quest.emoji}</span>
            <span>${quest.task}</span>
            <span>${questDone ? '\u2705' : '\u{1F6AB}'}</span>
          </div>
          <div class="tm-section-label">\u{1F396}\uFE0F Badges</div>
          <div class="tm-vault-badges">
            ${BADGES.map(b => {
              const earned = persisted.badges.includes(b.id);
              return `<div class="tm-vault-badge ${earned ? '' : 'tm-badge-locked'}" title="${b.name}">
                <div>${earned ? b.emoji : '\u{1F512}'}</div>
                <small>${b.name}</small>
              </div>`;
            }).join('')}
          </div>
          ${recentTrips.length > 0 ? `
          <div class="tm-section-label">\u{1F5FA}\uFE0F Recent Trips</div>
          ${recentTrips.map(t => {
            const place = LOCATIONS.find(l => l.id === t.place);
            const route = ROUTE_TYPES.find(r => r.id === t.route);
            return `<div class="tm-trip-card">
              <span>${place ? place.emoji : '\u{1F4CD}'}</span>
              <span>${place ? place.name : 'Unknown'}</span>
              <span>${route ? route.emoji : ''}</span>
            </div>`;
          }).join('')}` : ''}
        </div>
      </div>`;
  }

  /* ---- App Registration ---- */
  OS.registerApp('treasuremapper', {
    singleInstance: true,
    getWindowOpts() {
      return { id: 'treasuremapper', title: 'Treasure Mapper', icon: '\u{1F5FA}\uFE0F', width: 440, height: 560, content: '' };
    },
    onOpen(id) {
      winId = id;
      body = document.getElementById('win-body-' + id);
      loadState();
      screen = 'home';
      searchQuery = '';
      selectedPlace = null;
      selectedRoute = null;
      selectedVoice = null;
      navStep = 0;
      currentHunt = null;
      huntStep = 0;
      sneakerSceneIdx = 0;
      sneakerSpinning = false;
      exploreCategory = null;
      bannerIdx = Math.floor(Math.random() * BANNER_TIPS.length);
      trafficIdx = Math.floor(Math.random() * TRAFFIC_UPDATES.length);
      render();

      bannerInterval = setInterval(() => {
        bannerIdx = (bannerIdx + 1) % BANNER_TIPS.length;
        const el = body ? body.querySelector('#tm-banner') : null;
        if (el) el.textContent = BANNER_TIPS[bannerIdx];
        trafficIdx = (trafficIdx + 1) % TRAFFIC_UPDATES.length;
        const tel = body ? body.querySelector('.tm-traffic:not(.tm-traffic-nav)') : null;
        if (tel) tel.textContent = TRAFFIC_UPDATES[trafficIdx];
      }, 6000);
    },
    onClose() {
      if (bannerInterval) { clearInterval(bannerInterval); bannerInterval = null; }
      body = null;
      winId = null;
    },
  });
})();
