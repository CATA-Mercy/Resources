// scripts/howto-page.js
// How-To / Help page logic.
// - Labels & copy from branding/howto.json
// - Help items from data/howto.json
//
// Expected data/howto.json shape:
// {
//   "items": [
//     {
//       "id": "adobe-student-access",
//       "title": "Accessing Adobe Creative Cloud",
//       "program": "mpra",            // "mpra", "media", "comm", "da", "general"
//       "category": "accounts",       // "accounts", "troubleshooting", "walkthroughs", "other"
//       "summary": "Short one-line description.",
//       "format": "textOnly",         // "textOnly", "htmlEmbed", "video"
//       "url": "https://example.com/guide" // optional, used for HTML/video/text detail links
//     }
//   ]
// }

let howtoBranding = null;
let howtoItems = [];

let howtoGlobalBranding = null;
let howtoProgramsMap = null;

const howtoState = {
  search: "",
  program: "all",       // "all" or specific program key
  category: "all"       // "all" or specific category key
};

function howtoSafeStr(v) {
  return v == null ? "" : String(v);
}

function getProgramDisplayLabel(programKey) {
  const key = programKey || "";

  // Prefer names from branding/global.json if available
  if (howtoProgramsMap && key in howtoProgramsMap) {
    return howtoProgramsMap[key];
  }

  // Fallback to previous hard-coded labels if global map is missing or incomplete
  switch (key) {
    case "mpra":
      return "Music Production & Recording Arts";
    case "media":
      return "Media Studies";
    case "comm":
      return "Communication & the Arts";
    case "da":
      return "Digital Arts";
    case "general":
      return "General";
    default:
      return key || "Other";
  }
}

async function loadGlobalBrandingForHowto() {
  try {
    const res = await fetch("branding/global.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("branding/global.json HTTP " + res.status);
    const cfg = await res.json();
    howtoGlobalBranding = cfg;
    howtoProgramsMap = cfg && cfg.programs ? cfg.programs : null;
  } catch (err) {
    console.warn("Error loading global branding for How-To:", err);
    howtoGlobalBranding = null;
    howtoProgramsMap = null;
  }
}

async function loadHowtoBranding() {
  try {
    const res = await fetch("branding/howto.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("branding/howto.json HTTP " + res.status);
    const cfg = await res.json();
    howtoBranding = cfg;
    applyHowtoBranding(cfg);
  } catch (err) {
    console.warn("Error loading how-to branding:", err);
  }
}

function applyHowtoBranding(cfg) {
  const hero = cfg.hero || {};
  const searchCfg = cfg.search || {};
  const filtersCfg = cfg.filters || {};
  const sectionsCfg = cfg.sections || {};
  const categoriesCfg = cfg.categories || {};

  // Page hero title + subtitle
  const titleEl = document.getElementById("howtoPageTitle");
  const subEl = document.getElementById("howtoPageSub");

  if (titleEl && hero.heading) {
    titleEl.textContent = hero.heading;
  }
  if (subEl) {
    if (Array.isArray(hero.body) && hero.body.length > 0) {
      subEl.textContent = hero.body[0];
    } else {
      subEl.textContent = "";
    }
  }

  // Sidebar kicker
  const kickerEl = document.getElementById("howtoFilterKicker");
  if (kickerEl) {
    kickerEl.textContent = "Browse";
  }

  // Search label + placeholder
  const searchLabelEl = document.getElementById("howtoSearchLabel");
  const searchInputEl = document.getElementById("howtoSearch");

  if (searchLabelEl && searchCfg.label) {
    searchLabelEl.textContent = searchCfg.label;
  }
  if (searchInputEl) {
    searchInputEl.placeholder = searchCfg.placeholder || "Search help…";
    searchInputEl.addEventListener("input", () => {
      howtoState.search = searchInputEl.value || "";
      renderHowtoList();
    });
  }

  // Program pill filter
  const programLabelEl = document.getElementById("howtoProgramLabel");
  const programOptionsEl = document.getElementById("howtoProgramOptions");

  if (programLabelEl && filtersCfg.programLabel) {
    programLabelEl.textContent = filtersCfg.programLabel;
  }

  if (programOptionsEl) {
    programOptionsEl.innerHTML = "";

    const addOption = (value, label) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "howto-filter-pill";
      btn.dataset.value = value;
      btn.textContent = label;

      if (value === howtoState.program) {
        btn.classList.add("howto-filter-pill-active");
      }

      btn.addEventListener("click", () => {
        howtoState.program = value;
        // Update active state on all program pills
        const allBtns = programOptionsEl.querySelectorAll(".howto-filter-pill");
        allBtns.forEach(b => {
          if (b.dataset.value === howtoState.program) {
            b.classList.add("howto-filter-pill-active");
          } else {
            b.classList.remove("howto-filter-pill-active");
          }
        });
        renderHowtoList();
      });

      programOptionsEl.appendChild(btn);
    };

    addOption("all", filtersCfg.programAll || "All programs");
    addOption("mpra", getProgramDisplayLabel("mpra"));
    addOption("media", getProgramDisplayLabel("media"));
    addOption("comm", getProgramDisplayLabel("comm"));
    addOption("da", getProgramDisplayLabel("da"));
    addOption("general", getProgramDisplayLabel("general"));
  }

  // Category pill filter
  const categoryLabelEl = document.getElementById("howtoCategoryLabel");
  const categoryOptionsEl = document.getElementById("howtoCategoryOptions");

  if (categoryLabelEl && filtersCfg.categoryLabel) {
    categoryLabelEl.textContent = filtersCfg.categoryLabel;
  }

  if (categoryOptionsEl) {
    categoryOptionsEl.innerHTML = "";

    const addCatOption = (value, label) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "howto-filter-pill";
      btn.dataset.value = value;
      btn.textContent = label;

      if (value === howtoState.category) {
        btn.classList.add("howto-filter-pill-active");
      }

      btn.addEventListener("click", () => {
        howtoState.category = value;
        // Update active state on all category pills
        const allBtns = categoryOptionsEl.querySelectorAll(".howto-filter-pill");
        allBtns.forEach(b => {
          if (b.dataset.value === howtoState.category) {
            b.classList.add("howto-filter-pill-active");
          } else {
            b.classList.remove("howto-filter-pill-active");
          }
        });
        updateHowtoSectionIntro();
        renderHowtoList();
      });

      categoryOptionsEl.appendChild(btn);
    };

    addCatOption("all", filtersCfg.categoryAll || "All types");
    addCatOption("accounts", categoriesCfg.accounts || "Accounts & access");
    addCatOption("troubleshooting", categoriesCfg.troubleshooting || "Troubleshooting");
    addCatOption("walkthroughs", categoriesCfg.walkthroughs || "Walkthroughs");
    addCatOption("other", categoriesCfg.other || "Other / general help");
  }

  // Initial section intro
  updateHowtoSectionIntro();
}

function updateHowtoSectionIntro() {
  const cfg = howtoBranding || {};
  const hero = cfg.hero || {};
  const sectionsCfg = cfg.sections || {};
  const categoriesCfg = cfg.categories || {};

  const titleEl = document.getElementById("howtoSectionTitle");
  const bodyEl = document.getElementById("howtoSectionBody");

  let title = "";
  let body = "";

  if (howtoState.category === "accounts") {
    title = sectionsCfg.accountsTitle || categoriesCfg.accounts || "Accounts & access";
  } else if (howtoState.category === "troubleshooting") {
    title = sectionsCfg.troubleshootingTitle || categoriesCfg.troubleshooting || "Troubleshooting";
  } else if (howtoState.category === "walkthroughs") {
    title = sectionsCfg.walkthroughsTitle || categoriesCfg.walkthroughs || "Walkthroughs";
  } else if (howtoState.category === "other") {
    title = sectionsCfg.otherTitle || categoriesCfg.other || "Other / general help";
  } else {
    // "All" view – use a generic title, and the second hero body line if present
    title = "";
    if (Array.isArray(hero.body) && hero.body.length > 1) {
      body = hero.body[1];
    }
  }

  if (titleEl) titleEl.textContent = title;
  if (bodyEl) bodyEl.textContent = body;
}

async function loadHowtoData() {
  try {
    const res = await fetch("data/howto.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("data/howto.json HTTP " + res.status);
    const data = await res.json();
    howtoItems = Array.isArray(data.items) ? data.items : [];
  } catch (err) {
    console.warn("Error loading how-to data:", err);
    howtoItems = [];
  }

  renderHowtoList();
}

function renderHowtoList() {
  const listHost = document.getElementById("howtoList");
  const emptyEl = document.getElementById("howtoEmpty");
  if (!listHost) return;

  const cfg = howtoBranding || {};
  const categoriesCfg = cfg.categories || {};
  const itemLabels = cfg.itemLabels || {};
  const buttonLabels = cfg.buttons || {};
  const emptyCfg = cfg.emptyStates || {};
  const sectionsCfg = cfg.sections || {};

  listHost.innerHTML = "";
  if (emptyEl) {
    emptyEl.hidden = true;
    emptyEl.textContent = "";
  }

  const searchTerm = howtoState.search.trim().toLowerCase();
  const programFilter = howtoState.program || "all";
  const categoryFilter = howtoState.category || "all";

  const filtered = howtoItems.filter(item => {
    if (!item || !item.title) return false;

    if (programFilter !== "all" && item.program !== programFilter) {
      return false;
    }

    if (categoryFilter !== "all" && item.category !== categoryFilter) {
      return false;
    }

    if (searchTerm) {
      const haystack = [
        item.title,
        item.summary || "",
        item.program || "",
        item.category || ""
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(searchTerm)) {
        return false;
      }
    }

    return true;
  });

  if (!filtered.length) {
    if (emptyEl) {
      emptyEl.hidden = false;
      emptyEl.textContent =
        emptyCfg.noMatch ||
        sectionsCfg.empty ||
        "No help items matched your filters.";
    }
    return;
  }

  // Sort by title
  filtered.sort((a, b) => {
    const aTitle = howtoSafeStr(a.title).toLowerCase();
    const bTitle = howtoSafeStr(b.title).toLowerCase();
    return aTitle.localeCompare(bTitle);
  });

  filtered.forEach(item => {
    const card = document.createElement("article");
    card.className = "howto-item-card";

    const headerRow = document.createElement("div");
    headerRow.className = "howto-item-header";

    const titleEl = document.createElement("div");
    titleEl.className = "howto-item-title";
    titleEl.textContent = item.title;

    const programPill = document.createElement("span");
    programPill.className = "howto-item-program-pill";
    programPill.textContent = getProgramDisplayLabel(item.program);

    headerRow.appendChild(titleEl);
    headerRow.appendChild(programPill);
    card.appendChild(headerRow);

    if (item.summary) {
      const summaryEl = document.createElement("p");
      summaryEl.className = "howto-item-summary";
      summaryEl.textContent = item.summary;
      card.appendChild(summaryEl);
    }

    const metaBits = [];
    if (item.category && categoriesCfg[item.category]) {
      metaBits.push(categoriesCfg[item.category]);
    }
    if (item.format && itemLabels[item.format]) {
      metaBits.push(itemLabels[item.format]);
    }

    if (metaBits.length) {
      const metaEl = document.createElement("p");
      metaEl.className = "howto-item-meta";
      metaEl.textContent = metaBits.join(" • ");
      card.appendChild(metaEl);
    }

    // Drop-down content area
    const content = document.createElement("div");
    content.className = "howto-item-content";
    content.hidden = true;

    const isTextOnly = item.format === "textOnly";
    const hasSteps = Array.isArray(item.steps) && item.steps.length > 0;
    const hasBody = Array.isArray(item.body) && item.body.length > 0;

    if (isTextOnly && (hasSteps || hasBody)) {
      // Render structured text from JSON instead of an iframe
      if (hasBody) {
        item.body.forEach(paragraph => {
          const p = document.createElement("p");
          p.className = "howto-item-content-fallback";
          p.textContent = paragraph;
          content.appendChild(p);
        });
      }

      if (hasSteps) {
        const list = document.createElement("ol");
        list.className = "howto-item-steps";
        item.steps.forEach(stepText => {
          const li = document.createElement("li");
          li.textContent = stepText;
          list.appendChild(li);
        });
        content.appendChild(list);
      }
    } else if (item.url) {
      // Render content inline based on URL (HTML embed, video, etc.)
      const frame = document.createElement("iframe");
      frame.src = item.url;
      frame.loading = "lazy";
      frame.title = item.title || "Help guide";
      frame.setAttribute("allowfullscreen", "true");
      frame.setAttribute(
        "allow",
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      );

      // Try to auto-size iframe height to match its content when same-origin
      const autoSizeIframe = iframe => {
        if (!iframe) return;
        try {
          const doc = iframe.contentDocument || iframe.contentWindow.document;
          if (!doc) return;
          const body = doc.body;
          if (!body) return;
          const newHeight = body.scrollHeight + 16; // small padding
          if (newHeight > 0) {
            iframe.style.height = newHeight + "px";
            iframe.dataset.autoSized = "true";
          }
        } catch (e) {
          // Cross-origin embeds (e.g., YouTube) will throw here; keep default height.
        }
      };

      frame.addEventListener("load", () => autoSizeIframe(frame));

      content.appendChild(frame);
    } else {
      const fallback = document.createElement("p");
      fallback.className = "howto-item-content-fallback";
      fallback.textContent = "This guide does not have an associated link yet.";
      content.appendChild(fallback);
    }

    card.appendChild(content);

    // Footer with toggle button to show/hide the content
    const footer = document.createElement("div");
    footer.className = "howto-item-footer";

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "btn ghost small howto-item-toggle";

    let baseLabel;
    if (item.format === "video") {
      baseLabel = buttonLabels.watchVideo || "Watch video";
    } else if (item.format === "htmlEmbed") {
      baseLabel = buttonLabels.viewHtml || "View details";
    } else {
      baseLabel = buttonLabels.openGuide || "Open guide";
    }

    toggleBtn.textContent = baseLabel;
    toggleBtn.setAttribute("aria-expanded", "false");

    const toggleLabelOpen = baseLabel;
    const toggleLabelHide = buttonLabels.hideGuide || "Hide guide";

    const ensureIframeSize = () => {
      const iframe = content.querySelector("iframe");
      if (!iframe || iframe.dataset.autoSized === "true") return;

      try {
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        if (!doc) return;
        const body = doc.body;
        if (!body) return;
        const newHeight = body.scrollHeight + 16;
        if (newHeight > 0) {
          iframe.style.height = newHeight + "px";
          iframe.dataset.autoSized = "true";
        }
      } catch (e) {
        // Cross-origin iframe; ignore and keep default height.
      }
    };

    toggleBtn.addEventListener("click", () => {
      const expanded = toggleBtn.getAttribute("aria-expanded") === "true";
      const nextExpanded = !expanded;
      toggleBtn.setAttribute("aria-expanded", nextExpanded ? "true" : "false");
      content.hidden = !nextExpanded;

      if (nextExpanded) {
        ensureIframeSize();
        toggleBtn.textContent = toggleLabelHide;
      } else {
        toggleBtn.textContent = toggleLabelOpen;
      }
    });

    footer.appendChild(toggleBtn);
    card.appendChild(footer);

    listHost.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  Promise.all([loadGlobalBrandingForHowto(), loadHowtoBranding()])
    .then(() => {
      return loadHowtoData();
    })
    .catch(() => {
      // Even if branding fails, still try to load the data so the page is usable.
      return loadHowtoData();
    });
});