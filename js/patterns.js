(function () {
  function analyzePattern() {
    const urethaneAllowed = document.getElementById("urethaneAllowed")?.checked || false;

    const length = Number(document.getElementById("patternLength")?.value);
    const ratio = Number(document.getElementById("patternRatio")?.value);
    const volume = Number(document.getElementById("patternVolume")?.value);
    const drop = Number(document.getElementById("patternDrop")?.value);

    if (!length || !ratio || !volume || !drop) {
      alert("Please fill in all pattern fields.");
      return;
    }

    let summary = [];
    let recommendedCategories = [];
    let avoidCategories = [];

    const pushUnique = (arr, ...items) => {
      items.forEach(item => {
        if (item && !arr.includes(item)) arr.push(item);
      });
    };

    function generatePatternRead(length, ratio, volume, drop, urethaneAllowed) {
      let text =
        "Many variables influence how a bowling pattern plays including lane surface, topography, player style, and ball surface. Based on the combination of the pattern inputs provided, BallBrain suggests the following general approach: ";

      if (length < 38) {
        text +=
          "This is a shorter pattern, which usually means controlling the breakpoint and keeping the ball in front of you is important. ";
      } else if (length <= 43) {
        text +=
          "This is a medium length pattern, where benchmark-style motion often matches up well early. ";
      } else {
        text +=
          "This is a longer pattern, which typically rewards stronger balls and forward traction before creating angle. ";
      }

      if (ratio < 3) {
        text +=
          "The very low ratio suggests a flat sport condition with limited miss room. Accuracy and control are likely more important than creating angle. ";
      } else if (ratio < 6) {
        text +=
          "The moderate ratio suggests some built-in shape, but the pattern may still require controlled angles. ";
      } else {
        text +=
          "The higher ratio suggests there may be some built-in miss room to the outside. ";
      }

      if (volume > 28) {
        text +=
          "The higher oil volume indicates that traction and stronger covers may be helpful early in the block. ";
      } else if (volume < 22) {
        text +=
          "The lighter oil volume suggests cleaner balls and controlled entry angles may match up better. ";
      } else {
        text +=
          "The volume appears moderate, so the best look may depend more heavily on shape control and how quickly the fronts transition. ";
      }

      if (drop < length) {
        text +=
          "Because the drop brush is inside the pattern length, the outside boards may not provide as much free hook as some patterns. ";
      } else if (drop > length) {
        text +=
          "The drop brush extending beyond the pattern length may create some defined shape outside. ";
      } else {
        text +=
          "The drop brush is close to the end of the pattern, so the pattern may blend a little more predictably at the end of the oil line. ";
      }

      if (ratio < 3 && urethaneAllowed) {
        text +=
          "On flat patterns like this, urethane is often used early because it controls the breakpoint and keeps the reaction predictable. ";
      }

      if (ratio < 3 && !urethaneAllowed) {
        text +=
          "Since urethane is not allowed, players typically rely on urethane-like or smooth reactive control balls instead. ";
      }

      text +=
        "BallBrain would generally prioritize smoother, more controlled shapes first, then transition to cleaner motion as the lane develops.";

      return text;
    }

    if (length < 38) {
      summary.push("Short pattern. Control and smoother shapes are favored.");

      if (urethaneAllowed) {
        pushUnique(recommendedCategories, "Urethane", "Urethane-Like", "Weak/Smooth");
        summary.push("Urethane is a strong starting option on short patterns.");
      } else {
        pushUnique(recommendedCategories, "Urethane-Like", "Weak/Smooth", "Medium/Smooth");
        summary.push("Without urethane, urethane-like and smooth control pieces are preferred.");
      }

      pushUnique(avoidCategories, "Strong/Sharp");
    } else if (length <= 43) {
      summary.push("Medium length pattern. Benchmark shapes usually match up well.");

      if (ratio < 3) {
        if (urethaneAllowed) {
          pushUnique(recommendedCategories, "Urethane", "Urethane-Like", "Strong/Smooth");
          summary.push("Low ratio sport pattern — urethane control may be optimal.");
        } else {
          pushUnique(recommendedCategories, "Urethane-Like", "Strong/Smooth", "Medium/Smooth");
          summary.push(
            "Low ratio sport pattern with urethane banned — urethane-like control balls should be prioritized."
          );
        }
      } else {
        pushUnique(recommendedCategories, "Medium/Smooth", "Medium/Sharp");
      }
    } else {
      summary.push("Long pattern. Stronger balls and traction are required.");

      if (ratio < 3 && !urethaneAllowed) {
        pushUnique(recommendedCategories, "Urethane-Like", "Strong/Smooth", "Medium/Smooth");
      } else {
        pushUnique(recommendedCategories, "Strong/Smooth", "Strong/Sharp");
      }

      pushUnique(avoidCategories, "Weak/Smooth");
    }

    if (ratio >= 8) {
      summary.push("Higher ratio provides more miss room to the outside.");
    } else if (ratio >= 4) {
      summary.push("Moderate ratio requires controlled angles.");
    } else {
      summary.push("Low ratio sport pattern. Accuracy and control are critical.");
      pushUnique(recommendedCategories, "Strong/Smooth", "Medium/Smooth");
      pushUnique(avoidCategories, "Strong/Sharp");
    }

    if (volume > 26) {
      summary.push("Higher oil volume suggests stronger covers or surface adjustments.");

      if (ratio < 3 && !urethaneAllowed) {
        pushUnique(recommendedCategories, "Urethane-Like", "Strong/Smooth");
      } else {
        pushUnique(recommendedCategories, "Strong/Smooth");
      }
    } else if (volume < 22) {
      summary.push("Lower volume pattern. Cleaner balls may match up better.");
      pushUnique(recommendedCategories, "Weak/Smooth", "Medium/Sharp");
    }

    if (drop > length) {
      summary.push("Drop brush beyond pattern length creates a cliff outside.");
    } else if (drop < length) {
      summary.push("Oil taper inside the pattern may reduce outside miss room.");
    }

    if (ratio < 3 && urethaneAllowed) {
      summary.push("Flat sport pattern detected. Urethane control is commonly used early.");
      pushUnique(recommendedCategories, "Urethane", "Urethane-Like");
      pushUnique(avoidCategories, "Strong/Sharp");
    } else if (ratio < 3 && !urethaneAllowed) {
      summary.push(
        "Flat sport pattern detected but urethane is banned. Urethane-like and smooth reactive control balls are recommended."
      );
      pushUnique(recommendedCategories, "Urethane-Like", "Strong/Smooth", "Medium/Smooth");
      pushUnique(avoidCategories, "Strong/Sharp");
    }

    const aiRead = generatePatternRead(length, ratio, volume, drop, urethaneAllowed);
    const categoryPriority = [...new Set(recommendedCategories)];

    const arsenal =
      typeof window.BallBrainArsenal?.getArsenal === "function"
        ? window.BallBrainArsenal.getArsenal()
        : JSON.parse(localStorage.getItem("arsenal") || "[]");

    const bestBalls = arsenal
      .map(ball => ({
        ball,
        rank: categoryPriority.indexOf(ball.category)
      }))
      .filter(item => item.rank !== -1)
      .sort((a, b) => a.rank - b.rank)
      .map(item => item.ball);

    const avoidBalls = arsenal.filter(ball => avoidCategories.includes(ball.category));

    let html = "";

    html += `<div class="pattern-section">
      <div class="pattern-result-title">BallBrain Lane Read</div>
      <p style="line-height:1.6;">${aiRead}</p>
    </div>`;

    html += `<div class="pattern-section">
      <div class="pattern-result-title">Pattern Summary</div>
      <ul>${summary.map(s => `<li>${s}</li>`).join("")}</ul>
    </div>`;

    html += `<div class="pattern-section">
      <div class="pattern-result-title">Recommended Ball Types</div>
      <ul>${categoryPriority.map(c => `<li>${c}</li>`).join("")}</ul>
    </div>`;

    html += `<div class="pattern-section">
      <div class="pattern-result-title">Best Options From Your Arsenal</div>
      <ul>${
        bestBalls.length
          ? bestBalls.map(b => `<li>${b.brand} ${b.ball_name}</li>`).join("")
          : `<li>No strong matches found in your arsenal.</li>`
      }</ul>
    </div>`;

    html += `<div class="pattern-section">
      <div class="pattern-result-title">Balls To Avoid</div>
      <ul>${
        avoidBalls.length
          ? avoidBalls.map(b => `<li>${b.brand} ${b.ball_name}</li>`).join("")
          : `<li>No obvious avoid list from your arsenal.</li>`
      }</ul>
    </div>`;

    html += `<div class="pattern-section">
      <div class="pattern-result-title">Suggested Strategy</div>
      <ul>
        <li>Start with your smoothest controllable option that matches the pattern length.</li>
        <li>If the lane starts to hook early, migrate to a cleaner piece before forcing more speed.</li>
        <li>If the backends are too sharp, stay with smoother control and keep angles tighter.</li>
      </ul>
    </div>`;

    const patternResults = document.getElementById("patternResults");
    if (patternResults) {
      patternResults.innerHTML = html;
      patternResults.classList.remove("hidden");
    }
  }

  function pickBestBallForPattern(preferredCategories, excludedIds = []) {
    const arsenal =
      typeof window.BallBrainArsenal?.getArsenal === "function"
        ? window.BallBrainArsenal.getArsenal()
        : JSON.parse(localStorage.getItem("arsenal") || "[]");

    const excluded = new Set(excludedIds);

    for (const category of preferredCategories) {
      const exact = arsenal.find(ball => ball.category === category && !excluded.has(ball.id));
      if (exact) return exact;
    }

    const categoryFlex = window.CATEGORY_FLEX || {};

    for (const category of preferredCategories) {
      const flex = categoryFlex[category] || [];
      for (const flexCategory of flex) {
        const found = arsenal.find(ball => ball.category === flexCategory && !excluded.has(ball.id));
        if (found) return found;
      }
    }

    return null;
  }

  function renderPatternAdvisor() {
    const container = document.getElementById("patternAdvisor");
    const patternSelect = document.getElementById("patternSelect");

    if (!container || !patternSelect) return;

    const arsenal =
      typeof window.BallBrainArsenal?.getArsenal === "function"
        ? window.BallBrainArsenal.getArsenal()
        : JSON.parse(localStorage.getItem("arsenal") || "[]");

    if (!arsenal.length) {
      container.innerHTML = `<div class="empty-state">Add balls to your arsenal to get a pattern suggestion.</div>`;
      return;
    }

    const profile = (window.PATTERN_PROFILES || {})[patternSelect.value];

    if (!profile) {
      container.innerHTML = `<div class="empty-state">Choose a pattern type to see guidance.</div>`;
      return;
    }

    const startBall = pickBestBallForPattern(profile.preferred);
    const followBall = pickBestBallForPattern(
      profile.preferred.slice(1).concat(profile.preferred[0]),
      startBall ? [startBall.id] : []
    );

    container.innerHTML = `
      <div class="pattern-card">
        <h3>${profile.title}</h3>
        <p class="small-note">${profile.label}</p>
        <div class="pattern-line">
          <strong>Start With:</strong>
          <span>${startBall ? `${startBall.ball_name} — ${startBall.brand} (${startBall.category})` : "No good fit found in your current arsenal."}</span>
        </div>
        <div class="pattern-line">
          <strong>Go To Next:</strong>
          <span>${followBall ? `${followBall.ball_name} — ${followBall.brand} (${followBall.category})` : "No clear second option found."}</span>
        </div>
        <div class="pattern-line">
          <strong>Best Style Match:</strong>
          <span>${profile.preferred.join(" → ")}</span>
        </div>
      </div>
    `;
  }

  function setupPatternEvents() {
    const patternSelect = document.getElementById("patternSelect");
    if (patternSelect) {
      patternSelect.addEventListener("change", renderPatternAdvisor);
    }
  }

  window.BallBrainPatterns = {
    analyzePattern,
    renderPatternAdvisor,
    setupPatternEvents
  };

  window.analyzePattern = analyzePattern;
  window.renderPatternAdvisor = renderPatternAdvisor;
  window.setupPatternEvents = setupPatternEvents;
})();