(function () {
  let shareLogoImage = null;

  function preloadShareLogo() {
    const img = new Image();
    img.src = "logo.png";

    img.onload = () => {
      shareLogoImage = img;
      window.shareLogoImage = img;
    };

    img.onerror = () => {
      shareLogoImage = null;
      window.shareLogoImage = null;
    };
  }

  function showToast(message, type = "success") {
    let container = document.getElementById("toastContainer");

    if (!container) {
      container = document.createElement("div");
      container.id = "toastContainer";
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("toast-fade");
      setTimeout(() => toast.remove(), 300);
    }, 2200);
  }

  function setupTabs() {
    const tabButtons = document.querySelectorAll(".tab-button");
    const tabContents = document.querySelectorAll(".tab-content");

    tabButtons.forEach(button => {
      button.addEventListener("click", () => {
        const target = button.dataset.tab;

        tabButtons.forEach(btn => btn.classList.remove("active"));
        tabContents.forEach(tab => tab.classList.remove("active"));

        button.classList.add("active");

        const section = document.getElementById(target);
        if (section) section.classList.add("active");

        if (target === "stats" && typeof window.renderStats === "function") {
          window.renderStats();
        }

        if (target === "compare" && typeof window.renderComparison === "function") {
          window.renderComparison();
        }

        if (target === "recommendations" && typeof window.renderRecommendations === "function") {
          window.renderRecommendations();
        }

        if (target === "pattern-advisor" && typeof window.renderPatternAdvisor === "function") {
          window.renderPatternAdvisor();
        }
      });
    });
  }

  function populateFilters() {
    const brandFilter = document.getElementById("brandFilter");
    const recommendationBrandFilter = document.getElementById("recommendationBrandFilter");
    const allBalls = Array.isArray(window.allBalls) ? window.allBalls : [];

    const brands = [...new Set(allBalls.map(ball => ball.brand).filter(Boolean))].sort();

    [brandFilter, recommendationBrandFilter].forEach(select => {
      if (!select) return;

      const current = select.value;
      const firstOption =
        select.querySelector("option")?.outerHTML || `<option value="">All Brands</option>`;

      select.innerHTML =
        firstOption +
        brands.map(brand => `<option value="${brand}">${brand}</option>`).join("");

      if (brands.includes(current)) select.value = current;
    });
  }

  function populateCompareSelectors() {
    const compareBall1 = document.getElementById("compareBall1");
    const compareBall2 = document.getElementById("compareBall2");
    const allBalls = Array.isArray(window.allBalls) ? window.allBalls : [];

    if (!compareBall1 || !compareBall2) return;

    [compareBall1, compareBall2].forEach(select => {
      const current = select.value;
      select.innerHTML =
        `<option value="">Select a ball</option>` +
        allBalls
          .map(ball => `<option value="${ball.id}">${ball.brand} — ${ball.ball_name}</option>`)
          .join("");

      if (current) select.value = current;
    });
  }

  function populateBallSelectOptions(select, selectedValue = "") {
    if (!select) return;

    const allBalls = Array.isArray(window.allBalls) ? window.allBalls : [];

    select.innerHTML = `<option value="">Select a ball</option>`;

    allBalls.forEach(ball => {
      const option = document.createElement("option");
      option.value = ball.id;
      option.textContent = `${ball.brand} — ${ball.ball_name}`;
      if (selectedValue && selectedValue === ball.id) option.selected = true;
      select.appendChild(option);
    });
  }

  function setupEvents() {
    const headerLogo = document.querySelector(".logo");

    if (headerLogo) {
      headerLogo.style.cursor = "pointer";

      headerLogo.addEventListener("click", () => {
        const ballListTab = document.querySelector('.tab-button[data-tab="ball-list"]');
        if (ballListTab) ballListTab.click();
      });
    }

    const headerAboutBtn = document.querySelector('.header-nav-btn[data-tab="about"]');

    if (headerAboutBtn) {
      headerAboutBtn.addEventListener("click", () => {
        document.querySelectorAll(".tab-button").forEach(btn => {
          btn.classList.remove("active");
        });

        document.querySelectorAll(".tab-content").forEach(tab => {
          tab.classList.remove("active");
        });

        const aboutSection = document.getElementById("about");
        if (aboutSection) aboutSection.classList.add("active");
      });
    }

    const accountPlaceholderBtn = document.querySelector(".account-placeholder-btn");

    if (accountPlaceholderBtn) {
      accountPlaceholderBtn.addEventListener("click", () => {
        alert("Accounts and login features are coming soon.");
      });
    }

    const searchInput = document.getElementById("searchInput");
    const brandFilter = document.getElementById("brandFilter");
    const categoryFilter = document.getElementById("categoryFilter");
    const clearArsenalBtn = document.getElementById("clearArsenalBtn");
    const toggleCustomBallFormBtn = document.getElementById("toggleCustomBallFormBtn");
    const customBallFormWrapper = document.getElementById("customBallFormWrapper");
    const customBallForm = document.getElementById("customBallForm");
    const cancelCustomEditBtn = document.getElementById("cancelCustomEditBtn");

    if (searchInput && typeof window.renderBallList === "function") {
      searchInput.addEventListener("input", window.renderBallList);
    }

    if (brandFilter && typeof window.renderBallList === "function") {
      brandFilter.addEventListener("change", window.renderBallList);
    }

    if (categoryFilter && typeof window.renderBallList === "function") {
      categoryFilter.addEventListener("change", window.renderBallList);
    }

    if (clearArsenalBtn) {
      clearArsenalBtn.addEventListener("click", () => {
        if (!confirm("Clear your entire arsenal?")) return;

        if (typeof window.BallBrainArsenal?.clearArsenal === "function") {
          window.BallBrainArsenal.clearArsenal();
        } else {
          localStorage.setItem("arsenal", JSON.stringify([]));
          if (typeof window.renderArsenal === "function") window.renderArsenal();
          if (typeof window.renderBallList === "function") window.renderBallList();
        }
      });
    }

    if (toggleCustomBallFormBtn && customBallFormWrapper) {
      toggleCustomBallFormBtn.addEventListener("click", () => {
        customBallFormWrapper.classList.toggle("hidden");
      });
    }

    if (customBallForm) {
      customBallForm.addEventListener("submit", e => {
        e.preventDefault();

        const editId = document.getElementById("customBallEditId")?.value.trim() || "";

        const newBall = {
          id: editId || (typeof window.createCustomBallId === "function"
            ? window.createCustomBallId()
            : `custom-${Date.now()}`),
          brand: document.getElementById("customBrand")?.value.trim() || "",
          ball_name: document.getElementById("customBallName")?.value.trim() || "",
          category: document.getElementById("customCategory")?.value || "",
          core_type: document.getElementById("customCoreType")?.value || "",
          cover_type: document.getElementById("customCoverType")?.value.trim() || "",
          rg: document.getElementById("customRG")?.value.trim() || "",
          differential: document.getElementById("customDiff")?.value.trim() || "",
          intermediate_diff: document.getElementById("customIntDiff")?.value.trim() || "",
          image: document.getElementById("customImage")?.value.trim() || "",
          isCustom: true
        };

        if (!newBall.brand || !newBall.ball_name || !newBall.category) {
          alert("Brand, Ball Name, and Category are required.");
          return;
        }

        let customBalls =
          typeof window.getCustomBalls === "function" ? window.getCustomBalls() : [];

        if (editId) {
          customBalls = customBalls.map(ball => (ball.id === editId ? newBall : ball));

          if (window.BallBrainArsenal?.getArsenal && window.BallBrainArsenal?.setArsenal) {
            const updatedArsenal = window.BallBrainArsenal
              .getArsenal()
              .map(ball => (ball.id === editId ? newBall : ball));
            window.BallBrainArsenal.setArsenal(updatedArsenal);
          }

          if (Array.isArray(window.compareSelection)) {
            window.compareSelection = window.compareSelection.map(id =>
              id === editId ? newBall.id : id
            );
          }

          if (Array.isArray(window.purchaseSelection)) {
            window.purchaseSelection = window.purchaseSelection.map(id =>
              id === editId ? newBall.id : id
            );
          }

          showToast("Custom ball updated.", "success");
        } else {
          customBalls.push(newBall);
          showToast("Custom ball added.", "success");
        }

        if (typeof window.saveCustomBalls === "function") {
          window.saveCustomBalls(customBalls);
        }

        if (typeof window.loadBalls === "function") {
          window.loadBalls().then(() => {
            if (typeof window.populateFilters === "function") window.populateFilters();
            if (typeof window.populateCompareSelectors === "function") window.populateCompareSelectors();
            if (typeof window.renderBallList === "function") window.renderBallList();
            if (typeof window.renderArsenal === "function") window.renderArsenal();
            if (typeof window.renderRecommendations === "function") window.renderRecommendations();
            if (typeof window.runPurchaseAdvisor === "function") window.runPurchaseAdvisor();
            if (typeof window.renderComparison === "function") window.renderComparison();
          });
        }

        if (typeof window.resetCustomBallForm === "function") {
          window.resetCustomBallForm();
        } else {
          customBallForm.reset();
        }
      });
    }

    if (cancelCustomEditBtn) {
      cancelCustomEditBtn.addEventListener("click", () => {
        if (typeof window.resetCustomBallForm === "function") {
          window.resetCustomBallForm();
        }
      });
    }

    const arsenalScoreHeader = document.getElementById("arsenalScoreHeader");
    const saveScoreImageBtn = document.getElementById("saveScoreImageBtn");

    if (arsenalScoreHeader) {
      arsenalScoreHeader.addEventListener("click", e => {
        if (e.target.id === "saveScoreImageBtn") return;
        if (typeof window.toggleArsenalScoreCard === "function") {
          window.toggleArsenalScoreCard();
        }
      });
    }

    if (saveScoreImageBtn) {
      saveScoreImageBtn.addEventListener("click", e => {
        e.stopPropagation();
        if (typeof window.downloadArsenalScoreImage === "function") {
          window.downloadArsenalScoreImage();
        }
      });
    }
  }

  function editCustomBall(ballId) {
    const customBalls =
      typeof window.getCustomBalls === "function" ? window.getCustomBalls() : [];

    const ball = customBalls.find(item => item.id === ballId);
    if (!ball) return;

    document.getElementById("customBallEditId").value = ball.id;
    document.getElementById("customBrand").value = ball.brand || "";
    document.getElementById("customBallName").value = ball.ball_name || "";
    document.getElementById("customCategory").value = ball.category || "";
    document.getElementById("customCoreType").value = ball.core_type || "";
    document.getElementById("customCoverType").value = ball.cover_type || "";
    document.getElementById("customRG").value = ball.rg || "";
    document.getElementById("customDiff").value = ball.differential || "";
    document.getElementById("customIntDiff").value = ball.intermediate_diff || "";
    document.getElementById("customImage").value = ball.image || "";

    const submitBtn = document.getElementById("customBallSubmitBtn");
    const cancelBtn = document.getElementById("cancelCustomEditBtn");
    const customBallFormWrapper = document.getElementById("customBallFormWrapper");

    if (submitBtn) submitBtn.textContent = "Save Changes";
    if (cancelBtn) cancelBtn.classList.remove("hidden");
    if (customBallFormWrapper) customBallFormWrapper.classList.remove("hidden");

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetCustomBallForm() {
    const form = document.getElementById("customBallForm");
    const editId = document.getElementById("customBallEditId");
    const submitBtn = document.getElementById("customBallSubmitBtn");
    const cancelBtn = document.getElementById("cancelCustomEditBtn");

    if (form) form.reset();
    if (editId) editId.value = "";
    if (submitBtn) submitBtn.textContent = "Add Custom Ball";
    if (cancelBtn) cancelBtn.classList.add("hidden");
  }

  function deleteCustomBall(ballId) {
    if (!confirm("Delete this custom ball?")) return;

    const customBalls =
      typeof window.getCustomBalls === "function"
        ? window.getCustomBalls().filter(ball => ball.id !== ballId)
        : [];

    if (typeof window.saveCustomBalls === "function") {
      window.saveCustomBalls(customBalls);
    }

    if (window.BallBrainArsenal?.getArsenal && window.BallBrainArsenal?.setArsenal) {
      const updatedArsenal = window.BallBrainArsenal
        .getArsenal()
        .filter(ball => ball.id !== ballId);
      window.BallBrainArsenal.setArsenal(updatedArsenal);
    }

    if (Array.isArray(window.compareSelection)) {
      window.compareSelection = window.compareSelection.filter(id => id !== ballId);
    }

    if (Array.isArray(window.purchaseSelection)) {
      window.purchaseSelection = window.purchaseSelection.filter(id => id !== ballId);
    }

    if (typeof window.loadBalls === "function") {
      window.loadBalls().then(() => {
        if (typeof window.populateFilters === "function") window.populateFilters();
        if (typeof window.populateCompareSelectors === "function") window.populateCompareSelectors();
        if (typeof window.renderBallList === "function") window.renderBallList();
        if (typeof window.renderArsenal === "function") window.renderArsenal();
        if (typeof window.renderRecommendations === "function") window.renderRecommendations();
        if (typeof window.runPurchaseAdvisor === "function") window.runPurchaseAdvisor();
        if (typeof window.renderComparison === "function") window.renderComparison();
      });
    }

    showToast("Custom ball deleted.", "warn");
  }

  window.shareLogoImage = shareLogoImage;

  window.preloadShareLogo = preloadShareLogo;
  window.showToast = showToast;
  window.setupTabs = setupTabs;
  window.populateFilters = populateFilters;
  window.populateCompareSelectors = populateCompareSelectors;
  window.populateBallSelectOptions = populateBallSelectOptions;
  window.setupEvents = setupEvents;
  window.editCustomBall = editCustomBall;
  window.resetCustomBallForm = resetCustomBallForm;
  window.deleteCustomBall = deleteCustomBall;
})();