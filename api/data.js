export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const credentials = Buffer.from('operations:rboperations2026!').toString('base64');
  try {
    const response = await fetch('https://dbtool.xcira.cloud/?sale_number=2026426', {
      headers: {
        'Authorization': 'Basic ' + credentials,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Upstream ' + response.status, rows: [], count: 0 });
    }
    const html = await response.text();

    // Strip scripts/styles to avoid false matches
    const clean = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');

    // Find all <tr> blocks
    const rows = [];
    const trRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let tr;
    while ((tr = trRe.exec(clean)) !== null) {
      const rowHtml = tr[1];
      // Extract all <td> contents
      const cells = [];
      const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      let td;
      while ((td = tdRe.exec(rowHtml)) !== null) {
        cells.push(td[1].replace(/<[^>]+>/g, '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ').trim());
      }
      if (cells.length >= 9) {
        const lot = parseFloat(cells[0]);
        if (!isNaN(lot) && lot > 0) {
          rows.push({
            lot,
            desc: cells[1] || '',
            ownerCode: cells[2] || '',
            status: (cells[3] || '').toUpperCase(),
            highBid: parseFloat(cells[4]) || 0,
            maxBid: parseFloat(cells[5]) || 0,
            reserveMet: (cells[7] || '').toLowerCase() === 'true',
            reservePrice: parseFloat(cells[8]) || 0,
          });
        }
      }
    }

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');
    return res.status(200).json({ rows, fetchedAt: new Date().toISOString(), count: rows.length });
  } catch (err) {
    return res.status(500).json({ error: err.message, rows: [], count: 0 });
  }
}