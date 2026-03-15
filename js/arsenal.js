(function () {
  let arsenal =
    typeof window.getArsenalStorage === "function"
      ? window.getArsenalStorage()
      : JSON.parse(localStorage.getItem("arsenal") || "[]");

  let ballNotes =
    typeof window.getBallNotesStorage === "function"
      ? window.getBallNotesStorage()
      : JSON.parse(localStorage.getItem("ballNotes") || "{}");

  let expandedArsenalCards = new Set();

  function saveArsenal() {
    if (typeof window.saveArsenalStorage === "function") {
      window.saveArsenalStorage(arsenal);
    } else {
      localStorage.setItem("arsenal", JSON.stringify(arsenal));
    }
  }

  function saveBallNotes() {
    if (typeof window.saveBallNotesStorage === "function") {
      window.saveBallNotesStorage(ballNotes);
    } else {
      localStorage.setItem("ballNotes", JSON.stringify(ballNotes));
    }
  }

  function getArsenal() {
    return arsenal;
  }

  function setArsenal(nextArsenal) {
    arsenal = Array.isArray(nextArsenal) ? nextArsenal : [];
    saveArsenal();
  }

  function getBallNotes() {
    return ballNotes;
  }

  function getExpandedArsenalCards() {
    return expandedArsenalCards;
  }

  function getBallNoteData(ballId) {
    return ballNotes[ballId] || {
      surface: "",
      layout: "",
      notes: ""
    };
  }

  function updateBallNoteField(ballId, field, value) {
    const existing = getBallNoteData(ballId);

    ballNotes[ballId] = {
      ...existing,
      [field]: value
    };

    saveBallNotes();
  }

  function addToArsenal(ballId) {
    const ball =
      typeof window.getBallById === "function"
        ? window.getBallById(ballId)
        : (Array.isArray(window.allBalls) ? window.allBalls : []).find(item => item.id === ballId);

    if (!ball) return;

    if (arsenal.some(item => item.id === ball.id)) {
      if (typeof window.showToast === "function") {
        window.showToast("That ball is already in your arsenal.", "warn");
      }
      return;
    }

    arsenal.push(ball);
    saveArsenal();

    if (typeof window.renderBallList === "function") window.renderBallList();
    renderArsenal();
    if (typeof window.renderRecommendations === "function") window.renderRecommendations();
    if (typeof window.buildBag === "function") window.buildBag();
    if (typeof window.runPurchaseAdvisor === "function") window.runPurchaseAdvisor();
    if (typeof window.renderStats === "function") window.renderStats();

    if (typeof window.showToast === "function") {
      window.showToast(`${ball.brand} ${ball.ball_name} added to arsenal.`, "success");
    }
  }

  function removeFromArsenal(ballId) {
    arsenal = arsenal.filter(ball => ball.id !== ballId);
    delete ballNotes[ballId];
    expandedArsenalCards.delete(ballId);

    saveBallNotes();
    saveArsenal();

    if (Array.isArray(window.compareSelection)) {
      window.compareSelection = window.compareSelection.filter(id => id !== ballId);
    }

    if (Array.isArray(window.purchaseSelection)) {
      window.purchaseSelection = window.purchaseSelection.filter(id => id !== ballId);
    }

    if (typeof window.renderBallList === "function") window.renderBallList();
    renderArsenal();
    if (typeof window.renderRecommendations === "function") window.renderRecommendations();
    if (typeof window.buildBag === "function") window.buildBag();
    if (typeof window.runPurchaseAdvisor === "function") window.runPurchaseAdvisor();
    if (typeof window.renderStats === "function") window.renderStats();
    if (typeof window.updateCompareBar === "function") window.updateCompareBar();
    if (typeof window.updatePurchaseBar === "function") window.updatePurchaseBar();
    if (typeof window.renderComparison === "function") window.renderComparison();

    if (typeof window.showToast === "function") {
      window.showToast("Ball removed from arsenal.", "warn");
    }
  }

  function clearArsenal() {
    arsenal = [];
    ballNotes = {};
    expandedArsenalCards = new Set();

    saveBallNotes();
    saveArsenal();

    if (Array.isArray(window.compareSelection)) window.compareSelection = [];
    if (Array.isArray(window.purchaseSelection)) window.purchaseSelection = [];

    if (typeof window.renderBallList === "function") window.renderBallList();
    renderArsenal();
    if (typeof window.renderRecommendations === "function") window.renderRecommendations();
    if (typeof window.buildBag === "function") window.buildBag();
    if (typeof window.runPurchaseAdvisor === "function") window.runPurchaseAdvisor();
    if (typeof window.renderStats === "function") window.renderStats();
    if (typeof window.renderComparison === "function") window.renderComparison();
    if (typeof window.updateCompareBar === "function") window.updateCompareBar();
    if (typeof window.updatePurchaseBar === "function") window.updatePurchaseBar();

    if (typeof window.showToast === "function") {
      window.showToast("Arsenal cleared.", "warn");
    }
  }

  function toggleArsenalCard(ballId) {
    if (expandedArsenalCards.has(ballId)) {
      expandedArsenalCards.delete(ballId);
    } else {
      expandedArsenalCards.add(ballId);
    }

    renderArsenal();
  }

  function getArsenalCoverage() {
    const categoryOrder = window.CATEGORY_ORDER || [];
    const counts = {};

    categoryOrder.forEach(category => {
      counts[category] = 0;
    });

    arsenal.forEach(ball => {
      if (!counts[ball.category]) counts[ball.category] = 0;
      counts[ball.category] += 1;
    });

    return counts;
  }

  function getArsenalScoreData() {
    const coverage = getArsenalCoverage();
    const categoryOrder = window.CATEGORY_ORDER || [];

    const ownedCategories = Object.entries(coverage).filter(([, count]) => count > 0).length;
    const overlaps = Object.entries(coverage).filter(([, count]) => count > 2);
    const benchmarkCount = coverage["Medium/Smooth"] || 0;
    const controlCount =
      (coverage["Strong/Smooth"] || 0) +
      (coverage["Urethane"] || 0) +
      (coverage["Urethane-Like"] || 0);
    const transitionCount =
      (coverage["Medium/Sharp"] || 0) +
      (coverage["Weak/Sharp"] || 0) +
      (coverage["Weak/Smooth"] || 0);

    let score = 30;
    score += ownedCategories * 7;
    if (benchmarkCount > 0) score += 8;
    if (controlCount > 0) score += 7;
    if (transitionCount > 0) score += 7;
    score -= overlaps.length * 4;

    score = Math.max(0, Math.min(100, score));

    let headline = "Developing Arsenal";
    if (score >= 85) headline = "Tournament Ready Arsenal";
    else if (score >= 70) headline = "Well Rounded Arsenal";
    else if (score >= 55) headline = "Solid Core Arsenal";

    const strengths = [];
    const weaknesses = [];

    if (benchmarkCount > 0) strengths.push("Benchmark coverage present");
    else weaknesses.push("No clear benchmark ball");

    if ((coverage["Strong/Smooth"] || 0) > 0) strengths.push("Strong control option available");
    else weaknesses.push("No strong smooth control ball");

    if ((coverage["Weak/Sharp"] || 0) > 0 || (coverage["Medium/Sharp"] || 0) > 0) {
      strengths.push("Downlane shape available");
    } else {
      weaknesses.push("No clean angular transition option");
    }

    categoryOrder.forEach(category => {
      if ((coverage[category] || 0) === 0) weaknesses.push(`Missing ${category}`);
    });

    overlaps.forEach(([category, count]) => {
      weaknesses.push(`Heavy overlap in ${category} (${count})`);
    });

    return {
      score,
      headline,
      strengths: strengths.slice(0, 4),
      weaknesses: weaknesses.slice(0, 5),
      coverage
    };
  }

  function toggleArsenalScoreCard() {
    const card = document.getElementById("arsenalScoreCard");
    const expanded = document.getElementById("arsenalScoreExpanded");
    if (!card || !expanded) return;

    const isCollapsed = card.classList.contains("collapsed");
    card.classList.toggle("collapsed", !isCollapsed);
    expanded.classList.toggle("hidden", !isCollapsed);
  }

  function renderArsenalScoreCard() {
    const badge = document.getElementById("arsenalScoreBadge");
    const headline = document.getElementById("arsenalScoreHeadline");
    const expandedContent = document.getElementById("arsenalScoreExpandedContent");
    const categoryOrder = window.CATEGORY_ORDER || [];
    const categoryIcons = window.CATEGORY_ICONS || {};

    if (!badge || !headline || !expandedContent) return;

    if (!arsenal.length) {
      badge.textContent = "0";
      headline.textContent = "Build your arsenal to generate a score.";
      expandedContent.innerHTML = `<div class="empty-state">Add balls to your arsenal to see coverage, strengths, and gaps.</div>`;
      return;
    }

    const data = getArsenalScoreData();
    badge.textContent = data.score;
    headline.textContent = data.headline;

    expandedContent.innerHTML = `
      <div class="arsenal-score-columns">
        <div>
          <h4>Strengths</h4>
          <ul>${data.strengths.length ? data.strengths.map(item => `<li>${item}</li>`).join("") : `<li>No major strengths identified yet.</li>`}</ul>
        </div>
        <div>
          <h4>Weaknesses / Gaps</h4>
          <ul>${data.weaknesses.length ? data.weaknesses.map(item => `<li>${item}</li>`).join("") : `<li>No major weaknesses identified.</li>`}</ul>
        </div>
      </div>
      <div style="margin-top:16px;">
        <h4>Coverage Map</h4>
        <div class="coverage-grid">
          ${categoryOrder
            .map(category => {
              const count = data.coverage[category] || 0;
              return `
                <div class="coverage-cell ${count ? "covered" : "missing"}">
                  <div>${categoryIcons[category] || "•"} ${category}</div>
                  <div class="small-note">${count ? `${count} owned` : "Missing"}</div>
                </div>
              `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  function downloadArsenalScoreImage() {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1600;
  const ctx = canvas.getContext("2d");

  const data = getArsenalScoreData();
  const arsenalList = arsenal.map(ball => `${ball.brand} ${ball.ball_name}`);
  const arsenalCount = arsenal.length;

  // Background
  const bg = ctx.createLinearGradient(0, 0, canvas.width, 0);
  bg.addColorStop(0, "#020817");
  bg.addColorStop(0.5, "#03122b");
  bg.addColorStop(1, "#020817");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Helper: rounded rectangle
  function roundRect(x, y, w, h, r, fill = true, stroke = false) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  // Title
  ctx.fillStyle = "#f8fafc";
  ctx.font = "bold 64px Arial";
  ctx.textAlign = "center";
  ctx.fillText("BallBrain Arsenal Score", canvas.width / 2, 110);

  // Subtitle
  ctx.fillStyle = "#94a3b8";
  ctx.font = "42px Arial";
  ctx.fillText(`${arsenalCount} Ball${arsenalCount === 1 ? "" : "s"} in Arsenal`, canvas.width / 2, 170);

  // Score circle
  const scoreX = canvas.width / 2;
  const scoreY = 430;
  const scoreRadius = 165;

  // Outer glow ring
  ctx.beginPath();
  ctx.arc(scoreX, scoreY, scoreRadius + 10, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(148, 163, 184, 0.18)";
  ctx.fill();

  // Score circle fill
  let scoreColor = "#3b82f6";
  if (data.score >= 90) scoreColor = "#facc15";
  else if (data.score >= 75) scoreColor = "#22c55e";
  else if (data.score >= 60) scoreColor = "#3b82f6";
  else if (data.score >= 45) scoreColor = "#f97316";
  else scoreColor = "#ef4444";

  ctx.beginPath();
  ctx.arc(scoreX, scoreY, scoreRadius, 0, Math.PI * 2);
  ctx.fillStyle = scoreColor;
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 6;
  ctx.stroke();

  // Score text
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 120px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(data.score), scoreX, scoreY);

  ctx.textBaseline = "alphabetic";

  // Card styling
  const cardFill = "rgba(17, 24, 39, 0.88)";
  const cardStroke = "rgba(148, 163, 184, 0.08)";

  // Strengths / Weaknesses cards
  const cardY = 670;
  const cardW = 430;
  const cardH = 300;
  const leftX = 70;
  const rightX = 580;

  ctx.fillStyle = cardFill;
  ctx.strokeStyle = cardStroke;
  ctx.lineWidth = 2;
  roundRect(leftX, cardY, cardW, cardH, 24, true, true);
  roundRect(rightX, cardY, cardW, cardH, 24, true, true);

  // Section helper
  function drawSectionTitle(text, x, y) {
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 34px Arial";
    ctx.textAlign = "left";
    ctx.fillText(text, x, y);
  }

  function drawBullets(items, x, y, maxWidth, lineHeight, maxItems = 5) {
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "24px Arial";
    const shown = items.slice(0, maxItems);

    let currentY = y;

    shown.forEach(item => {
      const wrapped = wrapText(`• ${item}`, maxWidth, ctx);
      wrapped.forEach(line => {
        ctx.fillText(line, x, currentY);
        currentY += lineHeight;
      });
      currentY += 6;
    });

    if (items.length > maxItems) {
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(`• ...`, x, currentY);
    }
  }

  function wrapText(text, maxWidth, context) {
    const words = text.split(" ");
    const lines = [];
    let line = "";

    for (let i = 0; i < words.length; i++) {
      const testLine = line ? `${line} ${words[i]}` : words[i];
      const width = context.measureText(testLine).width;
      if (width > maxWidth && line) {
        lines.push(line);
        line = words[i];
      } else {
        line = testLine;
      }
    }

    if (line) lines.push(line);
    return lines;
  }

  drawSectionTitle("Strengths", leftX + 28, cardY + 52);
  drawSectionTitle("Weaknesses", rightX + 28, cardY + 52);

  drawBullets(data.strengths.length ? data.strengths : ["No major strengths identified yet."], leftX + 28, cardY + 105, cardW - 56, 36, 4);
  drawBullets(data.weaknesses.length ? data.weaknesses : ["No major weaknesses detected."], rightX + 28, cardY + 105, cardW - 56, 36, 4);

  // Arsenal card
  const arsenalCardY = 1015;
  const arsenalCardH = 430;

  ctx.fillStyle = cardFill;
  ctx.strokeStyle = cardStroke;
  roundRect(70, arsenalCardY, 940, arsenalCardH, 24, true, true);

  drawSectionTitle("My Arsenal", 100, arsenalCardY + 58);

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "24px Arial";
  ctx.textAlign = "left";

  const visibleItems = arsenalList.slice(0, 5);
  visibleItems.forEach((item, index) => {
    ctx.fillText(`• ${item}`, 100, arsenalCardY + 120 + index * 58);
  });

  if (arsenalList.length > 5) {
    ctx.fillStyle = "#94a3b8";
    ctx.fillText(`+ ${arsenalList.length - 5} more`, 100, arsenalCardY + 120 + visibleItems.length * 58 + 10);
  }

  // Bottom logo
  if (shareLogoImage) {
    const logoW = 420;
    const logoH = 120;
    const logoX = (canvas.width - logoW) / 2;
    const logoY = 1490;
    ctx.drawImage(shareLogoImage, logoX, logoY, logoW, logoH);
  } else {
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 54px Arial";
    ctx.textAlign = "center";
    ctx.fillText("BallBrain", canvas.width / 2, 1540);
  }

  // Export
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = "ballbrain-arsenal-score.png";
  link.click();
}


  function renderArsenal() {
    const arsenalContainer = document.getElementById("arsenalContainer");
    const arsenalCount = document.getElementById("arsenalCount");

    if (!arsenalContainer || !arsenalCount) return;

    arsenalCount.textContent = `${arsenal.length} ball${arsenal.length === 1 ? "" : "s"}`;
    renderArsenalScoreCard();

    if (!arsenal.length) {
      arsenalContainer.innerHTML = `<div class="empty-state">Your arsenal is empty. Add a ball from the Ball List tab.</div>`;
      return;
    }

    arsenalContainer.innerHTML = arsenal
      .map(ball => {
        const noteData = getBallNoteData(ball.id);
        const expanded = expandedArsenalCards.has(ball.id);
        const brandClass =
          typeof window.normalizeBrandClass === "function"
            ? window.normalizeBrandClass(ball.brand)
            : "";

        return `
          <div class="card arsenal-card">
            <img src="${ball.image || ""}" alt="${ball.ball_name}" onerror="this.src=''; this.alt='No image available';" />
            <span class="brand ${brandClass}">${ball.brand}</span>
            <h3>${ball.ball_name}</h3>
            <div class="small-note">${ball.category || "Unknown"}</div>
            <div class="card-actions">
              <button class="small-btn" onclick="toggleArsenalCard('${ball.id}')">${expanded ? "Hide Notes" : "Show Notes"}</button>
              <button class="small-btn danger" onclick="removeFromArsenal('${ball.id}')">Remove</button>
            </div>
            ${
              expanded
                ? `
              <div class="arsenal-notes-panel">
                <label>Surface</label>
                <input type="text" value="${noteData.surface}" oninput="updateBallNoteField('${ball.id}', 'surface', this.value)" />
                <label>Layout</label>
                <input type="text" value="${noteData.layout}" oninput="updateBallNoteField('${ball.id}', 'layout', this.value)" />
                <label>Notes</label>
                <textarea oninput="updateBallNoteField('${ball.id}', 'notes', this.value)">${noteData.notes}</textarea>
              </div>
            `
                : ""
            }
          </div>
        `;
      })
      .join("");
  }

    function renderCoverageMap() {
    const coverageMap = document.getElementById("coverageMap");
    if (!coverageMap) return;

    const categoryOrder = window.CATEGORY_ORDER || [];
    const categoryIcons = window.CATEGORY_ICONS || {};

    coverageMap.innerHTML = "";

    categoryOrder.forEach(category => {
      const matchingBalls = arsenal.filter(ball => ball.category === category);
      const count = matchingBalls.length;
      const isFilled = count > 0;
      const icon = categoryIcons[category] || "🎳";

      const tile = document.createElement("div");
      tile.className = `coverage-tile ${isFilled ? "filled" : "missing"}`;

      tile.innerHTML = `
        <div class="coverage-category">
          <span class="coverage-icon">${icon}</span>
          <span>${category}</span>
        </div>
        <div class="coverage-count">${count}</div>
        <div class="coverage-status">${isFilled ? "Covered" : "Missing"}</div>
        <div class="coverage-balls">
          ${
            isFilled
              ? matchingBalls.slice(0, 3).map(ball => ball.ball_name).join("<br>")
              : "No ball in this slot"
          }
        </div>
      `;

      coverageMap.appendChild(tile);
    });
  }

  function renderRadarLegend() {
    const legend = document.getElementById("radarLegend");
    if (!legend) return;

    const categoryOrder = window.CATEGORY_ORDER || [];
    const categoryIcons = window.CATEGORY_ICONS || {};

    legend.innerHTML = "";

    categoryOrder.forEach(category => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="legend-icon">${categoryIcons[category] || "🎳"}</span><span>${category}</span>`;
      legend.appendChild(li);
    });
  }

  function renderRadarChart() {
    const canvas = document.getElementById("arsenalRadar");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const categoryOrder = window.CATEGORY_ORDER || [];

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 180;
    const levels = 4;
    const maxValue = 3;

    const values = categoryOrder.map(category =>
      Math.min(arsenal.filter(ball => ball.category === category).length, maxValue)
    );

    for (let level = 1; level <= levels; level++) {
      const r = (radius / levels) * level;
      ctx.beginPath();

      categoryOrder.forEach((_, i) => {
        const angle = (-Math.PI / 2) + (i * 2 * Math.PI / categoryOrder.length);
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.closePath();
      ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    categoryOrder.forEach((category, i) => {
      const angle = (-Math.PI / 2) + (i * 2 * Math.PI / categoryOrder.length);
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();

      const labelX = centerX + Math.cos(angle) * (radius + 26);
      const labelY = centerY + Math.sin(angle) * (radius + 26);

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "13px Arial";
      ctx.textAlign = labelX < centerX - 10 ? "right" : labelX > centerX + 10 ? "left" : "center";
      ctx.fillText(category, labelX, labelY);
    });

    ctx.beginPath();
    categoryOrder.forEach((_, i) => {
      const angle = (-Math.PI / 2) + (i * 2 * Math.PI / categoryOrder.length);
      const scaled = (values[i] / maxValue) * radius;
      const x = centerX + Math.cos(angle) * scaled;
      const y = centerY + Math.sin(angle) * scaled;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = "rgba(59, 130, 246, 0.25)";
    ctx.strokeStyle = "rgba(96, 165, 250, 0.9)";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    categoryOrder.forEach((_, i) => {
      const angle = (-Math.PI / 2) + (i * 2 * Math.PI / categoryOrder.length);
      const scaled = (values[i] / maxValue) * radius;
      const x = centerX + Math.cos(angle) * scaled;
      const y = centerY + Math.sin(angle) * scaled;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#60a5fa";
      ctx.fill();
    });

    if (arsenal.length === 0) {
      ctx.fillStyle = "#9ca3af";
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Add balls to your arsenal to generate the radar.", centerX, centerY);
    }
  }

  function renderOverlapAnalysis() {
    const overlapResults = document.getElementById("overlapResults");
    if (!overlapResults) return;

    const categoryOrder = window.CATEGORY_ORDER || [];
    overlapResults.innerHTML = "";

    if (arsenal.length === 0) {
      overlapResults.innerHTML = `<div class="empty-state">Add balls to your arsenal to analyze overlap.</div>`;
      return;
    }

    const overlapCategories = categoryOrder
      .map(category => ({
        category,
        balls: arsenal.filter(ball => ball.category === category)
      }))
      .filter(group => group.balls.length >= 2);

    if (!overlapCategories.length) {
      overlapResults.innerHTML = `<div class="empty-state">No major category overlap detected.</div>`;
      return;
    }

    overlapCategories.forEach(group => {
      const div = document.createElement("div");
      div.className = "overlap-group";
      div.innerHTML = `
        <h4>${group.category}</h4>
        <p>${group.balls.length} balls in this slot.</p>
        <ul>
          ${group.balls.map(ball => `<li><strong>${ball.ball_name}</strong> — ${ball.brand}</li>`).join("")}
        </ul>
      `;
      overlapResults.appendChild(div);
    });
  }

  function renderRoleCards() {
    const roleCards = document.getElementById("roleCards");
    if (!roleCards) return;

    roleCards.innerHTML = "";

    if (arsenal.length === 0) {
      roleCards.innerHTML = `<div class="empty-state">Add balls to your arsenal to see role assignments.</div>`;
      return;
    }

    const getRoleBuckets =
      typeof window.getRoleBuckets === "function"
        ? window.getRoleBuckets
        : () => ({});

    const buckets = getRoleBuckets();
    const roleOrder = [
      "Benchmark",
      "Heavy Oil Control",
      "Big Motion / Create Angle",
      "Transition Angular",
      "Burn / Late Transition",
      "Short Pattern Control",
      "Control Reactive",
      "Late Block Control",
      "Burn / Downlane Shape",
      "General Purpose"
    ];

    roleOrder.forEach(role => {
      const balls = buckets[role] || [];
      const card = document.createElement("div");
      card.className = "role-card";

      card.innerHTML = `
        <h3>${role}</h3>
        ${
          balls.length
            ? `<ul>${balls.map(ball => `<li><strong>${ball.ball_name}</strong> — ${ball.brand}</li>`).join("")}</ul>`
            : `<div class="role-empty">No ball currently assigned to this role.</div>`
        }
      `;

      roleCards.appendChild(card);
    });
  }

  function calculateArsenalScore() {
    if (arsenal.length === 0) {
      return {
        score: 0,
        strengths: [],
        weaknesses: ["No balls in arsenal yet."]
      };
    }

    const categoryOrder = window.CATEGORY_ORDER || [];
    const ownedCategories = [...new Set(arsenal.map(ball => ball.category).filter(Boolean))];
    const overlapCategories = categoryOrder.filter(cat => arsenal.filter(ball => ball.category === cat).length >= 2);

    let score = 35;
    score += ownedCategories.length * 6;

    const getRoleBuckets =
      typeof window.getRoleBuckets === "function"
        ? window.getRoleBuckets
        : () => ({});

    const roleBuckets = getRoleBuckets();
    const majorRoles = [
      "Benchmark",
      "Heavy Oil Control",
      "Big Motion / Create Angle",
      "Burn / Late Transition",
      "Short Pattern Control"
    ];

    const coveredRoles = majorRoles.filter(role => (roleBuckets[role] || []).length > 0).length;
    score += coveredRoles * 4;

    score -= overlapCategories.length * 3;

    if (arsenal.length >= 3) score += 5;
    if (arsenal.length >= 6) score += 5;
    if (arsenal.length >= 9) score += 3;

    score = Math.max(0, Math.min(100, score));

    const strengths = [];
    const weaknesses = [];

    if (ownedCategories.includes("Medium/Smooth")) strengths.push("You have a benchmark-style motion slot covered.");
    if (ownedCategories.includes("Weak/Sharp")) strengths.push("You have an option for later transition / burn.");
    if (ownedCategories.includes("Strong/Smooth")) strengths.push("You have a stronger control option for more volume.");
    if (ownedCategories.includes("Urethane")) strengths.push("You have a short-pattern / control piece.");
    if (coveredRoles >= 4) strengths.push("Your arsenal covers several distinct jobs.");

    if (!ownedCategories.includes("Medium/Smooth")) weaknesses.push("You are missing a benchmark-style Medium/Smooth piece.");
    if (!ownedCategories.includes("Weak/Sharp")) weaknesses.push("You are missing a clear burn / late-transition option.");
    if (!ownedCategories.includes("Strong/Smooth")) weaknesses.push("You are missing a true stronger control ball.");
    if (!ownedCategories.includes("Urethane") && !ownedCategories.includes("Urethane-Like")) weaknesses.push("You do not have a dedicated control / short-pattern style piece.");
    if (overlapCategories.length > 0) weaknesses.push(`There is some overlap in: ${overlapCategories.join(", ")}.`);

    return { score, strengths, weaknesses };
  }

  function renderArsenalScore() {
    const container = document.getElementById("arsenalScore");
    if (!container) return;

    if (arsenal.length === 0) {
      container.innerHTML = `<div class="empty-state">Add balls to your arsenal to generate a score.</div>`;
      return;
    }

    const { score, strengths, weaknesses } = calculateArsenalScore();

    container.innerHTML = `
      <div class="score-wrap">
        <div class="score-circle">
          <div class="score-value">
            ${score}
            <span>/ 100</span>
          </div>
        </div>

        <div class="score-details">
          <h3>Arsenal Snapshot</h3>
          <div class="score-columns">
            <div class="score-block good">
              <strong>Strengths</strong>
              <ul>
                ${strengths.length ? strengths.map(item => `<li>${item}</li>`).join("") : `<li>No clear strengths yet.</li>`}
              </ul>
            </div>

            <div class="score-block bad">
              <strong>Weaknesses</strong>
              <ul>
                ${weaknesses.length ? weaknesses.map(item => `<li>${item}</li>`).join("") : `<li>No major weaknesses identified.</li>`}
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function getMapCoordinates(ball) {
    const categoryMap = {
      "Strong/Smooth": { x: 28, y: 88 },
      "Strong/Sharp": { x: 78, y: 88 },
      "Medium/Smooth": { x: 35, y: 66 },
      "Medium/Sharp": { x: 70, y: 66 },
      "Weak/Smooth": { x: 30, y: 36 },
      "Weak/Sharp": { x: 76, y: 36 },
      "Urethane": { x: 18, y: 56 },
      "Urethane-Like": { x: 24, y: 50 }
    };

    return categoryMap[ball.category] || { x: 50, y: 50 };
  }

  function renderArsenalMap() {
    const canvas = document.getElementById("arsenalMap");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const padding = 70;
    const plotW = width - padding * 2;
    const plotH = height - padding * 2;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
      const x = padding + (plotW / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    for (let i = 0; i <= 4; i++) {
      const y = padding + (plotH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(96, 165, 250, 0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, padding, plotW, plotH);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Smooth", padding, height - 18);
    ctx.fillText("Angular", width - padding, height - 18);
    ctx.fillText("Strength ↑", 70, 24);
    ctx.fillText("Weak", 36, height - padding + 4);
    ctx.fillText("Strong", 36, padding + 4);

    if (arsenal.length === 0) {
      ctx.fillStyle = "#9ca3af";
      ctx.font = "16px Arial";
      ctx.fillText("Add balls to your arsenal to see the motion map.", width / 2, height / 2);
      return;
    }

    arsenal.forEach((ball, index) => {
      const coords = getMapCoordinates(ball);
      const x = padding + (coords.x / 100) * plotW;
      const y = height - padding - (coords.y / 100) * plotH;
      const hue = (index * 47) % 360;

      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.65)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#e5e7eb";
      ctx.font = "12px Arial";
      ctx.textAlign = "left";
      ctx.fillText(ball.ball_name, x + 12, y + 4);
    });
  }

    function renderCoverageMap() {
    const coverageMap = document.getElementById("coverageMap");
    if (!coverageMap) return;

    const categoryOrder = window.CATEGORY_ORDER || [];
    const categoryIcons = window.CATEGORY_ICONS || {};

    coverageMap.innerHTML = "";

    categoryOrder.forEach(category => {
      const matchingBalls = arsenal.filter(ball => ball.category === category);
      const count = matchingBalls.length;
      const isFilled = count > 0;
      const icon = categoryIcons[category] || "🎳";

      const tile = document.createElement("div");
      tile.className = `coverage-tile ${isFilled ? "filled" : "missing"}`;

      tile.innerHTML = `
        <div class="coverage-category">
          <span class="coverage-icon">${icon}</span>
          <span>${category}</span>
        </div>
        <div class="coverage-count">${count}</div>
        <div class="coverage-status">${isFilled ? "Covered" : "Missing"}</div>
        <div class="coverage-balls">
          ${
            isFilled
              ? matchingBalls.slice(0, 3).map(ball => ball.ball_name).join("<br>")
              : "No ball in this slot"
          }
        </div>
      `;

      coverageMap.appendChild(tile);
    });
  }

  function renderRadarLegend() {
    const legend = document.getElementById("radarLegend");
    if (!legend) return;

    const categoryOrder = window.CATEGORY_ORDER || [];
    const categoryIcons = window.CATEGORY_ICONS || {};

    legend.innerHTML = "";

    categoryOrder.forEach(category => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="legend-icon">${categoryIcons[category] || "🎳"}</span><span>${category}</span>`;
      legend.appendChild(li);
    });
  }

  function renderRadarChart() {
    const canvas = document.getElementById("arsenalRadar");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const categoryOrder = window.CATEGORY_ORDER || [];

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = 180;
    const levels = 4;
    const maxValue = 3;

    const values = categoryOrder.map(category =>
      Math.min(arsenal.filter(ball => ball.category === category).length, maxValue)
    );

    for (let level = 1; level <= levels; level++) {
      const r = (radius / levels) * level;
      ctx.beginPath();

      categoryOrder.forEach((_, i) => {
        const angle = (-Math.PI / 2) + (i * 2 * Math.PI / categoryOrder.length);
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      ctx.closePath();
      ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    categoryOrder.forEach((category, i) => {
      const angle = (-Math.PI / 2) + (i * 2 * Math.PI / categoryOrder.length);
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "rgba(148, 163, 184, 0.3)";
      ctx.lineWidth = 1;
      ctx.stroke();

      const labelX = centerX + Math.cos(angle) * (radius + 26);
      const labelY = centerY + Math.sin(angle) * (radius + 26);

      ctx.fillStyle = "#cbd5e1";
      ctx.font = "13px Arial";
      ctx.textAlign = labelX < centerX - 10 ? "right" : labelX > centerX + 10 ? "left" : "center";
      ctx.fillText(category, labelX, labelY);
    });

    ctx.beginPath();
    categoryOrder.forEach((_, i) => {
      const angle = (-Math.PI / 2) + (i * 2 * Math.PI / categoryOrder.length);
      const scaled = (values[i] / maxValue) * radius;
      const x = centerX + Math.cos(angle) * scaled;
      const y = centerY + Math.sin(angle) * scaled;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = "rgba(59, 130, 246, 0.25)";
    ctx.strokeStyle = "rgba(96, 165, 250, 0.9)";
    ctx.lineWidth = 2;
    ctx.fill();
    ctx.stroke();

    categoryOrder.forEach((_, i) => {
      const angle = (-Math.PI / 2) + (i * 2 * Math.PI / categoryOrder.length);
      const scaled = (values[i] / maxValue) * radius;
      const x = centerX + Math.cos(angle) * scaled;
      const y = centerY + Math.sin(angle) * scaled;

      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#60a5fa";
      ctx.fill();
    });

    if (arsenal.length === 0) {
      ctx.fillStyle = "#9ca3af";
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Add balls to your arsenal to generate the radar.", centerX, centerY);
    }
  }

  function renderOverlapAnalysis() {
    const overlapResults = document.getElementById("overlapResults");
    if (!overlapResults) return;

    const categoryOrder = window.CATEGORY_ORDER || [];
    overlapResults.innerHTML = "";

    if (arsenal.length === 0) {
      overlapResults.innerHTML = `<div class="empty-state">Add balls to your arsenal to analyze overlap.</div>`;
      return;
    }

    const overlapCategories = categoryOrder
      .map(category => ({
        category,
        balls: arsenal.filter(ball => ball.category === category)
      }))
      .filter(group => group.balls.length >= 2);

    if (!overlapCategories.length) {
      overlapResults.innerHTML = `<div class="empty-state">No major category overlap detected.</div>`;
      return;
    }

    overlapCategories.forEach(group => {
      const div = document.createElement("div");
      div.className = "overlap-group";
      div.innerHTML = `
        <h4>${group.category}</h4>
        <p>${group.balls.length} balls in this slot.</p>
        <ul>
          ${group.balls.map(ball => `<li><strong>${ball.ball_name}</strong> — ${ball.brand}</li>`).join("")}
        </ul>
      `;
      overlapResults.appendChild(div);
    });
  }

  function renderRoleCards() {
    const roleCards = document.getElementById("roleCards");
    if (!roleCards) return;

    roleCards.innerHTML = "";

    if (arsenal.length === 0) {
      roleCards.innerHTML = `<div class="empty-state">Add balls to your arsenal to see role assignments.</div>`;
      return;
    }

    const buckets =
      typeof window.getRoleBuckets === "function"
        ? window.getRoleBuckets()
        : {};

    const roleOrder = Object.keys(buckets);

    if (!roleOrder.length) {
      roleCards.innerHTML = `<div class="empty-state">No role data available.</div>`;
      return;
    }

    roleOrder.forEach(role => {
      const balls = buckets[role] || [];
      const card = document.createElement("div");
      card.className = "role-card";

      card.innerHTML = `
        <h3>${role}</h3>
        ${
          balls.length
            ? `<ul>${balls.map(ball => `<li><strong>${ball.ball_name}</strong> — ${ball.brand}</li>`).join("")}</ul>`
            : `<div class="role-empty">No ball currently assigned to this role.</div>`
        }
      `;

      roleCards.appendChild(card);
    });
  }

  function calculateArsenalScore() {
    if (arsenal.length === 0) {
      return {
        score: 0,
        strengths: [],
        weaknesses: ["No balls in arsenal yet."]
      };
    }

    const categoryOrder = window.CATEGORY_ORDER || [];
    const ownedCategories = [...new Set(arsenal.map(ball => ball.category).filter(Boolean))];
    const overlapCategories = categoryOrder.filter(cat => arsenal.filter(ball => ball.category === cat).length >= 2);

    let score = 35;
    score += ownedCategories.length * 6;
    score -= overlapCategories.length * 3;

    if (arsenal.length >= 3) score += 5;
    if (arsenal.length >= 6) score += 5;
    if (arsenal.length >= 9) score += 3;

    score = Math.max(0, Math.min(100, score));

    const strengths = [];
    const weaknesses = [];

    if (ownedCategories.includes("Medium/Smooth")) strengths.push("You have a benchmark-style motion slot covered.");
    if (ownedCategories.includes("Weak/Sharp")) strengths.push("You have an option for later transition / burn.");
    if (ownedCategories.includes("Strong/Smooth")) strengths.push("You have a stronger control option for more volume.");
    if (ownedCategories.includes("Urethane")) strengths.push("You have a short-pattern / control piece.");

    if (!ownedCategories.includes("Medium/Smooth")) weaknesses.push("You are missing a benchmark-style Medium/Smooth piece.");
    if (!ownedCategories.includes("Weak/Sharp")) weaknesses.push("You are missing a clear burn / late-transition option.");
    if (!ownedCategories.includes("Strong/Smooth")) weaknesses.push("You are missing a true stronger control ball.");
    if (!ownedCategories.includes("Urethane") && !ownedCategories.includes("Urethane-Like")) weaknesses.push("You do not have a dedicated control / short-pattern style piece.");
    if (overlapCategories.length > 0) weaknesses.push(`There is some overlap in: ${overlapCategories.join(", ")}.`);

    return { score, strengths, weaknesses };
  }

  function renderArsenalScore() {
    const container = document.getElementById("arsenalScore");
    if (!container) return;

    if (arsenal.length === 0) {
      container.innerHTML = `<div class="empty-state">Add balls to your arsenal to generate a score.</div>`;
      return;
    }

    const { score, strengths, weaknesses } = calculateArsenalScore();

    container.innerHTML = `
      <div class="score-wrap">
        <div class="score-circle">
          <div class="score-value">
            ${score}
            <span>/ 100</span>
          </div>
        </div>

        <div class="score-details">
          <h3>Arsenal Snapshot</h3>
          <div class="score-columns">
            <div class="score-block good">
              <strong>Strengths</strong>
              <ul>
                ${strengths.length ? strengths.map(item => `<li>${item}</li>`).join("") : `<li>No clear strengths yet.</li>`}
              </ul>
            </div>

            <div class="score-block bad">
              <strong>Weaknesses</strong>
              <ul>
                ${weaknesses.length ? weaknesses.map(item => `<li>${item}</li>`).join("") : `<li>No major weaknesses identified.</li>`}
              </ul>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function getMapCoordinates(ball) {
    const categoryMap = {
      "Strong/Smooth": { x: 28, y: 88 },
      "Strong/Sharp": { x: 78, y: 88 },
      "Medium/Smooth": { x: 35, y: 66 },
      "Medium/Sharp": { x: 70, y: 66 },
      "Weak/Smooth": { x: 30, y: 36 },
      "Weak/Sharp": { x: 76, y: 36 },
      "Urethane": { x: 18, y: 56 },
      "Urethane-Like": { x: 24, y: 50 }
    };

    return categoryMap[ball.category] || { x: 50, y: 50 };
  }

  function renderArsenalMap() {
    const canvas = document.getElementById("arsenalMap");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    const padding = 70;
    const plotW = width - padding * 2;
    const plotH = height - padding * 2;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
      const x = padding + (plotW / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    for (let i = 0; i <= 4; i++) {
      const y = padding + (plotH / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(96, 165, 250, 0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(padding, padding, plotW, plotH);

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "14px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Smooth", padding, height - 18);
    ctx.fillText("Angular", width - padding, height - 18);
    ctx.fillText("Strength ↑", 70, 24);
    ctx.fillText("Weak", 36, height - padding + 4);
    ctx.fillText("Strong", 36, padding + 4);

    if (arsenal.length === 0) {
      ctx.fillStyle = "#9ca3af";
      ctx.font = "16px Arial";
      ctx.fillText("Add balls to your arsenal to see the motion map.", width / 2, height / 2);
      return;
    }

    arsenal.forEach((ball, index) => {
      const coords = getMapCoordinates(ball);
      const x = padding + (coords.x / 100) * plotW;
      const y = height - padding - (coords.y / 100) * plotH;
      const hue = (index * 47) % 360;

      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
      ctx.fill();

      ctx.strokeStyle = "rgba(255,255,255,0.65)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#e5e7eb";
      ctx.font = "12px Arial";
      ctx.textAlign = "left";
      ctx.fillText(ball.ball_name, x + 12, y + 4);
    });
  }

    window.BallBrainArsenal = {
    saveArsenal,
    saveBallNotes,
    getArsenal,
    setArsenal,
    getBallNotes,
    getExpandedArsenalCards,
    getBallNoteData,
    updateBallNoteField,
    addToArsenal,
    removeFromArsenal,
    clearArsenal,
    toggleArsenalCard,
    getArsenalCoverage,
    getArsenalScoreData,
    toggleArsenalScoreCard,
    renderArsenalScoreCard,
    downloadArsenalScoreImage,
    renderArsenal,
    renderCoverageMap,
    renderRadarLegend,
    renderRadarChart,
    renderOverlapAnalysis,
    renderRoleCards,
    calculateArsenalScore,
    renderArsenalScore,
    getMapCoordinates,
    renderArsenalMap
  };
    
  window.renderCoverageMap = renderCoverageMap;
  window.renderRadarLegend = renderRadarLegend;
  window.renderRadarChart = renderRadarChart;
  window.renderOverlapAnalysis = renderOverlapAnalysis;
  window.renderRoleCards = renderRoleCards;
  window.calculateArsenalScore = calculateArsenalScore;
  window.renderArsenalScore = renderArsenalScore;
  window.getMapCoordinates = getMapCoordinates;
  window.renderArsenalMap = renderArsenalMap;
  window.saveArsenal = saveArsenal;
  window.saveBallNotes = saveBallNotes;
  window.getBallNoteData = getBallNoteData;
  window.updateBallNoteField = updateBallNoteField;
  window.addToArsenal = addToArsenal;
  window.removeFromArsenal = removeFromArsenal;
  window.toggleArsenalCard = toggleArsenalCard;
  window.getArsenalCoverage = getArsenalCoverage;
  window.getArsenalScoreData = getArsenalScoreData;
  window.toggleArsenalScoreCard = toggleArsenalScoreCard;
  window.renderArsenalScoreCard = renderArsenalScoreCard;
  window.downloadArsenalScoreImage = downloadArsenalScoreImage;
  window.renderArsenal = renderArsenal;
  window.renderCoverageMap = renderCoverageMap;
  window.renderRadarLegend = renderRadarLegend;
  window.renderRadarChart = renderRadarChart;
  window.renderOverlapAnalysis = renderOverlapAnalysis;
  window.renderRoleCards = renderRoleCards;
  window.calculateArsenalScore = calculateArsenalScore;
  window.renderArsenalScore = renderArsenalScore;
  window.getMapCoordinates = getMapCoordinates;
  window.renderArsenalMap = renderArsenalMap;
})();