(function () {
  let sessionLogs =
    typeof window.getSessionLogsStorage === "function"
      ? window.getSessionLogsStorage()
      : JSON.parse(localStorage.getItem("sessionLogs") || "[]");

  function saveSessionLogs() {
    if (typeof window.saveSessionLogsStorage === "function") {
      window.saveSessionLogsStorage(sessionLogs);
    } else {
      localStorage.setItem("sessionLogs", JSON.stringify(sessionLogs));
    }
  }

  function getSessionLogs() {
  sessionLogs =
    typeof window.getSessionLogsStorage === "function"
      ? window.getSessionLogsStorage()
      : JSON.parse(localStorage.getItem("sessionLogs") || "[]");

  return sessionLogs;
}

  function setSessionLogs(nextLogs) {
    sessionLogs = Array.isArray(nextLogs) ? nextLogs : [];
    saveSessionLogs();
  }

  function populateStatsBallSelectOptions(select, selectedValue = "") {
    if (!select) return;

    const arsenalData =
      typeof window.BallBrainArsenal?.getArsenal === "function"
        ? window.BallBrainArsenal.getArsenal()
        : JSON.parse(localStorage.getItem("arsenal") || "[]");

    select.innerHTML = `<option value="">Select a ball</option>`;

    arsenalData.forEach(ball => {
      const option = document.createElement("option");
      option.value = ball.id;
      option.textContent = `${ball.brand} — ${ball.ball_name}`;
      if (selectedValue && selectedValue === ball.id) option.selected = true;
      select.appendChild(option);
    });
  }

  function buildSessionGameFields(count, existingGames = []) {
    const container = document.getElementById("sessionGamesContainer");
    if (!container) return;

    container.innerHTML = "";

    for (let i = 0; i < count; i++) {
      const existing = existingGames[i] || {};
      const card = document.createElement("div");
      card.className = "session-game-card";

      card.innerHTML = `
        <h4>Game ${i + 1}</h4>
        <div class="session-game-grid">
          <div>
            <label>Score</label>
            <input type="number" class="session-game-score" min="0" max="300" value="${existing.score ?? ""}" required />
          </div>
          <div>
            <label>Ball Used</label>
            <select class="session-game-ball"></select>
          </div>
        </div>
      `;

      container.appendChild(card);

      const select = card.querySelector(".session-game-ball");
      populateStatsBallSelectOptions(select, existing.ballId || "");
    }
  }

  function resetSessionLogForm() {
    const form = document.getElementById("sessionLogForm");
    const editId = document.getElementById("sessionLogEditId");
    const submitBtn = document.getElementById("sessionLogSubmitBtn");
    const cancelBtn = document.getElementById("cancelSessionEditBtn");
    const dateInput = document.getElementById("sessionDate");
    const gameCountInput = document.getElementById("sessionGameCount");

    if (form) form.reset();
    if (editId) editId.value = "";
    if (submitBtn) submitBtn.textContent = "Save Session";
    if (cancelBtn) cancelBtn.classList.add("hidden");

    if (dateInput) dateInput.value = new Date().toISOString().split("T")[0];
    if (gameCountInput) gameCountInput.value = 3;

    buildSessionGameFields(3);
  }

  function fillSessionLogForm(session) {
    const editId = document.getElementById("sessionLogEditId");
    const date = document.getElementById("sessionDate");
    const sessionType = document.getElementById("sessionType");
    const center = document.getElementById("sessionCenter");
    const count = document.getElementById("sessionGameCount");
    const notes = document.getElementById("sessionNotes");
    const submitBtn = document.getElementById("sessionLogSubmitBtn");
    const cancelBtn = document.getElementById("cancelSessionEditBtn");

    if (editId) editId.value = session.id || "";
    if (date) date.value = session.date || "";
    if (sessionType) sessionType.value = session.sessionType || "";
    if (center) center.value = session.center || "";
    if (count) count.value = session.games?.length || 3;
    if (notes) notes.value = session.notes || "";

    buildSessionGameFields(session.games?.length || 3, session.games || []);

    if (submitBtn) submitBtn.textContent = "Save Changes";
    if (cancelBtn) cancelBtn.classList.remove("hidden");
  }

  function deleteSessionLog(sessionId) {
    const target = sessionLogs.find(session => session.id === sessionId);
    if (!target) return;

    if (!confirm("Delete this session?")) return;

    sessionLogs = sessionLogs.filter(session => session.id !== sessionId);
    saveSessionLogs();

    renderStats();
    if (typeof window.runPurchaseAdvisor === "function") window.runPurchaseAdvisor();
    if (typeof window.showToast === "function") window.showToast("Session deleted.", "warn");
  }

  function getAllLoggedGames() {
    return sessionLogs.flatMap(session =>
      (session.games || []).map(game => ({
        ...game,
        date: session.date,
        sessionType: session.sessionType,
        center: session.center,
        sessionId: session.id,
        sessionNotes: session.notes || ""
      }))
    );
  }

  function getGameBallName(ballId) {
    if (!ballId) return "No ball selected";

    if (typeof window.getBallById === "function") {
      const ball = window.getBallById(ballId);
      return ball ? `${ball.brand} ${ball.ball_name}` : "Unknown ball";
    }

    return "Unknown ball";
  }

  function getStatsSummary() {
    const games = getAllLoggedGames();

    if (!games.length) {
      return {
        overallAverage: null,
        highGame: null,
        totalGames: 0,
        bestBall: null
      };
    }

    const scores = games.map(game => Number(game.score)).filter(Number.isFinite);
    const totalGames = scores.length;
    const overallAverage = totalGames
      ? scores.reduce((a, b) => a + b, 0) / totalGames
      : null;
    const highGame = totalGames ? Math.max(...scores) : null;

    const byBall = {};
    games.forEach(game => {
      if (!game.ballId || !Number.isFinite(Number(game.score))) return;
      if (!byBall[game.ballId]) byBall[game.ballId] = [];
      byBall[game.ballId].push(Number(game.score));
    });

    let bestBall = null;
    let bestAvg = -1;

    Object.entries(byBall).forEach(([ballId, scoresForBall]) => {
      const avg = scoresForBall.reduce((a, b) => a + b, 0) / scoresForBall.length;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestBall = ballId;
      }
    });

    return {
      overallAverage: overallAverage ? overallAverage.toFixed(1) : null,
      highGame,
      totalGames,
      bestBall
    };
  }

  function getBallPerformanceStats() {
    const games = getAllLoggedGames();
    const grouped = {};

    games.forEach(game => {
      if (!game.ballId || !Number.isFinite(Number(game.score))) return;
      if (!grouped[game.ballId]) grouped[game.ballId] = [];
      grouped[game.ballId].push(Number(game.score));
    });

    return Object.entries(grouped)
      .map(([ballId, scores]) => ({
        ballId,
        games: scores.length,
        average: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1),
        best: Math.max(...scores)
      }))
      .sort((a, b) => Number(b.average) - Number(a.average));
  }

  function getCategoryAverageFromLogs(category) {
    const games = getAllLoggedGames();

    const relevant = games.filter(game => {
      if (typeof window.getBallById !== "function") return false;
      const ball = window.getBallById(game.ballId);
      return ball && ball.category === category && Number.isFinite(Number(game.score));
    });

    if (!relevant.length) return null;

    const avg =
      relevant.reduce((sum, game) => sum + Number(game.score), 0) / relevant.length;

    return avg.toFixed(1);
  }

  function ensureStatsSectionLayout() {
    const statsSection = document.getElementById("stats");
    if (!statsSection) return;

    const hasSummary =
      document.getElementById("overallAverageStat") &&
      document.getElementById("highGameStat") &&
      document.getElementById("totalGamesStat") &&
      document.getElementById("bestBallStat") &&
      document.getElementById("recentGamesList") &&
      document.getElementById("ballPerformanceList");

    if (hasSummary) return;

    const existingBlock = statsSection.querySelector(".stats-dashboard-wrap");
    if (existingBlock) existingBlock.remove();

    const wrapper = document.createElement("div");
    wrapper.className = "stats-dashboard-wrap";
    wrapper.innerHTML = `
      <div class="results-header" style="margin-top:20px;">
        <h2>Stats Dashboard</h2>
        <p>Session summaries, ball performance, and trends.</p>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; margin-bottom:20px;">
        <div class="recommendation-box">
          <h3>Overall Average</h3>
          <div id="overallAverageStat" class="stat-big-number">—</div>
        </div>
        <div class="recommendation-box">
          <h3>High Game</h3>
          <div id="highGameStat" class="stat-big-number">—</div>
        </div>
        <div class="recommendation-box">
          <h3>Total Games</h3>
          <div id="totalGamesStat" class="stat-big-number">0</div>
        </div>
        <div class="recommendation-box">
          <h3>Best Ball</h3>
          <div id="bestBallStat" class="stat-big-label">—</div>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:16px;">
        <div class="recommendation-box">
          <h3>Recent Sessions</h3>
          <div id="recentGamesList"></div>
        </div>
        <div class="recommendation-box">
          <h3>Ball Performance</h3>
          <div id="ballPerformanceList"></div>
        </div>
      </div>
    `;

    statsSection.appendChild(wrapper);
  }

  function renderStats() {
    ensureStatsSectionLayout();

    const overallAverageStat = document.getElementById("overallAverageStat");
    const highGameStat = document.getElementById("highGameStat");
    const totalGamesStat = document.getElementById("totalGamesStat");
    const bestBallStat = document.getElementById("bestBallStat");
    const recentGamesList = document.getElementById("recentGamesList");
    const ballPerformanceList = document.getElementById("ballPerformanceList");

    if (
      !overallAverageStat ||
      !highGameStat ||
      !totalGamesStat ||
      !bestBallStat ||
      !recentGamesList ||
      !ballPerformanceList
    ) {
      return;
    }

    const summary = getStatsSummary();

    overallAverageStat.textContent = summary.overallAverage ?? "—";
    highGameStat.textContent = summary.highGame ?? "—";
    totalGamesStat.textContent = summary.totalGames ?? "0";
    bestBallStat.textContent = summary.bestBall ? getGameBallName(summary.bestBall) : "—";

    if (!sessionLogs.length) {
      recentGamesList.innerHTML = `<div class="empty-state">No sessions logged yet.</div>`;
      ballPerformanceList.innerHTML = `<div class="empty-state">Ball performance will appear after you log sessions.</div>`;
      return;
    }

    const sortedSessions = [...sessionLogs].sort((a, b) =>
      String(b.date).localeCompare(String(a.date))
    );

    recentGamesList.innerHTML = "";

    sortedSessions.slice(0, 10).forEach(session => {
      const sessionSeries = (session.games || []).reduce(
        (sum, game) => sum + Number(game.score || 0),
        0
      );

      const card = document.createElement("div");
      card.className = "game-log-card";
      card.innerHTML = `
        <h4>${session.sessionType || "Session"} • ${sessionSeries} total</h4>
        <div class="game-log-meta">${session.date || "No date"} • ${session.center || "No center"} • ${(session.games || []).length} game(s)</div>
        <div>
          ${(session.games || [])
            .map(
              (game, index) => `
            <div><strong>Game ${index + 1}:</strong> ${game.score} — ${getGameBallName(game.ballId)}</div>
          `
            )
            .join("")}
        </div>
        ${session.notes ? `<div style="margin-top:8px;"><strong>Notes:</strong> ${session.notes}</div>` : ""}
        <div class="game-log-actions">
          <button class="small-btn edit-session-log-btn" data-session-id="${session.id}">Edit</button>
          <button class="small-btn delete-session-log-btn" data-session-id="${session.id}">Delete</button>
        </div>
      `;
      recentGamesList.appendChild(card);
    });

    ballPerformanceList.innerHTML = "";
    const performance = getBallPerformanceStats();

    if (!performance.length) {
      ballPerformanceList.innerHTML = `<div class="empty-state">Log sessions with ball selections to see performance stats.</div>`;
    } else {
      performance.forEach(item => {
        const card = document.createElement("div");
        card.className = "ball-performance-card";
        card.innerHTML = `
          <h4>${getGameBallName(item.ballId)}</h4>
          <div><strong>Average:</strong> ${item.average}</div>
          <div><strong>Games:</strong> ${item.games}</div>
          <div><strong>Best:</strong> ${item.best}</div>
        `;
        ballPerformanceList.appendChild(card);
      });
    }

    recentGamesList.querySelectorAll(".edit-session-log-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const session = sessionLogs.find(item => item.id === btn.dataset.sessionId);
        if (session) fillSessionLogForm(session);
      });
    });

    recentGamesList.querySelectorAll(".delete-session-log-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        deleteSessionLog(btn.dataset.sessionId);
      });
    });
  }

  function setupStatsEvents() {
    if (window.__ballBrainStatsEventsBound) return;
    window.__ballBrainStatsEventsBound = true;

    ensureStatsSectionLayout();

    const sessionLogForm = document.getElementById("sessionLogForm");
    const cancelSessionEditBtn = document.getElementById("cancelSessionEditBtn");
    const buildSessionGamesBtn = document.getElementById("buildSessionGamesBtn");
    const sessionGameCount = document.getElementById("sessionGameCount");

    if (buildSessionGamesBtn) {
      buildSessionGamesBtn.addEventListener("click", () => {
        const count = Number(sessionGameCount?.value) || 3;
        buildSessionGameFields(count);
      });
    }

    if (sessionLogForm) {
      const dateInput = document.getElementById("sessionDate");
      if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split("T")[0];
      }

      buildSessionGameFields(Number(sessionGameCount?.value) || 3);

      sessionLogForm.addEventListener("submit", e => {
        e.preventDefault();

        const editId = document.getElementById("sessionLogEditId")?.value.trim() || "";
        const scoreInputs = document.querySelectorAll(".session-game-score");
        const ballInputs = document.querySelectorAll(".session-game-ball");

        const games = [];

        for (let i = 0; i < scoreInputs.length; i++) {
          const score = Number(scoreInputs[i].value);
          const ballId = ballInputs[i].value;

          if (!Number.isFinite(score)) {
            alert(`Please enter a valid score for Game ${i + 1}.`);
            return;
          }

          games.push({
            score,
            ballId
          });
        }

        const session = {
          id: editId || `session-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
          date: document.getElementById("sessionDate")?.value || "",
          sessionType: document.getElementById("sessionType")?.value.trim() || "",
          center: document.getElementById("sessionCenter")?.value.trim() || "",
          notes: document.getElementById("sessionNotes")?.value.trim() || "",
          games
        };

        if (!session.date || !games.length) {
          alert("Date and at least one game are required.");
          return;
        }

        if (editId) {
          sessionLogs = sessionLogs.map(item => (item.id === editId ? session : item));
          if (typeof window.showToast === "function") window.showToast("Session updated.", "success");
        } else {
          sessionLogs.push(session);
          if (typeof window.showToast === "function") window.showToast("Session logged.", "success");
        }

        saveSessionLogs();
        resetSessionLogForm();
        renderStats();

        if (typeof window.runPurchaseAdvisor === "function") window.runPurchaseAdvisor();
      });
    }

    if (cancelSessionEditBtn) {
      cancelSessionEditBtn.addEventListener("click", () => {
        resetSessionLogForm();
      });
    }
  }

  window.BallBrainStats = {
    saveSessionLogs,
    getSessionLogs,
    setSessionLogs,
    populateStatsBallSelectOptions,
    buildSessionGameFields,
    resetSessionLogForm,
    fillSessionLogForm,
    deleteSessionLog,
    getAllLoggedGames,
    getStatsSummary,
    getBallPerformanceStats,
    getGameBallName,
    ensureStatsSectionLayout,
    renderStats,
    getCategoryAverageFromLogs,
    setupStatsEvents
  };

  window.saveSessionLogs = saveSessionLogs;
  window.getSessionLogs = getSessionLogs;
  window.setSessionLogs = setSessionLogs;
  window.populateStatsBallSelectOptions = populateStatsBallSelectOptions;
  window.buildSessionGameFields = buildSessionGameFields;
  window.resetSessionLogForm = resetSessionLogForm;
  window.fillSessionLogForm = fillSessionLogForm;
  window.deleteSessionLog = deleteSessionLog;
  window.getAllLoggedGames = getAllLoggedGames;
  window.getStatsSummary = getStatsSummary;
  window.getBallPerformanceStats = getBallPerformanceStats;
  window.getGameBallName = getGameBallName;
  window.ensureStatsSectionLayout = ensureStatsSectionLayout;
  window.renderStats = renderStats;
  window.getCategoryAverageFromLogs = getCategoryAverageFromLogs;
  window.setupStatsEvents = setupStatsEvents;
})();