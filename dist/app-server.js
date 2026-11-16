const http = require('http');
const fs = require('fs');
const path = require('path');

const siteRoot = __dirname;
const port = Number(process.env.PORT || 3000);
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon'
};
const translations = JSON.parse(fs.readFileSync(path.join(siteRoot, 'public/content.json'), 'utf8'));

const readContent = (source, key) => key.split('.').reduce((value, part) => value?.[part], source);
const renderList = (items = []) => items.map((item) => `<li>${item}</li>`).join('');
const buildTimelineMarkup = (content) => (Array.isArray(content?.experience?.items) ? content.experience.items : []).map((item) => `
  <article class="timeline-item">
    <div class="timeline-marker"><span></span></div>
    <div class="timeline-date">${item.date}</div>
    <div class="timeline-body"><h3>${item.title}</h3><p class="timeline-place">${item.place}</p>${item.summary ? `<p>${item.summary}</p>` : ''}${item.points ? `<ul class="timeline-points">${renderList(item.points)}</ul>` : ''}${item.subTitle ? `<h4>${item.subTitle}</h4><ul class="timeline-points">${renderList(item.subPoints)}</ul>` : ''}</div>
  </article>`).join('');

function renderPage(template, requestedLanguage) {
  const language = requestedLanguage === 'ar' ? 'ar' : 'en';
  const content = translations[language];
  let html = template
    .replace('<html lang="en" dir="ltr">', `<html lang="${language}" dir="${language === 'ar' ? 'rtl' : 'ltr'}">`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${content.meta.title}</title>`)
    .replace(/(<meta name="description"[^>]*content=")[^"]*("[^>]*>)/, `$1${content.meta.description}$2`)
    .replace(/(<meta property="og:title"[^>]*content=")[^"]*("[^>]*>)/, `$1${content.meta.title}$2`)
    .replace(/(<meta property="og:description"[^>]*content=")[^"]*("[^>]*>)/, `$1${content.meta.description}$2`)
    .replace(/(<meta name="twitter:title"[^>]*content=")[^"]*("[^>]*>)/, `$1${content.meta.title}$2`)
    .replace(/(<meta name="twitter:description"[^>]*content=")[^"]*("[^>]*>)/, `$1${content.meta.description}$2`)
    .replace(/<div class="timeline reveal reveal-delay" id="timeline" data-render="experience"><\/div>/, `<div class="timeline reveal reveal-delay" id="timeline" data-render="experience">${buildTimelineMarkup(content)}</div>`);

  html = html.replace(/<([a-z0-9]+)([^>]*data-i18n="([^"]+)"[^>]*)>[\s\S]*?<\/\1>/gi, (match, tag, attributes, key) => {
    const value = readContent(content, key);
    return value === undefined ? match : `<${tag}${attributes}>${value}</${tag}>`;
  });
  html = html.replace(/data-i18n-aria-label="([^"]+)"/g, (match, key) => {
    const value = readContent(content, key);
    return value === undefined ? match : `aria-label="${value}"`;
  });
  return html;
}

const serveStaticFile = (response, filePath, statusCode = 200) => {
  fs.readFile(filePath, (error, data) => {
    if (error) { response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return response.end('Not found'); }
    response.writeHead(statusCode, { 'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream', 'Cache-Control': path.extname(filePath) === '.html' ? 'no-cache' : 'public, max-age=3600' });
    response.end(data);
  });
};

const server = http.createServer((request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  const requestPath = decodeURIComponent(url.pathname);
  if (requestPath === '/health') { response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' }); return response.end('ok'); }
  if (requestPath === '/content.json') return serveStaticFile(response, path.join(siteRoot, 'public/content.json'));
  if (requestPath === '/' || requestPath === '/index.html') {
    const template = fs.readFileSync(path.join(siteRoot, 'index.html'), 'utf8');
    response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache, no-store, must-revalidate' });
    return response.end(renderPage(template, url.searchParams.get('lang')));
  }
  const safePath = path.normalize(requestPath).replace(/^([.][.][\\/])+/, '');
  const filePath = path.join(siteRoot, safePath);
  if (!filePath.startsWith(siteRoot)) { response.writeHead(403); return response.end('Forbidden'); }
  serveStaticFile(response, filePath);
});

server.listen(port, '0.0.0.0', () => console.log(`Portfolio server listening on ${port}`));
