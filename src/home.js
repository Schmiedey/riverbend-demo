(function () {
  const R = window.RFC;
  const $ = id => document.getElementById(id);
  const list = $("fieldlist"), hl = $("hl"), sel = $("team-pick"), answer = $("answer");
  if (!list) return;

  function activate(li) {
    list.querySelectorAll("li").forEach(x => x.classList.toggle("on", x === li));
    document.querySelectorAll("#mapbox .lbl").forEach(l => l.classList.toggle("on", !!li && l.dataset.f === li.dataset.f));
    if (!li) { hl.classList.remove("on"); return; }
    hl.style.left = li.dataset.x + "%";
    hl.style.top = li.dataset.y + "%";
    hl.classList.add("on");
  }
  list.querySelectorAll("li").forEach(li => {
    const b = li.querySelector("button");
    b.addEventListener("click", () => activate(li));
    b.addEventListener("mouseenter", () => activate(li));
    b.addEventListener("focus", () => activate(li));
  });

  Object.keys(R.ages).forEach(age => {
    const g = document.createElement("optgroup");
    g.label = age;
    Object.values(R.ages[age].pools).flat().map(id => [id, R.teamName(id)])
      .sort((a, b) => a[1].localeCompare(b[1]))
      .forEach(([id, name]) => g.appendChild(new Option(name, id)));
    sel.appendChild(g);
  });

  const games = R.schedule();
  sel.addEventListener("change", () => {
    const id = sel.value;
    if (!id) { answer.textContent = "Pick a team to see its next game, its field and when to be there."; activate(null); return; }
    const mine = games.filter(g => g.a === id || g.b === id);
    const next = mine.find(g => !g.final);
    const name = R.esc(R.teamName(id));
    let field;
    if (next) {
      const opp = R.esc(R.teamName(next.a === id ? next.b : next.a));
      field = next.field;
      answer.innerHTML = next.live
        ? "<em>" + name + "</em> are playing now: " + next.label.toLowerCase() + " against " + opp + " on Field " + field + ", " + (next.a === id ? next.sa + "–" + next.sb : next.sb + "–" + next.sa) + "."
        : "<em>" + name + "</em> play " + opp + " at " + next.time + " on Field " + field + ", the " + next.label.toLowerCase() + ". Be at the gate by " + early(next.time) + ".";
    } else {
      const last = mine[mine.length - 1];
      const won = (last.a === id ? last.sa > last.sb : last.sb > last.sa);
      const opp = R.esc(R.teamName(last.a === id ? last.b : last.a));
      field = last.field;
      answer.innerHTML = "<em>" + name + "</em> finished their weekend " + (won ? "beating " : "losing to ") + opp + " " + Math.max(last.sa, last.sb) + "–" + Math.min(last.sa, last.sb) + " in the " + last.label.toLowerCase() + " on Field " + field + ".";
    }
    activate(list.querySelector('li[data-f="' + field + '"]'));
  });

  function early(t) {
    const m = t.match(/(\d+):(\d+) (AM|PM)/);
    let mins = (parseInt(m[1], 10) % 12 + (m[3] === "PM" ? 12 : 0)) * 60 + parseInt(m[2], 10) - 45;
    const h = Math.floor(mins / 60), mm = String(mins % 60).padStart(2, "0");
    return ((h % 12) || 12) + ":" + mm + " " + (h >= 12 ? "PM" : "AM");
  }
})();
