(function () {
  function renderBallList() {
    const container = document.getElementById("ballListContainer");
    const ballCount = document.getElementById("ballCount");
    const searchInput = document.getElementById("searchInput");
    const brandFilter = document.getElementById("brandFilter");
    const categoryFilter = document.getElementById("categoryFilter");

    if (!container || !ballCount) return;

    const allBalls =
      typeof window.getAllBalls === "function"
        ? window.getAllBalls()
        : Array.isArray(window.allBalls)
          ? window.allBalls
          : [];

    const arsenal =
      typeof window.BallBrainArsenal?.getArsenal === "function"
        ? window.BallBrainArsenal.getArsenal()
        : JSON.parse(localStorage.getItem("arsenal") || "[]");

    const search = String(searchInput?.value || "").toLowerCase().trim();
    const brand = brandFilter?.value || "";
    const category = categoryFilter?.value || "";

    const arsenalIds = new Set(arsenal.map(ball => ball.id));

    const filtered = allBalls.filter(ball => {
      if (arsenalIds.has(ball.id)) return false;
      if (brand && ball.brand !== brand) return false;
      if (category && ball.category !== category) return false;

      if (search) {
        const haystack = `${ball.brand} ${ball.ball_name}`.toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      return true;
    });

    ballCount.textContent = `${filtered.length} ball${filtered.length === 1 ? "" : "s"}`;

    if (!filtered.length) {
      container.innerHTML = `<div class="empty-state">No balls match your current filters.</div>`;
      return;
    }

    container.innerHTML = filtered.map(ball => {
      const brandClass =
        typeof window.normalizeBrandClass === "function"
          ? window.normalizeBrandClass(ball.brand)
          : "";

      const compareSelected =
        Array.isArray(window.compareSelection) &&
        window.compareSelection.includes(ball.id);

      const purchaseSelected =
        Array.isArray(window.purchaseSelection) &&
        window.purchaseSelection.includes(ball.id);

      return `
        <div class="card ${compareSelected ? "selected-compare" : ""}" data-ball-id="${ball.id}">
          <img src="${ball.image || ""}" alt="${ball.ball_name}" onerror="this.src=''; this.alt='No image available';" />
          <span class="brand ${brandClass}">${ball.brand}</span>
          <h3>${ball.ball_name}</h3>

          <div class="chip-row">
            <span class="chip">${ball.category || "Unknown"}</span>
            ${ball.core_type ? `<span class="chip">${ball.core_type}</span>` : ""}
          </div>

          <div class="ball-specs">
            <div><strong>Cover:</strong> ${ball.cover_type || "—"}</div>
            <div><strong>RG:</strong> ${ball.rg || "—"}</div>
            <div><strong>Diff:</strong> ${ball.differential || "—"}</div>
            <div><strong>Int Diff:</strong> ${ball.intermediate_diff || "—"}</div>
          </div>

          <div class="card-actions">
            <button class="small-btn" onclick="addToArsenal('${ball.id}')">Add to Arsenal</button>
            <button class="small-btn" onclick="toggleCompareSelection('${ball.id}')">
              ${compareSelected ? "Remove Compare" : "Compare"}
            </button>
            <button class="small-btn" onclick="togglePurchaseSelection('${ball.id}')">
              ${purchaseSelected ? "Remove Advisor" : "Purchase Advisor"}
            </button>
          </div>

          ${
            ball.isCustom
              ? `
            <div class="card-actions">
              <button class="small-btn" onclick="editCustomBall('${ball.id}')">Edit</button>
              <button class="small-btn danger" onclick="deleteCustomBall('${ball.id}')">Delete</button>
            </div>
          `
              : ""
          }
        </div>
      `;
    }).join("");
  }

  window.BallBrainBallList = {
    renderBallList
  };

  window.renderBallList = renderBallList;
})();