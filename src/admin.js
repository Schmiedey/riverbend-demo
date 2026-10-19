(function () {
  const R = window.RFC;
  const $ = id => document.getElementById(id);
  const OVERRIDES = "rfc_admin_paid";

  let overrides = {};
  try { overrides = JSON.parse(localStorage.getItem(OVERRIDES)) || {}; } catch (e) {}

  // Fictional seeded teams, plus anything registered in this browser.
  function seeded() {
    const out = [];
    let day = 1;
    Object.keys(R.ages).forEach(age => {
      Object.entries(R.ages[age].pools).forEach(([pool, ids]) => ids.forEach(id => {
        const t = R.teams[id];
        const slug = t.coach.toLowerCase().replace(/[^a-z]+/g, ".");
        out.push({
          id: "RFC-" + id.toUpperCase() + "-" + (100 + day), team: t.name, age, pool, coach: t.coach,
          email: slug + "@example.com", phone: "(555) 555-01" + String(day).padStart(2, "0"),
          players: t.players, status: R.unpaidSeed.includes(id) ? "unpaid" : "paid",
          created: new Date(Date.UTC(2026, 8, 1 + day * 2)).toISOString(), fee: R.event.fee, seed: true
        });
        day++;
      }));
    });
    return out;
  }

  function rows() {
    const mine = R.store.all().map(r => ({ ...r, mine: true }));
    return mine.concat(seeded()).map(r => overrides[r.id] ? { ...r, status: overrides[r.id] } : r)
      .sort((a, b) => (b.mine ? 1 : 0) - (a.mine ? 1 : 0) || (a.status === "unpaid" ? 0 : 1) - (b.status === "unpaid" ? 0 : 1));
  }

  const date = iso => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  function render() {
    const all = rows();
    const paid = all.filter(r => r.status === "paid");
    $("stats").innerHTML = [
      ["Teams", all.length],
      ["Paid", paid.length],
      ["Unpaid", all.length - paid.length],
      ["Collected", R.money(paid.length * R.event.fee).replace(".00", "")]
    ].map(([k, v]) => '<div class="stat"><span>' + k + "</span><b>" + v + "</b></div>").join("");

    const q = $("q").value.trim().toLowerCase(), age = $("f-age").value, st = $("f-status").value;
    const list = all.filter(r => (!age || r.age === age) && (!st || r.status === st) &&
      (!q || [r.team, r.coach, r.email].join(" ").toLowerCase().includes(q)));
    $("count").textContent = "Showing " + list.length + " of " + all.length + " registrations";
    $("list").innerHTML = list.length ? list.map(r =>
      '<div class="reg' + (r.mine ? " is-new" : "") + '">' +
        '<div class="t">' + R.esc(r.team) + (r.mine ? ' <span class="pill new">New</span>' : "") + "</div>" +
        '<div><span class="pill ' + r.status + '">' + (r.status === "paid" ? "Paid" : "Unpaid") + "</span></div>" +
        '<div class="sub">' + R.esc(r.age) + (r.pool ? " · Pool " + R.esc(r.pool) : "") + " · " + R.esc(r.coach) + " · " + R.esc(r.email) + " · " + R.esc(r.phone) +
        " · " + r.players + " players · " + date(r.created) + "</div>" +
        '<div class="actions">' +
          (r.status === "unpaid"
            ? '<button type="button" data-act="remind" data-id="' + R.esc(r.id) + '">Send payment reminder</button><button type="button" data-act="paid" data-id="' + R.esc(r.id) + '">Mark paid</button>'
            : '<button type="button" data-act="unpaid" data-id="' + R.esc(r.id) + '">Mark unpaid</button>') +
        "</div></div>").join("") : '<div class="card empty">No registrations match those filters.</div>';
    return list;
  }

  $("list").addEventListener("click", e => {
    const b = e.target.closest("button[data-act]"); if (!b) return;
    const all = rows(), r = all.find(x => x.id === b.dataset.id); if (!r) return;
    if (b.dataset.act === "remind") { R.toast("Reminder queued for " + r.coach + " (demo — nothing sent)"); return; }
    overrides[r.id] = b.dataset.act;
    try { localStorage.setItem(OVERRIDES, JSON.stringify(overrides)); } catch (e2) {}
    render();
    R.toast(r.team + " marked " + b.dataset.act);
  });

  ["q", "f-age", "f-status"].forEach(id => $(id).addEventListener(id === "q" ? "input" : "change", render));

  $("csv").addEventListener("click", () => {
    const list = render();
    const cols = ["id", "team", "age", "pool", "coach", "email", "phone", "players", "status", "fee", "created"];
    const cell = v => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const csv = [cols.join(",")].concat(list.map(r => cols.map(c => cell(r[c])).join(","))).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "riverbend-registrations.csv";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    R.toast("Exported " + list.length + " registrations");
  });

  render();
})();
