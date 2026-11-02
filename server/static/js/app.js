// ==========================================================================
// GRAPH-BASED RECOMMENDATION SYSTEM - CLIENT CONTROLLER
// High-End Luxury Noir, White & Silver Experience
// ==========================================================================

let networkInstance = null;
let currentUserId = "U0001";
let allUsers = [];
let allProducts = [];
let currentCategoryFilter = "ALL";
let currentGraphMode = "ego"; // "ego", "sample", "explain"
let currentExplainProductId = null;

// Currency formatter for Indian Rupees (₹)
function formatINR(val) {
  const num = Number(val || 0);
  return "₹" + num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// Curated high-resolution Unsplash product photography mapping
const PRODUCT_IMAGE_MAP = {
  // Electronics
  "smartphone": "https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80",
  "wireless earbuds": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80",
  "gaming laptop": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=600&q=80",
  "smartwatch": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
  "4k monitor": "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80",
  "bluetooth speaker": "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80",
  "tablet pro": "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80",
  "smartphone v2": "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80",
  "smartphone #49": "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80",

  // Fashion
  "leather jacket": "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=600&q=80",
  "leather jacket v2": "https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?auto=format&fit=crop&w=600&q=80",
  "running shoes": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
  "denim jeans": "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=600&q=80",
  "cotton hoodie": "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80",
  "designer sunglasses": "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80",
  "wristwatch": "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=600&q=80",
  "sneakers": "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=600&q=80",

  // Home & Kitchen
  "espresso maker": "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=600&q=80",
  "espresso maker v2": "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=600&q=80",
  "air fryer": "https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=600&q=80",
  "chef knife set": "https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=600&q=80",
  "robot vacuum": "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80",
  "ergonomic chair": "https://images.unsplash.com/photo-1580481077195-c22ae4534c79?auto=format&fit=crop&w=600&q=80",
  "blender": "https://images.unsplash.com/photo-1570222094114-d054a817e56b?auto=format&fit=crop&w=600&q=80",
  "aromatherapy diffuser": "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=600&q=80",

  // Sports & Fitness
  "yoga mat": "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=600&q=80",
  "yoga mat v2": "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=600&q=80",
  "adjustable dumbbells": "https://images.unsplash.com/photo-1586401100295-7a8096fd231a?auto=format&fit=crop&w=600&q=80",
  "adjustable dumbbells v2": "https://images.unsplash.com/photo-1586401100295-7a8096fd231a?auto=format&fit=crop&w=600&q=80",
  "resistance bands": "https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&w=600&q=80",
  "hydration flask": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80",
  "treadmill": "https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&w=600&q=80",
  "cycling helmet": "https://images.unsplash.com/photo-1559348349-86f1f65817fe?auto=format&fit=crop&w=600&q=80",

  // Books & Media
  "machine learning handbook": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
  "machine learning handbook v2": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
  "sci-fi best-seller": "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=600&q=80",
  "sci-fi best-seller v2": "https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=600&q=80",
  "productivity guide": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80",
  "productivity guide v2": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80",
  "cooking masterclass": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80",
  "historical novel": "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=600&q=80",

  // Beauty & Wellness
  "hydrating serum": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80",
  "hydrating serum v2": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=600&q=80",
  "sunscreen spf 50": "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80",
  "sunscreen spf 50 v2": "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80",
  "sunscreen spf 50 #50": "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80",
  "electric toothbrush": "https://images.unsplash.com/photo-1559591937-e1032a26fa3a?auto=format&fit=crop&w=600&q=80",
  "electric toothbrush v2": "https://images.unsplash.com/photo-1559591937-e1032a26fa3a?auto=format&fit=crop&w=600&q=80",
  "hair dryer": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80",
  "organic face wash": "https://images.unsplash.com/photo-1556228722-d0b5de70b774?auto=format&fit=crop&w=600&q=80"
};

// Generic fallback images per category
const CATEGORY_IMAGE_MAP = {
  "electronics": "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80",
  "fashion": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80",
  "home & kitchen": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80",
  "sports & fitness": "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80",
  "books & media": "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80",
  "beauty & wellness": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=600&q=80"
};

function getProductImageUrl(product) {
  if (!product) return CATEGORY_IMAGE_MAP["electronics"];
  const nameKey = (product.name || "").toLowerCase().trim();
  if (PRODUCT_IMAGE_MAP[nameKey]) {
    return PRODUCT_IMAGE_MAP[nameKey];
  }
  const catKey = (product.category || "").toLowerCase().trim();
  return CATEGORY_IMAGE_MAP[catKey] || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80";
}

// Initialize Application
document.addEventListener("DOMContentLoaded", async () => {
  setupThemeToggle();
  setupAuthListeners();
  setupNavigationTabs();
  setupCarouselScroll();
  setupCategoryFilters();
  setupSearchFilter();
  setupModalHandlers();
  setupSimulator();

  await fetchOverview();
  await loadProductsCatalog();

  // Route to the appropriate portal (Auth, Admin, or Customer)
  await applyActivePortal();
});

async function initAdminPortal() {
  if (allUsers.length === 0) {
    await loadUsers();
  } else {
    updateUserProfileCard();
  }
  await refreshDashboard();
}

// Setup Dark/Light Theme Switcher
function setupThemeToggle() {
  const toggleBtn = document.getElementById("btn-theme-toggle");
  const icon = document.getElementById("theme-icon");
  const savedTheme = localStorage.getItem("graphrec_theme") || "dark";
  
  applyTheme(savedTheme);

  toggleBtn.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem("graphrec_theme", next);
  });

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === "dark") {
      icon.className = "fas fa-moon";
    } else {
      icon.className = "fas fa-sun";
    }
    if (networkInstance) {
      if (currentGraphMode === "ego") loadUserEgoGraph(currentUserId);
      else loadSampleGraph();
    }
  }
}

// Setup Horizontal Navigation Tabs
function setupNavigationTabs() {
  document.querySelectorAll(".nav-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-tab-btn").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".view-panel").forEach((v) => (v.style.display = "none"));

      btn.classList.add("active");
      const targetId = btn.getAttribute("data-tab");
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.style.display = "block";
      }

      if (targetId === "tab-graph") {
        setTimeout(() => {
          if (!networkInstance) {
            loadUserEgoGraph(currentUserId);
          } else {
            networkInstance.setSize("100%", "600px");
            networkInstance.redraw();
            networkInstance.fit();
          }
        }, 100);
      }
      if (targetId === "tab-recs") {
        renderDedicatedRecsTab();
      }
    });
  });

  // Graph Mode buttons
  const btnEgo = document.getElementById("btn-graph-ego");
  if (btnEgo) {
    btnEgo.addEventListener("click", () => {
      currentGraphMode = "ego";
      highlightGraphBtn("btn-graph-ego");
      loadUserEgoGraph(currentUserId);
    });
  }

  const btnSample = document.getElementById("btn-graph-sample");
  if (btnSample) {
    btnSample.addEventListener("click", () => {
      currentGraphMode = "sample";
      highlightGraphBtn("btn-graph-sample");
      loadSampleGraph();
    });
  }
}

function highlightGraphBtn(activeId) {
  ["btn-graph-ego", "btn-graph-sample"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("btn-primary");
  });
  const activeEl = document.getElementById(activeId);
  if (activeEl) activeEl.classList.add("btn-primary");
}

// Horizontal Carousel Smooth Scrolling & Bidirectional Autoscroll
let autoScrollActive = false;
let autoScrollDirection = 1; // 1 = Left-to-Right, -1 = Right-to-Left
let autoScrollSpeed = 1.6;   // Noticeable, smooth cinematic gliding speed
let scrollAccumulator = 0;
let isInteractingWithCard = false;
let autoScrollPauseUntil = 0;
let autoScrollAnimId = null;

function setupCarouselScroll() {
  const track = document.getElementById("product-carousel-track");
  const prevBtn = document.getElementById("scroll-prev-btn");
  const nextBtn = document.getElementById("scroll-next-btn");
  const toggleBtn = document.getElementById("btn-toggle-autoscroll");

  if (!track) return;

  // Initialize accumulator to current scroll
  scrollAccumulator = track.scrollLeft;

  // Sync accumulator on user manual scroll/drag
  track.addEventListener("scroll", () => {
    if (Math.abs(track.scrollLeft - scrollAccumulator) > 4) {
      scrollAccumulator = track.scrollLeft;
    }
  }, { passive: true });

  // Manual scroll buttons (pause autoscroll for 3.5s after click)
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      autoScrollPauseUntil = Date.now() + 3500;
      autoScrollDirection = -1;
      track.scrollBy({ left: -320, behavior: "smooth" });
      setTimeout(() => { scrollAccumulator = track.scrollLeft; }, 400);
      updateAutoScrollUI();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      autoScrollPauseUntil = Date.now() + 3500;
      autoScrollDirection = 1;
      track.scrollBy({ left: 320, behavior: "smooth" });
      setTimeout(() => { scrollAccumulator = track.scrollLeft; }, 400);
      updateAutoScrollUI();
    });
  }

  // Toggle button for Play/Pause
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      autoScrollActive = !autoScrollActive;
      if (autoScrollActive) {
        scrollAccumulator = track.scrollLeft;
        autoScrollPauseUntil = 0;
      }
      updateAutoScrollUI();
    });
  }

  // Gentle temporary pause on card hover (2.5 seconds) so user can click, but does NOT get stuck indefinitely
  track.addEventListener("mouseenter", () => {
    autoScrollPauseUntil = Date.now() + 2500;
  });

  // Touch and drag support
  track.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button") || e.target.closest(".product-card")) {
      isInteractingWithCard = true;
    }
  });
  window.addEventListener("pointerup", () => {
    if (isInteractingWithCard) {
      autoScrollPauseUntil = Date.now() + 2000;
      isInteractingWithCard = false;
      scrollAccumulator = track.scrollLeft;
    }
  });

  startAutoScrollEngine();
}

function updateAutoScrollUI() {
  const icon = document.getElementById("autoscroll-icon");
  const text = document.getElementById("autoscroll-text");
  if (!icon || !text) return;

  if (autoScrollActive) {
    icon.className = "fas fa-sync-alt fa-spin";
    icon.style.color = "#10B981";
    text.innerText = autoScrollDirection === 1 ? "Auto-Scroll: L ➔ R" : "Auto-Scroll: R ➔ L";
  } else {
    icon.className = "fas fa-pause";
    icon.style.color = "#94A3B8";
    text.innerText = "Auto-Scroll: Paused";
  }
}

function startAutoScrollEngine() {
  const track = document.getElementById("product-carousel-track");
  if (!track) return;

  let lastTimestamp = performance.now();

  function autoScrollStep(timestamp) {
    const elapsed = Math.min(60, timestamp - lastTimestamp);
    lastTimestamp = timestamp;

    const modal = document.getElementById("product-details-modal");
    const isModalOpen = modal && modal.open;

    const maxScroll = track.scrollWidth - track.clientWidth;

    const canScroll = autoScrollActive && 
                      !isInteractingWithCard && 
                      !isModalOpen && 
                      Date.now() > autoScrollPauseUntil &&
                      maxScroll > 10;

    if (canScroll) {
      // Calculate delta normalized to 60fps
      const delta = autoScrollSpeed * (elapsed / 16.67);

      if (autoScrollDirection === 1) {
        // Scrolling from Left to Right
        scrollAccumulator += delta;
        if (scrollAccumulator >= maxScroll - 3) {
          scrollAccumulator = maxScroll;
          track.scrollLeft = maxScroll;
          autoScrollDirection = -1; // Reverse: now scroll Right to Left!
          autoScrollPauseUntil = Date.now() + 1500; // Pause 1.5s at end
          updateAutoScrollUI();
        } else {
          track.scrollLeft = Math.round(scrollAccumulator);
        }
      } else {
        // Scrolling from Right to Left
        scrollAccumulator -= delta;
        if (scrollAccumulator <= 3) {
          scrollAccumulator = 0;
          track.scrollLeft = 0;
          autoScrollDirection = 1; // Reverse: now scroll Left to Right!
          autoScrollPauseUntil = Date.now() + 1500; // Pause 1.5s at start
          updateAutoScrollUI();
        } else {
          track.scrollLeft = Math.round(scrollAccumulator);
        }
      }
    } else {
      // Keep accumulator in sync if paused or clamped
      if (Math.abs(track.scrollLeft - scrollAccumulator) > 4) {
        scrollAccumulator = track.scrollLeft;
      }
    }

    autoScrollAnimId = requestAnimationFrame(autoScrollStep);
  }

  if (autoScrollAnimId) cancelAnimationFrame(autoScrollAnimId);
  autoScrollAnimId = requestAnimationFrame(autoScrollStep);
}

// Category Filter Pills
function setupCategoryFilters() {
  const container = document.getElementById("category-filter-container");
  container.addEventListener("click", (e) => {
    const btn = e.target.closest(".cat-pill");
    if (!btn) return;

    container.querySelectorAll(".cat-pill").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    currentCategoryFilter = btn.getAttribute("data-category");
    renderProductCarousel();
  });
}

// Search Filter
function setupSearchFilter() {
  const input = document.getElementById("product-search-input");
  input.addEventListener("input", () => {
    renderProductCarousel();
  });
}

// Product Details Modal Handlers
function setupModalHandlers() {
  const modal = document.getElementById("product-details-modal");
  const closeBtn = document.getElementById("modal-close-btn");

  closeBtn.addEventListener("click", () => modal.close());

  // Close when clicking modal backdrop
  modal.addEventListener("click", (e) => {
    const rect = modal.getBoundingClientRect();
    const isInDialog = (
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width
    );
    if (!isInDialog) {
      modal.close();
    }
  });
}

// Setup User & Model Controls
function setupSimulator() {
  const userSelect = document.getElementById("user-select");
  if (userSelect) {
    userSelect.addEventListener("change", async (e) => {
      currentUserId = e.target.value;
      updateUserProfileCard();
      await refreshDashboard();
    });
  }

  const modelSelect = document.getElementById("model-select");
  if (modelSelect) {
    modelSelect.addEventListener("change", async () => {
      await fetchRecommendations();
    });
  }

  const kSlider = document.getElementById("k-slider");
  if (kSlider) {
    kSlider.addEventListener("input", (e) => {
      const kValDisplay = document.getElementById("k-val-display");
      if (kValDisplay) kValDisplay.innerText = e.target.value;
    });

    kSlider.addEventListener("change", async () => {
      await fetchRecommendations();
    });
  }

  const btnSimAction = document.getElementById("btn-sim-action");
  if (btnSimAction) {
    btnSimAction.addEventListener("click", async () => {
      const prodSelect = document.getElementById("sim-product-select");
      const actionSelect = document.getElementById("sim-action-select");
      const prodId = prodSelect ? prodSelect.value : "";
      const action = actionSelect ? actionSelect.value : "view";
      if (prodId) {
        await triggerInteraction(currentUserId, prodId, action);
      }
    });
  }
}

// Fetch System Overview Metrics
async function fetchOverview() {
  try {
    const res = await fetch("/api/overview");
    const data = await res.json();

    document.getElementById("stat-users").innerText = data.dataset.num_users;
    document.getElementById("stat-products").innerText = data.dataset.num_products;
    document.getElementById("stat-edges").innerText = data.graph.total_edges;
    document.getElementById("stat-interactions").innerText = (data.dataset.train_interactions + data.dataset.test_interactions);
  } catch (err) {
    console.error("Failed to load overview:", err);
  }
}

// Load Users into Selectors
async function loadUsers() {
  try {
    const res = await fetch("/api/users");
    const data = await res.json();
    allUsers = data.users || [];

    const select = document.getElementById("user-select");
    if (select) {
      select.innerHTML = "";
      allUsers.forEach((u) => {
        const opt = document.createElement("option");
        opt.value = u.user_id;
        opt.innerText = `${u.user_id} - ${u.name} (${u.primary_interest || 'General'})`;
        select.appendChild(opt);
      });

      if (allUsers.length > 0) {
        if (!currentUserId || !allUsers.some(u => u.user_id === currentUserId)) {
          currentUserId = allUsers[0].user_id;
        }
        select.value = currentUserId;
        updateUserProfileCard();
      }
    }
  } catch (err) {
    console.error("Failed to load users:", err);
  }
}

// Load Product Catalog
async function loadProductsCatalog() {
  try {
    const res = await fetch("/api/products");
    const data = await res.json();
    allProducts = data.products || [];

    const simSelect = document.getElementById("sim-product-select");
    simSelect.innerHTML = "";
    allProducts.forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p.product_id;
      opt.innerText = `[${p.category}] ${p.name}`;
      simSelect.appendChild(opt);
    });

    renderProductCarousel();
  } catch (err) {
    console.error("Failed to load products:", err);
  }
}

// Render Horizontal Scrolling Product Carousel on Homepage
function renderProductCarousel() {
  const track = document.getElementById("product-carousel-track");
  const searchVal = (document.getElementById("product-search-input").value || "").toLowerCase().trim();

  let filtered = allProducts;
  if (currentCategoryFilter !== "ALL") {
    filtered = filtered.filter((p) => p.category === currentCategoryFilter);
  }
  if (searchVal) {
    filtered = filtered.filter((p) => 
      p.name.toLowerCase().includes(searchVal) || 
      p.category.toLowerCase().includes(searchVal) ||
      (p.brand && p.brand.toLowerCase().includes(searchVal))
    );
  }

  document.getElementById("catalog-count-badge").innerText = `${filtered.length} Items`;
  track.innerHTML = "";
  scrollAccumulator = 0;
  track.scrollLeft = 0;
  autoScrollPauseUntil = 0;

  if (filtered.length === 0) {
    track.innerHTML = `<div style="padding:2rem; color:var(--text-muted); font-size:0.9rem;">No products match the selected criteria.</div>`;
    return;
  }

  filtered.forEach((p) => {
    const imgUrl = getProductImageUrl(p);
    const card = document.createElement("div");
    card.className = "product-card";

    // Star rating generator (4.5 to 5.0)
    const rating = (4.5 + ((p.price * 17) % 5) / 10).toFixed(1);
    const reviews = Math.floor(40 + (p.price % 180));

    card.innerHTML = `
      <div class="product-card-img-wrap" onclick="openProductDetailsModal('${p.product_id}')">
        <img class="product-card-img" src="${imgUrl}" alt="${p.name}" loading="lazy" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80';">
        <span class="product-badge-category">${p.category}</span>
        <span class="product-badge-brand">${p.brand || 'Premium'}</span>
      </div>
      <div class="product-card-body">
        <div class="product-card-title" onclick="openProductDetailsModal('${p.product_id}')">${p.name}</div>
        <div class="product-rating-row">
          <i class="fas fa-star" style="color:#FFFFFF;"></i>
          <span><b>${rating}</b> (${reviews})</span>
        </div>
        <div class="product-card-price">${formatINR(p.price)}</div>
        <div class="product-card-actions">
          <button class="btn-card-action btn-details" onclick="openProductDetailsModal('${p.product_id}')">
            <i class="fas fa-eye"></i> Product Details
          </button>
          <button class="btn-card-action" onclick="triggerInteraction('${currentUserId}', '${p.product_id}', 'cart')">
            <i class="fas fa-shopping-cart"></i> Cart
          </button>
          <button class="btn-card-action" onclick="triggerInteraction('${currentUserId}', '${p.product_id}', 'purchase')">
            <i class="fas fa-bolt"></i> Buy
          </button>
        </div>
      </div>
    `;

    track.appendChild(card);
  });
}

// Open Product Details Modal Dialog
async function openProductDetailsModal(productId) {
  const modal = document.getElementById("product-details-modal");
  const product = allProducts.find((p) => p.product_id === productId);
  if (!product) return;

  const imgUrl = getProductImageUrl(product);
  document.getElementById("modal-img").src = imgUrl;
  document.getElementById("modal-category").innerText = product.category;
  document.getElementById("modal-brand-badge").innerText = `${product.brand || 'Elite Series'} • ${product.product_id}`;
  document.getElementById("modal-title").innerText = product.name;
  document.getElementById("modal-price").innerText = formatINR(product.price);
  document.getElementById("modal-description").innerText = `Premium ${product.category} offering. Featured in multi-hop behavioral embeddings with high collaborative filtering affinity across customer clusters.`;

  // Action buttons
  document.getElementById("modal-btn-cart").onclick = () => {
    const session = getCurrentSession();
    if (session && session.role === "user") {
      addToCustomerCart(session.user_id, productId);
    } else {
      triggerInteraction(currentUserId, productId, "cart");
    }
  };
  document.getElementById("modal-btn-buy").onclick = async () => {
    const session = getCurrentSession();
    if (session && session.role === "user") {
      await addToCustomerCart(session.user_id, productId, true);
      await checkoutCustomerCart(session.user_id);
    } else {
      triggerInteraction(currentUserId, productId, "purchase");
    }
  };

  // Fetch real-time graph stats for this product
  try {
    const res = await fetch(`/api/product/${productId}`);
    if (res.ok) {
      const data = await res.json();
      const stats = data.graph_stats || {};
      document.getElementById("modal-stat-views").innerText = stats.view || 0;
      document.getElementById("modal-stat-clicks").innerText = stats.search_click || 0;
      document.getElementById("modal-stat-carts").innerText = stats.cart || 0;
      document.getElementById("modal-stat-purchases").innerText = stats.purchase || 0;

      const coContainer = document.getElementById("modal-co-items");
      coContainer.innerHTML = "";
      if (data.co_interacted_items && data.co_interacted_items.length > 0) {
        data.co_interacted_items.forEach((item) => {
          const chip = document.createElement("span");
          chip.className = "chip";
          chip.style.cursor = "pointer";
          chip.innerText = `${item.name} (${item.co_count}x)`;
          chip.onclick = () => openProductDetailsModal(item.product_id);
          coContainer.appendChild(chip);
        });
      } else {
        coContainer.innerHTML = `<span style="font-size:0.75rem; color:var(--text-muted);">None recorded yet</span>`;
      }
    }
  } catch (e) {
    console.error("Failed to load product graph details:", e);
  }

  modal.showModal();
}

// Update Active Customer Profile Card
function updateUserProfileCard() {
  const user = allUsers.find((u) => u.user_id === currentUserId) || allUsers[0];
  if (!user) return;

  currentUserId = user.user_id;

  const userSelect = document.getElementById("user-select");
  if (userSelect && userSelect.value !== user.user_id) {
    userSelect.value = user.user_id;
  }

  const avatar = document.getElementById("user-avatar-text");
  if (avatar) avatar.innerText = (user.name || "U").charAt(0).toUpperCase();

  const nameEl = document.getElementById("user-card-name");
  if (nameEl) nameEl.innerText = user.name || user.user_id;

  const idEl = document.getElementById("user-card-id");
  if (idEl) {
    const age = user.age_group || "25-34";
    const act = (user.activity_level || "active").toString().toUpperCase();
    idEl.innerText = `${user.user_id} • Age ${age} • ${act}`;
  }

  const chipsContainer = document.getElementById("user-card-interests");
  if (chipsContainer) {
    chipsContainer.innerHTML = "";
    const interestStr = user.interests || user.primary_interest || "General";
    interestStr.split(",").forEach((item) => {
      const clean = item.trim();
      if (clean) {
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.innerText = clean;
        chipsContainer.appendChild(chip);
      }
    });
  }

  const recSub = document.getElementById("recs-subtitle");
  if (recSub) {
    recSub.innerText = `Personalized for ${user.name} (${user.primary_interest || 'General'}) based on recursive graph convolutions & PageRank diffusion.`;
  }
}

// Refresh Entire Dashboard State
async function refreshDashboard() {
  await Promise.all([
    fetchUserHistory(currentUserId),
    fetchRecommendations(),
    loadUserEgoGraph(currentUserId),
    fetchBenchmark()
  ]);
}

// Fetch and Render Horizontal User History
async function fetchUserHistory(userId) {
  try {
    const container = document.getElementById("user-history-list");
    if (!container) return;

    const res = await fetch(`/api/user/${userId}/history`);
    const data = await res.json();
    container.innerHTML = "";

    const countEl = document.getElementById("user-history-count");
    if (countEl) countEl.innerText = `${data.total_interactions || 0} events logged`;

    if (!data.history || data.history.length === 0) {
      container.innerHTML = '<div style="color:var(--text-muted); font-size:0.75rem;">No past interactions logged.</div>';
      return;
    }

    data.history.slice(0, 10).forEach((h) => {
      const chip = document.createElement("div");
      chip.className = "history-chip";

      let badgeClass = "action-view";
      if (h.action_type === "cart") badgeClass = "action-cart";
      if (h.action_type === "purchase") badgeClass = "action-purchase";
      if (h.action_type === "search_click") badgeClass = "action-search";

      chip.innerHTML = `
        <div class="history-chip-header">
          <span style="font-size:0.7rem; color:var(--text-muted);">${h.category}</span>
          <span class="action-badge ${badgeClass}">${h.action_type}</span>
        </div>
        <div style="font-size:0.8rem; font-weight:700; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
          ${h.name || h.product_id}
        </div>
        <div style="font-size:0.72rem; color:var(--silver-300); margin-top:0.2rem;">
          ${formatINR(h.price)}
        </div>
      `;
      container.appendChild(chip);
    });
  } catch (err) {
    console.error("Failed to load history:", err);
  }
}

// Fetch Personalized Recommendations
let cachedRecommendations = [];

async function fetchRecommendations() {
  const modelSelect = document.getElementById("model-select");
  const model = modelSelect ? modelSelect.value : "hybrid";
  const kSlider = document.getElementById("k-slider");
  const k = kSlider ? kSlider.value : 8;
  const grid = document.getElementById("recs-container");
  if (!grid) return;
  grid.innerHTML = '<div style="color:var(--text-muted); grid-column: 1/-1;">Computing personalized graph embeddings...</div>';

  try {
    const res = await fetch(`/api/recommendations?user_id=${currentUserId}&model_name=${model}&k=${k}`);
    const data = await res.json();
    cachedRecommendations = data.recommendations || [];
    renderRecommendationCards(grid, cachedRecommendations);

    // Also populate dedicated tab container if it exists
    const tabGrid = document.getElementById("tab-recs-container");
    if (tabGrid) {
      renderRecommendationCards(tabGrid, cachedRecommendations);
    }
  } catch (err) {
    console.error("Failed to load recommendations:", err);
    grid.innerHTML = '<div style="color:var(--text-muted); grid-column: 1/-1;">Error computing recommendations.</div>';
  }
}

function renderDedicatedRecsTab() {
  const tabGrid = document.getElementById("tab-recs-container");
  if (tabGrid && cachedRecommendations.length > 0) {
    renderRecommendationCards(tabGrid, cachedRecommendations);
  }
}

function renderRecommendationCards(container, items) {
  container.innerHTML = "";

  if (!items || items.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted); grid-column: 1/-1;">No recommendations generated.</div>';
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("div");
    card.className = "rec-card";

    const scoreVal = item.adjusted_score !== undefined ? item.adjusted_score : (item.score || 0.5);
    const scorePct = Math.min(100, Math.max(15, Math.round((Math.abs(scoreVal) / (item.score > 1 ? 5 : 1)) * 100)));

    let explanationHtml = "";
    if (item.explanation) {
      explanationHtml = `
        <div class="rec-explanation">
          <i class="fas fa-lightbulb" style="color:#FFFFFF; margin-right:4px;"></i>
          <b>Rationale:</b> ${item.explanation.summary}
        </div>
      `;
    }

    card.innerHTML = `
      <div class="rec-rank-badge">#${item.rank}</div>
      <div class="rec-category">${item.category}</div>
      <div class="rec-title">${item.name}</div>
      <div class="rec-price">${formatINR(item.price)}</div>
      
      <div class="score-bar-wrap">
        <div class="score-bar-labels">
          <span>Graph Affinity Score</span>
          <span>${(scoreVal).toFixed(3)}</span>
        </div>
        <div class="score-bar-bg">
          <div class="score-bar-fill" style="width: ${scorePct}%;"></div>
        </div>
      </div>

      ${explanationHtml}

      <div class="rec-actions">
        <button class="rec-act-btn" onclick="openProductDetailsModal('${item.product_id}')">
          <i class="fas fa-eye"></i> Specs
        </button>
        <button class="rec-act-btn" onclick="triggerInteraction('${currentUserId}', '${item.product_id}', 'cart')">
          <i class="fas fa-shopping-cart"></i> Cart
        </button>
        <button class="rec-act-btn" style="grid-column: 1 / -1;" onclick="inspectExplanationGraph('${currentUserId}', '${item.product_id}')">
          <i class="fas fa-project-diagram"></i> Trace Graph Traversal
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}

// Helper function to create rich, styled DOM tooltip for Vis.js Network
function formatGraphTooltip(titleContent, itemData, isEdge = false) {
  if (!titleContent && !itemData) return undefined;

  const container = document.createElement("div");
  container.className = "network-tooltip-card";

  if (isEdge) {
    const rel = itemData?.label || (typeof titleContent === "string" ? titleContent.split("<br")[0].replace("Relation:", "").trim() : "Interaction");
    const weight = itemData?.raw_data?.weight || (typeof titleContent === "string" && titleContent.includes("Weight:") ? titleContent.split("Weight:")[1].trim() : "");
    container.innerHTML = `
      <div class="tt-header">
        <span class="tt-id">${rel.toUpperCase()}</span>
        <span class="tt-badge tt-badge-edge"><i class="fas fa-link"></i> Relation</span>
      </div>
      <div class="tt-body">
        <div class="tt-row"><span class="tt-label">Type:</span> <span class="tt-val">${rel}</span></div>
        ${weight ? `<div class="tt-row"><span class="tt-label">Weight:</span> <span class="tt-val">${weight}</span></div>` : ""}
      </div>
    `;
    return container;
  }

  // Node formatting
  const raw = itemData?.raw_data || {};
  const group = itemData?.group || (itemData?.id?.startsWith("U") ? "user" : itemData?.id?.startsWith("P") ? "product" : "category");
  const id = itemData?.id || "";

  let icon = "fa-cube";
  let badgeClass = "tt-badge-prod";
  let typeLabel = "Product";

  if (group === "user") {
    icon = "fa-user";
    badgeClass = "tt-badge-user";
    typeLabel = "Customer";
  } else if (group === "category") {
    icon = "fa-tag";
    badgeClass = "tt-badge-cat";
    typeLabel = "Category";
  }

  let detailsHtml = "";
  if (group === "user") {
    const name = raw.name || id;
    const interests = raw.interests || "General";
    const activity = raw.activity_level || "Active";
    detailsHtml = `
      <div class="tt-row"><span class="tt-label">Name:</span> <span class="tt-val">${name}</span></div>
      <div class="tt-row"><span class="tt-label">Interests:</span> <span class="tt-val">${interests}</span></div>
      <div class="tt-row"><span class="tt-label">Activity:</span> <span class="tt-val">${activity}</span></div>
    `;
  } else if (group === "product") {
    const name = raw.name || id;
    const category = raw.category || "";
    const priceVal = typeof raw.price === "number" ? `$${raw.price.toFixed(2)}` : (raw.price || "");
    detailsHtml = `
      <div class="tt-row"><span class="tt-label">Product:</span> <span class="tt-val">${name}</span></div>
      ${category ? `<div class="tt-row"><span class="tt-label">Category:</span> <span class="tt-val">${category}</span></div>` : ""}
      ${priceVal ? `<div class="tt-row"><span class="tt-label">Price:</span> <span class="tt-val">${priceVal}</span></div>` : ""}
    `;
  } else {
    const name = raw.name || id.replace("CAT_", "");
    detailsHtml = `
      <div class="tt-row"><span class="tt-label">Category:</span> <span class="tt-val">${name}</span></div>
    `;
  }

  container.innerHTML = `
    <div class="tt-header">
      <span class="tt-id">${id}</span>
      <span class="tt-badge ${badgeClass}"><i class="fas ${icon}"></i> ${typeLabel}</span>
    </div>
    <div class="tt-body">
      ${detailsHtml}
    </div>
  `;

  return container;
}

// Vis.js Monochrome Black, White & Silver Network Graph
function renderNetwork(graphData) {
  const container = document.getElementById("network-graph-container");
  if (!container) return;

  const isLight = document.documentElement.getAttribute("data-theme") === "light";

  // High-contrast, crystal-clear typography and palette for Vis.js
  const labelColor = isLight ? "#090A0C" : "#FFFFFF";
  const strokeColor = isLight ? "#FFFFFF" : "#090A0C";
  const strokeWidth = 4;

  const userColor = isLight ? "#0284C7" : "#38BDF8";
  const prodColor = isLight ? "#059669" : "#34D399";
  const catColor = isLight ? "#7C3AED" : "#A78BFA";

  const nodes = (graphData.nodes || []).map((n) => {
    const grp = (n.group || "").toLowerCase();
    const id = n.id || "";
    const raw = n.raw_data || {};

    let cleanTitle = `${id}`;
    if (grp === "user" || id.startsWith("U")) {
      cleanTitle += `\nType: Customer\nName: ${raw.name || id}\nInterests: ${raw.interests || 'General'}\nActivity: ${raw.activity_level || 'Active'}`;
    } else if (grp === "category" || id.startsWith("CAT_") || id.startsWith("C_")) {
      cleanTitle += `\nType: Category\nCategory: ${raw.name || id.replace('CAT_', '')}`;
    } else {
      const priceStr = typeof raw.price === 'number' ? `$${raw.price.toFixed(2)}` : (raw.price || '');
      cleanTitle += `\nType: Product\nProduct: ${raw.name || id}\nCategory: ${raw.category || ''}`;
      if (priceStr) cleanTitle += `\nPrice: ${priceStr}`;
    }

    let bg = prodColor;
    let border = isLight ? "#047857" : "#6EE7B7";
    let size = 20;

    if (grp === "user" || id.startsWith("U")) {
      bg = userColor;
      border = isLight ? "#0369A1" : "#BAE6FD";
      size = 24;
    } else if (grp === "category" || id.startsWith("CAT_") || id.startsWith("C_")) {
      bg = catColor;
      border = isLight ? "#6D28D9" : "#DDD6FE";
      size = 18;
    }

    return {
      ...n,
      title: cleanTitle,
      size: size,
      color: {
        background: bg,
        border: border,
        highlight: { background: "#FFFFFF", border: "#FFFFFF" }
      },
      font: {
        color: labelColor,
        face: "Inter, system-ui, -apple-system, sans-serif",
        size: 13,
        strokeWidth: strokeWidth,
        strokeColor: strokeColor,
        multi: true,
        vadjust: 0
      }
    };
  });

  const edges = (graphData.edges || []).map((e) => {
    const relUpper = (e.label || "").toUpperCase();
    let edgeColor = isLight ? "#64748B" : "#94A3B8";
    let edgeWidth = 1.8;

    if (relUpper.includes("PURCHASE")) {
      edgeColor = isLight ? "#0284C7" : "#38BDF8";
      edgeWidth = 3.0;
    } else if (relUpper.includes("CART")) {
      edgeColor = isLight ? "#059669" : "#34D399";
      edgeWidth = 2.4;
    } else if (relUpper.includes("SEARCH")) {
      edgeColor = isLight ? "#D97706" : "#FBBF24";
      edgeWidth = 2.0;
    } else if (relUpper.includes("BELONGS")) {
      edgeColor = isLight ? "#7C3AED" : "#A78BFA";
      edgeWidth = 1.6;
    }

    const cleanEdgeTitle = `Relation: ${relUpper}\nWeight: ${e.raw_data?.weight || 1.0}`;
    return {
      ...e,
      title: cleanEdgeTitle,
      width: edgeWidth,
      color: { color: edgeColor, highlight: "#FFFFFF" },
      font: {
        color: labelColor,
        size: 11,
        strokeWidth: 3,
        strokeColor: strokeColor,
        face: "Inter, system-ui, -apple-system, sans-serif",
        align: "middle"
      }
    };
  });

  const data = { nodes: new vis.DataSet(nodes), edges: new vis.DataSet(edges) };
  const options = {
    nodes: {
      borderWidth: 2,
      shadow: true,
      font: {
        strokeWidth: strokeWidth,
        strokeColor: strokeColor
      }
    },
    edges: {
      shadow: false,
      smooth: { type: "continuous" },
      font: {
        strokeWidth: 3,
        strokeColor: strokeColor
      }
    },
    physics: {
      stabilization: { iterations: 120 },
      barnesHut: {
        gravitationalConstant: -3200,
        springLength: 90,
        springConstant: 0.04
      }
    },
    interaction: {
      hover: true,
      tooltipDelay: 100,
      zoomView: true,
      dragView: true
    }
  };

  if (networkInstance) {
    networkInstance.destroy();
    networkInstance = null;
  }

  networkInstance = new vis.Network(container, data, options);
  networkInstance.setSize("100%", "600px");

  setTimeout(() => {
    if (networkInstance) {
      networkInstance.redraw();
      networkInstance.fit();
    }
  }, 100);

  const handleNodeInteraction = (clickedId) => {
    if (!clickedId) return;
    if (clickedId.startsWith("P")) {
      openProductDetailsModal(clickedId);
    } else if (clickedId.startsWith("U")) {
      const userSelect = document.getElementById("user-select");
      if (userSelect && userSelect.value !== clickedId) {
        userSelect.value = clickedId;
        currentUserId = clickedId;
        updateUserProfileCard();
        refreshDashboard();
        showToast(`Switched active customer to ${clickedId}`);
      } else {
        showToast(`Customer: ${clickedId}`);
      }
    } else {
      showToast(`Category: ${clickedId.replace("CAT_", "")}`);
    }
  };

  networkInstance.on("click", (params) => {
    if (params.nodes.length > 0) {
      handleNodeInteraction(params.nodes[0]);
    }
  });

  networkInstance.on("selectNode", (params) => {
    if (params.nodes && params.nodes.length > 0) {
      handleNodeInteraction(params.nodes[0]);
    }
  });
}

async function loadUserEgoGraph(userId) {
  try {
    const titleEl = document.getElementById("graph-title-status");
    if (titleEl) titleEl.innerText = `Customer Ego-Network (${userId})`;

    const res = await fetch(`/api/graph/user-ego?user_id=${userId}`);
    const data = await res.json();
    renderNetwork(data);
  } catch (err) {
    console.error("Failed to load user ego-graph:", err);
  }
}

async function loadSampleGraph() {
  try {
    const titleEl = document.getElementById("graph-title-status");
    if (titleEl) titleEl.innerText = "Customer Ego-Network";

    const res = await fetch("/api/graph/sample");
    const data = await res.json();
    renderNetwork(data);
  } catch (err) {
    console.error("Failed to load sample graph:", err);
  }
}

async function inspectExplanationGraph(userId, productId) {
  try {
    // Switch to graph tab
    document.querySelectorAll(".nav-tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".view-panel").forEach((v) => (v.style.display = "none"));

    const graphTabBtn = document.querySelector('[data-tab="tab-graph"]');
    if (graphTabBtn) graphTabBtn.classList.add("active");
    const graphPanel = document.getElementById("tab-graph");
    if (graphPanel) graphPanel.style.display = "block";

    const titleEl = document.getElementById("graph-title-status");
    if (titleEl) titleEl.innerText = `Reasoning Path: Customer ${userId} ➔ Product ${productId}`;

    const res = await fetch(`/api/graph/explain?user_id=${userId}&product_id=${productId}`);
    const data = await res.json();
    renderNetwork(data);
  } catch (err) {
    console.error("Failed to load explanation graph:", err);
  }
}

// Trigger Live Customer Behavior Event
async function triggerInteraction(userId, productId, actionType) {
  try {
    const res = await fetch("/api/interact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        product_id: productId,
        action_type: actionType
      })
    });

    const data = await res.json();
    if (res.ok) {
      showToast(`Recorded '${actionType}' on item ${productId} for ${userId}`);
      await refreshDashboard();
    } else {
      showToast(data.detail || "Interaction failed", true);
    }
  } catch (err) {
    console.error("Interaction failed:", err);
    showToast("Network error executing event", true);
  }
}

// Fetch Benchmark Offline Evaluation
async function fetchBenchmark() {
  try {
    const res = await fetch("/api/benchmark");
    const data = await res.json();
    if (!data.results) return;

    const tbody = document.getElementById("benchmark-table-body");
    tbody.innerHTML = "";

    data.results.forEach((row) => {
      const tr = document.createElement("tr");
      const isTop = row["Model"].includes("Hybrid") || row["Model"].includes("LightGCN");
      if (isTop) {
        tr.style.fontWeight = "700";
      }

      const ndcg = Number(row["NDCG@10"] ?? 0);
      const hr = Number(row["HitRate@10"] ?? row["HR@10"] ?? 0);
      const prec = Number(row["Precision@10"] ?? row["P@10"] ?? 0);
      const rec = Number(row["Recall@10"] ?? row["R@10"] ?? 0);
      const cov = Number(row["CatalogCoverage"] ?? row["Coverage"] ?? 0);
      const div = Number(row["Diversity"] ?? 0);

      tr.innerHTML = `
        <td style="color:var(--text-primary);"><i class="fas ${isTop ? 'fa-award' : 'fa-circle-notch'}" style="margin-right:6px; font-size:0.75rem;"></i>${row["Model"]}</td>
        <td>${ndcg.toFixed(4)}</td>
        <td>${hr.toFixed(4)}</td>
        <td>${prec.toFixed(4)}</td>
        <td>${rec.toFixed(4)}</td>
        <td>${(cov * 100).toFixed(1)}%</td>
        <td>${div.toFixed(3)}</td>
      `;
      tbody.appendChild(tr);
    });

    const chartImg = document.getElementById("benchmark-chart-img");
    if (chartImg && data.chart_url) {
      chartImg.src = `${data.chart_url}?t=${Date.now()}`;
    }
  } catch (err) {
    console.error("Failed to load benchmark:", err);
  }
}

// Floating Toast Notification
let toastTimeout = null;
function showToast(msg, isError = false) {
  const toast = document.getElementById("toast-notification");
  const text = document.getElementById("toast-text");
  text.innerText = msg;
  toast.classList.add("show");

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}


// ==========================================================================
// SESSION MANAGEMENT & AUTHENTICATION CONTROLLER
// ==========================================================================

function getCurrentSession() {
  try {
    const s = localStorage.getItem("graphrec_session");
    return s ? JSON.parse(s) : null;
  } catch (e) {
    return null;
  }
}

function saveSession(user) {
  localStorage.setItem("graphrec_session", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("graphrec_session");
}

function setupAuthListeners() {
  const tabSignIn = document.getElementById("tab-btn-signin");
  const tabSignUp = document.getElementById("tab-btn-signup");
  const formSignIn = document.getElementById("form-signin");
  const formSignUp = document.getElementById("form-signup");
  const errSignIn = document.getElementById("signin-error");
  const errSignUp = document.getElementById("signup-error");

  // Tab Switching
  if (tabSignIn && tabSignUp) {
    tabSignIn.onclick = () => {
      tabSignIn.classList.add("active");
      tabSignUp.classList.remove("active");
      formSignIn.style.display = "flex";
      formSignUp.style.display = "none";
      if (errSignIn) errSignIn.style.display = "none";
      if (errSignUp) errSignUp.style.display = "none";
    };

    tabSignUp.onclick = () => {
      tabSignUp.classList.add("active");
      tabSignIn.classList.remove("active");
      formSignUp.style.display = "flex";
      formSignIn.style.display = "none";
      if (errSignIn) errSignIn.style.display = "none";
      if (errSignUp) errSignUp.style.display = "none";
    };
  }

  // Handle Sign In submission
  const handleSignIn = async () => {
    const email = document.getElementById("login-email")?.value.trim() || "";
    const password = document.getElementById("login-password")?.value || "";

    if (!email || !password) {
      if (errSignIn) {
        errSignIn.innerText = "Please enter both email and password.";
        errSignIn.style.display = "flex";
      }
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (res.ok && data.status === "success") {
        if (errSignIn) errSignIn.style.display = "none";
        saveSession(data.user);
        showToast(`Welcome back, ${data.user.name}!`);
        const emailInput = document.getElementById("login-email");
        const passInput = document.getElementById("login-password");
        if (emailInput) emailInput.value = "";
        if (passInput) passInput.value = "";
        await applyActivePortal();
      } else {
        if (errSignIn) {
          errSignIn.innerText = data.detail || "Invalid email or password.";
          errSignIn.style.display = "flex";
        }
      }
    } catch (err) {
      console.error("Sign in failed:", err);
      if (errSignIn) {
        errSignIn.innerText = "Network error communicating with authentication service.";
        errSignIn.style.display = "flex";
      }
    }
  };

  const btnSignIn = document.getElementById("btn-submit-signin");
  if (btnSignIn) btnSignIn.onclick = handleSignIn;
  if (formSignIn) {
    formSignIn.onsubmit = (e) => {
      e.preventDefault();
      handleSignIn();
    };
  }

  // Handle Registration submission
  const handleSignUp = async () => {
    const name = document.getElementById("reg-name")?.value.trim() || "";
    const email = document.getElementById("reg-email")?.value.trim() || "";
    const password = document.getElementById("reg-password")?.value || "";
    const primary_interest = document.getElementById("reg-interest")?.value || "Electronics";

    if (!name || !email || !password) {
      if (errSignUp) {
        errSignUp.innerText = "Please complete all registration fields.";
        errSignUp.style.display = "flex";
      }
      return;
    }

    if (password.length < 4) {
      if (errSignUp) {
        errSignUp.innerText = "Password must be at least 4 characters long.";
        errSignUp.style.display = "flex";
      }
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, primary_interest })
      });
      const data = await res.json();

      if (res.ok && data.status === "success") {
        if (errSignUp) errSignUp.style.display = "none";
        saveSession(data.user);
        showToast(`Account registered! Welcome to GraphStore, ${data.user.name}.`);
        const nameInput = document.getElementById("reg-name");
        const emailInput = document.getElementById("reg-email");
        const passInput = document.getElementById("reg-password");
        if (nameInput) nameInput.value = "";
        if (emailInput) emailInput.value = "";
        if (passInput) passInput.value = "";
        await applyActivePortal();
      } else {
        if (errSignUp) {
          errSignUp.innerText = data.detail || "Registration failed. Please try again.";
          errSignUp.style.display = "flex";
        }
      }
    } catch (err) {
      console.error("Registration failed:", err);
      if (errSignUp) {
        errSignUp.innerText = "Network error during account registration.";
        errSignUp.style.display = "flex";
      }
    }
  };

  const btnSignUp = document.getElementById("btn-submit-signup");
  if (btnSignUp) btnSignUp.onclick = handleSignUp;
  if (formSignUp) {
    formSignUp.onsubmit = (e) => {
      e.preventDefault();
      handleSignUp();
    };
  }

  // Logout Listeners
  const btnAdminLogout = document.getElementById("btn-admin-logout");
  if (btnAdminLogout) {
    btnAdminLogout.onclick = async () => {
      clearSession();
      showToast("Signed out of Admin Console.");
      await applyActivePortal();
    };
  }

  const btnCustLogout = document.getElementById("btn-customer-logout");
  if (btnCustLogout) {
    btnCustLogout.onclick = async () => {
      clearSession();
      showToast("Signed out of customer store.");
      await applyActivePortal();
    };
  }

  // Customer theme toggle
  const custThemeToggle = document.getElementById("btn-cust-theme-toggle");
  if (custThemeToggle) {
    custThemeToggle.onclick = () => {
      const current = document.documentElement.getAttribute("data-theme") || "dark";
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("graphrec_theme", next);
      const icon1 = document.getElementById("theme-icon");
      const icon2 = document.getElementById("cust-theme-icon");
      if (icon1) icon1.className = next === "dark" ? "fas fa-moon" : "fas fa-sun";
      if (icon2) icon2.className = next === "dark" ? "fas fa-moon" : "fas fa-sun";
    };
  }

  // Checkout button listener
  const btnCheckout = document.getElementById("btn-cust-checkout");
  if (btnCheckout) {
    btnCheckout.onclick = async () => {
      const session = getCurrentSession();
      if (session) {
        await checkoutCustomerCart(session.user_id);
      }
    };
  }
}

async function applyActivePortal() {
  const session = getCurrentSession();
  const authView = document.getElementById("view-auth");
  const adminView = document.getElementById("view-admin");
  const custView = document.getElementById("view-customer");

  if (!session) {
    if (authView) authView.style.display = "block";
    if (adminView) adminView.style.display = "none";
    if (custView) custView.style.display = "none";
    return;
  }

  if (session.role === "admin") {
    if (authView) authView.style.display = "none";
    if (adminView) adminView.style.display = "block";
    if (custView) custView.style.display = "none";

    currentUserId = session.user_id || "U0001";
    await initAdminPortal();
  } else {
    // Regular Customer account
    if (authView) authView.style.display = "none";
    if (adminView) adminView.style.display = "none";
    if (custView) custView.style.display = "block";

    await initCustomerPortal(session);
  }
}

// ==========================================================================
// CUSTOMER E-COMMERCE PORTAL CONTROLLER
// ==========================================================================

let currentCustomerTab = "cust-tab-foryou";
let customerCatalogFilter = "ALL";

async function initCustomerPortal(session) {
  const displayName = document.getElementById("cust-display-name");
  if (displayName) displayName.innerText = session.name || "Customer";

  const displaySub = document.getElementById("cust-display-sub");
  if (displaySub) displaySub.innerText = `${session.user_id} • ${session.primary_interest || "General"}`;

  const avatarBadge = document.getElementById("cust-avatar-badge");
  if (avatarBadge) avatarBadge.innerText = (session.name || "C").charAt(0).toUpperCase();

  const welcomeTitle = document.getElementById("cust-welcome-title");
  if (welcomeTitle) welcomeTitle.innerText = `Welcome back, ${session.name.split(" ")[0]}!`;

  const welcomeSubtitle = document.getElementById("cust-welcome-subtitle");
  if (welcomeSubtitle) {
    welcomeSubtitle.innerText = `Here are your live graph recommendations tailored to your interest in ${session.primary_interest || "our collections"}. Interactions dynamically adapt your neural graph embeddings.`;
  }

  setupCustomerNavigation();
  setupCustomerCatFilters();
  setupCustomerSearch();

  await loadCustomerCart(session.user_id);
  await loadCustomerRecommendations(session.user_id);
  await loadCustomerCatalog();
  await loadCustomerOrders(session.user_id);
}

function setupCustomerNavigation() {
  document.querySelectorAll(".cust-nav-btn").forEach((btn) => {
    btn.onclick = () => {
      const targetTab = btn.getAttribute("data-cust-tab");
      switchCustomerTab(targetTab);
    };
  });
}

function switchCustomerTab(tabId) {
  currentCustomerTab = tabId;
  document.querySelectorAll(".cust-nav-btn").forEach((b) => {
    if (b.getAttribute("data-cust-tab") === tabId) b.classList.add("active");
    else b.classList.remove("active");
  });
  document.querySelectorAll(".cust-tab-panel").forEach((panel) => {
    if (panel.id === tabId) panel.style.display = "block";
    else panel.style.display = "none";
  });
  const session = getCurrentSession();
  if (session) {
    if (tabId === "cust-tab-cart") loadCustomerCart(session.user_id);
    if (tabId === "cust-tab-orders") loadCustomerOrders(session.user_id);
  }
}

async function loadCustomerRecommendations(userId) {
  const session = getCurrentSession();
  const uId = userId || (session ? session.user_id : "U0001");
  const container = document.getElementById("cust-foryou-grid");
  if (!container) return;
  container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--text-muted);"><i class="fas fa-spinner fa-spin fa-2x" style="margin-bottom:1rem; display:block;"></i>Synthesizing personalized graph recommendations...</div>`;

  try {
    const res = await fetch(`/api/recommendations?user_id=${uId}&model_name=hybrid&k=8`);
    const data = await res.json();
    const recs = data.recommendations || [];

    if (recs.length === 0) {
      container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--text-muted);">Explore our catalog to discover recommendations tailored for you!</div>`;
      return;
    }

    container.innerHTML = "";
    recs.forEach((item) => {
      const card = document.createElement("div");
      card.className = "cust-product-card";
      const fullProd = allProducts.find((p) => p.product_id === item.product_id) || item;
      const imgUrl = getProductImageUrl(fullProd);
      const scorePct = Math.min(99, Math.round((item.adjusted_score || item.score || 0.88) * 100));

      card.innerHTML = `
        <div class="cust-card-img-wrap" style="cursor:pointer;" onclick="openProductDetailsModal('${item.product_id}')">
          <img src="${imgUrl}" alt="${item.name}" class="cust-card-img" loading="lazy">
        </div>
        <div class="cust-card-body">
          <div class="cust-card-cat">${item.category}</div>
          <div class="cust-card-title" style="cursor:pointer;" onclick="openProductDetailsModal('${item.product_id}')">${item.name}</div>
          <div class="cust-card-match">
            <i class="fas fa-magic"></i> ${scorePct}% Graph Affinity
          </div>
          <div class="cust-card-footer">
            <div class="cust-card-price">${formatINR(item.price)}</div>
            <button class="btn-add-cart" onclick="addToCustomerCart('${uId}', '${item.product_id}')">
              <i class="fas fa-shopping-cart"></i> Add to Cart
            </button>
          </div>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Failed to load customer recommendations:", err);
    container.innerHTML = `<div style="grid-column:1/-1; color:#F87171; text-align:center; padding:2rem;">Failed to load recommendations.</div>`;
  }
}

function renderCustomerCatalog() {
  const container = document.getElementById("cust-catalog-grid");
  if (!container) return;

  const session = getCurrentSession();
  const uId = session ? session.user_id : "U0001";
  const searchVal = (document.getElementById("cust-catalog-search")?.value || "").toLowerCase().trim();

  let filtered = allProducts;
  if (customerCatalogFilter !== "ALL") {
    filtered = filtered.filter((p) => p.category === customerCatalogFilter);
  }
  if (searchVal) {
    filtered = filtered.filter((p) =>
      p.name.toLowerCase().includes(searchVal) ||
      p.category.toLowerCase().includes(searchVal) ||
      (p.brand && p.brand.toLowerCase().includes(searchVal))
    );
  }

  const countBadge = document.getElementById("cust-catalog-count");
  if (countBadge) countBadge.innerText = `${filtered.length} Products`;

  if (filtered.length === 0) {
    container.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--text-muted);">No products match your criteria.</div>`;
    return;
  }

  container.innerHTML = "";
  filtered.forEach((prod) => {
    const card = document.createElement("div");
    card.className = "cust-product-card";
    const imgUrl = getProductImageUrl(prod);

    card.innerHTML = `
      <div class="cust-card-img-wrap" style="cursor:pointer;" onclick="openProductDetailsModal('${prod.product_id}')">
        <img src="${imgUrl}" alt="${prod.name}" class="cust-card-img" loading="lazy">
      </div>
      <div class="cust-card-body">
        <div class="cust-card-cat">${prod.category}</div>
        <div class="cust-card-title" style="cursor:pointer;" onclick="openProductDetailsModal('${prod.product_id}')">${prod.name}</div>
        <div class="cust-card-footer">
          <div class="cust-card-price">${formatINR(prod.price)}</div>
          <button class="btn-add-cart" onclick="addToCustomerCart('${uId}', '${prod.product_id}')">
            <i class="fas fa-shopping-cart"></i> Add to Cart
          </button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function setupCustomerCatFilters() {
  const container = document.getElementById("cust-cat-filters");
  if (!container) return;
  container.querySelectorAll(".cat-pill").forEach((btn) => {
    btn.onclick = () => {
      container.querySelectorAll(".cat-pill").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      customerCatalogFilter = btn.getAttribute("data-cust-cat") || "ALL";
      renderCustomerCatalog();
    };
  });
}

function setupCustomerSearch() {
  const searchInput = document.getElementById("cust-catalog-search");
  if (searchInput) {
    searchInput.oninput = () => {
      renderCustomerCatalog();
    };
  }
}

async function loadCustomerCatalog() {
  if (allProducts.length === 0) {
    await loadProductsCatalog();
  }
  renderCustomerCatalog();
}

async function loadCustomerCart(userId) {
  try {
    const res = await fetch(`/api/cart?user_id=${userId}`);
    const data = await res.json();
    const items = data.items || [];

    const badge = document.getElementById("cust-cart-badge");
    if (badge) badge.innerText = data.count || 0;

    const countHeader = document.getElementById("cust-cart-item-count");
    if (countHeader) countHeader.innerText = `${data.count || 0} items`;

    const subtotalEl = document.getElementById("cust-cart-subtotal");
    const taxEl = document.getElementById("cust-cart-tax");
    const shippingEl = document.getElementById("cust-cart-shipping");
    const grandtotalEl = document.getElementById("cust-cart-grandtotal");

    const subtotal = Number(data.total_price || 0);
    const tax = Math.round(subtotal * 0.08 * 100) / 100;
    const shipping = subtotal > 50 || subtotal === 0 ? 0 : 9.99;
    const grandTotal = subtotal === 0 ? 0 : subtotal + tax + shipping;

    if (subtotalEl) subtotalEl.innerText = formatINR(subtotal);
    if (taxEl) taxEl.innerText = formatINR(tax);
    if (shippingEl) shippingEl.innerText = shipping === 0 ? "Free" : formatINR(shipping);
    if (grandtotalEl) grandtotalEl.innerText = formatINR(grandTotal);

    const listContainer = document.getElementById("cust-cart-items-list");
    if (!listContainer) return;

    if (items.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align:center; padding:3rem 1rem; color:var(--text-muted);">
          <i class="fas fa-shopping-bag" style="font-size:2.5rem; margin-bottom:1rem; opacity:0.3; display:block;"></i>
          <p style="font-size:0.95rem; margin-bottom:1rem;">Your shopping cart is currently empty.</p>
          <button class="btn-primary" onclick="switchCustomerTab('cust-tab-catalog')" style="padding:0.5rem 1.25rem;">
            Explore Catalog
          </button>
        </div>
      `;
      return;
    }

    listContainer.innerHTML = "";
    items.forEach((item) => {
      const fullProd = allProducts.find((p) => p.product_id === item.product_id) || item;
      const imgUrl = getProductImageUrl(fullProd);
      const lineTotal = Number(item.price || 0) * (item.quantity || 1);

      const row = document.createElement("div");
      row.className = "cart-item-row";
      row.innerHTML = `
        <div class="cart-item-info">
          <img src="${imgUrl}" alt="${item.name}" class="cart-item-thumb">
          <div class="cart-item-details">
            <h4>${item.name}</h4>
            <p>${item.category} &bull; ${formatINR(item.price)} each</p>
          </div>
        </div>
        <div class="cart-qty-group">
          <button class="cart-qty-btn" onclick="modifyCustomerCartQuantity('${userId}', '${item.product_id}', 'remove')">&minus;</button>
          <span class="cart-qty-num">${item.quantity || 1}</span>
          <button class="cart-qty-btn" onclick="modifyCustomerCartQuantity('${userId}', '${item.product_id}', 'add')">&plus;</button>
        </div>
        <div class="cart-item-price-col">
          <div class="cart-item-price">${formatINR(lineTotal)}</div>
        </div>
      `;
      listContainer.appendChild(row);
    });
  } catch (err) {
    console.error("Failed to load customer cart:", err);
  }
}

async function addToCustomerCart(userId, productId, silent = false) {
  try {
    const res = await fetch("/api/cart/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, product_id: productId })
    });
    const data = await res.json();
    if (res.ok) {
      if (!silent) showToast(data.message || "Added item to cart!");
      await loadCustomerCart(userId);
    } else {
      showToast(data.detail || "Could not add item to cart", true);
    }
  } catch (err) {
    console.error("Add to cart failed:", err);
    showToast("Network error updating cart", true);
  }
}

async function modifyCustomerCartQuantity(userId, productId, action) {
  const endpoint = action === "add" ? "/api/cart/add" : "/api/cart/remove";
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, product_id: productId })
    });
    if (res.ok) {
      await loadCustomerCart(userId);
    }
  } catch (err) {
    console.error("Cart quantity update failed:", err);
  }
}

async function checkoutCustomerCart(userId) {
  try {
    const res = await fetch("/api/cart/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId })
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`🎉 Order ${data.order.order_id} confirmed successfully!`);
      const modal = document.getElementById("product-details-modal");
      if (modal && modal.open) modal.close();
      await loadCustomerCart(userId);
      await loadCustomerOrders(userId);
      switchCustomerTab("cust-tab-orders");
    } else {
      showToast(data.detail || "Checkout failed", true);
    }
  } catch (err) {
    console.error("Checkout failed:", err);
    showToast("Network error executing checkout", true);
  }
}

async function loadCustomerOrders(userId) {
  const container = document.getElementById("cust-orders-list");
  if (!container) return;
  const session = getCurrentSession();
  const uId = userId || (session ? session.user_id : "U0001");

  try {
    const res = await fetch(`/api/orders?user_id=${uId}`);
    const data = await res.json();
    const orders = data.orders || [];

    if (orders.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:3rem; color:var(--text-muted); background:var(--bg-card); border-radius:var(--radius-lg); border:1px solid var(--border-color);">
          <i class="fas fa-box-open" style="font-size:2.5rem; opacity:0.3; margin-bottom:1rem; display:block;"></i>
          <p style="font-size:0.95rem;">You haven't placed any orders yet.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = "";
    orders.forEach((order) => {
      const card = document.createElement("div");
      card.className = "order-entry-card";
      const itemsListHtml = (order.items || []).map((it) => `
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; padding:0.4rem 0; border-bottom:1px dashed var(--border-color);">
          <span>${it.quantity}x <b>${it.name}</b> (${it.category})</span>
          <span style="font-weight:600; color:var(--text-primary);">${formatINR(it.price * it.quantity)}</span>
        </div>
      `).join("");

      card.innerHTML = `
        <div class="order-entry-header">
          <div>
            <div class="order-id-tag"><i class="fas fa-receipt" style="margin-right:0.4rem; color:#10B981;"></i>${order.order_id}</div>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:2px;">Placed on ${order.date}</div>
          </div>
          <span class="order-status-pill"><i class="fas fa-check-circle"></i> ${order.status}</span>
        </div>
        <div style="margin-bottom:1rem;">
          ${itemsListHtml}
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; padding-top:0.5rem; font-size:0.92rem;">
          <span style="color:var(--text-muted); font-size:0.8rem;">Includes GST &amp; Live Graph Sync</span>
          <span style="font-weight:800; font-size:1.1rem; color:var(--text-primary);">Total: ${formatINR(order.total)}</span>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Failed to load customer orders:", err);
  }
}
