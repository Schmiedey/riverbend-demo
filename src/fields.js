(function () {
  const R = window.RFC;
  const $ = id => document.getElementById(id);
  const KEY = "rfc_sched_filters";

  const all = R.schedule();
  const teamSel = $("f-team");
  Object.keys(R.ages).forEach(age => {
    const g = document.createElement("optgroup"); g.label = age;
    Object.values(R.ages[age].pools).flat().map(id => [id, R.teamName(id)]).sort((a, b) => a[1].localeCompare(b[1]))
      .forEach(([id, name]) => { const o = document.createElement("option"); o.value = id; o.textContent = name; g.appendChild(o); });
    teamSel.appendChild(g);
  });

  try {
    const f = JSON.parse(localStorage.getItem(KEY)) || {};
    if (f.day) $("f-day").value = f.day;
    if (f.age != null) $("f-age").value = f.age;
    if (f.team != null) teamSel.value = f.team;
  } catch (e) {}

  const toMin = t => { const [h, rest] = t.split(":"); const m = parseInt(rest, 10); let hh = parseInt(h, 10) % 12; if (/PM/.test(t)) hh += 12; return hh * 60 + m; };

  function line(g, side) {
    const id = side === "a" ? g.a : g.b;
    const s = side === "a" ? g.sa : g.sb, o = side === "a" ? g.sb : g.sa;
    const name = id ? R.esc(R.teamName(id)) : '<span class="muted">TBD</span>';
    return "<div>" + (g.final && s > o ? "<b>" + name + "</b>" : name) + "</div>";
  }

  function render() {
    const day = $("f-day").value, age = $("f-age").value, team = teamSel.value;
    try { localStorage.setItem(KEY, JSON.stringify({ day, age, team })); } catch (e) {}
    const rows = all.filter(g => g.day === day && (!age || g.age === age) && (!team || g.a === team || g.b === team))
      .sort((a, b) => toMin(a.time) - toMin(b.time) || a.field - b.field);
    if (!rows.length) { $("sched").innerHTML = '<div class="card empty">No games match. ' + (team ? "Try another day." : "") + "</div>"; return; }
    const times = [...new Set(rows.map(r => r.time))];
    $("sched").innerHTML = times.map(t => '<div class="timeslot"><h3><span>' + t + "</span><span>" + rows.filter(r => r.time === t).length + " games</span></h3>" +
      rows.filter(r => r.time === t).map(g =>
        '<div class="sched-row"><div class="fld">Field ' + g.field + "<span>" + g.age + " · " + g.label + '</span></div><div class="teams">' +
        line(g, "a") + line(g, "b") + '</div><div class="sc">' +
        (g.final ? g.sa + "<br>" + g.sb : g.live ? '<span class="pill live">Live ' + g.sa + "–" + g.sb + "</span>" : '<span class="pill">Upcoming</span>') +
        "</div></div>").join("") + "</div>").join("");
  }
  ["f-day", "f-age", "f-team"].forEach(id => $(id).addEventListener("change", render));
  render();
})();
