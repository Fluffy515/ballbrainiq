(function () {
  async function init() {
    try {
      if (typeof window.preloadShareLogo === "function") {
        window.preloadShareLogo();
      }

      if (typeof window.setupTabs === "function") {
        window.setupTabs();
      }

      if (typeof window.loadBalls === "function") {
        await window.loadBalls();
      }

      if (typeof window.populateFilters === "function") {
        window.populateFilters();
      }

      if (typeof window.populateCompareSelectors === "function") {
        window.populateCompareSelectors();
      }

      if (typeof window.setupEvents === "function") {
        window.setupEvents();
      }

      if (typeof window.setupStatsEvents === "function") {
        window.setupStatsEvents();
      }

      if (typeof window.setupAdvisorEvents === "function") {
        window.setupAdvisorEvents();
      }

      if (typeof window.setupPatternEvents === "function") {
        window.setupPatternEvents();
      }

      if (typeof window.renderBallList === "function") {
        window.renderBallList();
      }

      if (typeof window.renderArsenal === "function") {
        window.renderArsenal();
      }

      if (typeof window.renderRecommendations === "function") {
        window.renderRecommendations();
      }

      if (typeof window.buildBag === "function") {
        window.buildBag();
      }

      if (typeof window.renderComparison === "function") {
        window.renderComparison();
      }

      if (typeof window.runPurchaseAdvisor === "function") {
        window.runPurchaseAdvisor();
      }

      if (typeof window.renderPatternAdvisor === "function") {
        window.renderPatternAdvisor();
      }

      if (typeof window.resetSessionLogForm === "function") {
        window.resetSessionLogForm();
      }

      if (typeof window.renderStats === "function") {
        window.renderStats();
      }

      if (typeof window.updateCompareBar === "function") {
        window.updateCompareBar();
      }

      if (typeof window.updatePurchaseBar === "function") {
        window.updatePurchaseBar();
      }
    } catch (error) {
      console.error("BallBrain init failed:", error);
    } finally {
      const loadingOverlay = document.getElementById("loadingOverlay");
      if (loadingOverlay) {
        loadingOverlay.classList.add("hidden");
      }
    }
  }

  window.initBallBrain = init;
  document.addEventListener("DOMContentLoaded", init);
})();