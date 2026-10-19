/* ==================================================================
   Metropolis Youth Network — frontend app
   Works in two modes:
   - CLOUD  : talks to /api/* (Cloudflare Pages Functions + D1)
   - LOCAL  : localStorage + embedded seed (preview / offline / fallback)
   ================================================================== */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, cls, html) => { const n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function flag(cc) {
    if (!cc || cc.length !== 2) return "🏳️";
    const A = 0x1F1E6;
    return String.fromCodePoint(A + cc.toUpperCase().charCodeAt(0) - 65, A + cc.toUpperCase().charCodeAt(1) - 65);
  }
  const normUrl = (u) => !u ? "" : (/^https?:\/\//.test(u) ? u : "https://" + u);
  const host = (u) => u ? u.replace(/^https?:\/\//, "").replace(/\/$/, "") : "";

  /* ---------------- Data layer ---------------- */
  const LS = {
    theatres: "myn_theatres_v1",
    activity: "myn_activity_v1",
    user: "myn_user_v1",
  };
  let MODE = "local"; // probed at init

  const local = {
    read(k, def) { try { return JSON.parse(localStorage.getItem(k)) ?? def; } catch { return def; } },
    write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };

  const DB = {
    async init() {
      try {
        const r = await fetch("/api/theatres", { method: "GET" });
        if (r.ok) { MODE = "cloud"; return; }
      } catch {}
      MODE = "local";
      if (!localStorage.getItem(LS.theatres)) local.write(LS.theatres, window.MYN_SEED || []);
    },
    async list() {
      if (MODE === "cloud") { const r = await fetch("/api/theatres"); return (await r.json()).theatres || []; }
      return local.read(LS.theatres, window.MYN_SEED || []);
    },
    async get(id) {
      const all = await this.list();
      return all.find(t => t.id === id);
    },
    async add(obj) {
      if (MODE === "cloud") {
        const r = await fetch("/api/theatres", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(obj) });
        if (!r.ok) throw new Error("add failed");
        return (await r.json()).theatre;
      }
      const all = local.read(LS.theatres, []);
      obj.id = obj.id || slug(obj.name) + "-" + Math.random().toString(36).slice(2, 6);
      all.push(obj); local.write(LS.theatres, all);
      await this.log("add", obj.name, obj.id);
      return obj;
    },
    async remove(id, name) {
      if (MODE === "cloud") {
        const r = await fetch("/api/theatres/" + encodeURIComponent(id), { method: "DELETE", headers: { "x-user": state.user || "" } });
        if (!r.ok) throw new Error("delete failed");
        return;
      }
      const all = local.read(LS.theatres, []).filter(t => t.id !== id);
      local.write(LS.theatres, all);
      await this.log("delete", name, id);
    },
    async activity() {
      if (MODE === "cloud") { const r = await fetch("/api/activity"); return (await r.json()).activity || []; }
      return local.read(LS.activity, []);
    },
    async log(action, target, targetId) {
      if (MODE === "cloud") return; // server logs writes automatically
      const a = local.read(LS.activity, []);
      a.unshift({ id: Date.now() + "-" + Math.random().toString(36).slice(2, 5), user: state.user || "Anonim", action, target, targetId, ts: new Date().toISOString() });
      local.write(LS.activity, a.slice(0, 500));
    },
  };
  const slug = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  /* ---------------- State ---------------- */
  const state = {
    user: local.read(LS.user, null),
    theatres: [],
    filter: { q: "", country: "", type: "", category: "", sort: "name", mission: false },
  };

  /* ---------------- Toast / modal ---------------- */
  function toast(msg, kind = "") {
    const host = $("#toast-host");
    const t = el("div", "toast " + kind, esc(msg));
    host.appendChild(t);
    setTimeout(() => { t.style.opacity = "0"; t.style.transition = "opacity .3s"; setTimeout(() => t.remove(), 300); }, 2600);
  }
  function openModal(html) {
    const m = $("#modal"); m.innerHTML = html;
    $("#modal-backdrop").hidden = false;
  }
  function closeModal() { $("#modal-backdrop").hidden = true; $("#modal").innerHTML = ""; }
  $("#modal-backdrop").addEventListener("click", (e) => { if (e.target.id === "modal-backdrop") closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  /* ---------------- Auth (name only, internal) ---------------- */
  function renderUser() {
    const box = $("#header-user");
    if (state.user) {
      box.innerHTML = `<button class="user-chip" id="user-chip"><span class="avatar">${esc(initials(state.user))}</span>${esc(state.user)}</button>`;
      $("#user-chip").onclick = () => openModal(userMenuHtml());
    } else {
      box.innerHTML = `<button class="btn btn-sm btn-primary" id="login-btn">Autentifică-te</button>`;
      $("#login-btn").onclick = loginPrompt;
    }
  }
  const initials = (n) => n.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
  function loginPrompt() {
    openModal(`
      <button class="modal-close" onclick="MYN.closeModal()">×</button>
      <h2>Autentificare</h2>
      <p class="modal-sub">Document intern. Intră cu numele tău — apare lângă modificările pe care le faci.</p>
      <div class="field"><label>Numele tău</label><input id="login-name" placeholder="ex. Oana B." autofocus></div>
      <div class="modal-actions">
        <button class="btn" onclick="MYN.closeModal()">Renunță</button>
        <button class="btn btn-primary" id="login-save">Intră</button>
      </div>`);
    const save = () => {
      const v = $("#login-name").value.trim();
      if (!v) { toast("Scrie un nume.", "err"); return; }
      state.user = v; local.write(LS.user, v); closeModal(); renderUser(); toast("Bun venit, " + v + "!", "ok");
    };
    $("#login-save").onclick = save;
    $("#login-name").addEventListener("keydown", e => { if (e.key === "Enter") save(); });
  }
  function userMenuHtml() {
    return `
      <button class="modal-close" onclick="MYN.closeModal()">×</button>
      <h2>${esc(state.user)}</h2>
      <p class="modal-sub">Ești autentificat ca acest utilizator pentru acest document intern.</p>
      <div class="modal-actions">
        <button class="btn" onclick="MYN.logout()">Schimbă utilizatorul</button>
        <button class="btn btn-primary" onclick="MYN.closeModal()">Închide</button>
      </div>`;
  }
  function logout() { state.user = null; local.write(LS.user, null); closeModal(); renderUser(); showGate(); }
  function ensureUser() {
    if (!state.user) { toast("Autentifică-te întâi (buton dreapta-sus).", "err"); loginPrompt(); return false; }
    return true;
  }
  // Full-screen login gate shown at entry when no user is set
  function showGate() {
    if ($("#login-gate")) return;
    const g = el("div", "login-gate");
    g.id = "login-gate";
    g.innerHTML = `
      <div class="gate-card">
        <div class="gate-brand">
          <span class="gate-main">Metropolis Youth Network</span>
          <span class="gate-sub">rețeaua europeană de teatru tânăr</span>
        </div>
        <h2>Bine ai venit</h2>
        <p class="gate-lead">Instrument intern al Teatrului Metropolis. Intră cu numele tău ca să explorezi și să editezi catalogul — numele apare lângă modificările pe care le faci.</p>
        <div class="field"><label>Numele tău</label><input id="gate-name" placeholder="ex. Oana B." autocomplete="name"></div>
        <button class="btn btn-accent gate-go" id="gate-go">Intră în platformă →</button>
        <p class="gate-note">Fără cont, fără parolă — doar numele, pentru document intern.</p>
      </div>`;
    document.body.appendChild(g);
    const inp = $("#gate-name");
    inp.focus();
    const enter = () => {
      const v = inp.value.trim();
      if (!v) { inp.classList.add("shake"); setTimeout(() => inp.classList.remove("shake"), 400); inp.focus(); return; }
      state.user = v; local.write(LS.user, v);
      g.classList.add("gate-out");
      setTimeout(() => g.remove(), 260);
      renderUser(); render(); toast("Bun venit, " + v + "!", "ok");
    };
    $("#gate-go").onclick = enter;
    inp.addEventListener("keydown", e => { if (e.key === "Enter") enter(); });
  }

  /* ---------------- Router ---------------- */
  const routes = {};
  function route(path, fn) { routes[path] = fn; }
  function go(hash) { location.hash = hash; }
  async function render() {
    const hash = location.hash.replace(/^#/, "") || "/";
    const [path, param] = splitRoute(hash);
    $$(".main-nav a").forEach(a => a.classList.toggle("active", a.dataset.route === path));
    $("#main-nav").classList.remove("open");
    const app = $("#app");
    app.innerHTML = `<div class="wrap"><p class="empty">Se încarcă…</p></div>`;
    const fn = routes[path] || routes["/"];
    try { await fn(app, param); } catch (e) { app.innerHTML = `<div class="wrap"><p class="empty">Eroare: ${esc(e.message)}</p></div>`; }
    window.scrollTo(0, 0);
  }
  function splitRoute(hash) {
    if (hash.startsWith("/teatru/")) return ["/teatru", decodeURIComponent(hash.slice("/teatru/".length))];
    if (hash.startsWith("/tari/")) return ["/tari", decodeURIComponent(hash.slice("/tari/".length))];
    if (hash.startsWith("/director/")) return ["/director", decodeURIComponent(hash.slice("/director/".length))];
    return [hash, null];
  }

  /* ---------------- Views ---------------- */

  // HOME
  route("/", async (app) => {
    const T = await DB.list();
    const countries = [...new Set(T.map(t => t.country))];
    const oldest = T.filter(t => t.founded).sort((a, b) => a.founded - b.founded)[0];
    app.innerHTML = `
      <div class="wrap">
        <section class="hero">
          <p class="eyebrow">Rețea europeană · teatru tânăr</p>
          <h1>O hartă vie a teatrelor unde urcă pe scenă noua generație de actori, în toată Europa.</h1>
          <p class="lede">Documentăm teatrele și companiile din Europa unde majoritatea producțiilor sunt jucate de actori tineri (18–35), pentru publicul larg — locuri în care oricine poate veni să vadă noua generație pe scenă. Un punct de plecare pentru o rețea internațională și pentru un festival la București.</p>
          <div class="hero-actions">
            <button class="btn btn-accent" onclick="MYN.go('/director')">Explorează teatrele →</button>
            <button class="btn" onclick="MYN.go('/harta')">Vezi harta</button>
          </div>
        </section>

        <section class="stats" id="home-stats">
          ${statCard(T.length, "teatre documentate", "/director")}
          ${statCard(countries.length, "țări europene", "/tari")}
          ${statCard(oldest ? oldest.founded : "—", "cel mai vechi (an)", oldest ? "/teatru/" + oldest.id : "/director")}
          ${statCard((window.MYN_RESOURCES || []).length, "rețele & resurse", "/resurse")}
        </section>

        <div class="section-title"><h2>Ce găsești aici</h2></div>
        <section class="features">
          ${feature("🎭", "Ansambluri de actori tineri", "Teatre de stat și academii de stat din Europa unde cei care urcă pe scenă sunt actori tineri (18–35), pentru publicul larg. Cele marcate cu ★ sunt relevante pentru Metropolis.")}
          ${feature("🔎", "Căutare & filtrare", "Caută după nume, oraș sau profil și filtrează pe țară și tip (teatru de stat / academie de stat), în catalogul detaliat.")}
          ${feature("🗺️", "Hartă interactivă", "Vezi unde se află fiecare teatru pe harta Europei și deschide direct profilul sau site-ul fiecăruia.")}
          ${feature("🤝", "Gândit pentru parteneriate", "Un punct de plecare pentru coproducții, mobilități și un festival internațional de teatru tânăr.")}
          ${feature("🌍", "Acoperire pan-europeană", "Vest, Nord, Sud, Centru și Est — cele mai relevante structuri din fiecare țară europeană.")}
          ${feature("✍️", "Colaborativ & editabil", "Adaugă, actualizează și șterge intrări. Fiecare modificare apare în fila Activitate, cu numele autorului.")}
        </section>
      </div>`;
    // mini preview map
  });
  const statCard = (num, lbl, to) => `<button class="stat" onclick="MYN.go('${to}')"><span class="go">↗</span><span class="num">${esc(num)}</span><span class="lbl">${esc(lbl)}</span></button>`;
  const feature = (ic, h, p) => `<div class="feature"><div class="ic">${ic}</div><h3>${esc(h)}</h3><p>${esc(p)}</p></div>`;

  // DIRECTOR
  function classify(t) {
    const ty = (t.type || "").toLowerCase();
    const nm = (t.name || "").toLowerCase();
    if (/acc?adem|akadem|hochschule|universit|schule|seminar|institut|école|ecole|conservator/.test(ty)
        || /acc?adem|akadem|hochschule|universit|schule|seminar|institut|école|ecole|conservator|\bdisk\b|collegium nobilium|studio marta|divadlo lab|[oó]dry/.test(nm))
      return "Universitate";
    if (/municipal|de stat|na[țt]ional/.test(ty)
        || /jeune théâtre national|théâtre national de toulouse|la colline/.test(nm))
      return "Teatru de stat";
    return "Companie independentă";
  }
  const CAT_LABELS = { "Teatru de stat": "Teatre de stat", "Universitate": "Universități", "Companie independentă": "Companii independente" };
  function catClsOf(c) { return c === "Teatru de stat" ? "cat-stat" : c === "Universitate" ? "cat-acad" : "cat-indep"; }

  const relOf = (t) => Math.max(0, Math.min(5, parseInt(t && t.relevance, 10) || 0));
  function relBars(n) {
    n = Math.max(0, Math.min(5, parseInt(n, 10) || 0));
    let s = `<span class="relbars" title="Relevanță Metropolis: ${n}/5" aria-label="Relevanță ${n} din 5">`;
    for (let i = 1; i <= 5; i++) s += `<i class="relbar${i <= n ? " on" : ""}"></i>`;
    return s + "</span>";
  }
  function relBarsText(n) {
    n = Math.max(0, Math.min(5, parseInt(n, 10) || 0));
    return "▮".repeat(n) + "▯".repeat(5 - n);
  }
  // Editable 0–5 picker (used in the add/edit form)
  function relPickerHtml(val) {
    val = Math.max(0, Math.min(5, parseInt(val, 10) || 0));
    let segs = "";
    for (let i = 1; i <= 5; i++) segs += `<button type="button" class="rp-seg${i <= val ? " on" : ""}" data-v="${i}" title="${i}/5"></button>`;
    return `<div class="rel-picker" id="e-rel" data-val="${val}">${segs}<button type="button" class="rp-clear" data-v="0" title="Șterge">✕</button><span class="rp-num">${val}/5</span></div>`;
  }

  function filteredList() {
    let list = (state.theatres || []).slice();
    const q = (state.filter.q || "").trim().toLowerCase();
    if (q) list = list.filter(t => (t.name + " " + t.city + " " + t.country + " " + (t.tagline || "") + " " + (t.profile || "")).toLowerCase().includes(q));
    if (state.filter.country) list = list.filter(t => t.country === state.filter.country);
    if (state.filter.category) list = list.filter(t => classify(t) === state.filter.category);
    if (state.filter.mission) list = list.filter(t => relOf(t) > 0);
    const s = state.filter.sort;
    list.sort((a, b) => {
      if (s === "relevance") return relOf(b) - relOf(a) || a.name.localeCompare(b.name, "ro");
      if (s === "founded") return (a.founded || 9999) - (b.founded || 9999);
      return (a[s] || "").localeCompare(b[s] || "", "ro");
    });
    return list;
  }

  route("/director", async (app, param) => {
    const T = await DB.list();
    state.theatres = T;
    if (param) state.filter.country = param;
    const countries = [...new Set(T.map(t => t.country))].sort((a, b) => a.localeCompare(b, "ro"));
    const cats = ["Teatru de stat", "Universitate", "Companie independentă"];
    app.innerHTML = `
      <div class="wrap">
        <div class="page-head">
          <p class="eyebrow">Teatre</p>
          <h1>Teatrele rețelei</h1>
          <p class="lede">Teatre de stat și academii de stat din Europa unde urcă pe scenă actori tineri (18–35), pentru publicul larg. Cele cu ★ sunt marcate ca relevante pentru Metropolis. Dă click pe o intrare pentru profilul complet.</p>
        </div>
        <div class="toolbar">
          <div class="search">🔎<input id="f-q" placeholder="Caută nume, oraș, profil…" value="${esc(state.filter.q)}"></div>
          <select class="select" id="f-country"><option value="">Toate țările</option>${countries.map(c => `<option ${state.filter.country === c ? "selected" : ""}>${esc(c)}</option>`).join("")}</select>
          <select class="select" id="f-category"><option value="">Toate tipurile</option>${cats.map(c => `<option value="${esc(c)}" ${state.filter.category === c ? "selected" : ""}>${esc(CAT_LABELS[c])}</option>`).join("")}</select>
          <select class="select" id="f-sort">
            <option value="name" ${state.filter.sort === "name" ? "selected" : ""}>Sortează: nume</option>
            <option value="country" ${state.filter.sort === "country" ? "selected" : ""}>Sortează: țară</option>
            <option value="founded" ${state.filter.sort === "founded" ? "selected" : ""}>Sortează: an înființare</option>
            <option value="relevance" ${state.filter.sort === "relevance" ? "selected" : ""}>Sortează: relevanță ▮</option>
          </select>
          <label class="mission-toggle"><input type="checkbox" id="f-mission" ${state.filter.mission ? "checked" : ""}> doar relevante pentru Metropolis ★</label>
          <button class="btn btn-sm btn-pdf" id="f-pdf" title="Exportă catalogul ca PDF pentru print">⤓ Export PDF</button>
          <span class="result-count" id="f-count"></span>
        </div>
        <div class="cards" id="cards"></div>
      </div>`;
    const apply = () => {
      state.filter.q = $("#f-q").value;
      state.filter.country = $("#f-country").value;
      state.filter.category = $("#f-category").value;
      state.filter.sort = $("#f-sort").value;
      state.filter.mission = $("#f-mission").checked;
      drawCards();
    };
    $("#f-q").addEventListener("input", apply);
    $("#f-country").addEventListener("change", apply);
    $("#f-category").addEventListener("change", apply);
    $("#f-sort").addEventListener("change", apply);
    $("#f-mission").addEventListener("change", apply);
    $("#f-pdf").addEventListener("click", () => exportPDF());
    drawCards();

    function drawCards() {
      const list = filteredList();
      $("#f-count").textContent = `${list.length} din ${state.theatres.length} teatre`;
      const wrap = $("#cards");
      wrap.innerHTML = "";
      wrap.appendChild(addCardEl());
      list.forEach(t => wrap.appendChild(cardEl(t)));
      if (!list.length) wrap.appendChild(el("div", "empty", "Niciun teatru nu se potrivește filtrelor."));
    }
  });

  function cardEl(t) {
    const c = el("div", "card");
    const cat = classify(t); const catCls = catClsOf(cat);
    c.innerHTML = `
      <button class="card-del" title="Șterge" data-del="${esc(t.id)}">🗑</button>
      <div class="card-top">
        <div><h3>${esc(t.name)}</h3><div class="loc">${esc(t.city)}, ${esc(t.country)}</div></div>
        <div class="flag">${flag(t.cc)}</div>
      </div>
      <div class="tagline">${esc(t.tagline || "")}</div>
      <p class="desc">${esc(truncate(t.profile || "", 110))}</p>
      <div class="card-meta">
        <span class="tag ${catCls}">${esc(cat)}</span>
        ${relOf(t) > 0 ? `<span class="tag mission">${relBars(relOf(t))} Metropolis</span>` : ""}
        ${t.ageRange ? `<span class="tag">actori ${esc(t.ageRange)}</span>` : ""}
        ${t.founded ? `<span class="tag year">fondat ${esc(t.founded)}</span>` : ""}
      </div>
      ${t.website ? `<a class="card-site" href="${esc(normUrl(t.website))}" target="_blank" rel="noopener" title="Deschide site-ul oficial">🔗 ${esc(host(t.website))} ↗</a>` : ""}`;
    c.addEventListener("click", (e) => {
      if (e.target.closest(".card-del")) { e.stopPropagation(); confirmDelete(t); return; }
      if (e.target.closest(".card-site")) { e.stopPropagation(); return; }
      go("/teatru/" + t.id);
    });
    return c;
  }
  function addCardEl() {
    const c = el("div", "card add-card");
    c.innerHTML = `<div class="plus">+</div><div>Adaugă un teatru</div>`;
    c.addEventListener("click", () => { if (ensureUser()) openEditForm(); });
    return c;
  }
  const truncate = (s, n) => s.length > n ? s.slice(0, n).replace(/\s+\S*$/, "") + "…" : s;

  // DETAIL
  route("/teatru", async (app, id) => {
    const t = await DB.get(id);
    if (!t) { app.innerHTML = `<div class="wrap"><p class="empty">Teatru inexistent. <a href="#/director">Înapoi la director</a></p></div>`; return; }
    const cat = classify(t); const catCls = catClsOf(cat);
    const photo = t.photo
      ? `<div class="detail-photo" style="background-image:url('${esc(t.photo)}')"></div>`
      : `<div class="detail-photo placeholder"><span class="ph-flag">${flag(t.cc)}</span><span class="ph-name">${esc(t.name)}</span></div>`;
    const relBox = t.metropolisRelevance
      ? `<div class="metropolis-box"><div class="mb-label">★ Relevant pentru Metropolis</div><p>${esc(t.metropolisRelevance)}</p></div>` : "";
    app.innerHTML = `
      <div class="wrap detail">
        <a class="back-link" href="#/director">← Înapoi la Teatre</a>
        ${photo}
        <div class="detail-head">
          <div class="flag">${flag(t.cc)}</div>
          <div style="flex:1;min-width:260px">
            <h1>${esc(t.name)}</h1>
            <div class="loc">${esc(t.city)}, ${esc(t.country)}</div>
            <div class="detail-badges">
              <span class="tag ${catCls}">${esc(cat)}</span>
              ${relOf(t) > 0 ? `<span class="tag mission">${relBars(relOf(t))} Metropolis</span>` : ""}
              ${t.founded ? `<span class="tag year">fondat ${esc(t.founded)}</span>` : ""}
              ${t.ageRange ? `<span class="tag">actori ${esc(t.ageRange)}</span>` : ""}
            </div>
          </div>
        </div>
        <div class="detail-grid">
          <div class="detail-main">
            ${relBox}
            ${section("Profil", t.profile)}
            ${section("Repertoriu & stil", t.repertoire)}
            ${section("Premii & recunoaștere", t.awards)}
            ${section("Experiență internațională & rețea", t.international)}
          </div>
          <aside class="detail-aside">
            <div class="fact"><span class="k">Oraș</span><span class="v">${esc(t.city)}</span></div>
            <div class="fact"><span class="k">Țară</span><span class="v">${flag(t.cc)} ${esc(t.country)}</span></div>
            ${t.founded ? `<div class="fact"><span class="k">Înființare</span><span class="v">${esc(t.founded)}</span></div>` : ""}
            ${t.ageRange ? `<div class="fact"><span class="k">Actori (vârste)</span><span class="v">${esc(t.ageRange)}</span></div>` : ""}
            ${relOf(t) > 0 ? `<div class="fact"><span class="k">Relevanță Metropolis</span><span class="v">${relBars(relOf(t))} ${relOf(t)}/5</span></div>` : ""}
            <div class="fact"><span class="k">Tip</span><span class="v">${esc(cat)}</span></div>
            <div class="fact"><span class="k">Formă</span><span class="v">${esc(t.type || "—")}</span></div>
            ${t.website ? `<div class="fact"><span class="k">Site</span><span class="v"><a href="${esc(normUrl(t.website))}" target="_blank" rel="noopener" style="color:var(--accent)">${esc(host(t.website))} ↗</a></span></div>` : ""}
            ${t.website ? `<a class="btn btn-accent" href="${esc(normUrl(t.website))}" target="_blank" rel="noopener">Vizitează site-ul ↗</a>` : ""}
            <button class="btn" id="edit-btn">Editează</button>
            <button class="btn btn-danger" id="del-btn">Șterge</button>
            ${(t.lat && t.lng) ? `<div class="mini-map" id="mini-map"></div>` : ""}
          </aside>
        </div>
      </div>`;
    $("#edit-btn").onclick = () => { if (ensureUser()) openEditForm(t); };
    $("#del-btn").onclick = () => { if (ensureUser()) confirmDelete(t); };
    if (t.lat && t.lng && window.L) {
      const m = L.map("mini-map", { scrollWheelZoom: false, attributionControl: false }).setView([t.lat, t.lng], 11);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(m);
      L.circleMarker([t.lat, t.lng], { radius: 8, color: "#fff", weight: 2, fillColor: "#9b2c2c", fillOpacity: 1 }).addTo(m);
    }
  });
  const section = (h, body) => body ? `<div class="detail-section"><h3>${esc(h)}</h3><p>${esc(body)}</p></div>` : "";

  // MAP
  route("/harta", async (app) => {
    const T = await DB.list();
    app.innerHTML = `
      <div class="wrap">
        <div class="page-head"><p class="eyebrow">Hartă</p><h1>Harta rețelei</h1>
          <p class="lede">Fiecare marcaj e un teatru. Click pe marcaj pentru detalii și profil complet.</p></div>
        <div id="map"></div>
        <div class="map-legend"><span>📍 ${T.filter(t => t.lat && t.lng).length} teatre localizate pe hartă din ${T.length} documentate.</span></div>
      </div>`;
    if (!window.L) { $("#map").innerHTML = "<p class='empty'>Harta nu s-a putut încărca.</p>"; return; }
    const map = L.map("map", { scrollWheelZoom: true }).setView([52, 12], 4);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    const pts = [];
    T.filter(t => t.lat && t.lng).forEach(t => {
      const mk = L.circleMarker([t.lat, t.lng], {
        radius: 7, color: "#fff", weight: 2, fillColor: "#9b2c2c", fillOpacity: 1
      }).addTo(map);
      mk.bindPopup(`<div class="popup-name">${esc(t.name)}</div><div class="popup-loc">${flag(t.cc)} ${esc(t.city)}, ${esc(t.country)}</div><a class="popup-link" href="#/teatru/${esc(t.id)}" onclick="MYN.closeAllPopups()">Vezi profilul →</a>`);
      pts.push([t.lat, t.lng]);
    });
    if (pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: 6 });
    window.__map = map;
  });

  // COUNTRIES
  route("/tari", async (app, param) => {
    const T = await DB.list();
    const byC = {};
    T.forEach(t => { (byC[t.country] = byC[t.country] || []).push(t); });
    const countries = Object.keys(byC).sort((a, b) => a.localeCompare(b, "ro"));
    app.innerHTML = `
      <div class="wrap">
        <div class="page-head"><p class="eyebrow">Pe țări</p><h1>${countries.length} țări europene</h1>
          <p class="lede">Click pe o țară pentru a vedea teatrele ei în director.</p></div>
        <div class="country-grid">
          ${countries.map(c => `
            <button class="country-card" onclick="MYN.go('/director/${encodeURIComponent(c)}')">
              <span class="flag">${flag(byC[c][0].cc)}</span>
              <span><span class="cname">${esc(c)}</span><br><span class="ccount">${byC[c].length} ${byC[c].length === 1 ? "teatru" : "teatre"}</span></span>
            </button>`).join("")}
        </div>
      </div>`;
  });

  // RESOURCES
  route("/resurse", async (app) => {
    const R = window.MYN_RESOURCES || [];
    app.innerHTML = `
      <div class="wrap">
        <div class="page-head"><p class="eyebrow">Rețele & resurse</p><h1>Rețele-cadru & finanțare</h1>
          <p class="lede">Rețelele europene și programele de finanțare care susțin teatrul pentru copii, tineret și tânărul public.</p></div>
        <div class="res-list">
          ${R.map(r => `
            <div class="res">
              <h3>${esc(r.name)}</h3>
              <span class="tag" style="align-self:flex-start">${esc(r.kind)}</span>
              <p>${esc(r.desc)}</p>
              ${r.url ? `<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(host(r.url))} ↗</a>` : ""}
            </div>`).join("")}
        </div>
      </div>`;
  });

  // ABOUT
  route("/despre", async (app) => {
    app.innerHTML = `
      <div class="wrap">
        <div class="page-head"><p class="eyebrow">Despre</p><h1>Despre rețea</h1></div>
        <div class="prose">
          <p>Metropolis Youth Network este un instrument intern de documentare și lucru: o hartă vie a teatrelor și companiilor din Europa unde <b>majoritatea producțiilor sunt jucate de actori tineri (18–35)</b>, pentru publicul larg. Modelul este chiar Teatrul Metropolis — un loc în care actorii la început de drum au o scenă, iar oricine poate veni să vadă noua generație jucând.</p>
          <p>Scopul este dublu. Pe de o parte, să construim o <b>rețea internațională</b> de parteneri pentru coproducții, mobilități și schimburi. Pe de altă parte, să pregătim un <b>festival</b> găzduit la București, unde aducem pe scenă trupe tinere din toată Europa.</p>
          <p>De aceea nu căutăm teatrul <i>pentru</i> copii sau tânărul public, ci teatrul făcut <i>de</i> actori tineri pentru toată lumea. Catalogul cuprinde doar <b>instituții publice</b> — teatre de stat, naționale și municipale, cu trupele lor tinere, și academii de stat de teatru (scenele lor publice) — nu companii independente private. Evidențiem cu ★ structurile <b>relevante pentru Metropolis</b>. Selecția e făcută pe criterii reale: componența ansamblului, statut public, reputație artistică și experiență — nu pe marketing.</p>
          <h2>Cum funcționează</h2>
          <p>Catalogul poate fi completat de echipă: oricine autentificat cu numele poate adăuga, actualiza sau șterge intrări, și poate exporta un PDF pentru print. Toate modificările apar în fila <a href="#/activitate">Activitate</a>, ca să știm cine a lucrat la ce.</p>
        </div>
      </div>`;
  });

  // ACTIVITY
  route("/activitate", async (app) => {
    const A = await DB.activity();
    app.innerHTML = `
      <div class="wrap">
        <div class="page-head"><p class="eyebrow">Echipă</p><h1>Activitate</h1>
          <p class="lede">Istoricul modificărilor aduse directorului de către echipă.</p></div>
        <div class="activity-list">
          ${A.length ? A.map(actRow).join("") : `<div class="empty">Nicio activitate încă. Adaugă sau modifică un teatru în <a href="#/director">director</a>.</div>`}
        </div>
      </div>`;
  });
  function actRow(a) {
    const verb = a.action === "add" ? "a adăugat" : a.action === "delete" ? "a șters" : "a actualizat";
    const cls = a.action === "add" ? "add" : a.action === "delete" ? "del" : "edit";
    return `<div class="act">
      <div class="avatar ${cls}">${esc(initials(a.user || "?"))}</div>
      <div class="act-body">
        <div class="act-main"><b>${esc(a.user || "Anonim")}</b> ${verb} <b>${esc(a.target || "")}</b></div>
        <div class="act-time">${esc(timeAgo(a.ts))}</div>
      </div>
    </div>`;
  }
  function timeAgo(iso) {
    const d = new Date(iso); if (isNaN(d)) return "";
    const s = (Date.now() - d.getTime()) / 1000;
    if (s < 60) return "chiar acum";
    if (s < 3600) return Math.floor(s / 60) + " min în urmă";
    if (s < 86400) return Math.floor(s / 3600) + " h în urmă";
    if (s < 604800) return Math.floor(s / 86400) + " zile în urmă";
    return d.toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" });
  }

  /* ---------------- Add / Edit form ---------------- */
  function openEditForm(t) {
    const e = t || {};
    openModal(`
      <button class="modal-close" onclick="MYN.closeModal()">×</button>
      <h2>${t ? "Editează teatrul" : "Adaugă un teatru"}</h2>
      <p class="modal-sub">Câmpurile marcate cu * sunt obligatorii.</p>
      <div class="field"><label>Nume *</label><input id="e-name" value="${esc(e.name || "")}"></div>
      <div class="field-row">
        <div class="field"><label>Oraș *</label><input id="e-city" value="${esc(e.city || "")}"></div>
        <div class="field"><label>Țară *</label><input id="e-country" value="${esc(e.country || "")}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Cod țară (ISO2, ex. DE)</label><input id="e-cc" maxlength="2" value="${esc(e.cc || "")}"></div>
        <div class="field"><label>An înființare</label><input id="e-founded" type="number" value="${esc(e.founded || "")}"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Vârsta actorilor (ansamblu)</label><input id="e-age" value="${esc(e.ageRange || "")}" placeholder="ex. 18–35"></div>
        <div class="field"><label>Tip</label>
          <select id="e-category">
            <option value="Teatru de stat" ${e.category === "Teatru de stat" ? "selected" : ""}>Teatru de stat</option>
            <option value="Academie de stat" ${e.category === "Academie de stat" ? "selected" : ""}>Academie de stat</option>
          </select>
        </div>
      </div>
      <div class="field"><label>Formă de organizare (detaliat)</label><input id="e-type" value="${esc(e.type || "")}" placeholder="ex. Teatru municipal, Scenă a academiei de teatru"></div>
      <div class="field"><label>Relevanță pentru Metropolis (câte liniuțe, 0–5)</label>${relPickerHtml(relOf(e))}</div>
      <div class="field"><label>Site web</label><input id="e-website" value="${esc(e.website || "")}" placeholder="ex. teatru.de"></div>
      <div class="field"><label>Poză (link imagine)</label><input id="e-photo" value="${esc(e.photo || "")}" placeholder="https://… (opțional)"></div>
      <div class="field"><label>Scurtă descriere (tagline)</label><input id="e-tagline" value="${esc(e.tagline || "")}"></div>
      <div class="field"><label>Relevanță pentru Metropolis</label><textarea id="e-metropolis" placeholder="De ce e relevant pentru Teatrul Metropolis (parteneriat, festival, model)…">${esc(e.metropolisRelevance || "")}</textarea></div>
      <div class="field"><label>Profil</label><textarea id="e-profile">${esc(e.profile || "")}</textarea></div>
      <div class="field"><label>Repertoriu & stil</label><textarea id="e-repertoire">${esc(e.repertoire || "")}</textarea></div>
      <div class="field"><label>Premii & recunoaștere</label><textarea id="e-awards">${esc(e.awards || "")}</textarea></div>
      <div class="field"><label>Experiență internațională & rețea</label><textarea id="e-international">${esc(e.international || "")}</textarea></div>
      <div class="field-row">
        <div class="field"><label>Latitudine (hartă)</label><input id="e-lat" type="number" step="any" value="${esc(e.lat || "")}"></div>
        <div class="field"><label>Longitudine (hartă)</label><input id="e-lng" type="number" step="any" value="${esc(e.lng || "")}"></div>
      </div>
      <div class="modal-actions">
        <button class="btn" onclick="MYN.closeModal()">Renunță</button>
        <button class="btn btn-primary" id="e-save">${t ? "Salvează" : "Adaugă"}</button>
      </div>`);
    (function wireRel() {
      const p = $("#e-rel"); if (!p) return;
      const paint = () => { const v = +p.dataset.val || 0; p.querySelectorAll(".rp-seg").forEach(s => s.classList.toggle("on", (+s.dataset.v) <= v)); const n = p.querySelector(".rp-num"); if (n) n.textContent = v + "/5"; };
      p.querySelectorAll("[data-v]").forEach(b => b.addEventListener("click", () => {
        const v = +b.dataset.v;
        p.dataset.val = b.classList.contains("rp-clear") ? 0 : (v === (+p.dataset.val) ? v - 1 : v);
        paint();
      }));
      paint();
    })();

    $("#e-save").onclick = async () => {
      const g = (id) => $("#" + id).value.trim();
      const obj = {
        id: e.id, name: g("e-name"), city: g("e-city"), country: g("e-country"),
        cc: g("e-cc").toUpperCase(), founded: g("e-founded") ? +g("e-founded") : null,
        ageRange: g("e-age"), category: $("#e-category").value, type: g("e-type"), website: g("e-website"),
        photo: g("e-photo"), relevance: (function () { const p = $("#e-rel"); return p ? (parseInt(p.dataset.val, 10) || 0) : 0; })(),
        tagline: g("e-tagline"), metropolisRelevance: g("e-metropolis"),
        profile: g("e-profile"), repertoire: g("e-repertoire"),
        awards: g("e-awards"), international: g("e-international"),
        lat: g("e-lat") ? +g("e-lat") : null, lng: g("e-lng") ? +g("e-lng") : null,
      };
      if (!obj.name || !obj.city || !obj.country) { toast("Nume, oraș și țară sunt obligatorii.", "err"); return; }
      try {
        if (t) {
          await updateTheatre(obj);
          toast("Teatru actualizat.", "ok");
        } else {
          await DB.add(obj);
          toast("Teatru adăugat.", "ok");
        }
        closeModal();
        render();
      } catch (err) { toast("Nu s-a putut salva: " + err.message, "err"); }
    };
  }
  async function updateTheatre(obj) {
    if (MODE === "cloud") {
      const r = await fetch("/api/theatres/" + encodeURIComponent(obj.id), {
        method: "PUT", headers: { "content-type": "application/json", "x-user": state.user || "" }, body: JSON.stringify(obj)
      });
      if (!r.ok) throw new Error("update failed");
      return;
    }
    const all = local.read(LS.theatres, []);
    const i = all.findIndex(x => x.id === obj.id);
    if (i >= 0) { all[i] = obj; local.write(LS.theatres, all); await DB.log("edit", obj.name, obj.id); }
  }
  function confirmDelete(t) {
    if (!ensureUser()) return;
    openModal(`
      <button class="modal-close" onclick="MYN.closeModal()">×</button>
      <h2>Ștergi „${esc(t.name)}”?</h2>
      <p class="modal-sub">Această acțiune elimină intrarea din director. Va apărea în fila Activitate.</p>
      <div class="modal-actions">
        <button class="btn" onclick="MYN.closeModal()">Renunță</button>
        <button class="btn btn-accent" id="del-confirm">Șterge definitiv</button>
      </div>`);
    $("#del-confirm").onclick = async () => {
      try { await DB.remove(t.id, t.name); toast("Teatru șters.", "ok"); closeModal(); go("/director"); render(); }
      catch (err) { toast("Nu s-a putut șterge: " + err.message, "err"); }
    };
  }

  /* ---------------- Export PDF (descarcă fișier, respectă filtrele active) ---------------- */
  function filterSummary() {
    const parts = [];
    if (state.filter.country) parts.push(state.filter.country);
    if (state.filter.category) parts.push(CAT_LABELS[state.filter.category] || state.filter.category);
    if (state.filter.mission) parts.push("doar relevante pentru Metropolis ★");
    if ((state.filter.q || "").trim()) parts.push("căutare: „" + state.filter.q.trim() + "”");
    return parts.length ? parts.join(" · ") : "Toate instituțiile";
  }

  async function ensureHtml2pdf() {
    if (window.html2pdf) return;
    await new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = "assets/vendor/html2pdf.bundle.min.js";
      s.onload = resolve;
      s.onerror = () => reject(new Error("Nu s-a putut încărca generatorul PDF."));
      document.head.appendChild(s);
    });
  }

  async function exportPDF() {
    const list = filteredList();
    if (!list.length) { toast("Nicio instituție în selecția curentă.", "err"); return; }
    toast("Se generează PDF-ul… (câteva secunde)", "ok");
    try { await ensureHtml2pdf(); } catch (e) { toast(e.message, "err"); return; }

    const countries = [...new Set(list.map(t => t.country))];
    const CATS = ["Teatru de stat", "Universitate", "Companie independentă"];
    const CAT_COL = { "Teatru de stat": "#6b3fa0", "Universitate": "#2f5d86", "Companie independentă": "#2f7d4f" };
    const byCat = { "Teatru de stat": [], "Universitate": [], "Companie independentă": [] };
    list.forEach(t => byCat[classify(t)].push(t));
    const today = new Date().toLocaleDateString("ro-RO", { day: "numeric", month: "long", year: "numeric" });
    const stat = list.filter(t => classify(t) === "Teatru de stat").length;
    const univ = list.filter(t => classify(t) === "Universitate").length;
    const indep = list.filter(t => classify(t) === "Companie independentă").length;

    const S = {
      page: "width:794px;box-sizing:border-box;padding:0 34px;background:#fff;color:#1a1a18;font-family:'Inter',Arial,sans-serif;",
      cover: "page-break-after:always;text-align:center;padding:150px 20px 40px;",
      brand: "font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:#a33;font-weight:700;",
      sub: "font-size:13px;color:#777;margin:6px 0 32px;",
      title: "font-family:'Fraunces',Georgia,serif;font-size:40px;font-weight:600;margin:0 0 16px;",
      lead: "font-size:13px;line-height:1.6;color:#444;max-width:560px;margin:0 auto 20px;",
      sel: "font-size:13px;color:#a33;font-weight:600;margin:0 auto 22px;",
      stats: "font-size:13px;color:#333;line-height:2;",
      date: "font-size:12px;color:#999;margin-top:22px;",
      cname: "font-family:'Fraunces',Georgia,serif;font-size:19px;font-weight:600;color:#a33;border-bottom:2px solid #eadfe0;padding:14px 0 6px;margin:20px 0 10px;",
      th: "page-break-inside:avoid;break-inside:avoid;margin:0 0 11px;padding:0 0 9px;border-bottom:1px solid #e6e4dd;",
      thh: "font-family:'Fraunces',Georgia,serif;font-size:15px;font-weight:600;margin:0 0 2px;",
      meta: "font-size:11.5px;color:#666;margin:0 0 5px;",
      rel: "font-size:12px;color:#333;margin:4px 0;",
      prof: "font-size:12px;line-height:1.5;color:#333;margin:4px 0 0;",
      web: "font-size:11.5px;color:#a33;margin:4px 0 0;",
      foot: "text-align:center;font-size:11px;color:#999;padding:18px 0;",
    };
    const root = el("div");
    root.id = "pdf-root";
    root.style.cssText = S.page + "margin:0 auto;";
    root.innerHTML =
      `<div style="${S.cover}">
        <div style="${S.brand}">Metropolis Youth Network</div>
        <div style="${S.sub}">Rețeaua europeană de teatru tânăr</div>
        <h1 style="${S.title}">Catalogul teatrelor</h1>
        <p style="${S.lead}">Catalog al rețelei europene de teatru tânăr (actori 18–35). Instrument intern de documentare și parteneriat al Teatrului Metropolis. Grupat pe categorii; liniuțele ▮ indică relevanța pentru Metropolis (0–5).</p>
        <p style="${S.sel}">Selecție: ${esc(filterSummary())}</p>
        <div style="${S.stats}"><b>${list.length}</b> ${list.length === 1 ? "instituție" : "instituții"} &nbsp;·&nbsp; <b>${countries.length}</b> ${countries.length === 1 ? "țară" : "țări"}<br><b>${stat}</b> teatre de stat &nbsp;·&nbsp; <b>${univ}</b> universități &nbsp;·&nbsp; <b>${indep}</b> companii independente</div>
        <div style="${S.date}">Generat: ${today}</div>
      </div>` +
      CATS.map(c => {
        const items = byCat[c];
        if (!items.length) return "";
        items.sort((a, b) => relOf(b) - relOf(a) || a.name.localeCompare(b.name, "ro"));
        const col = CAT_COL[c];
        return `<section>
          <h2 style="${S.cname}color:${col};border-bottom-color:${col};">${esc(CAT_LABELS[c])} · ${items.length}</h2>
          ${items.map(t =>
            `<div style="${S.th}">
              <h3 style="${S.thh}">${esc(t.name)}${relOf(t) > 0 ? ` <span style="color:${col};font-size:12px">${relBarsText(relOf(t))}</span>` : ""}</h3>
              <div style="${S.meta}">${esc(t.city)}, ${esc(t.country)}${t.founded ? " · fondat " + esc(t.founded) : ""}${t.ageRange ? " · actori " + esc(t.ageRange) : ""}</div>
              ${t.profile ? `<p style="${S.prof}">${esc(t.profile)}</p>` : ""}
              ${t.website ? `<p style="${S.web}">${esc(host(t.website))}</p>` : ""}
            </div>`).join("")}
        </section>`;
      }).join("") +
      `<div style="${S.foot}">Metropolis Youth Network · instrument intern Teatrul Metropolis · ${today}</div>`;
    window.scrollTo(0, 0);
    document.body.appendChild(root);
    const ov = el("div");
    ov.style.cssText = "position:fixed;inset:0;z-index:99999;background:rgba(250,249,246,.97);display:flex;align-items:center;justify-content:center;font-family:'Inter',Arial,sans-serif;font-size:16px;color:#a33;font-weight:600;";
    ov.textContent = "Se generează PDF-ul…";
    document.body.appendChild(ov);

    const tag = (state.filter.country ? "-" + slug(state.filter.country) : "") + (state.filter.category ? "-" + slug(state.filter.category) : "");
    const opt = {
      margin: [10, 0, 12, 0],
      filename: "Catalog-Metropolis-Youth-Network" + tag + ".pdf",
      image: { type: "jpeg", quality: 0.96 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff", windowWidth: 794 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] },
    };
    try {
      await window.html2pdf().set(opt).from(root).save();
      toast("PDF descărcat.", "ok");
    } catch (e) {
      toast("Eroare la generarea PDF: " + (e && e.message || e), "err");
    } finally {
      root.remove();
      ov.remove();
    }
  }

  /* ---------------- Boot ---------------- */
  $("#nav-toggle").addEventListener("click", () => {
    const n = $("#main-nav"); n.classList.toggle("open");
  });
  window.addEventListener("hashchange", render);

  window.MYN = {
    go, closeModal, logout,
    closeAllPopups() { if (window.__map) window.__map.closePopup(); },
  };

  (async function boot() {
    await DB.init();
    renderUser();
    $("#footer-status").textContent = "";
    if (!location.hash) location.hash = "/";
    if (!state.user) { showGate(); } else { render(); }
  })();
})();
