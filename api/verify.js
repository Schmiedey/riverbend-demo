// Confirms a test-mode Checkout session was paid.
export default async function handler(req, res) {
  const k = process.env.STRIPE_SECRET_KEY || "";
  const id = String(req.query.session_id || "");
  if (!k.includes("_test_") || !/^cs_test_[A-Za-z0-9]+$/.test(id)) return res.status(400).json({ paid: false });
  const r = await fetch("https://api.stripe.com/v1/checkout/sessions/" + id, { headers: { Authorization: "Bearer " + k } });
  const j = await r.json();
  return res.status(200).json({ paid: r.ok && j.payment_status === "paid" });
}
