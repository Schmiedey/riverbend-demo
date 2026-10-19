(function () {
  const R = window.RFC;
  const $ = id => document.getElementById(id);
  const KEY = "rfc_age";

  function slot(s, winner, side) {
    if (!s) return '<div class="slot tbd"><span class="name">Winner advances</span></div>';
    const cls = winner ? (winner === side ? " win" : " lose") : "";
    return '<div class="slot' + cls + '"><span class="seed">' + s.seed + '</span><span class="name">' + R.esc(R.teamName(s.id)) +
      '</span><span class="score">' + (s.score == null ? "" : s.score) + "</span></div>";
  }
  function match(m) {
    const pill = m.status === "final" ? '<span class="pill">Final</span>' :
      m.status === "live" ? '<span class="pill live">Live</span>' : '<span class="pill">Upcoming</span>';
    const note = m.status === "live" ? m.note.replace(/^Live · /, "") : m.note;
    return '<div class="match"><div class="meta"><span>' + R.esc(note) + "</span>" + pill + "</div>" +
      slot(m.a, m.winner, "a") + slot(m.b, m.winner, "b") + "</div>";
  }

  function render(age) {
    const br = R.bracketFor(age);
    $("bracket").innerHTML =
      '<div class="round"><h3>Quarterfinals</h3><div class="matches">' + br.qf.map(match).join("") + "</div></div>" +
      '<div class="round"><h3>Semifinals</h3><div class="matches">' + br.sf.map(match).join("") + "</div></div>" +
      '<div class="round"><h3>Championship</h3><div class="matches">' + match(br.final) +
      '<div class="champ">' + age + " champion<br><small>Decided Sunday at 3:00 PM</small></div></div></div>";

    const st = R.standings(age);
    const pools = R.ages[age].pools;
    $("pools").innerHTML = Object.keys(pools).map(p => {
      const rows = pools[p].map(id => st.rows[id]).sort((a, b) => a.seed - b.seed);
      const games = st.games.filter(g => g.pool === p);
      return '<div class="card"><h3>Pool ' + p + "</h3>" +
        '<table><thead><tr><th scope="col">Team</th><th scope="col" class="num">W-L</th><th scope="col" class="num">RA</th><th scope="col" class="num">RD</th></tr></thead><tbody>' +
        rows.map(r => '<tr><td><span class="team-cell"><span class="seed" title="Bracket seed">' + r.seed + "</span>" + R.esc(R.teamName(r.id)) +
          '</span></td><td class="num">' + r.w + "-" + r.l + '</td><td class="num">' + r.ra + '</td><td class="num">' + (r.rs - r.ra > 0 ? "+" : "") + (r.rs - r.ra) + "</td></tr>").join("") +
        "</tbody></table>" +
        '<details class="games"><summary>Pool ' + p + " results (" + games.length + " games)</summary>" +
        games.map(g => {
          const aw = g.sa > g.sb;
          return '<div class="game-line"><span class="muted">' + g.time + "</span><span>" +
            (aw ? "<b>" : "") + R.esc(R.teamName(g.a)) + (aw ? "</b>" : "") + " vs " +
            (!aw ? "<b>" : "") + R.esc(R.teamName(g.b)) + (!aw ? "</b>" : "") + "</span><b>" + g.sa + "–" + g.sb + "</b></div>";
        }).join("") + "</details></div>";
    }).join("");
  }

  const tabs = ["12U", "14U"].map(a => $("tab-" + a));
  function select(age, focus) {
    tabs.forEach(t => {
      const on = t.id === "tab-" + age;
      t.setAttribute("aria-selected", on); t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    $("panel").setAttribute("aria-labelledby", "tab-" + age);
    render(age);
    try { localStorage.setItem(KEY, age); } catch (e) {}
  }
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => select(t.textContent));
    t.addEventListener("keydown", e => {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); select(tabs[(i + 1) % 2].textContent, true); }
    });
  });
  let start = "12U";
  try { start = localStorage.getItem(KEY) || "12U"; } catch (e) {}
  select(R.ages[start] ? start : "12U");
})();
