(function () {
  const CATEGORY_ORDER = [
    "Strong/Smooth",
    "Strong/Sharp",
    "Medium/Smooth",
    "Medium/Sharp",
    "Weak/Smooth",
    "Weak/Sharp",
    "Urethane",
    "Urethane-Like"
  ];

  const CATEGORY_ICONS = {
    "Strong/Smooth": "🟦",
    "Strong/Sharp": "🟥",
    "Medium/Smooth": "🟩",
    "Medium/Sharp": "🟪",
    "Weak/Smooth": "🟨",
    "Weak/Sharp": "🟧",
    "Urethane": "⚪",
    "Urethane-Like": "⚫"
  };

  const BAG_TEMPLATES = {
    3: [
      { label: "Benchmark Ball", category: "Medium/Smooth" },
      { label: "Downlane / Angular Ball", category: "Strong/Sharp" },
      { label: "Weaker / Late Transition Ball", category: "Weak/Sharp" }
    ],
    6: [
      { label: "Heavy Oil Control", category: "Strong/Smooth" },
      { label: "Strong Angular", category: "Strong/Sharp" },
      { label: "Benchmark", category: "Medium/Smooth" },
      { label: "Middle Transition", category: "Medium/Sharp" },
      { label: "Burn / Late Transition", category: "Weak/Sharp" },
      { label: "Short / Control Option", category: "Urethane" }
    ],
    9: [
      { label: "Heavy Oil Control", category: "Strong/Smooth" },
      { label: "Heavy Oil Angular", category: "Strong/Sharp" },
      { label: "Benchmark 1", category: "Medium/Smooth" },
      { label: "Benchmark 2 / Control", category: "Medium/Smooth" },
      { label: "Transition Smooth", category: "Weak/Smooth" },
      { label: "Transition Angular", category: "Medium/Sharp" },
      { label: "Burn Ball", category: "Weak/Sharp" },
      { label: "Urethane Option", category: "Urethane" },
      { label: "Urethane-Like Control", category: "Urethane-Like" }
    ]
  };

  const CATEGORY_FLEX = {
    "Strong/Smooth": ["Medium/Smooth", "Strong/Sharp"],
    "Strong/Sharp": ["Medium/Sharp", "Strong/Smooth", "Weak/Sharp"],
    "Medium/Smooth": ["Weak/Smooth", "Medium/Sharp", "Strong/Smooth"],
    "Medium/Sharp": ["Strong/Sharp", "Weak/Sharp", "Medium/Smooth"],
    "Weak/Smooth": ["Medium/Smooth", "Weak/Sharp", "Urethane-Like"],
    "Weak/Sharp": ["Medium/Sharp", "Strong/Sharp", "Weak/Smooth"],
    "Urethane": ["Urethane-Like", "Weak/Smooth"],
    "Urethane-Like": ["Urethane", "Weak/Smooth", "Medium/Smooth"]
  };

  const PATTERN_PROFILES = {
    house: {
      title: "Typical House Shot",
      preferred: ["Medium/Smooth", "Medium/Sharp", "Weak/Sharp"],
      label: "Most house conditions usually reward benchmark reads first, then a cleaner angular option later."
    },
    short: {
      title: "Short Pattern",
      preferred: ["Urethane", "Urethane-Like", "Weak/Smooth"],
      label: "Shorter patterns usually call for control, earlier roll, and keeping the ball in front of you."
    },
    "sport-medium": {
      title: "Medium Sport Pattern",
      preferred: ["Medium/Smooth", "Strong/Smooth", "Urethane"],
      label: "Medium sport patterns usually favor control and readable motion before adding shape."
    },
    long: {
      title: "Long / Heavy Pattern",
      preferred: ["Strong/Smooth", "Strong/Sharp", "Medium/Smooth"],
      label: "Longer or heavier patterns usually need stronger traction and a ball that can continue through the pins."
    },
    burn: {
      title: "Burn / Late Block",
      preferred: ["Weak/Sharp", "Weak/Smooth", "Urethane-Like"],
      label: "When the lane opens up or dries out, cleaner and weaker pieces often separate themselves."
    }
  };

  let allBalls = [];

  function getAllBalls() {
    return allBalls;
  }

  function setAllBalls(nextBalls) {
    allBalls = Array.isArray(nextBalls) ? nextBalls : [];
    window.allBalls = allBalls;
  }

  function createCustomBallId() {
    return `custom-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  }

  function hydrateBall(rawBall) {
  const brand =
    rawBall.brand ||
    rawBall.Brand ||
    "Unknown";

  const ballName =
    rawBall.ball_name ||
    rawBall.Ball_Name ||
    rawBall["Ball Name"] ||
    "Unknown Ball";

  const category =
    rawBall.category ||
    rawBall.Category ||
    "Unknown";

  const image =
    rawBall.image ||
    rawBall.Image ||
    rawBall.image_url ||
    rawBall.Image_URL ||
    "";

  const coreType =
    rawBall.core_type ||
    rawBall.Core_Type ||
    rawBall["Core Type"] ||
    "";

  const coverType =
    rawBall.cover_type ||
    rawBall.Cover_Type ||
    rawBall["Cover Type"] ||
    "";

  const rg =
    rawBall.rg ||
    rawBall.RG ||
    "";

  const differential =
    rawBall.differential ||
    rawBall.Differential ||
    "";

  const intermediateDiff =
    rawBall.intermediate_diff ||
    rawBall.Intermediate_Diff ||
    rawBall["Intermediate Diff"] ||
    rawBall["Intermediate Differential"] ||
    "";

  const id =
    rawBall.id ||
    `${brand}-${ballName}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return {
    id,
    brand,
    ball_name: ballName,
    category,
    core_type: coreType,
    cover_type: coverType,
    rg,
    differential,
    intermediate_diff: intermediateDiff,
    image,
    isCustom: Boolean(rawBall.isCustom)
  };
}

  function mergeAllBalls(baseBalls, customBalls) {
    return [
      ...(Array.isArray(baseBalls) ? baseBalls : []).map(hydrateBall),
      ...(Array.isArray(customBalls) ? customBalls : []).map(hydrateBall)
    ];
  }

  function getCustomBalls() {
    if (typeof window.getCustomBallsStorage === "function") {
      return window.getCustomBallsStorage();
    }
    return JSON.parse(localStorage.getItem("customBalls") || "[]");
  }

  function saveCustomBalls(customBalls) {
    if (typeof window.saveCustomBallsStorage === "function") {
      window.saveCustomBallsStorage(customBalls);
      return;
    }
    localStorage.setItem("customBalls", JSON.stringify(customBalls));
  }

  async function loadBalls() {
    const response = await fetch("balls.json");
    const baseBalls = await response.json();
    const customBalls = getCustomBalls();
    setAllBalls(mergeAllBalls(baseBalls, customBalls));
    return allBalls;
  }

  function getBallById(ballId) {
    const arsenal =
      typeof window.BallBrainArsenal?.getArsenal === "function"
        ? window.BallBrainArsenal.getArsenal()
        : JSON.parse(localStorage.getItem("arsenal") || "[]");

    return (
      allBalls.find(ball => ball.id === ballId) ||
      arsenal.find(ball => ball.id === ballId) ||
      null
    );
  }

  function normalizeBrandClass(brand) {
    return `brand-${String(brand || "unknown")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}`;
  }

  window.CATEGORY_ORDER = CATEGORY_ORDER;
  window.CATEGORY_ICONS = CATEGORY_ICONS;
  window.BAG_TEMPLATES = BAG_TEMPLATES;
  window.CATEGORY_FLEX = CATEGORY_FLEX;
  window.PATTERN_PROFILES = PATTERN_PROFILES;

  window.allBalls = allBalls;

  window.getAllBalls = getAllBalls;
  window.setAllBalls = setAllBalls;
  window.createCustomBallId = createCustomBallId;
  window.hydrateBall = hydrateBall;
  window.mergeAllBalls = mergeAllBalls;
  window.getCustomBalls = getCustomBalls;
  window.saveCustomBalls = saveCustomBalls;
  window.loadBalls = loadBalls;
  window.getBallById = getBallById;
  window.normalizeBrandClass = normalizeBrandClass;
})();