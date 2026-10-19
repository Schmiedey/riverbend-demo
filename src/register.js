(function () {
  const R = window.RFC;
  const $ = id => document.getElementById(id);
  const form = $("reg");
  const DRAFT = "rfc_draft";
  let current = null;
  let mode = null; // "stripe" | "sim"

  const POOLS = { "12U": ["A", "B"], "14U": ["C", "D"] };
  function fillPools(age, keep) {
    const sel = $("pool");
    sel.innerHTML = '<option value="">No preference</option>' +
      (POOLS[age] || []).map(p => '<option value="' + p + '">Pool ' + p + "</option>").join("");
    sel.disabled = !age;
    if (keep) sel.value = keep;
  }

  function fmtPhone(v) {
    const d = v.replace(/\D/g, "").replace(/^1(?=\d{10})/, "").slice(0, 10);
    if (d.length < 4) return d;
    if (d.length < 7) return "(" + d.slice(0, 3) + ") " + d.slice(3);
    return "(" + d.slice(0, 3) + ") " + d.slice(3, 6) + "-" + d.slice(6);
  }

  const rules = {
    team: v => v.trim().length < 2 ? "Enter your team name." : "",
    age: v => !v ? "Choose 12U or 14U." : "",
    coach: v => v.trim().split(/\s+/).length < 2 ? "Enter the coach's first and last name." : "",
    email: v => !v.trim() ? "Enter an email address." : (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "That email doesn't look right. Check for typos, like a missing @ or .com." : ""),
    phone: v => v.replace(/\D/g, "").length !== 10 ? "Enter a 10-digit mobile number." : "",
    players: v => {
      const n = Number(v);
      if (!v || !Number.isInteger(n)) return "Enter the number of players.";
      if (n < 9) return "You need at least 9 players to field a team.";
      if (n > 15) return "Rosters are capped at 15 players.";
      return "";
    }
  };
  const labels = { team: "Team name", age: "Age bracket", coach: "Head coach name", email: "Coach email", phone: "Coach mobile", players: "Number of players" };

  function val(name) {
    if (name === "age") { const c = form.querySelector('input[name="age"]:checked'); return c ? c.value : ""; }
    return form.elements[name].value;
  }

  function check(name) {
    const msg = rules[name](val(name));
    const target = name === "age" ? $("age-set") : $(name);
    const err = $(name + "-err");
    target.setAttribute("aria-invalid", msg ? "true" : "false");
    err.textContent = msg;
    err.classList.toggle("show", !!msg);
    return msg;
  }

  const touched = new Set();
  Object.keys(rules).forEach(name => {
    const els = name === "age" ? form.querySelectorAll('input[name="age"]') : [form.elements[name]];
    els.forEach(el => {
      el.addEventListener("blur", () => { if (name !== "age" && el.value) touched.add(name); if (touched.has(name)) check(name); });
      el.addEventListener("input", () => { if (touched.has(name)) check(name); saveDraft(); });
      el.addEventListener("change", () => { if (name === "age") { touched.add("age"); check("age"); fillPools(val("age")); } saveDraft(); });
    });
  });

  $("phone").addEventListener("input", e => {
    const el = e.target, end = el.selectionEnd === el.value.length;
    el.value = fmtPhone(el.value);
    if (end) el.setSelectionRange(el.value.length, el.value.length);
  });
  form.querySelectorAll("[data-step]").forEach(b => b.addEventListener("click", () => {
    const el = $("players");
    const n = Math.min(15, Math.max(9, (Number(el.value) || 12) + Number(b.dataset.step)));
    el.value = n; touched.add("players"); check("players"); saveDraft();
  }));
  $("pool").addEventListener("change", saveDraft);

  function data() {
    return {
      team: val("team").trim(), age: val("age"), coach: val("coach").trim().replace(/\s+/g, " "),
      email: val("email").trim().toLowerCase(), phone: val("phone"), players: Number(val("players")), pool: $("pool").value
    };
  }
  function saveDraft() { try { sessionStorage.setItem(DRAFT, JSON.stringify(data())); } catch (e) {} }
  function fill(d) {
    if (!d) return;
    ["team", "coach", "email", "phone", "players"].forEach(k => { if (d[k] != null && d[k] !== "") form.elements[k].value = d[k]; });
    if (d.age) { const r = form.querySelector('input[name="age"][value="' + d.age + '"]'); if (r) r.checked = true; }
    fillPools(d.age, d.pool);
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    const bad = Object.keys(rules).map(n => { touched.add(n); return [n, check(n)]; }).filter(x => x[1]);
    const sum = $("summary");
    if (bad.length) {
      sum.innerHTML = "Fix " + (bad.length === 1 ? "this field" : "these " + bad.length + " fields") + " to continue:<ul>" +
        bad.map(([n]) => '<li><a href="#' + (n === "age" ? "age-set" : n) + '">' + labels[n] + "</a></li>").join("") + "</ul>";
      sum.classList.add("show");
      const first = bad[0][0];
      (first === "age" ? form.querySelector('input[name="age"]') : $(first)).focus();
      return;
    }
    sum.classList.remove("show");
    const d = data();
    current = Object.assign(current && current.status === "unpaid" ? current : { id: R.newId(), created: new Date().toISOString() }, d, { status: "unpaid", fee: R.event.fee });
    R.store.upsert(current);
    showPay();
  });
  $("summary").addEventListener("click", e => {
    const a = e.target.closest("a"); if (!a) return;
    e.preventDefault();
    const t = document.querySelector(a.getAttribute("href"));
    (t.matches("fieldset") ? t.querySelector("input") : t).focus();
  });

  function setStep(n) {
    [1, 2, 3].forEach(i => {
      const li = $("st" + i);
      li.className = i < n ? "done" : i === n ? "on" : "";
      if (i === n) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
  }

  async function detectMode() {
    if (mode) return mode;
    try {
      const r = await fetch("/api/checkout", { method: "GET" });
      const j = r.ok ? await r.json() : {};
      mode = j.configured ? "stripe" : "sim";
    } catch (e) { mode = "sim"; }
    return mode;
  }

  function showPay() {
    const d = current;
    $("review").innerHTML = [
      ["Team", d.team], ["Age bracket", d.age], ["Coach", d.coach], ["Email", d.email],
      ["Mobile", d.phone], ["Players", d.players], ["Preferred pool", d.pool ? "Pool " + d.pool : "No preference"]
    ].map(([k, v]) => "<dt>" + k + "</dt><dd>" + R.esc(v) + "</dd>").join("");
    $("step-form").hidden = true;
    $("step-pay").hidden = false;
    $("canceled").hidden = true;
    setStep(2);
    window.scrollTo(0, 0);
    $("h-pay").focus();
    detectMode().then(m => { $("sim").hidden = m !== "sim"; });
  }

  $("back").addEventListener("click", () => {
    $("step-pay").hidden = true; $("step-form").hidden = false; setStep(1); $("team").focus();
  });

  $("pay").addEventListener("click", async () => {
    const btn = $("pay"), err = $("pay-err");
    btn.disabled = true; btn.textContent = "Processing…"; err.classList.remove("show");
    const m = await detectMode();
    if (m === "sim") {
      setTimeout(() => { location.href = "/confirmed?id=" + encodeURIComponent(current.id) + "&sim=1"; }, 700);
      return;
    }
    try {
      const r = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: current.id, team: current.team, age: current.age, email: current.email })
      });
      const j = await r.json();
      if (!r.ok || !j.url) throw new Error(j.error || "Checkout failed");
      location.href = j.url;
    } catch (e) {
      err.textContent = "We couldn't start checkout. Nothing was charged. Please try again in a moment.";
      err.classList.add("show");
      btn.disabled = false; btn.textContent = "Pay $495.00";
    }
  });

  // Restore a canceled checkout or an in-progress draft.
  const q = new URLSearchParams(location.search);
  if (q.get("canceled") && q.get("id")) {
    current = R.store.get(q.get("id"));
    if (current) { fill(current); $("canceled").hidden = false; }
  } else {
    try { fill(JSON.parse(sessionStorage.getItem(DRAFT))); } catch (e) {}
  }
  if (!val("age")) fillPools("");
})();
