/**
 * Shared layout and design system for the web app.
 *
 * Constraints that shaped this file:
 *  - no external fonts, scripts, or analytics: a page that phones a CDN is a page
 *    that does not work offline, and offline is a first-class mode here
 *  - under 60KB of CSS in total, minified-by-hand, so a 3G phone gets it fast
 *  - system fonts and `prefers-color-scheme`, so it looks native everywhere
 *  - every interactive control is a real form control; the JS is an enhancement,
 *    not a requirement
 */

export const CSS = `
:root{
  --bg:#0b0f14;--panel:#121820;--panel2:#182028;--line:#232c37;--fg:#e8eef5;--muted:#93a1b0;
  --accent:#3fb950;--accent2:#58a6ff;--warn:#d29922;--bad:#f85149;--radius:12px;
  --font:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  --max:1080px; --focus:#f0b429;
}
@media (prefers-color-scheme:light){:root{
  --bg:#fcfdfe;--panel:#fff;--panel2:#f4f7fa;--line:#e2e8ef;--fg:#10151b;--muted:#5a6673;
  --accent:#1a7f37;--accent2:#0969da;--warn:#8a6100;--bad:#cf222e;
}}
html[data-contrast="high"]{--line:#6b7684;--muted:#3d4854}
@media (prefers-color-scheme:dark){html[data-contrast="high"]{--line:#8b949e;--muted:#c9d1d9}}
html[data-scale="large"]{font-size:118%}
html[data-scale="xlarge"]{font-size:134%}
html[data-motion="reduced"] *{animation:none!important;transition:none!important}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.62 var(--font);text-rendering:optimizeLegibility}
a{color:var(--accent2);text-decoration-thickness:1px;text-underline-offset:2px}
a:hover{text-decoration-thickness:2px}
:focus-visible{outline:3px solid var(--focus);outline-offset:2px;border-radius:4px}
.skip{position:absolute;left:-9999px;top:0;background:var(--panel);color:var(--fg);padding:10px 14px;z-index:100;border:1px solid var(--line)}
.skip:focus{left:8px;top:8px}
header.site{position:sticky;top:0;z-index:50;background:color-mix(in srgb,var(--bg) 92%,transparent);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
.bar{max-width:var(--max);margin:0 auto;padding:0 18px;display:flex;align-items:center;gap:14px;min-height:56px;flex-wrap:wrap}
.brand{font-weight:800;letter-spacing:-.02em;color:var(--fg);text-decoration:none;font-size:15px;white-space:nowrap}
.brand span{color:var(--accent)}
nav.main{display:flex;gap:2px;flex-wrap:wrap;flex:1}
nav.main a{color:var(--muted);text-decoration:none;font-size:13.5px;padding:7px 9px;border-radius:7px}
nav.main a:hover{color:var(--fg);background:var(--panel2)}
nav.main a[aria-current="page"]{color:var(--fg);background:var(--panel2);font-weight:600}
.wrap{max-width:var(--max);margin:0 auto;padding:34px 18px 96px}
h1{font-size:clamp(26px,4.4vw,40px);line-height:1.14;letter-spacing:-.025em;margin:0 0 10px}
h2{font-size:clamp(19px,2.4vw,24px);letter-spacing:-.015em;margin:44px 0 12px;padding-top:18px;border-top:1px solid var(--line)}
h3{font-size:16.5px;margin:24px 0 8px}
p{margin:0 0 14px;max-width:72ch}
.lede{font-size:clamp(16.5px,2vw,19px);color:var(--muted);max-width:66ch}
.muted{color:var(--muted)}
.small{font-size:13.5px}
.tiny{font-size:12px}
.mono{font-family:var(--mono);font-size:13px}
.panel{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:22px;margin:16px 0}
.panel.tight{padding:16px}
.grid{display:grid;gap:14px}
.g2{grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}
.g3{grid-template-columns:repeat(auto-fit,minmax(210px,1fr))}
.g4{grid-template-columns:repeat(auto-fit,minmax(160px,1fr))}
label{display:block;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:0 0 6px;font-weight:600}
input[type=text],input[type=url],textarea,select{
  width:100%;background:var(--bg);border:1px solid var(--line);border-radius:9px;color:var(--fg);
  padding:11px 12px;font:14px/1.5 var(--mono);min-height:44px
}
textarea{min-height:130px;resize:vertical}
input:focus,textarea:focus,select:focus{outline:none;border-color:var(--accent2);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent2) 22%,transparent)}
button,.btn{background:var(--accent);color:#04240d;border:0;border-radius:9px;padding:11px 18px;font-weight:700;font-size:14.5px;cursor:pointer;min-height:44px;text-decoration:none;display:inline-flex;align-items:center;gap:8px;font-family:var(--font)}
@media (prefers-color-scheme:light){button,.btn{color:#fff}}
button:hover,.btn:hover{filter:brightness(1.08)}
button:disabled{opacity:.55;cursor:progress}
.btn.ghost{background:transparent;border:1px solid var(--line);color:var(--fg);font-weight:500}
.btn.ghost:hover{background:var(--panel2);filter:none}
.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.spread{justify-content:space-between}
.chk{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--muted);text-transform:none;letter-spacing:0;font-weight:400}
.chk input{accent-color:var(--accent);width:18px;height:18px;min-height:0}
table{width:100%;border-collapse:collapse;font-size:14px;margin:12px 0}
th,td{text-align:left;padding:9px 10px;border-bottom:1px solid var(--line);vertical-align:top}
th{font-size:11.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);font-weight:700}
td.num,th.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.pill{display:inline-block;font-size:11px;padding:2px 9px;border-radius:99px;border:1px solid var(--line);color:var(--muted);text-transform:uppercase;letter-spacing:.05em;font-weight:600;white-space:nowrap}
.pill.ok{color:var(--accent);border-color:color-mix(in srgb,var(--accent) 55%,var(--line))}
.pill.warn{color:var(--warn);border-color:color-mix(in srgb,var(--warn) 55%,var(--line))}
.pill.bad{color:var(--bad);border-color:color-mix(in srgb,var(--bad) 55%,var(--line))}
.big{font-size:clamp(42px,10vw,72px);font-weight:800;line-height:.96;letter-spacing:-.04em;font-variant-numeric:tabular-nums}
.kpi{display:flex;gap:26px;flex-wrap:wrap;align-items:flex-end}
.stop{border-left:5px solid var(--bad);background:color-mix(in srgb,var(--bad) 10%,var(--panel));padding:14px 18px;border-radius:8px;margin:16px 0}
.stop strong{color:var(--bad)}
pre{background:var(--bg);border:1px solid var(--line);border-radius:9px;padding:14px;overflow-x:auto;font:13px/1.55 var(--mono);white-space:pre-wrap;word-break:break-word}
code{font-family:var(--mono);font-size:.92em;background:var(--panel2);padding:1px 5px;border-radius:4px}
pre code{background:none;padding:0}
details{background:var(--panel);border:1px solid var(--line);border-radius:9px;padding:12px 16px;margin:8px 0}
summary{cursor:pointer;font-weight:600}
summary::marker{color:var(--muted)}
ul,ol{padding-left:22px;max-width:72ch}
li{margin:5px 0}
.hero{padding:56px 0 8px}
.hero h1{max-width:20ch}
.cta{display:flex;gap:12px;flex-wrap:wrap;margin:26px 0 8px}
.notice{border:1px solid var(--line);border-left:4px solid var(--accent2);background:var(--panel2);padding:12px 16px;border-radius:6px;font-size:14px;margin:14px 0}
.notice.warn{border-left-color:var(--warn)}
.notice.bad{border-left-color:var(--bad)}
.bar-track{height:22px;background:var(--panel2);border:1px solid var(--line);border-radius:6px;overflow:hidden;position:relative;min-width:120px}
.bar-fill{height:100%;background:var(--accent);transition:width .2s}
.bar-fill.warn{background:var(--warn)}
.bar-fill.bad{background:var(--bad)}
.legend{display:flex;gap:16px;flex-wrap:wrap;font-size:12.5px;color:var(--muted);margin-top:8px}
.sw{display:inline-block;width:11px;height:11px;border-radius:3px;margin-right:6px;vertical-align:middle}
footer.site{border-top:1px solid var(--line);background:var(--panel);padding:30px 18px 44px;margin-top:60px}
footer.site .inner{max-width:var(--max);margin:0 auto;display:grid;gap:22px;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));font-size:13.5px;color:var(--muted)}
footer.site h4{font-size:12px;text-transform:uppercase;letter-spacing:.06em;margin:0 0 8px;color:var(--fg)}
footer.site a{display:block;color:var(--muted);text-decoration:none;padding:2px 0}
footer.site a:hover{color:var(--fg)}
.toolbar{display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding:10px 0;border-bottom:1px solid var(--line);margin-bottom:18px}
.toolbar select{width:auto;min-height:38px;padding:6px 10px;font-size:13px}
.skip-link-hidden{display:none}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@media (max-width:640px){
  .wrap{padding:22px 14px 72px}
  nav.main{order:3;width:100%;overflow-x:auto;flex-wrap:nowrap;padding-bottom:4px}
  nav.main a{white-space:nowrap}
  .panel{padding:16px}
  table{font-size:13px}
  th,td{padding:7px 6px}
}
@media print{
  header.site,footer.site,.toolbar,.cta{display:none}
  body{background:#fff;color:#000}
  .panel,details{border:1px solid #ccc;break-inside:avoid}
  a::after{content:" (" attr(href) ")";font-size:11px;color:#555}
}
`;

export interface NavItem { href: string; label: string }

export const NAV: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/analyze', label: 'Analyzer' },
  { href: '/scorecard', label: 'Scorecard' },
  { href: '/protocol', label: 'Protocol' },
  { href: '/academy', label: 'Academy' },
  { href: '/evidence', label: 'Evidence' },
  { href: '/case-studies', label: 'Case studies' },
  { href: '/museum', label: 'Failed launches' },
  { href: '/api', label: 'API' },
  { href: '/local', label: 'Local mode' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/accessibility', label: 'Accessibility' },
];

export function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface LayoutOptions {
  title: string;
  description: string;
  path: string;
  body: string;
  /** Extra <script> content, injected at the end of body. */
  script?: string;
  /** Skip the default footer. */
  bare?: boolean;
}

export function layout(o: LayoutOptions): string {
  const nav = NAV.map(
    (n) => `<a href="${n.href}"${n.href === o.path ? ' aria-current="page"' : ''}>${esc(n.label)}</a>`,
  ).join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(o.title)} — Viral Engine Commons</title>
<meta name="description" content="${esc(o.description)}">
<meta name="color-scheme" content="dark light">
<meta property="og:title" content="${esc(o.title)} — Viral Engine Commons">
<meta property="og:description" content="${esc(o.description)}">
<meta property="og:type" content="website">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<style>${CSS}</style>
<script>
// Preference application runs before paint so there is no flash of the wrong theme.
(function(){
  try{
    var s=JSON.parse(localStorage.getItem('vec.prefs')||'{}');
    if(s.contrast)document.documentElement.dataset.contrast=s.contrast;
    if(s.scale)document.documentElement.dataset.scale=s.scale;
    if(s.motion)document.documentElement.dataset.motion=s.motion;
    if(s.lang)document.documentElement.lang=s.lang;
    if(s.theme==='light'||s.theme==='dark')document.documentElement.style.colorScheme=s.theme;
  }catch(e){}
})();
</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site">
  <div class="bar">
    <a class="brand" href="/">Viral Engine <span>Commons</span></a>
    <nav class="main" aria-label="Main">
      ${nav}
    </nav>
    <a class="btn ghost" href="/analyze" style="padding:8px 14px;min-height:38px;font-size:13px">Run a diagnosis</a>
  </div>
</header>
<main id="main" class="wrap">
${o.body}
</main>
${o.bare ? '' : footer()}
${o.script ? `<script>${o.script}</script>` : ''}
<script>
if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}
</script>
</body>
</html>`;
}

function footer(): string {
  return `<footer class="site"><div class="inner">
  <div>
    <h4>Use it</h4>
    <a href="/analyze">Analyzer</a>
    <a href="/scorecard">The 1000-point index</a>
    <a href="/local">Run it locally</a>
    <a href="/accessibility">Accessibility settings</a>
  </div>
  <div>
    <h4>Learn</h4>
    <a href="/protocol">Open Diffusion Spec</a>
    <a href="/academy">Free academy</a>
    <a href="/case-studies">Case studies</a>
    <a href="/museum">Failed launch museum</a>
  </div>
  <div>
    <h4>Build on it</h4>
    <a href="/api">API and schema</a>
    <a href="/protocol#conformance">Conformance suite</a>
    <a href="https://github.com/mananmodi1487/viral-engine">Source (MIT)</a>
    <a href="/privacy">Privacy dashboard</a>
  </div>
  <div>
    <h4>Why it exists</h4>
    <p class="tiny" style="margin:0">Free forever. No account, no telemetry, no paywall, no premium tier. There is nothing to upgrade to, and nothing withheld to make you want to.</p>
    <p class="tiny" style="margin:8px 0 0">Core code MIT · docs CC BY 4.0 · protocol CC0 1.0</p>
  </div>
</div></footer>`;
}
