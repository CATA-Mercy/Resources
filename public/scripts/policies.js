// scripts/policies.js
// Policies page logic.
// - Labels & copy from branding/policies.json
// - Policy items from data/policies.json
//
// Expected data/policies.json shape:
// {
//   "policies": [
//     {
//       "id": "studio-general",
//       "title": "Studio & Lab Access and Booking",
//       "category": "spacesResources", // or "studentsIndividuals"
//       "lastUpdated": "2024-08-01",
//       "downloadUrl": "files/studio-policies.pdf", // optional
//       "printUrl": "print/policy-studio-general.html", // optional
//       "sections": [
//         {
//           "title": "General Policies",
//           "items": [
//             "Only students currently enrolled in the MPRA Program may request access to facilities.",
//             "All non-Mercy students and non-majors must have advanced approval from the Studio Manager or Program Director and must be accompanied by a major at all times."
//           ]
//         },
//         {
//           "title": "Maintenance and Cleanup",
//           "items": [
//             "You are expected to leave the studio in the same condition as you found it (or better).",
//             "No trash should be left in the studio."
//           ]
//         }
//       ]
//     }
//   ]
// }

let policiesBranding = null;
let allPolicies = [];

const policiesState = {
  category: "spacesResources", // "spacesResources" or "studentsIndividuals"
  search: "",
  selectedPolicyId: null
};

function safeStr(v) {
  return v == null ? "" : String(v);
}

async function loadPoliciesBranding() {
  try {
    const res = await fetch("branding/policies.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("branding/policies.json HTTP " + res.status);
    const cfg = await res.json();
    policiesBranding = cfg;
    applyPoliciesBranding(cfg);
  } catch (err) {
    console.warn("Error loading policies branding:", err);
  }
}

function applyPoliciesBranding(cfg) {
  const hero = cfg.hero || {};
  const tabsCfg = cfg.tabs || {};
  const searchCfg = cfg.search || {};
  const listCfg = cfg.list || {};
  const detailsCfg = cfg.details || {};
  const sectionsCfg = cfg.sections || {};

  // Page title + subtitle
  const titleEl = document.getElementById("policiesPageTitle");
  const subEl = document.getElementById("policiesPageSub");

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

  // Sidebar: category tabs
  const tabsHost = document.getElementById("policiesTabs");
  if (tabsHost) {
    tabsHost.innerHTML = "";

    const addTab = (key, label) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "policies-tab";
      btn.dataset.category = key;
      btn.textContent = label;

      if (key === policiesState.category) {
        btn.classList.add("policies-tab-active");
      }

      btn.addEventListener("click", () => {
        policiesState.category = key;
        policiesState.selectedPolicyId = null;
        updatePolicyTabs(tabsHost);
        renderPolicies();
      });

      tabsHost.appendChild(btn);
    };

    if (tabsCfg.spacesResources) {
      addTab("spacesResources", tabsCfg.spacesResources);
    }
    if (tabsCfg.studentsIndividuals) {
      addTab("studentsIndividuals", tabsCfg.studentsIndividuals);
    }
  }

  // Sidebar: search label + placeholder
  const searchLabelEl = document.getElementById("policiesSearchLabel");
  const searchInputEl = document.getElementById("policiesSearch");

  if (searchLabelEl && searchCfg.label) {
    searchLabelEl.textContent = searchCfg.label;
  }
  if (searchInputEl) {
    // Use JSON placeholder if present, else a simple default.
    searchInputEl.placeholder = searchCfg.placeholder || "Search...";

    searchInputEl.addEventListener("input", () => {
      policiesState.search = searchInputEl.value || "";
      renderPolicies();
    });
  }

  // List header text
  const listHeadingEl = document.getElementById("policiesListHeading");
  if (listHeadingEl && listCfg.heading) {
    listHeadingEl.textContent = listCfg.heading;
  }

  // Detail labels
  const detailLabelEl = document.getElementById("policiesDetailLabel");
  if (detailLabelEl && detailsCfg.headingLabel) {
    detailLabelEl.textContent = detailsCfg.headingLabel;
  }

  const detailIntroEl = document.getElementById("policiesDetailIntro");
  if (detailIntroEl && detailsCfg.introMessage) {
    detailIntroEl.textContent = detailsCfg.introMessage;
  }

  // Category intro text, initial
  updateCategoryIntro(sectionsCfg, hero);

  // Now that branding is applied, rendering will fill the lists once data is loaded
}

function updatePolicyTabs(tabsHost) {
  const buttons = tabsHost.querySelectorAll(".policies-tab");
  buttons.forEach(btn => {
    const key = btn.dataset.category;
    if (key === policiesState.category) {
      btn.classList.add("policies-tab-active");
    } else {
      btn.classList.remove("policies-tab-active");
    }
  });
}

function updateCategoryIntro(sectionsCfg, heroCfg) {
  const introTitleEl = document.getElementById("policiesCategoryIntroTitle");
  const introBodyEl = document.getElementById("policiesCategoryIntroBody");

  let title = "";
  let body = "";

  if (policiesState.category === "spacesResources") {
    title = sectionsCfg.spacesResourcesIntroTitle || "";
    body = sectionsCfg.spacesResourcesIntroBody || "";
  } else if (policiesState.category === "studentsIndividuals") {
    title = sectionsCfg.studentsIndividualsIntroTitle || "";
    body = sectionsCfg.studentsIndividualsIntroBody || "";
  }

  if (!title && heroCfg && Array.isArray(heroCfg.body) && heroCfg.body.length > 1) {
    title = "";
    body = heroCfg.body[1];
  }

  if (introTitleEl) introTitleEl.textContent = title;
  if (introBodyEl) introBodyEl.textContent = body;
}

async function loadPoliciesData() {
  try {
    const res = await fetch("data/policies.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("data/policies.json HTTP " + res.status);
    const data = await res.json();
    allPolicies = Array.isArray(data.policies) ? data.policies : [];
  } catch (err) {
    console.warn("Error loading policies data:", err);
    allPolicies = [];
  }

  renderPolicies();
}

function renderPolicies() {
  const listHost = document.getElementById("policiesList");
  const listEmptyEl = document.getElementById("policiesListEmpty");
  const emptyGlobalEl = document.getElementById("policiesEmptyGlobal");
  const detailIntroEl = document.getElementById("policiesDetailIntro");
  const detailTitleEl = document.getElementById("policiesDetailTitle");
  const detailUpdatedEl = document.getElementById("policiesDetailUpdated");
  const detailActionsEl = document.getElementById("policiesDetailActions");
  const detailSectionsEl = document.getElementById("policiesDetailSections");

  if (!listHost) return;

  const cfg = policiesBranding || {};
  const listCfg = cfg.list || {};
  const detailsCfg = cfg.details || {};
  const sectionsCfg = cfg.sections || {};
  const emptyCfg = cfg.emptyStates || {};
  const hero = cfg.hero || {};

  // Update category intro each time category changes
  updateCategoryIntro(sectionsCfg, hero);

  listHost.innerHTML = "";
  if (listEmptyEl) {
    listEmptyEl.hidden = true;
    listEmptyEl.textContent = "";
  }
  if (emptyGlobalEl) {
    emptyGlobalEl.hidden = true;
    emptyGlobalEl.textContent = "";
  }
  if (detailIntroEl && detailsCfg.introMessage) {
    detailIntroEl.textContent = detailsCfg.introMessage;
  }
  if (detailTitleEl) detailTitleEl.textContent = "";
  if (detailUpdatedEl) detailUpdatedEl.textContent = "";
  if (detailActionsEl) detailActionsEl.innerHTML = "";
  if (detailSectionsEl) detailSectionsEl.innerHTML = "";

  const searchTerm = policiesState.search.trim().toLowerCase();
  const activeCategory = policiesState.category;

  const filtered = allPolicies.filter(policy => {
    if (!policy || !policy.title) return false;
    if (activeCategory && policy.category !== activeCategory) return false;

    if (searchTerm) {
      const haystack = [
        policy.title,
        safeStr(policy.lastUpdated),
        (policy.sections || []).map(sec => {
          const parts = [];
          if (sec.title) parts.push(sec.title);
          if (Array.isArray(sec.items)) {
            parts.push(sec.items.join(" "));
          }
          if (Array.isArray(sec.body)) {
            parts.push(sec.body.join(" "));
          }
          return parts.join(" ");
        }).join(" ")
      ].join(" ").toLowerCase();

      if (!haystack.includes(searchTerm)) {
        return false;
      }
    }

    return true;
  });

  if (!filtered.length) {
    if (listEmptyEl) {
      listEmptyEl.hidden = false;
      listEmptyEl.textContent =
        emptyCfg.noMatch ||
        listCfg.empty ||
        "No policies matched your filters.";
    }
    return;
  }

  // Sort policies by title for stable display
  filtered.sort((a, b) => {
    const aTitle = safeStr(a.title).toLowerCase();
    const bTitle = safeStr(b.title).toLowerCase();
    return aTitle.localeCompare(bTitle);
  });

  // Choose selected policy
  let selected = filtered.find(p => p.id === policiesState.selectedPolicyId) || null;
  if (!selected) {
    selected = filtered[0];
    policiesState.selectedPolicyId = selected.id;
  }

  // Render list
  filtered.forEach(policy => {
    const li = document.createElement("li");
    li.className = "policies-list-item";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "policies-list-button";
    btn.textContent = policy.title;
    btn.dataset.policyId = policy.id;

    if (policy.id === policiesState.selectedPolicyId) {
      btn.classList.add("policies-list-button-active");
    }

    btn.addEventListener("click", () => {
      policiesState.selectedPolicyId = policy.id;
      renderPolicies();
    });

    li.appendChild(btn);
    listHost.appendChild(li);
  });

  // Render detail
  renderPolicyDetail(selected, cfg);
}

function renderPolicyDetail(policy, cfg) {
  const detailsCfg = cfg.details || {};
  const detailIntroEl = document.getElementById("policiesDetailIntro");
  const detailTitleEl = document.getElementById("policiesDetailTitle");
  const detailUpdatedEl = document.getElementById("policiesDetailUpdated");
  const detailActionsEl = document.getElementById("policiesDetailActions");
  const detailSectionsEl = document.getElementById("policiesDetailSections");

  if (!policy) {
    if (detailIntroEl && detailsCfg.introMessage) {
      detailIntroEl.textContent = detailsCfg.introMessage;
    }
    return;
  }

  if (detailIntroEl) {
    detailIntroEl.textContent = "";
  }

  if (detailTitleEl) {
    detailTitleEl.textContent = policy.title || "";
  }

  if (detailUpdatedEl) {
    const label = detailsCfg.lastUpdatedLabel || "Last updated";
    if (policy.lastUpdated) {
      detailUpdatedEl.textContent = `${label}: ${policy.lastUpdated}`;
    } else {
      detailUpdatedEl.textContent = "";
    }
  }

  if (detailActionsEl) {
    detailActionsEl.innerHTML = "";

    if (policy.downloadUrl) {
      const downloadBtn = document.createElement("a");
      downloadBtn.href = policy.downloadUrl;
      downloadBtn.target = "_blank";
      downloadBtn.rel = "noopener noreferrer";
      downloadBtn.className = "btn ghost small";
      downloadBtn.textContent = detailsCfg.downloadLabel || "Download PDF";
      downloadBtn.setAttribute("download", "");
      detailActionsEl.appendChild(downloadBtn);
    }

    if (policy.printUrl) {
      const printBtn = document.createElement("a");
      printBtn.href = policy.printUrl;
      printBtn.target = "_blank";
      printBtn.rel = "noopener noreferrer";
      printBtn.className = "btn primary small";
      printBtn.textContent = detailsCfg.printLabel || "Open print-friendly view";
      detailActionsEl.appendChild(printBtn);
    }
  }

  if (detailSectionsEl) {
    detailSectionsEl.innerHTML = "";

    const sections = Array.isArray(policy.sections) ? policy.sections : [];
    if (!sections.length) {
      const msg = document.createElement("p");
      msg.className = "policies-detail-empty";
      msg.textContent =
        detailsCfg.noSections ||
        "This policy does not have any sections configured yet.";
      detailSectionsEl.appendChild(msg);
      return;
    }

    sections.forEach(sec => {
      const block = document.createElement("section");
      block.className = "policies-detail-section";

      if (sec.title) {
        const h = document.createElement("h4");
        h.className = "policies-detail-section-title";
        h.textContent = sec.title;
        block.appendChild(h);
      }

      // If "items" is present, render as a bullet list
      if (Array.isArray(sec.items) && sec.items.length) {
        const ul = document.createElement("ul");
        ul.className = "policies-detail-list";
        sec.items.forEach(text => {
          const li = document.createElement("li");
          li.textContent = text;
          ul.appendChild(li);
        });
        block.appendChild(ul);
      }

      // If "body" is present, render as paragraphs
      if (Array.isArray(sec.body) && sec.body.length) {
        sec.body.forEach(text => {
          const p = document.createElement("p");
          p.className = "policies-detail-paragraph";
          p.textContent = text;
          block.appendChild(p);
        });
      }

      detailSectionsEl.appendChild(block);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadPoliciesBranding();
  loadPoliciesData();
});
