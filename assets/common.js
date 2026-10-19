(function () {
  const R = window.RFC;
  const KEY = "rfc_registrations_v1";

  R.store = {
    all() {
      try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; }
    },
    save(list) {
      try { localStorage.setItem(KEY, JSON.stringify(list)); return true; } catch (e) { return false; }
    },
    get(id) { return this.all().find(r => r.id === id) || null; },
    upsert(reg) {
      const list = this.all().filter(r => r.id !== reg.id);
      list.unshift(reg);
      this.save(list);
    }
  };

  R.money = n => "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  R.esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  R.teamName = id => (R.teams[id] ? R.teams[id].name : id);

  R.newId = () => "RFC-" + Math.random().toString(36).slice(2, 6).toUpperCase() + "-" + String(Date.now()).slice(-3);

  // Round-robin pairings for a pool of four, in poolScores order.
  const PAIRS = [[0, 1], [2, 3], [0, 2], [1, 3], [0, 3], [1, 2]];

  R.poolGames = function (pool, teams, field) {
    return PAIRS.map((p, i) => {
      const s = R.poolScores[pool][i];
      return { pool, field, day: "Sat", time: R.poolTimes[i], a: teams[p[0]], b: teams[p[1]], sa: s[0], sb: s[1], final: true };
    });
  };

  R.standings = function (age) {
    const cfg = R.ages[age];
    const rows = {};
    const games = [];
    Object.keys(cfg.pools).forEach((pool, idx) => {
      cfg.pools[pool].forEach(t => { rows[t] = { id: t, pool, w: 0, l: 0, rs: 0, ra: 0 }; });
      games.push(...R.poolGames(pool, cfg.pools[pool], cfg.fields[idx]));
    });
    games.forEach(g => {
      const A = rows[g.a], B = rows[g.b];
      A.rs += g.sa; A.ra += g.sb; B.rs += g.sb; B.ra += g.sa;
      if (g.sa > g.sb) { A.w++; B.l++; } else { B.w++; A.l++; }
    });
    // Tiebreakers: wins, fewest runs allowed, run differential, name.
    const seeded = Object.values(rows).sort((x, y) =>
      y.w - x.w || x.ra - y.ra || (y.rs - y.ra) - (x.rs - x.ra) || R.teamName(x.id).localeCompare(R.teamName(y.id)));
    seeded.forEach((r, i) => { r.seed = i + 1; });
    return { rows, seeded, games };
  };

  R.bracketFor = function (age) {
    const { seeded } = R.standings(age);
    const by = s => seeded[s - 1].id;
    const cfg = R.bracket[age];
    const fields = R.ages[age].fields;
    const order = [[1, 8], [4, 5], [3, 6], [2, 7]];
    const qf = order.map((pair, i) => {
      const [sa, sb] = cfg.qf[i];
      return {
        a: { id: by(pair[0]), seed: pair[0], score: sa },
        b: { id: by(pair[1]), seed: pair[1], score: sb },
        winner: sa > sb ? "a" : "b",
        note: (i < 2 ? "8:00 AM" : "10:00 AM") + " · Field " + fields[i % 2],
        status: "final"
      };
    });
    const w = m => m[m.winner];
    const sf = [0, 1].map(i => {
      const a = w(qf[i * 2]), b = w(qf[i * 2 + 1]);
      const c = cfg.sf[i];
      return {
        a: { ...a, score: c.score ? c.score[0] : null },
        b: { ...b, score: c.score ? c.score[1] : null },
        winner: null, note: c.note, status: c.status
      };
    });
    const final = { a: null, b: null, note: cfg.final.note, status: "sched" };
    return { qf, sf, final };
  };

  // Every game, both days, for the schedule page.
  R.schedule = function () {
    const out = [];
    Object.keys(R.ages).forEach(age => {
      const st = R.standings(age);
      st.games.forEach(g => out.push({ ...g, age, label: "Pool " + g.pool }));
      const br = R.bracketFor(age);
      const f = R.ages[age].fields;
      br.qf.forEach((m, i) => out.push({
        age, day: "Sun", time: i < 2 ? "8:00 AM" : "10:00 AM", field: f[i % 2], label: "Quarterfinal",
        a: m.a.id, b: m.b.id, sa: m.a.score, sb: m.b.score, final: true
      }));
      br.sf.forEach((m, i) => out.push({
        age, day: "Sun", time: "12:30 PM", field: f[i], label: "Semifinal",
        a: m.a.id, b: m.b.id, sa: m.a.score, sb: m.b.score, final: false, live: m.status === "live"
      }));
      out.push({ age, day: "Sun", time: "3:00 PM", field: f[0], label: "Championship", a: null, b: null, final: false });
    });
    return out;
  };

  R.toast = function (msg) {
    let t = document.querySelector(".toast");
    if (!t) {
      t = document.createElement("div");
      t.className = "toast";
      t.setAttribute("role", "status");
      document.body.appendChild(t);
    }
    t.textContent = msg;
    clearTimeout(t._h);
    t._h = setTimeout(() => t.remove(), 3200);
  };

  // Optional builder credit in the footer.
  document.addEventListener("DOMContentLoaded", () => {
    const slot = document.getElementById("builder");
    if (slot && R.builder.name) {
      slot.innerHTML = "Built by " + (R.builder.url
        ? '<a href="' + R.esc(R.builder.url) + '">' + R.esc(R.builder.name) + "</a>"
        : R.esc(R.builder.name)) + " — want this for your tournament?";
    }
  });
})();
