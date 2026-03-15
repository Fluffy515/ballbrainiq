(function () {
  function getArsenalSafe() {
    if (typeof window.BallBrainArsenal?.getArsenal === "function") {
      return window.BallBrainArsenal.getArsenal();
    }
    return JSON.parse(localStorage.getItem("arsenal") || "[]");
  }

  function getAllBallsSafe() {
    if (typeof window.BallBrainData?.getAllBalls === "function") {
      return window.BallBrainData.getAllBalls();
    }
    return window.allBalls || [];
  }

  function getBallByIdSafe(ballId) {
    if (!ballId) return null;

    if (typeof window.BallBrainData?.getBallById === "function") {
      return window.BallBrainData.getBallById(ballId);
    }

    const allBalls = getAllBallsSafe();
    return allBalls.find(ball => ball.id === ballId) || null;
  }

  if (!Array.isArray(window.compareSelection)) window.compareSelection = [];
  if (!Array.isArray(window.purchaseSelection)) window.purchaseSelection = [];

  function getRoleBuckets() {
    const arsenal = getArsenalSafe();

    const buckets = {
      Benchmark: [],
      "Heavy Oil Control": [],
      "Big Motion / Create Angle": [],
      "Transition Angular": [],
      "Burn / Late Transition": [],
      "Short Pattern Control": [],
      "Control Reactive": [],
      "Late Block Control": [],
      "Burn / Downlane Shape": [],
      "General Purpose": []
    };

    arsenal.forEach(ball => {
      const role = getBallRole(ball);
      if (!buckets[role]) buckets[role] = [];
      buckets[role].push(ball);
    });

    return buckets;
  }

  function getBallRole(ball) {
    if (!ball) return "General Purpose";

    const category = ball.category;
    const core = String(ball.core_type || "").toLowerCase();
    const cover = String(ball.cover_type || "").toLowerCase();

    if (category === "Urethane") return "Short Pattern Control";
    if (category === "Urethane-Like") return "Control Reactive";
    if (category === "Strong/Smooth") return core.includes("asym") ? "Heavy Oil Control" : "Benchmark";
    if (category === "Strong/Sharp") return "Big Motion / Create Angle";
    if (category === "Medium/Smooth") return cover.includes("solid") ? "Benchmark" : "General Purpose";
    if (category === "Medium/Sharp") return "Transition Angular";
    if (category === "Weak/Smooth") return "Late Block Control";
    if (category === "Weak/Sharp") return "Burn / Downlane Shape";

    return "General Purpose";
  }

  function calculateComparisonScore(ball1, ball2) {
    if (!ball1 || !ball2) return 0;

    let score = 100;

    if (ball1.category !== ball2.category) score -= 30;
    if ((ball1.core_type || "") !== (ball2.core_type || "")) score -= 10;
    if ((ball1.cover_type || "") !== (ball2.cover_type || "")) score -= 12;

    const rg1 = Number(ball1.rg || 0);
    const rg2 = Number(ball2.rg || 0);
    const diff1 = Number(ball1.differential || 0);
    const diff2 = Number(ball2.differential || 0);
    const int1 = Number(ball1.intermediate_diff || 0);
    const int2 = Number(ball2.intermediate_diff || 0);

    if (rg1 && rg2) score -= Math.min(15, Math.abs(rg1 - rg2) * 100);
    if (diff1 && diff2) score -= Math.min(18, Math.abs(diff1 - diff2) * 100);
    if (int1 && int2) score -= Math.min(10, Math.abs(int1 - int2) * 100);

    return Math.max(0, Math.round(score));
  }

  function updateCompareBar() {
    const compareBar = document.getElementById("compareBar");
    const compareText = document.getElementById("compareText");

    if (!compareBar || !compareText) return;

    if (window.compareSelection.length) {
      compareBar.classList.remove("hidden");
      compareText.textContent = `${window.compareSelection.length} ball${window.compareSelection.length === 1 ? "" : "s"} selected for comparison`;
    } else {
      compareBar.classList.add("hidden");
    }
  }

  function updatePurchaseBar() {
    const purchaseBar = document.getElementById("purchaseBar");
    const purchaseText = document.getElementById("purchaseText");

    if (!purchaseBar || !purchaseText) return;

    if (window.purchaseSelection.length) {
      purchaseBar.classList.remove("hidden");
      purchaseText.textContent = `${window.purchaseSelection.length} ball${window.purchaseSelection.length === 1 ? "" : "s"} in Purchase Advisor`;
    } else {
      purchaseBar.classList.add("hidden");
    }
  }

  function toggleCompareSelection(ballId) {
    if (window.compareSelection.includes(ballId)) {
      window.compareSelection = window.compareSelection.filter(id => id !== ballId);
    } else {
      if (window.compareSelection.length >= 2) {
        if (typeof window.showToast === "function") {
          window.showToast("You can compare up to 2 balls at a time.", "warn");
        }
        return;
      }
      window.compareSelection.push(ballId);
    }

    updateCompareBar();
    if (typeof window.renderBallList === "function") window.renderBallList();
    if (typeof window.renderRecommendations === "function") window.renderRecommendations();
  }

  function togglePurchaseSelection(ballId) {
  if (window.purchaseSelection.includes(ballId)) {
    window.purchaseSelection = window.purchaseSelection.filter(id => id !== ballId);
  } else {
    window.purchaseSelection = [ballId];
  }

  updatePurchaseBar();

  const purchaseAdvisorSelect = document.getElementById("purchaseAdvisorSelect");
  if (purchaseAdvisorSelect) {
    purchaseAdvisorSelect.value = ballId;
    purchaseAdvisorSelect.dispatchEvent(new Event("change"));
  }

  if (typeof window.renderBallList === "function") window.renderBallList();

  const recommendationsTab = document.querySelector('.tab-button[data-tab="recommendations"]');
  if (recommendationsTab) {
    recommendationsTab.click();
  }

  setTimeout(() => {
    const advisorSection = document.getElementById("purchaseAdvisorResults");
    if (!advisorSection) return;

    advisorSection.scrollIntoView({ behavior: "smooth", block: "center" });
    advisorSection.classList.add("highlight-ball");

    setTimeout(() => {
      advisorSection.classList.remove("highlight-ball");
    }, 2000);
  }, 250);
}






  function renderComparison() {
    const result = document.getElementById("compareResults");
    const compareBall1 = document.getElementById("compareBall1");
    const compareBall2 = document.getElementById("compareBall2");

    if (!result || !compareBall1 || !compareBall2) return;

    const ball1 = getBallByIdSafe(compareBall1.value);
    const ball2 = getBallByIdSafe(compareBall2.value);

    if (!ball1 || !ball2) {
      result.innerHTML = `<div class="empty-state">Select two balls to compare.</div>`;
      return;
    }

    const score = calculateComparisonScore(ball1, ball2);

    let verdict = "Distinct Roles";
    if (score >= 85) verdict = "Very Similar";
    else if (score >= 70) verdict = "Some Overlap";
    else if (score >= 55) verdict = "Useful Difference";

    result.innerHTML = `
      <div class="comparison-grid">
        <div class="recommendation-box">
          <h3>${ball1.brand} ${ball1.ball_name}</h3>
          <div>Category: ${ball1.category || "—"}</div>
          <div>Core: ${ball1.core_type || "—"}</div>
          <div>Cover: ${ball1.cover_type || "—"}</div>
          <div>RG: ${ball1.rg || "—"}</div>
          <div>Diff: ${ball1.differential || "—"}</div>
          <div>Int Diff: ${ball1.intermediate_diff || "—"}</div>
        </div>
        <div class="recommendation-box">
          <h3>${ball2.brand} ${ball2.ball_name}</h3>
          <div>Category: ${ball2.category || "—"}</div>
          <div>Core: ${ball2.core_type || "—"}</div>
          <div>Cover: ${ball2.cover_type || "—"}</div>
          <div>RG: ${ball2.rg || "—"}</div>
          <div>Diff: ${ball2.differential || "—"}</div>
          <div>Int Diff: ${ball2.intermediate_diff || "—"}</div>
        </div>
      </div>
      <div class="advisor-card ${score >= 70 ? "warn" : "good"}" style="margin-top:16px;">
        <div class="advisor-headline">Overlap Score: ${score}/100</div>
        <ul class="advisor-list">
          <li>Verdict: ${verdict}</li>
          <li>${ball1.brand} ${ball1.ball_name} role: ${getBallRole(ball1)}</li>
          <li>${ball2.brand} ${ball2.ball_name} role: ${getBallRole(ball2)}</li>
        </ul>
      </div>
    `;
  }

  function renderComparisonFromSelection() {
    const compareBall1 = document.getElementById("compareBall1");
    const compareBall2 = document.getElementById("compareBall2");
    const compareTabBtn = document.querySelector('.tab-button[data-tab="compare"]');

    if (!compareBall1 || !compareBall2) return;

    if (window.compareSelection.length !== 2) {
      if (typeof window.showToast === "function") {
        window.showToast("Select exactly 2 balls to compare.", "warn");
      }
      return;
    }

    compareBall1.value = window.compareSelection[0];
    compareBall2.value = window.compareSelection[1];
    renderComparison();

    if (compareTabBtn) compareTabBtn.click();
  }

  function renderRecommendations() {
    const coverageList = document.getElementById("coverageList");
    const missingCategoriesList = document.getElementById("missingCategoriesList");
    const recommendationsContainer = document.getElementById("recommendationsContainer");
    const recommendationBrandFilter = document.getElementById("recommendationBrandFilter");

    if (!coverageList || !missingCategoriesList || !recommendationsContainer) return;

    coverageList.innerHTML = "";
    missingCategoriesList.innerHTML = "";
    recommendationsContainer.innerHTML = "";

    if (typeof window.renderCoverageMap === "function") window.renderCoverageMap();
    if (typeof window.renderRadarLegend === "function") window.renderRadarLegend();
    if (typeof window.renderRadarChart === "function") window.renderRadarChart();
    if (typeof window.renderOverlapAnalysis === "function") window.renderOverlapAnalysis();
    if (typeof window.renderRoleCards === "function") window.renderRoleCards();
    if (typeof window.renderArsenalScore === "function") window.renderArsenalScore();
    if (typeof window.renderPatternAdvisor === "function") window.renderPatternAdvisor();
    if (typeof window.renderArsenalMap === "function") window.renderArsenalMap();

    const selectedBrand = recommendationBrandFilter ? recommendationBrandFilter.value : "";
    const arsenal = getArsenalSafe();
    const allBalls = getAllBallsSafe();
    const categoryOrder = window.CATEGORY_ORDER || [];
    const ownedCategories = [...new Set(arsenal.map(ball => ball.category).filter(Boolean))];
    const missingCategories = categoryOrder.filter(cat => !ownedCategories.includes(cat));

    if (arsenal.length === 0) {
      coverageList.innerHTML = `<li>No balls in your arsenal yet.</li>`;
      missingCategoriesList.innerHTML = `<li>Add balls to see recommendations.</li>`;
      recommendationsContainer.innerHTML = `<div class="empty-state">No recommendations yet.</div>`;
      return;
    }

    categoryOrder.forEach(category => {
      const count = arsenal.filter(ball => ball.category === category).length;
      const li = document.createElement("li");
      li.textContent = `${category}: ${count}`;
      coverageList.appendChild(li);
    });

    if (missingCategories.length === 0) {
      missingCategoriesList.innerHTML = `<li>You have at least one ball in every category.</li>`;
      recommendationsContainer.innerHTML = `
        <div class="empty-state">
          Your arsenal already covers every category.
        </div>
      `;
      return;
    }

    missingCategories.forEach(category => {
      const li = document.createElement("li");
      li.textContent = category;
      missingCategoriesList.appendChild(li);
    });

    const recommendations = [];

    missingCategories.forEach(category => {
      const matches = allBalls.filter(ball =>
        ball.category === category &&
        !arsenal.some(item => item.id === ball.id) &&
        (!selectedBrand || ball.brand === selectedBrand)
      );

      const brandSeen = new Set();
      const uniqueBrandMatches = [];

      for (const ball of matches) {
        if (!brandSeen.has(ball.brand)) {
          brandSeen.add(ball.brand);
          uniqueBrandMatches.push(ball);
        }
      }

      recommendations.push(...uniqueBrandMatches.slice(0, 4));
    });

    if (recommendations.length === 0) {
      recommendationsContainer.innerHTML = `
        <div class="empty-state">
          No recommendations available for the current brand filter.
        </div>
      `;
      return;
    }

    recommendations.forEach(ball => {
      const brandClass =
        typeof window.normalizeBrandClass === "function"
          ? window.normalizeBrandClass(ball.brand)
          : "";

      const card = document.createElement("div");
      card.className = "card";

      card.innerHTML = `
        <img src="${ball.image || ""}" alt="${ball.ball_name}" onerror="this.src=''; this.alt='No image available';" />
        <span class="brand ${brandClass}">${ball.brand}</span>
        <h3>${ball.ball_name}</h3>
        <div class="small-note">${ball.category}</div>
        <div class="card-actions">
          <button class="small-btn see-ball-btn" data-ball-id="${ball.id}">
            See in Ball List
          </button>
        </div>
      `;

      recommendationsContainer.appendChild(card);
    });

    recommendationsContainer.querySelectorAll(".see-ball-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const ballId = btn.dataset.ballId;

        const ballListTab = document.querySelector('.tab-button[data-tab="ball-list"]');
        if (ballListTab) ballListTab.click();

        setTimeout(() => {
          const ballCard = document.querySelector(`[data-ball-id="${ballId}"]`);
          if (!ballCard) return;

          ballCard.scrollIntoView({ behavior: "smooth", block: "center" });
          ballCard.classList.add("highlight-ball");

          setTimeout(() => {
            ballCard.classList.remove("highlight-ball");
          }, 2000);
        }, 200);
      });
    });
      recommendationsContainer.querySelectorAll(".see-ball-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const ballId = btn.dataset.ballId;

      const ballListTab = document.querySelector('.tab-button[data-tab="ball-list"]');
      if (ballListTab) ballListTab.click();

      setTimeout(() => {
        const ballCard = document.querySelector(`[data-ball-id="${ballId}"]`);
        if (!ballCard) return;

        ballCard.scrollIntoView({ behavior: "smooth", block: "center" });
        ballCard.classList.add("highlight-ball");

        setTimeout(() => {
          ballCard.classList.remove("highlight-ball");
        }, 2000);
      }, 200);
    });
  });

  if (typeof window.runPurchaseAdvisor === "function") {
    window.runPurchaseAdvisor();
  }
}


  function buildBag() {
    const bagResults = document.getElementById("bagBuilderResults");
    const bagMissing = document.getElementById("bagBuilderMissing");
    const bagSizeSelect = document.getElementById("bagSizeSelect");

    if (!bagResults || !bagMissing || !bagSizeSelect) return;

    const size = Number(bagSizeSelect.value || 3);
    const templates = window.BAG_TEMPLATES || {};
    const flexMap = window.CATEGORY_FLEX || {};
    const template = templates[size] || templates[3];
    const arsenal = getArsenalSafe();
    const allBalls = getAllBallsSafe();

    if (!arsenal.length) {
      bagResults.innerHTML = `<div class="empty-state">Add balls to your arsenal to build a bag.</div>`;
      bagMissing.innerHTML = "";
      return;
    }

    const selected = [];
    const missing = [];

    template.forEach(slot => {
      let chosen = arsenal.find(ball => ball.category === slot.category && !selected.some(item => item.id === ball.id));

      if (!chosen) {
        const flexCategories = flexMap[slot.category] || [];
        chosen = arsenal.find(ball => flexCategories.includes(ball.category) && !selected.some(item => item.id === ball.id));
      }

      if (chosen) {
        selected.push({ slot: slot.label, ball: chosen, matchedCategory: chosen.category });
      } else {
        missing.push(slot);
      }
    });

    const suggestions = missing.map(slot =>
      allBalls.find(ball =>
        !arsenal.some(item => item.id === ball.id) &&
        (ball.category === slot.category || (flexMap[slot.category] || []).includes(ball.category))
      )
    ).filter(Boolean);

    bagResults.innerHTML = `
      <div class="pattern-section">
        <div class="pattern-result-title">Recommended ${size}-Ball Bag</div>
        <ul>
          ${selected.length
            ? selected.map(item => `<li><strong>${item.slot}:</strong> ${item.ball.brand} ${item.ball.ball_name} <span class="small-note">(${item.matchedCategory})</span></li>`).join("")
            : `<li>No recommended balls found.</li>`}
        </ul>
      </div>
    `;

    bagMissing.innerHTML = `
      <div class="pattern-section">
        <div class="pattern-result-title">Missing Slots</div>
        <ul>
          ${missing.length
            ? missing.map(item => `<li>${item.label} — ${item.category}</li>`).join("")
            : `<li>No missing slots in this bag template.</li>`}
        </ul>
      </div>

      <div class="pattern-section">
        <div class="pattern-result-title">Suggested Purchases</div>
        <ul>
          ${suggestions.length
            ? suggestions.map(ball => `<li>${ball.brand} ${ball.ball_name} — ${ball.category}</li>`).join("")
            : `<li>No purchase suggestions needed right now.</li>`}
        </ul>
      </div>
    `;
  }

  function getPurchaseAdvisorPlus(target) {
    const arsenal = getArsenalSafe();
    const sameCategory = arsenal.filter(ball => ball.category === target.category);
    const mostSimilarOwned = arsenal
      .map(ball => ({ ball, score: calculateComparisonScore(ball, target) }))
      .sort((a, b) => b.score - a.score)[0];

    const ownedCategories = [...new Set(arsenal.map(ball => ball.category).filter(Boolean))];
    const roleBuckets = getRoleBuckets();
    const targetRole = getBallRole(target);

    let fitScore = 55;
    const reasons = [];
    let verdict = "Situational Fit";
    let ratingClass = "warn";

    if (!ownedCategories.includes(target.category)) {
      fitScore += 20;
      reasons.push(`Fills a missing category in your arsenal: ${target.category}.`);
    } else {
      reasons.push(`You already have coverage in ${target.category}.`);
    }

    const roleCovered = Object.values(roleBuckets).some(list =>
      list.some(ball => getBallRole(ball) === targetRole)
    );

    if (!roleCovered) {
      fitScore += 10;
      reasons.push(`Adds a new role: ${targetRole}.`);
    } else {
      reasons.push(`You already have a similar role covered: ${targetRole}.`);
    }

    if (sameCategory.length === 0) {
      fitScore += 8;
    } else if (sameCategory.length >= 2) {
      fitScore -= 10;
    }

    if (mostSimilarOwned) {
      if (mostSimilarOwned.score >= 85) {
        fitScore -= 18;
        reasons.push(`Very similar to ${mostSimilarOwned.ball.brand} ${mostSimilarOwned.ball.ball_name} (${mostSimilarOwned.score}% overlap).`);
      } else if (mostSimilarOwned.score >= 70) {
        fitScore -= 10;
        reasons.push(`Moderate overlap with ${mostSimilarOwned.ball.brand} ${mostSimilarOwned.ball.ball_name} (${mostSimilarOwned.score}% overlap).`);
      } else {
        fitScore += 5;
        reasons.push(`Distinct enough from your current equipment. Closest match is ${mostSimilarOwned.ball.brand} ${mostSimilarOwned.ball.ball_name} at ${mostSimilarOwned.score}% overlap.`);
      }
    }

    fitScore = Math.max(0, Math.min(100, Math.round(fitScore)));

    if (fitScore >= 85) {
      verdict = "Excellent Fit";
      ratingClass = "good";
    } else if (fitScore >= 70) {
      verdict = "Good Fit";
      ratingClass = "good";
    } else if (fitScore >= 55) {
      verdict = "Situational Fit";
      ratingClass = "warn";
    } else {
      verdict = "Likely Redundant";
      ratingClass = "bad";
    }

    return {
      fitScore,
      verdict,
      reasons,
      ratingClass,
      closestBall: mostSimilarOwned?.ball || null,
      closestScore: mostSimilarOwned?.score || null,
      role: targetRole
    };
  }

  function runPurchaseAdvisor() {
  const purchaseResults = document.getElementById("purchaseAdvisorResults");
  const purchaseAdvisorSelect = document.getElementById("purchaseAdvisorSelect");

  if (!purchaseResults) {
    console.warn("purchaseAdvisorResults container not found");
    return;
  }

  const selectedBallId = purchaseAdvisorSelect ? purchaseAdvisorSelect.value : "";

  if (!selectedBallId) {
    purchaseResults.innerHTML = `
      <div class="empty-state">
        Choose a ball above to see whether it fills a gap or overlaps with your current arsenal.
      </div>
    `;
    return;
  }

  const target = getBallByIdSafe(selectedBallId);

  if (!target) {
    purchaseResults.innerHTML = `
      <div class="empty-state">
        Could not find that ball in the database.
      </div>
    `;
    return;
  }

  const plus = getPurchaseAdvisorPlus(target);

  purchaseResults.innerHTML = `
    <div class="advisor-card ${plus.ratingClass}" style="margin-bottom:16px;">
      <div class="advisor-headline">${target.brand} ${target.ball_name}</div>
      <div style="margin-bottom:10px;"><strong>Fit Score:</strong> ${plus.fitScore} — ${plus.verdict}</div>
      <div style="margin-bottom:10px;"><strong>Projected Role:</strong> ${plus.role}</div>
      ${
        plus.closestBall
          ? `<div style="margin-bottom:10px;"><strong>Closest Ball:</strong> ${plus.closestBall.brand} ${plus.closestBall.ball_name} (${plus.closestScore}% similarity)</div>`
          : ""
      }
      <ul class="advisor-list">
        ${plus.reasons.map(reason => `<li>${reason}</li>`).join("")}
      </ul>
    </div>
  `;
}


function populatePurchaseAdvisorSelect() {
  const purchaseAdvisorSelect = document.getElementById("purchaseAdvisorSelect");
  if (!purchaseAdvisorSelect) return;

  const allBalls = getAllBallsSafe();
  const currentValue = purchaseAdvisorSelect.value;

  purchaseAdvisorSelect.innerHTML = `<option value="">Select a ball to evaluate</option>` +
    allBalls.map(ball => `<option value="${ball.id}">${ball.brand} — ${ball.ball_name}</option>`).join("");

  if (currentValue) {
    purchaseAdvisorSelect.value = currentValue;
  }
}



  function setupAdvisorEvents() {
  populatePurchaseAdvisorSelect();

  const purchaseAdvisorSelect = document.getElementById("purchaseAdvisorSelect");
  if (purchaseAdvisorSelect) {
    purchaseAdvisorSelect.addEventListener("change", runPurchaseAdvisor);
  }

  const compareNowBtn = document.getElementById("compareNowBtn");
  if (compareNowBtn) {
    compareNowBtn.addEventListener("click", renderComparisonFromSelection);
  }

  const compareBall1 = document.getElementById("compareBall1");
  const compareBall2 = document.getElementById("compareBall2");

  if (compareBall1) compareBall1.addEventListener("change", renderComparison);
  if (compareBall2) compareBall2.addEventListener("change", renderComparison);

  const recommendationBrandFilter = document.getElementById("recommendationBrandFilter");
  if (recommendationBrandFilter) {
    recommendationBrandFilter.addEventListener("change", renderRecommendations);
  }

  const bagSizeSelect = document.getElementById("bagSizeSelect");
  if (bagSizeSelect) {
    bagSizeSelect.addEventListener("change", buildBag);
  }

  const buildBagBtn = document.getElementById("buildBagBtn");
  if (buildBagBtn) {
    buildBagBtn.addEventListener("click", buildBag);
  }
}



  window.BallBrainAdvisor = {
    getRoleBuckets,
    getBallRole,
    calculateComparisonScore,
    updateCompareBar,
    updatePurchaseBar,
    toggleCompareSelection,
    togglePurchaseSelection,
    renderComparison,
    renderComparisonFromSelection,
    renderRecommendations,
    buildBag,
    getPurchaseAdvisorPlus,
    runPurchaseAdvisor,
    populatePurchaseAdvisorSelect,
    setupAdvisorEvents
  };

  window.getRoleBuckets = getRoleBuckets;
  window.getBallRole = getBallRole;
  window.calculateComparisonScore = calculateComparisonScore;
  window.updateCompareBar = updateCompareBar;
  window.updatePurchaseBar = updatePurchaseBar;
  window.toggleCompareSelection = toggleCompareSelection;
  window.togglePurchaseSelection = togglePurchaseSelection;
  window.renderComparison = renderComparison;
  window.renderComparisonFromSelection = renderComparisonFromSelection;
  window.renderRecommendations = renderRecommendations;
  window.buildBag = buildBag;
  window.getPurchaseAdvisorPlus = getPurchaseAdvisorPlus;
  window.runPurchaseAdvisor = runPurchaseAdvisor;
  window.setupAdvisorEvents = setupAdvisorEvents;
  window.populatePurchaseAdvisorSelect = populatePurchaseAdvisorSelect;
})();
