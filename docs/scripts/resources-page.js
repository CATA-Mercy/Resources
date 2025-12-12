// scripts/resources-page.js
// Resources page logic using "left browser + right list" layout.
// - Labels & copy from branding/resources.json
// - Resource items from data/resources.json
//
// Expected data/resources.json shape:
// {
//   "resources": [
//     {
//       "id": "studio-a-plot",
//       "name": "Studio A – Room & Stage Plot",
//       "description": "Optional description text.",
//       "program": "mpra",        // "mpra", "media", "comm", "da", "general"
//       "category": "roomPlots",  // key in branding.resourceTypeLabels
//       "linkType": "download",   // "download" or "link"
//       "url": "files/studio-a-plot.pdf"
//     }
//   ]
// }

let resourcesBranding = null;
let allResources = [];

const resourcesState = {
  search: "",
  program: "all" // "all" or specific program key
};

function safeStr(v) {
  return v == null ? "" : String(v);
}

async function loadResourcesBranding() {
  try {
    const res = await fetch("branding/resources.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("branding/resources.json HTTP " + res.status);
    const cfg = await res.json();
    resourcesBranding = cfg;

    applyResourcesBranding(cfg);
  } catch (err) {
    console.warn("Error loading resources branding:", err);
  }
}

function applyResourcesBranding(cfg) {
  const hero = cfg.hero || {};
  const searchCfg = cfg.search || {};
  const filtersCfg = cfg.filters || {};
  const sectionsCfg = cfg.sections || {};
  const sidebarCfg = cfg.sidebar || {};

  // Page title / subtitle (hero)
  const titleEl = document.getElementById("resourcesPageTitle");
  const subEl = document.getElementById("resourcesPageSub");

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

  // Sidebar: labels and search
  const filterKickerEl = document.getElementById("resourcesFilterKicker");
  const searchLabelEl = document.getElementById("resourcesSearchLabel");
  const searchInputEl = document.getElementById("resourcesSearch");
  const filterNoteEl = document.getElementById("resourcesFilterNote");
  const programLabelEl = document.getElementById("resourcesProgramLabel");
  const programListEl = document.getElementById("resourcesProgramList");

  if (filterKickerEl) {
    filterKickerEl.textContent = sidebarCfg.kicker || "Browse";
  }

  if (searchLabelEl && searchCfg.label) {
    searchLabelEl.textContent = searchCfg.label;
  }
  if (searchInputEl) {
    // Use a simple, consistent placeholder rather than pulling from JSON
    searchInputEl.placeholder = "Search...";
  }

  if (filterNoteEl) {
    filterNoteEl.textContent =
      sidebarCfg.note ||
      "Select a program on the left to see its resources. Use search to narrow down the list.";
  }

  if (programLabelEl && filtersCfg.programLabel) {
    programLabelEl.textContent = filtersCfg.programLabel;
  }

  // Program browser list from branding.programGroups
  if (programListEl) {
    programListEl.innerHTML = "";
    const programGroups = cfg.programGroups || {};

    const addProgramItem = (key, label) => {
      const li = document.createElement("li");
      li.className = "resources-program-item";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "resources-program-button";
      btn.dataset.program = key;
      btn.textContent = label;

      if (key === resourcesState.program) {
        btn.classList.add("resources-program-button-active");
      }

      btn.addEventListener("click", () => {
        resourcesState.program = key;
        updateProgramButtons(programListEl);
        renderResources();
      });

      li.appendChild(btn);
      programListEl.appendChild(li);
    };

    // "All" row
    const allLabel = filtersCfg.programAll || "All programs";
    addProgramItem("all", allLabel);

    // One row for each program group
    Object.entries(programGroups).forEach(([key, meta]) => {
      const label = (meta && meta.title) || key;
      addProgramItem(key, label);
    });
  }

  // Hook up search
  if (searchInputEl) {
    searchInputEl.addEventListener("input", () => {
      resourcesState.search = searchInputEl.value || "";
      renderResources();
    });
  }

  // Initial program header will be set by renderResources()
  const byProgramTitle = sectionsCfg.byProgramTitle;
  const currentTitleEl = document.getElementById("resourcesProgramCurrentTitle");
  const currentDescEl = document.getElementById("resourcesProgramCurrentDescription");

  if (currentTitleEl && byProgramTitle && resourcesState.program === "all") {
    currentTitleEl.textContent = byProgramTitle;
  }
  if (currentDescEl && Array.isArray(hero.body) && hero.body.length > 1) {
    currentDescEl.textContent = hero.body[1];
  }
}

function updateProgramButtons(listEl) {
  const buttons = listEl.querySelectorAll(".resources-program-button");
  buttons.forEach(btn => {
    const key = btn.dataset.program;
    if (key === resourcesState.program) {
      btn.classList.add("resources-program-button-active");
    } else {
      btn.classList.remove("resources-program-button-active");
    }
  });
}

async function loadResourcesData() {
  try {
    const res = await fetch("data/resources.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("data/resources.json HTTP " + res.status);
    const data = await res.json();
    allResources = Array.isArray(data.resources) ? data.resources : [];
  } catch (err) {
    console.warn("Error loading resources data:", err);
    allResources = [];
  }

  renderResources();
}

function renderResources() {
  const listHost = document.getElementById("resourcesList");
  const emptyEl = document.getElementById("resourcesEmpty");
  const currentTitleEl = document.getElementById("resourcesProgramCurrentTitle");
  const currentDescEl = document.getElementById("resourcesProgramCurrentDescription");

  if (!listHost) return;

  const cfg = resourcesBranding || {};
  const hero = cfg.hero || {};
  const programGroups = cfg.programGroups || {};
  const typeLabels = cfg.resourceTypeLabels || {};
  const btnLabels = cfg.buttons || {};
  const sectionsCfg = cfg.sections || {};
  const emptyCfg = cfg.emptyStates || {};

  listHost.innerHTML = "";
  if (emptyEl) {
    emptyEl.hidden = true;
    emptyEl.textContent = "";
  }

  // Update program header above the list
  let headerTitle = "";
  let headerDesc = "";

  if (resourcesState.program === "all") {
    headerTitle = sectionsCfg.byProgramTitle || "All resources";
    if (Array.isArray(hero.body) && hero.body.length > 1) {
      headerDesc = hero.body[1];
    }
  } else {
    const meta = programGroups[resourcesState.program];
    if (meta && meta.title) {
      headerTitle = meta.title;
    } else {
      headerTitle = resourcesState.program;
    }
    if (meta && meta.description) {
      headerDesc = meta.description;
    }
  }

  if (currentTitleEl) {
    currentTitleEl.textContent = headerTitle;
  }
  if (currentDescEl) {
    currentDescEl.textContent = headerDesc;
  }

  // Apply filters
  const searchTerm = resourcesState.search.trim().toLowerCase();
  const programFilter = resourcesState.program || "all";

  const filtered = allResources.filter(item => {
    if (!item || !item.name || !item.url) return false;

    if (programFilter !== "all" && item.program !== programFilter) {
      return false;
    }

    if (searchTerm) {
      const haystack = [
        item.name,
        item.description || "",
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
        "No resources matched your filters.";
    }
    return;
  }

  // Sort by name for stable, readable order
  filtered.sort((a, b) => {
    const aName = safeStr(a.name).toLowerCase();
    const bName = safeStr(b.name).toLowerCase();
    return aName.localeCompare(bName);
  });

  // Render flat list of resource cards
  filtered.forEach(item => {
    const card = document.createElement("article");
    card.className = "resources-item-card";

    const headerRow = document.createElement("div");
    headerRow.className = "resources-item-header";

    const nameEl = document.createElement("div");
    nameEl.className = "resources-item-name";
    nameEl.textContent = item.name;

    const programLabel = (() => {
      const pg = programGroups[item.program];
      if (pg && pg.title) return pg.title;
      switch (item.program) {
        case "mpra":
          return "MPRA";
        case "media":
          return "Media Studies";
        case "comm":
          return "Comm Arts";
        case "da":
          return "Digital Arts";
        case "general":
          return "General";
        default:
          return item.program || "Other";
      }
    })();

    const programPill = document.createElement("span");
    programPill.className = "resources-item-program-pill";
    programPill.textContent = programLabel;

    headerRow.appendChild(nameEl);
    headerRow.appendChild(programPill);
    card.appendChild(headerRow);

    if (item.description) {
      const descEl = document.createElement("p");
      descEl.className = "resources-item-description";
      descEl.textContent = item.description;
      card.appendChild(descEl);
    }

    if (item.category && typeLabels[item.category]) {
      const metaEl = document.createElement("p");
      metaEl.className = "resources-item-meta";
      metaEl.textContent = typeLabels[item.category];
      card.appendChild(metaEl);
    }

    const footer = document.createElement("div");
    footer.className = "resources-item-footer";

    if (item.url) {
      const btn = document.createElement("a");
      const linkType = item.linkType === "download" ? "download" : "link";
      const isDownload = linkType === "download";

      btn.href = item.url;
      btn.target = "_blank";
      btn.rel = "noopener noreferrer";
      btn.className = isDownload
        ? "btn ghost small resources-item-btn-download"
        : "btn primary small resources-item-btn-link";

      if (isDownload) {
        btn.textContent = btnLabels.download || "Download";
        btn.setAttribute("download", "");
      } else {
        btn.textContent = btnLabels.link || "Link to resource";
      }

      footer.appendChild(btn);
    }

    card.appendChild(footer);
    listHost.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadResourcesBranding();
  loadResourcesData();
});