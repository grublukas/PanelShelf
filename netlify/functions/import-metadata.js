const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json; charset=utf-8'
};
const reply = (statusCode, body) => ({ statusCode, headers: corsHeaders, body: JSON.stringify(body) });

function clean(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/\s+/g, ' ').trim();
}
function meta(html, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${escaped}["'][^>]*>`, 'i')
  ];
  for (const p of patterns) { const m = html.match(p); if (m) return clean(m[1]); }
  return '';
}
function chapterFrom(text) {
  const m = String(text || '').match(/(?:chapter|chap|ch\.?|episode|ep\.?|第)\s*[-:#]?\s*(\d+(?:\.\d+)?)/i)
    || String(text || '').match(/(?:^|[\/_\-])(?:chapter|chap|ch|episode|ep)[\/_\-]?(\d+(?:\.\d+)?)/i);
  return m ? m[1] : '';
}
function absoluteUrl(value, base) {
  try { const u = new URL(value, base); return ['http:', 'https:'].includes(u.protocol) ? u.href : ''; } catch { return ''; }
}
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: corsHeaders, body: '' };
  if (event.httpMethod !== 'POST') return reply(405, { error: 'Nur POST ist erlaubt.' });
  let input; try { input = JSON.parse(event.body || '{}'); } catch { return reply(400, { error: 'Ungültige Anfrage.' }); }
  let target; try { target = new URL(input.url); } catch { return reply(400, { error: 'Bitte einen gültigen Link eingeben.' }); }
  if (!['http:', 'https:'].includes(target.protocol) || target.username || target.password ||
      /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[::1\])/i.test(target.hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(target.hostname)) {
    return reply(400, { error: 'Dieser Link ist nicht zulässig.' });
  }
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    let response;
    try { response = await fetch(target.href, { signal: controller.signal, redirect: 'follow', headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; PanelShelf/2.1; +https://www.netlify.com/)','Accept': 'text/html,application/xhtml+xml'
    }}); } finally { clearTimeout(timeout); }
    if (!response.ok) return reply(200, { title: '', cover_url: '', chapter: '', note: `Die Website antwortet mit HTTP ${response.status}.` });
    const type = response.headers.get('content-type') || '';
    if (!type.includes('text/html') && !type.includes('application/xhtml+xml')) return reply(200, { title: '', cover_url: '', chapter: '' });
    const html = (await response.text()).slice(0, 2_000_000);
    let title = meta(html, 'og:title') || meta(html, 'twitter:title') || '';
    if (!title) { const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i); if (t) title = clean(t[1]); }
    let cover = meta(html, 'og:image') || meta(html, 'twitter:image') || meta(html, 'twitter:image:src');
    if (!cover) { const link = html.match(/<link[^>]+rel=["'](?:image_src|apple-touch-icon)["'][^>]+href=["']([^"']+)["']/i); if (link) cover = link[1]; }
    let chapter = chapterFrom(target.href) || chapterFrom(title) || chapterFrom(meta(html, 'og:description')) || chapterFrom(meta(html, 'description'));
    // Some sites expose the series title and chapter in JSON-LD.
    if (!title) { const ld = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i); if (ld) { try { const data = JSON.parse(ld[1]); title = clean(data.name || data.headline || ''); } catch {} } }
    return reply(200, { title: clean(title).slice(0, 120), cover_url: absoluteUrl(cover, response.url || target.href), chapter: String(chapter || '').slice(0, 40) });
  } catch (error) {
    return reply(200, { title: '', cover_url: '', chapter: '', note: error.name === 'AbortError' ? 'Zeitüberschreitung.' : 'Die Website konnte nicht gelesen werden.' });
  }
};
