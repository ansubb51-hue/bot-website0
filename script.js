/* SK1.0 website — script.js
   Sab pages ka common JavaScript: nav/footer, invite buttons, animations, live stats, commands page.
   Koi secret yahan nahi hai. */
(function () {
  "use strict";
  var CFG = window.SK_CONFIG || {};
  var DATA = window.SK_COMMANDS || null;
  var doc = document;
  doc.documentElement.classList.remove("no-js");

  function $(s, r) { return (r || doc).querySelector(s); }
  function $all(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function safeUrl(u) { return /^https?:\/\//i.test(u || "") ? u : ""; }
  function el(tag, cls, text) { var e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  /* ---------- links from config ---------- */
  function inviteUrl() {
    var o = safeUrl(CFG.inviteUrlOverride);
    if (o) return o;
    if (!/^\d{15,25}$/.test(String(CFG.clientId || ""))) return "";
    var perms = /^\d+$/.test(String(CFG.invitePermissions || "")) ? CFG.invitePermissions : "0";
    return "https://discord.com/oauth2/authorize?client_id=" + CFG.clientId + "&permissions=" + perms + "&scope=bot%20applications.commands";
  }
  function supportUrl() { return safeUrl(CFG.supportServerUrl); }

  function wireLinks() {
    var inv = inviteUrl(), sup = supportUrl();
    $all("[data-invite]").forEach(function (a) {
      if (inv) { a.href = inv; a.target = "_blank"; a.rel = "noopener noreferrer"; }
      else { a.href = "index.html#invite"; a.title = "Invite link not set yet (site-config.js)"; }
    });
    $all("[data-support]").forEach(function (a) {
      if (sup) { a.href = sup; a.target = "_blank"; a.rel = "noopener noreferrer"; }
      else {
        a.href = "index.html#support"; a.title = "Support server link not set yet (site-config.js)";
        if (!a.querySelector(".badge-unset") && a.classList.contains("btn")) { var b = el("span", "badge-unset", "not set yet"); a.appendChild(b); }
      }
    });
    $all("[data-config]").forEach(function (n) {
      var v = CFG[n.getAttribute("data-config")];
      if (v) { n.textContent = v; n.classList.remove("ph"); }
      else { n.textContent = "[" + n.getAttribute("data-config") + " — not set yet]"; n.classList.add("ph"); }
    });
    $all("[data-config-mail]").forEach(function (n) {
      if (CFG.contactEmail) { n.innerHTML = '<a href="mailto:' + esc(CFG.contactEmail) + '">' + esc(CFG.contactEmail) + "</a>"; }
      else { n.textContent = "[contact email — not set yet]"; n.classList.add("ph"); }
    });
    $all("[data-avatar]").forEach(function (box) {
      var u = CFG.avatarUrl;
      var img = box.querySelector("img");
      if (u && img) img.src = u;
    });
  }

  /* ---------- nav + footer ---------- */
  var PAGE = (doc.body.getAttribute("data-page") || "").toLowerCase();
  var NAV = [["index.html", "Home", "home"], ["index.html#features", "Features", "features"], ["commands.html", "Commands", "commands"],
    ["index.html#how", "How it works", "how"], ["status.html", "Status", "status"], ["index.html#support", "Support", "support"]];

  function buildNav() {
    var host = $("#site-nav"); if (!host) return;
    var links = NAV.map(function (n) { return '<a href="' + n[0] + '"' + (n[2] === PAGE ? ' class="active"' : "") + ">" + n[1] + "</a>"; }).join("");
    host.innerHTML =
      '<header class="nav"><div class="wrap">' +
      '<a class="brand" href="index.html" aria-label="SK1.0 home"><img src="assets/logo.svg" alt="" width="34" height="34"><span>SK<b>1.0</b></span></a>' +
      '<nav class="nav-links" aria-label="Main">' + links + "</nav>" +
      '<a class="btn btn-primary btn-sm" data-invite href="#">Add to Discord</a>' +
      '<button class="nav-toggle" aria-label="Open menu" aria-expanded="false" aria-controls="mm">☰</button>' +
      '</div><div class="mobile-menu" id="mm">' + links + '<a class="btn btn-primary" data-invite href="#">Add to Discord</a></div></header>';
    var t = $(".nav-toggle", host), m = $("#mm", host);
    t.addEventListener("click", function () { var o = m.classList.toggle("open"); t.setAttribute("aria-expanded", o); t.textContent = o ? "✕" : "☰"; });
    $all("a", m).forEach(function (a) { a.addEventListener("click", function () { m.classList.remove("open"); t.textContent = "☰"; t.setAttribute("aria-expanded", "false"); }); });
  }

  function buildFooter() {
    var host = $("#site-footer"); if (!host) return;
    var s = CFG.social || {}, soc = [];
    [["youtube", "YouTube"], ["instagram", "Instagram"], ["github", "GitHub"], ["x", "X"], ["website", "Website"]].forEach(function (p) {
      var u = safeUrl(s[p[0]]); if (u) soc.push('<li><a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + p[1] + "</a></li>");
    });
    var year = new Date().getFullYear();
    host.innerHTML =
      '<footer><div class="wrap"><div class="foot-grid">' +
      '<div><a class="brand" href="index.html"><img src="assets/logo.svg" alt="" width="34" height="34"><span>SK<b>1.0</b></span></a>' +
      '<p style="color:var(--muted);margin-top:12px;max-width:330px">' + esc(CFG.tagline || "") + "</p>" +
      '<a class="btn btn-primary btn-sm" data-invite href="#">Add to Discord</a></div>' +
      '<div><h4>Explore</h4><ul><li><a href="index.html">Home</a></li><li><a href="commands.html">Commands</a></li><li><a href="index.html#features">Features</a></li><li><a href="status.html">Status</a></li></ul></div>' +
      '<div><h4>Get SK1.0</h4><ul><li><a data-invite href="#">Invite</a></li><li><a data-support href="#">Support</a></li><li><a href="index.html#faq">FAQ</a></li></ul></div>' +
      '<div><h4>Legal' + (soc.length ? " &amp; Social" : "") + '</h4><ul><li><a href="privacy.html">Privacy Policy</a></li><li><a href="terms.html">Terms of Service</a></li>' + soc.join("") + "</ul></div>" +
      '</div><div class="copy"><span>© ' + year + " " + esc(CFG.botName || "SK1.0") + ". All rights reserved.</span>" +
      "<span>Not affiliated with or endorsed by Discord Inc.</span></div></div></footer>";
  }

  /* ---------- particles ---------- */
  function particles() {
    var c = $("#bg-canvas"); if (!c || !c.getContext) return;
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var ctx = c.getContext("2d"), w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), pts = [], raf = 0;
    var colors = ["#22d3ee", "#8b5cf6", "#3b82f6", "#f5b942"];
    function size() {
      w = window.innerWidth; h = window.innerHeight;
      c.width = w * dpr; c.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(70, Math.floor(w * h / 22000));
      pts = [];
      for (var i = 0; i < n; i++) pts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, r: Math.random() * 1.6 + .6, c: colors[i % 4] });
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i]; p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1; if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.globalAlpha = .75; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = dx * dx + dy * dy;
          if (d < 14000) { ctx.globalAlpha = (1 - d / 14000) * .22; ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = .6; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
        }
      }
      raf = requestAnimationFrame(frame);
    }
    size(); frame();
    var t; window.addEventListener("resize", function () { clearTimeout(t); t = setTimeout(size, 200); });
    doc.addEventListener("visibilitychange", function () { if (doc.hidden) cancelAnimationFrame(raf); else frame(); });
  }

  /* ---------- reveal + counters ---------- */
  function reveal() {
    var items = $all(".reveal");
    if (!("IntersectionObserver" in window)) { items.forEach(function (i) { i.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { threshold: .12 });
    items.forEach(function (i) { io.observe(i); });
  }
  function fmt(n) { return Number(n).toLocaleString("en-US"); }
  function countTo(node, target) {
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || target < 2) { node.textContent = fmt(target); return; }
    var start = performance.now(), dur = 1100;
    (function step(now) {
      var p = Math.min(1, (now - start) / dur), e = 1 - Math.pow(1 - p, 3);
      node.textContent = fmt(Math.round(target * e));
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }
  function setNum(id, value, note) {
    var n = $("#" + id); if (!n) return;
    var box = n.closest(".stat") || n.parentNode, noteEl = box.querySelector(".note");
    if (value == null || isNaN(value)) { n.textContent = "Unavailable"; n.classList.add("na"); }
    else { n.classList.remove("na"); countTo(n, Number(value)); }
    if (noteEl) noteEl.textContent = note || "";
  }

  /* ---------- live stats ---------- */
  function ago(sec) {
    if (sec < 90) return "just now";
    if (sec < 5400) return Math.round(sec / 60) + " min ago";
    if (sec < 129600) return Math.round(sec / 3600) + " h ago";
    return Math.round(sec / 86400) + " days ago";
  }
  function dur(sec) {
    sec = Math.max(0, Math.floor(sec));
    var d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60);
    return (d ? d + "d " : "") + (h || d ? h + "h " : "") + m + "m";
  }
  function parseTime(v) {
    if (v == null || v === "") return null;
    if (typeof v === "number") return v > 1e12 ? v : v * 1000;
    var t = Date.parse(v); return isNaN(t) ? null : t;
  }
  function pill(cls, text) { return '<span class="pill ' + cls + '"><span class="dot"></span>' + esc(text) + "</span>"; }

  function loadStats() {
    var hasStats = $("#st-servers") || $("#st-status");
    if (!hasStats) return;
    var cmdTotal = DATA && DATA.total != null ? DATA.total : null;
    var cmdNote = DATA ? "from the bot's source code · " + DATA.generated : "";
    var url = CFG.statsUrl;
    function render(s, why) {
      var out = { state: "na", label: "Not connected", detail: why || "" };
      var updated = s ? parseTime(s.updated) : null, age = updated ? (Date.now() - updated) / 1000 : null;
      var stale = age != null && age > (CFG.statsStaleMinutes || 30) * 60;
      var fresh = s && updated && !stale;
      if (s && s.connected === false) { out = { state: "na", label: "Not connected", detail: "no live reporter is connected yet" }; s = null; updated = null; age = null; fresh = false; why = "no live reporter connected yet"; }
      else if (s && updated == null) { out = { state: "na", label: "Report unreadable", detail: "stats file has no valid 'updated' time" }; }
      else if (fresh) { out = s.online === false ? { state: "off", label: "Offline" } : { state: "ok", label: "Online" }; }
      else if (s) { out = { state: "stale", label: "No recent report", detail: "last report " + ago(age) }; }
      var asOf = (s && updated && !fresh) ? "last known · " + ago(age) : (updated ? "updated " + ago(age) : "");
      setNum("st-servers", s && s.servers != null ? s.servers : null, s && s.servers != null ? asOf : (why || "needs live stats connection"));
      setNum("st-users", s && s.tracked_users != null ? s.tracked_users : null, s && s.tracked_users != null ? "users saved in bot database · " + asOf : (why || "needs live stats connection"));
      setNum("st-commands", cmdTotal, cmdNote || "command data missing");
      var st = $("#st-status"); if (st) { st.innerHTML = pill(out.state === "na" ? "na-p" : out.state, out.label); st.classList.remove("na"); var n = (st.closest(".stat") || st.parentNode).querySelector(".note"); if (n) n.textContent = out.detail || (fresh ? "reported by the bot's host" : ""); }
      var up = $("#st-uptime");
      if (up) {
        var n2 = (up.closest(".stat") || up.parentNode).querySelector(".note");
        if (fresh && s.online !== false && s.uptime_seconds != null) { up.classList.remove("na"); up.textContent = dur(s.uptime_seconds); if (n2) n2.textContent = "since last restart"; }
        else { up.classList.add("na"); up.textContent = "Unavailable"; if (n2) n2.textContent = fresh ? "bot reported offline" : "needs a recent report"; }
      }
      var lu = $("#st-updated");
      if (lu) lu.textContent = updated ? new Date(updated).toLocaleString() + " (" + ago(age) + ")" : "No report received yet";
      var svc = $("#st-svc-bot"); if (svc) svc.innerHTML = pill(out.state === "na" ? "na-p" : out.state, out.label);
      var sd = $("#st-svc-bot-detail"); if (sd) sd.textContent = out.detail || (fresh ? "Bot reported by its host" : "");
    }
    if (!url) { render(null, "stats URL not set"); return; }
    var ctrl = ("AbortController" in window) ? new AbortController() : null;
    var to = setTimeout(function () { if (ctrl) ctrl.abort(); }, 8000);
    fetch(url + (url.indexOf("?") < 0 ? "?t=" + Date.now() : ""), { cache: "no-store", signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (j) { clearTimeout(to); render(j && typeof j === "object" ? j : null, "stats file is not valid"); })
      .catch(function () { clearTimeout(to); render(null, "no stats report found"); });
  }

  /* ---------- premium (only if the owner filled it) ---------- */
  function premium() {
    var sec = $("#premium"); if (!sec) return;
    var p = CFG.premium;
    if (!p || !p.plans || !p.plans.length) { sec.remove(); return; }
    $("#premium-title").textContent = p.title || "Support SK1.0";
    $("#premium-intro").textContent = p.intro || "";
    var g = $("#premium-grid"); g.innerHTML = "";
    p.plans.forEach(function (pl) {
      var c = el("div", "card reveal in");
      c.appendChild(el("h3", "", pl.name || "")); c.appendChild(el("div", "num", pl.price || "")).style.cssText = "font-size:1.6rem;font-weight:800;color:var(--gold);margin:6px 0 10px";
      var ul = el("ul", "feat-list"); (pl.benefits || []).forEach(function (b) { ul.appendChild(el("li", "", b)); }); c.appendChild(ul);
      var u = safeUrl(pl.url); if (u) { var a = el("a", "btn btn-gold btn-sm", pl.cta || "Open"); a.href = u; a.target = "_blank"; a.rel = "noopener noreferrer"; a.style.marginTop = "14px"; c.appendChild(a); }
      g.appendChild(c);
    });
    var nav = $all('a[href="index.html#premium"]'); nav.forEach(function (a) { a.hidden = false; });
  }

  /* ---------- typed line ---------- */
  function typed() {
    var t = $("#typed"); if (!t) return;
    var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var lines = ["!help", "!ban @user spamming", "!balance", "!ticketpanel", "!antinuke on", "!rank", "!giveaway", "!shop"];
    if (reduce) { t.textContent = lines[0]; return; }
    var i = 0, j = 0, del = false;
    (function tick() {
      var s = lines[i];
      t.textContent = s.slice(0, j);
      if (!del && j === s.length) { del = true; return setTimeout(tick, 1400); }
      if (del && j === 0) { del = false; i = (i + 1) % lines.length; }
      j += del ? -1 : 1;
      setTimeout(tick, del ? 28 : 75);
    })();
  }

  /* ---------- commands page ---------- */
  function commandsPage() {
    var list = $("#cmd-list"); if (!list) return;
    if (!DATA) { list.innerHTML = '<div class="empty">Command data file (data/commands.js) not found.</div>'; return; }
    var prefix = "!", cat = "All", q = "", slashOnly = false;
    var search = $("#cmd-search"), chips = $("#chips"), count = $("#cmd-count");
    var all = DATA.commands;
    var counts = {}; all.forEach(function (c) { counts[c.category] = (counts[c.category] || 0) + 1; });
    var cats = ["All"].concat(DATA.categories.map(function (c) { return c.name; }));
    chips.innerHTML = "";
    cats.forEach(function (n) {
      var b = el("button", "chip" + (n === "All" ? " on" : "")); b.type = "button"; b.setAttribute("data-cat", n);
      b.innerHTML = esc(n) + "<small>" + (n === "All" ? all.length : counts[n]) + "</small>";
      b.addEventListener("click", function () { cat = n; $all(".chip", chips).forEach(function (x) { x.classList.toggle("on", x === b); }); render(); b.scrollIntoView({ block: "nearest", inline: "center" }); });
      chips.appendChild(b);
    });
    function withPrefix(s) { return prefix + s.replace(/^!/, ""); }
    function copy(text, btn) {
      function done() { btn.textContent = "Copied ✓"; btn.classList.add("done"); setTimeout(function () { btn.textContent = "Copy"; btn.classList.remove("done"); }, 1400); }
      if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(text).then(done, fallback); } else fallback();
      function fallback() {
        var ta = el("textarea"); ta.value = text; ta.style.cssText = "position:fixed;opacity:0;top:0"; doc.body.appendChild(ta); ta.select();
        try { doc.execCommand("copy"); done(); } catch (e) { btn.textContent = "Press Ctrl+C"; } doc.body.removeChild(ta);
      }
    }
    function match(c) {
      if (cat !== "All" && c.category !== cat) return false;
      if (slashOnly && !c.slash) return false;
      if (!q) return true;
      var hay = (c.name + " " + c.description + " " + c.aliases.join(" ") + " " + c.category + " " + c.permissions.join(" ")).toLowerCase();
      return q.split(/\s+/).every(function (w) { return hay.indexOf(w) >= 0; });
    }
    function card(c) {
      var d = el("article", "cmd"), top = el("div", "cmd-top");
      top.appendChild(el("div", "cmd-name", withPrefix("!" + c.name)));
      var b = el("button", "copy-btn", "Copy"); b.type = "button"; b.setAttribute("aria-label", "Copy example of " + c.name);
      b.addEventListener("click", function () { copy(withPrefix(c.example), b); });
      top.appendChild(b); d.appendChild(top);
      d.appendChild(el("p", "cmd-desc", c.description));
      var u = el("div", "usage"); u.innerHTML = "<b>Usage</b> " + esc(withPrefix(c.usage)) + " &nbsp;·&nbsp; <b>Example</b> " + esc(withPrefix(c.example)); d.appendChild(u);
      var tags = el("div", "tags");
      c.permissions.forEach(function (p) { tags.appendChild(el("span", "tag " + (p === "Everyone" ? "every" : "perm"), p === "Everyone" ? "Everyone" : "Needs: " + p)); });
      if (c.slash) tags.appendChild(el("span", "tag slash", "also /" + c.name));
      if (c.aliases.length) tags.appendChild(el("span", "tag", "aliases: " + c.aliases.join(", ")));
      d.appendChild(tags);
      return d;
    }
    function render() {
      var shown = all.filter(match);
      list.innerHTML = "";
      count.textContent = shown.length + " of " + all.length + " commands";
      if (!shown.length) { list.innerHTML = '<div class="empty">No command matches “' + esc(q) + '”. Try a shorter word like <b>ban</b>, <b>ticket</b> or <b>shop</b>.</div>'; return; }
      var order = DATA.categories.map(function (c) { return c.name; });
      order.forEach(function (n) {
        var items = shown.filter(function (c) { return c.category === n; });
        if (!items.length) return;
        var s = el("section", "cmd-cat"); s.style.padding = "0";
        var h = el("h2"); h.innerHTML = esc(n) + " <span>" + items.length + "</span>"; s.appendChild(h);
        items.forEach(function (c) { s.appendChild(card(c)); });
        list.appendChild(s);
      });
    }
    var tm; search.addEventListener("input", function () { clearTimeout(tm); tm = setTimeout(function () { q = search.value.trim().toLowerCase(); render(); }, 120); });
    $all(".prefix-switch button").forEach(function (b) { b.addEventListener("click", function () { prefix = b.getAttribute("data-p"); $all(".prefix-switch button").forEach(function (x) { x.classList.toggle("on", x === b); }); render(); }); });
    var so = $("#slash-only"); if (so) so.addEventListener("change", function () { slashOnly = so.checked; render(); });
    var m = /[?&]q=([^&]+)/.exec(location.search); if (m) { try { search.value = decodeURIComponent(m[1].replace(/\+/g, " ")); q = search.value.toLowerCase(); } catch (e) { } }
    render();
    $all("[data-total]").forEach(function (n) { n.textContent = DATA.total; });
    $all("[data-slash]").forEach(function (n) { n.textContent = DATA.slash_total; });
  }

  /* ---------- feature counts on home ---------- */
  function homeCounts() {
    if (!DATA) return;
    var counts = {}; DATA.commands.forEach(function (c) { counts[c.category] = (counts[c.category] || 0) + 1; });
    $all("[data-catcount]").forEach(function (n) { var c = counts[n.getAttribute("data-catcount")]; n.textContent = c ? c + " commands" : ""; });
    $all("[data-total]").forEach(function (n) { n.textContent = DATA.total; });
    $all("[data-slash]").forEach(function (n) { n.textContent = DATA.slash_total; });
  }

  function init() {
    buildNav(); buildFooter(); wireLinks(); premium();
    particles(); reveal(); typed(); homeCounts(); commandsPage(); loadStats();
    var y = $all("[data-year]"); y.forEach(function (n) { n.textContent = new Date().getFullYear(); });
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", init); else init();
})();
