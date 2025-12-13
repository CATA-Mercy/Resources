// scripts/shell.js
// Loads the shared header/footer partials and applies global branding text.

function setTheme(theme) {
  const root = document.documentElement;
  const value = theme === "light" ? "light" : "dark";
  root.setAttribute("data-theme", value);
  try {
    window.localStorage.setItem("cataTheme", value);
  } catch (_) {
    // ignore storage issues
  }
}

async function injectPartials() {
  const headerHost = document.getElementById("siteHeader");
  const footerHost = document.getElementById("siteFooter");

  try {
    if (headerHost) {
      const res = await fetch("partials/header.html", { cache: "no-cache" });
      if (!res.ok) throw new Error("Header HTTP " + res.status);
      headerHost.innerHTML = await res.text();
    }

    if (footerHost) {
      const res = await fetch("partials/footer.html", { cache: "no-cache" });
      if (!res.ok) throw new Error("Footer HTTP " + res.status);
      footerHost.innerHTML = await res.text();
    }
  } catch (err) {
    console.warn("Failed to inject header/footer partials:", err);
  }
}

async function applyGlobalBranding() {
  let cfg;
  try {
    const res = await fetch("branding/global.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("branding/global.json HTTP " + res.status);
    cfg = await res.json();
  } catch (err) {
    console.warn("Could not load branding/global.json:", err);
    return;
  }

  // Theme selection:
  // - Default to the OS/browser preference
  // - Fall back to branding default if provided
  // - Ignore any previously stored override so the site always follows the device setting
  let theme = "light";
  try {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      theme = "dark";
    } else if (
      cfg.theme &&
      (cfg.theme.default === "light" || cfg.theme.default === "dark")
    ) {
      theme = cfg.theme.default;
    }
  } catch (_) {
    if (
      cfg.theme &&
      (cfg.theme.default === "light" || cfg.theme.default === "dark")
    ) {
      theme = cfg.theme.default;
    }
  }

  setTheme(theme);

  // React live if the OS/browser theme changes while the page is open
  try {
    if (window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handleSystemThemeChange = event => {
        const nextTheme = event.matches ? "dark" : "light";
        setTheme(nextTheme);
      };

      if (typeof mq.addEventListener === "function") {
        mq.addEventListener("change", handleSystemThemeChange);
      } else if (typeof mq.addListener === "function") {
        mq.addListener(handleSystemThemeChange);
      }
    }
  } catch (_) {
    // If matchMedia isn't available or throws, just skip live updates
  }

  // Show or hide theme toggle based on config
  const toggleBtn = document.querySelector(".theme-toggle");
  if (toggleBtn) {
    if (cfg.theme && cfg.theme.allowToggle) {
      toggleBtn.style.display = "inline-flex";
    } else {
      toggleBtn.style.display = "none";
    }
  }

  // Browser/tab title
  if (cfg.siteTitle) {
    document.title = cfg.siteTitle;
  }

  // Header: logo (monogram or image) + site name
  if (cfg.header) {
    const logoMark = document.getElementById("headerLogoMark");
    const logoImg = document.getElementById("headerLogoImage");
    const siteName = document.getElementById("headerSiteName");

    const mode = cfg.header.logoMode === "image" ? "image" : "monogram";

    if (mode === "image" && cfg.header.logoImageUrl && logoImg) {
      logoImg.src = cfg.header.logoImageUrl;
      logoImg.alt = cfg.header.logoImageAlt || cfg.header.siteName || "Site logo";
      logoImg.style.display = "block";
      if (logoMark) logoMark.style.display = "none";
    } else {
      if (logoMark) {
        logoMark.textContent = cfg.header.logoText || "";
        logoMark.style.display = "inline-flex";
      }
      if (logoImg) logoImg.style.display = "none";
    }

    if (siteName && cfg.header.siteName) {
      siteName.textContent = cfg.header.siteName;
    }
  }

  // Nav labels
  if (cfg.nav) {
    const map = {
      home: "navHomeLink",
      policies: "navPoliciesLink",
      howto: "navHowtoLink",
      resources: "navResourcesLink"
    };
    Object.keys(map).forEach(key => {
      const el = document.getElementById(map[key]);
      if (el && cfg.nav[key]) {
        el.textContent = cfg.nav[key];
      }
    });
  }

  // Footer text
  if (cfg.footer) {
    const cp = document.getElementById("footerCopyrightPrefix");
    if (cp && cfg.footer.copyrightPrefix) {
      cp.textContent = cfg.footer.copyrightPrefix + " ";
    }

    const owner = document.getElementById("footerOwner");
    if (owner && cfg.footer.owner) {
      owner.textContent = cfg.footer.owner;
    }
  }

  // Always set current year if we have the span
  const yearEl = document.getElementById("footerYear");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

function setActiveNav() {
  const path = window.location.pathname.toLowerCase();
  let key = "home";

  if (path.includes("policies")) {
    key = "policies";
  } else if (path.includes("how-to")) {
    key = "howto";
  } else if (path.includes("resources")) {
    key = "resources";
  }

  const active = document.querySelector('nav.nav a[data-nav="' + key + '"]');
  if (active) {
    active.classList.add("active");
  }
}

function initNavToggle() {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector("nav.nav");

  if (!header || !toggle || !nav) return;

  toggle.addEventListener("click", () => {
    const isOpen = header.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  nav.addEventListener("click", event => {
    const link = event.target.closest("a");
    if (!link) return;
    header.classList.remove("nav-open");
    toggle.setAttribute("aria-expanded", "false");
  });
}

async function initShell() {
  await injectPartials();
  await applyGlobalBranding();
  setActiveNav();
  initNavToggle();

  // Hook up theme toggle if allowed (kept for future use)
  try {
    const res = await fetch("branding/global.json", { cache: "no-cache" });
    if (res.ok) {
      const cfg = await res.json();
      if (cfg.theme && cfg.theme.allowToggle) {
        const btn = document.querySelector(".theme-toggle");
        if (btn) {
          const updateBtn = () => {
            const current =
              document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
            btn.dataset.theme = current;
            btn.setAttribute("aria-pressed", current === "dark" ? "true" : "false");
            btn.title =
              current === "dark" ? "Switch to light mode" : "Switch to dark mode";
          };
          updateBtn();
          btn.addEventListener("click", () => {
            const current =
              document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
            const next = current === "light" ? "dark" : "light";
            setTheme(next);
            updateBtn();
          });
        }
      }
    }
  } catch (_) {
    // non-fatal if branding can't be reloaded here
  }
}

document.addEventListener("DOMContentLoaded", initShell);