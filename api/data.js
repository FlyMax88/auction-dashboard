export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const credentials = Buffer.from('operations:rboperations2026!').toString('base64');
  try {
    const response = await fetch('https://dbtool.xcira.cloud/?sale_number=2026426', {
      headers: { 'Authorization': 'Basic ' + credentials, 'User-Agent': 'Mozilla/5.0' },
    });
    if (!response.ok) return res.status(response.status).json({ error: 'Upstream ' + response.status });
    const html = await response.text();
    const rows = [];
    const trRegex = /<tr[^>]*>([sS]*?)<\/tr>/gi;
    let trMatch;
    while ((trMatch = trRegex.exec(html)) !== null) {
      const cells = [];
      const tdRe = /<td[^>]*>([sS]*?)<\/td>/gi;
      let tdMatch;
      while ((tdMatch = tdRe.exec(trMatch[1])) !== null) {
        cells.push(tdMatch[1].replace(/<[^>]+>/g, '').trim());
      }
      if (cells.length >= 9 && !isNaN(parseFloat(cells[0]))) {
        rows.push({
          lot: parseFloat(cells[0]), desc: cells[1], ownerCode: cells[2],
          status: cells[3], highBid: parseFloat(cells[4])||0, maxBid: parseFloat(cells[5])||0,
          reserveMet: cells[7].toLowerCase()==='true', reservePrice: parseFloat(cells[8])||0,
        });
      }
    }
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');
    return res.status(200).json({ rows, fetchedAt: new Date().toISOString(), count: rows.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}