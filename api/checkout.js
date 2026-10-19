// Creates a Stripe Checkout session in TEST MODE only.
// Set STRIPE_SECRET_KEY to an sk_test_ key in the Vercel project settings.
// Without it, GET reports configured:false and the page falls back to a simulated payment.

const key = () => process.env.STRIPE_SECRET_KEY || "";
const isTestKey = k => k.startsWith("sk_test_") || k.startsWith("rk_test_");

export default async function handler(req, res) {
  const k = key();
  if (req.method === "GET") {
    return res.status(200).json({ configured: isTestKey(k) });
  }
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!isTestKey(k)) return res.status(503).json({ error: "Stripe test mode is not configured" });

  const { id, team, age, email } = req.body || {};
  if (!id || !team || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "")) {
    return res.status(400).json({ error: "Missing registration details" });
  }

  const origin = (req.headers["x-forwarded-proto"] || "https") + "://" + req.headers.host;
  const params = new URLSearchParams({
    mode: "payment",
    customer_email: email,
    client_reference_id: String(id).slice(0, 60),
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][unit_amount]": "49500",
    "line_items[0][price_data][product_data][name]": "Riverbend Fall Classic entry (" + String(age).slice(0, 4) + ") — DEMO",
    "line_items[0][price_data][product_data][description]": String(team).slice(0, 60),
    "metadata[registration_id]": String(id).slice(0, 60),
    success_url: origin + "/confirmed?id=" + encodeURIComponent(id) + "&session_id={CHECKOUT_SESSION_ID}",
    cancel_url: origin + "/register?canceled=1&id=" + encodeURIComponent(id)
  });

  const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: "Bearer " + k, "Content-Type": "application/x-www-form-urlencoded" },
    body: params
  });
  const j = await r.json();
  if (!r.ok) return res.status(502).json({ error: (j.error && j.error.message) || "Stripe error" });
  return res.status(200).json({ url: j.url });
}
