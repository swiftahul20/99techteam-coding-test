export default async function handler(req, res) {
  try {
    const upstream = await fetch("https://interview.switcheo.com/prices.json");

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: "Upstream request failed" });
      return;
    }

    const data = await upstream.json();

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=300");
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch prices" });
  }
}
