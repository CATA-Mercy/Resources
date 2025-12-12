// scripts/home.js
// Home page logic: applies branding/home.json and shows basic
// placeholders for highlights + upcoming from data/home-content.json.

async function loadHomeBranding() {
  try {
    const res = await fetch("branding/home.json", { cache: "no-cache" });
    if (!res.ok) throw new Error("branding/home.json HTTP " + res.status);
    const cfg = await res.json();

    // Hero
    if (cfg.hero) {
      const h = cfg.hero;
      const headingEl = document.getElementById("homeHeroHeading");
      const bodyEl = document.getElementById("homeHeroBody");

      if (headingEl && h.heading) headingEl.textContent = h.heading;

      if (bodyEl && Array.isArray(h.body)) {
        bodyEl.innerHTML = "";
        h.body.forEach(line => {
          const p = document.createElement("p");
          p.textContent = line;
          bodyEl.appendChild(p);
        });
      }
    }

    // Contact block
    if (cfg.contact) {
      const c = cfg.contact;
      const titleEl = document.getElementById("homeContactTitle");
      const bodyEl = document.getElementById("homeContactBody");
      const emailLabelEl = document.getElementById("homeContactEmailLabel");
      const phoneLabelEl = document.getElementById("homeContactPhoneLabel");
      const emailValueEl = document.getElementById("homeContactEmailValue");
      const phoneValueEl = document.getElementById("homeContactPhoneValue");

      if (titleEl && c.title) titleEl.textContent = c.title;
      if (bodyEl && c.body) bodyEl.textContent = c.body;
      if (emailLabelEl && c.emailLabel) emailLabelEl.textContent = c.emailLabel;
      if (phoneLabelEl && c.phoneLabel) phoneLabelEl.textContent = c.phoneLabel;
      if (emailValueEl && c.email) {
        emailValueEl.textContent = c.email;
        emailValueEl.href = "mailto:" + c.email;
      }
      if (phoneValueEl && c.phone) {
        phoneValueEl.textContent = c.phone;
      }
    }

    // Cards
    if (cfg.cards) {
      const cards = cfg.cards;

      if (cards.policies) {
        const t = document.getElementById("homeCardPoliciesTitle");
        const b = document.getElementById("homeCardPoliciesBody");
        if (t && cards.policies.title) t.textContent = cards.policies.title;
        if (b && cards.policies.body) b.textContent = cards.policies.body;
      }

      if (cards.howto) {
        const t = document.getElementById("homeCardHowtoTitle");
        const b = document.getElementById("homeCardHowtoBody");
        if (t && cards.howto.title) t.textContent = cards.howto.title;
        if (b && cards.howto.body) b.textContent = cards.howto.body;
      }

      if (cards.resources) {
        const t = document.getElementById("homeCardResourcesTitle");
        const b = document.getElementById("homeCardResourcesBody");
        if (t && cards.resources.title) t.textContent = cards.resources.title;
        if (b && cards.resources.body) b.textContent = cards.resources.body;
      }
    }

    // Section titles & empty states
    if (cfg.sections) {
      const s = cfg.sections;
      const hiTitle = document.getElementById("homeHighlightsTitle");
      const upTitle = document.getElementById("homeUpcomingTitle");
      if (hiTitle && s.highlightsTitle) hiTitle.textContent = s.highlightsTitle;
      if (upTitle && s.upcomingTitle) upTitle.textContent = s.upcomingTitle;

      const hiList = document.getElementById("homeHighlightsList");
      const upList = document.getElementById("homeUpcomingList");
      if (hiList && s.highlightsEmpty) {
        hiList.textContent = s.highlightsEmpty;
      }
      if (upList && s.upcomingEmpty) {
        upList.textContent = s.upcomingEmpty;
      }
    }
  } catch (err) {
    console.warn("Error applying home branding:", err);
  }
}

async function loadHomeContent() {
  // Later we’ll populate highlights / upcoming from data/home-content.json
  // For now, this is a no-op so the empty-state text from branding shows.
  try {
    const res = await fetch("data/home-content.json", { cache: "no-cache" });
    if (!res.ok) return; // fine to silently skip for now
    const data = await res.json();

    const hiList = document.getElementById("homeHighlightsList");
    const upList = document.getElementById("homeUpcomingList");

    if (data.highlights && data.highlights.length && hiList) {
      hiList.classList.remove("empty-state");
      hiList.innerHTML = "";
      data.highlights.forEach(item => {
        const card = document.createElement("article");
        card.className = "card item-card";
        const title = document.createElement("h3");
        title.textContent = item.title || "";
        const desc = document.createElement("p");
        desc.textContent = item.description || "";
        card.appendChild(title);
        card.appendChild(desc);
        if (item.link) {
          const link = document.createElement("a");
          link.href = item.link;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.className = "btn ghost small";
          link.textContent = "View";
          card.appendChild(link);
        }
        hiList.appendChild(card);
      });
    }

    if (data.upcoming && data.upcoming.length && upList) {
      upList.classList.remove("empty-state");
      upList.innerHTML = "";
      data.upcoming.forEach(item => {
        const card = document.createElement("article");
        card.className = "card item-card";
        const title = document.createElement("h3");
        title.textContent = item.title || "";
        const meta = document.createElement("p");
        const bits = [];
        if (item.date) bits.push(item.date);
        if (item.time) bits.push(item.time);
        if (item.location) bits.push(item.location);
        meta.textContent = bits.join(" • ");
        card.appendChild(title);
        if (meta.textContent) card.appendChild(meta);
        if (item.description) {
          const desc = document.createElement("p");
          desc.textContent = item.description;
          card.appendChild(desc);
        }
        if (item.link) {
          const link = document.createElement("a");
          link.href = item.link;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.className = "btn ghost small";
          link.textContent = "Details";
          card.appendChild(link);
        }
        upList.appendChild(card);
      });
    }
  } catch (err) {
    console.warn("Error loading home-content.json:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadHomeBranding();
  loadHomeContent();
});