(async function () {
  const R = window.RFC;
  const $ = id => document.getElementById(id);
  const q = new URLSearchParams(location.search);
  const reg = R.store.get(q.get("id") || "");
  if (!reg) { $("missing").hidden = false; return; }

  let paid = reg.status === "paid";
  if (!paid && q.get("session_id")) {
    try {
      const r = await fetch("/api/verify?session_id=" + encodeURIComponent(q.get("session_id")));
      const j = await r.json();
      paid = !!j.paid;
      if (paid) reg.payment = "Stripe test mode";
    } catch (e) {}
  } else if (!paid && q.get("sim")) {
    paid = true;
    reg.payment = "Simulated (demo)";
  }
  if (!paid) {
    $("missing").hidden = false;
    $("missing").querySelector("h1").textContent = "Payment hasn't cleared yet";
    $("missing").querySelector("p").textContent = "Your spot is held but not confirmed. Try the payment step again.";
    $("missing").querySelector("a").href = "/register?canceled=1&id=" + encodeURIComponent(reg.id);
    $("missing").querySelector("a").textContent = "Back to payment";
    return;
  }
  if (reg.status !== "paid") {
    reg.status = "paid";
    reg.paidAt = new Date().toISOString();
    R.store.upsert(reg);
  }

  const first = reg.coach.split(" ")[0];
  const e = R.event;
  $("ok-sub").textContent = reg.team + " is registered for the " + e.name + ". A confirmation was sent to " + reg.email + ".";
  const rows = [
    ["Confirmation", reg.id], ["Team", reg.team], ["Age bracket", reg.age], ["Coach", reg.coach],
    ["Players", reg.players], ["Pool request", reg.pool ? "Pool " + reg.pool : "No preference"], ["Payment", reg.payment || "Card"]
  ];
  const kv = rows.map(([k, v]) => "<dt>" + k + "</dt><dd>" + R.esc(v) + "</dd>").join("");
  $("receipt").innerHTML = kv;

  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Riverbend Demo//EN", "BEGIN:VEVENT",
    "UID:" + reg.id + "@riverbend-demo.example", "DTSTAMP:20261018T000000Z",
    "DTSTART;VALUE=DATE:" + e.startISO, "DTEND;VALUE=DATE:" + e.endISO,
    "SUMMARY:" + e.name + " (" + reg.age + ") — " + reg.team,
    "LOCATION:" + e.venue + "\\, " + e.town, "DESCRIPTION:Demo event. Schedule: /fields", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  $("ics").href = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);

  $("email").innerHTML =
    '<div class="email-head">' +
      "<div><b>From</b> " + R.esc(e.host) + " &lt;" + R.esc(e.email) + "&gt;</div>" +
      "<div><b>To</b> " + R.esc(reg.coach) + " &lt;" + R.esc(reg.email) + "&gt;</div>" +
      "<div><b>Subject</b> You're registered: " + R.esc(reg.team) + " · " + R.esc(e.name) + "</div>" +
    "</div>" +
    '<div class="email-body">' +
      '<div class="email-banner"><p class="eyebrow" style="color:#ffd2b3;margin:0 0 4px">' + R.esc(e.dates) + "</p><h3>" + R.esc(e.name) + "</h3></div>" +
      '<div class="email-inner">' +
        "<p>Hi " + R.esc(first) + ",</p>" +
        "<p><b>" + R.esc(reg.team) + "</b> is officially in the " + R.esc(reg.age) + " division. Your $495.00 entry fee has been received. Here's your receipt.</p>" +
        '<dl class="kv" style="margin-bottom:16px">' + kv + "</dl>" +
        "<p><b>What happens next</b></p>" +
        '<ul style="padding-left:20px;margin:0 0 16px">' +
          "<li>Pools and Saturday game times post by <b>Nov 2</b>. We'll text " + R.esc(reg.phone) + " when they're live.</li>" +
          "<li>Upload your roster and birth-year verification by <b>Nov 4</b>.</li>" +
          "<li>Check in at the HQ tent by Field 1 at least 45 minutes before your first game.</li>" +
        "</ul>" +
        '<p><span class="btn" style="pointer-events:none">View schedule &amp; bracket</span></p>' +
        '<p class="muted" style="font-size:.85rem;margin:0">' + R.esc(e.host) + " · " + R.esc(e.venue) + ", " + R.esc(e.town) + "<br>Questions? Just reply to this email.</p>" +
      "</div>" +
    "</div>";

  $("ok").hidden = false;
  $("ok-h").focus();
  try { sessionStorage.removeItem("rfc_draft"); } catch (e2) {}
})();
