/**
 * Page bodies. Every page is server-rendered HTML; the analyzer is the only page
 * that needs JavaScript, and it has a no-JS fallback (a form POST that returns
 * the same report as plain HTML).
 */
import { esc } from './layout.js';
import {
  AQI_DIMENSIONS,
  AQI_MAX,
  AQI_VERSION,
  AQI_BANDS,
  SUPPORTED_INPUTS,
  AGENT_REGISTRY_FOR_DOCS,
} from './data.js';

/* ---------------- Home ---------------- */

export function homePage(): string {
  return `
<section class="hero">
  <p class="small muted" style="margin:0 0 12px"><span class="pill ok">Free forever</span> <span class="pill">No account</span> <span class="pill">No telemetry</span> <span class="pill">Works offline</span></p>
  <h1>Your work did not spread because of the category, not the writing.</h1>
  <p class="lede">Viral Engine Commons is a free, open protocol for finding out why something did not travel — and for fixing the one thing that would change that. It scores 25 dimensions, names the weakest, and writes the sentence a real person could paste.</p>
  <div class="cta">
    <a class="btn" href="/analyze">Diagnose something you published</a>
    <a class="btn ghost" href="/protocol">Read the protocol</a>
  </div>
  <p class="tiny muted">No signup. No API key. Paste a URL, a repo, a PDF, or a README and get a report in seconds. It will tell you not to launch if that is the honest answer.</p>
</section>

<div class="panel">
  <p class="small muted" style="margin:0 0 10px">Real output from this repository's own README:</p>
<pre><span class="muted">$</span> viral-engine analyze ./README.md --offline

  <strong>638/1000</strong>  Workable   weakest: Broadcast Stake (22/100)

  where the leverage is (points lost, not score):
  1. Broadcast Stake              51 pts of 65
  2. Broadcaster Fit              46 pts of 80
  3. Share Friction Reduction     37 pts of 65

  THE ONE-LINE FORWARD
  The diagnostic that tells you which of 25 dimensions is losing your launch.

  HONESTY  passed · 0 network call(s)</pre>
  <p class="tiny muted" style="margin:10px 0 0">Every number carries a basis: <code>measured</code>, <code>structural</code>, <code>heuristic</code>, or <code>unavailable</code>. Pretending all 25 are equally rigorous is how scorecards start lying.</p>
</div>

<h2>What it actually answers</h2>
<div class="grid g2">
  <div class="panel tight">
    <h3 style="margin-top:0">The twelve questions</h3>
    <ul class="small">
      <li>What is this thing really?</li>
      <li>Who needs it, specifically?</li>
      <li>Why have they not noticed it yet?</li>
      <li>What category should it belong to — and is that category crowded or empty?</li>
      <li>Who is the specific broadcaster, and why would they share it?</li>
      <li>What asset makes sharing effortless?</li>
      <li>What is the friction?</li>
      <li>What is the honest hook?</li>
      <li>What could fail, and how would we know?</li>
      <li>What should be tested before launch?</li>
      <li>What should <em>not</em> be launched yet?</li>
      <li>What did we learn, and how does the next attempt improve?</li>
    </ul>
  </div>
  <div class="panel tight">
    <h3 style="margin-top:0">Four findings that contradict common advice</h3>
    <ol class="small">
      <li><strong>"Going viral" barely exists.</strong> Across ~1 billion diffusion events, cascades larger than 100 nodes were about 0.025% of all events. The average cascade: 1.3 nodes. <span class="muted">(Goel, Watts &amp; Goldstein, 2012/2016)</span></li>
      <li><strong>Popularity is a broadcast, not a chain.</strong> What predicts a big event is the size of the single largest broadcast.</li>
      <li><strong>Sadness makes people stop.</strong> Awe, anger, anxiety and amusement increase sharing; sadness deactivates it. <span class="muted">(Berger &amp; Milkman, 2012)</span></li>
      <li><strong>Half of YouTube videos have under 500 views.</strong> Only ~7% of word of mouth happens online. <span class="muted">(Berger, 2013)</span></li>
    </ol>
    <p class="small" style="margin:10px 0 0"><a href="/protocol#broadcaster-rule">The Broadcaster Rule →</a></p>
  </div>
</div>

<h2>Why it is a protocol and not a product</h2>
<p class="lede">A tool can be paywalled, captured, or shut down. A protocol cannot. Every score, schema, weight, and template here is published so that anyone can implement it, audit it, or fork it — including a version that competes with this one.</p>
<div class="grid g3">
  <div class="panel tight"><h3 style="margin-top:0">ODS 2.0</h3><p class="small">A machine-readable schema for describing an artifact and its diffusion state. JSON Schema, TypeScript, Python, Go, and Rust. <a href="/protocol">Read it</a></p></div>
  <div class="panel tight"><h3 style="margin-top:0">The AQI</h3><p class="small">25 dimensions, weights published in one JSON file, summing to exactly ${AQI_MAX}. You can recompute any number we print. <a href="/scorecard">Check the maths</a></p></div>
  <div class="panel tight"><h3 style="margin-top:0">Evidence Commons</h3><p class="small">Wins, failures, and postmortems, each labelled by evidence quality so ten anecdotes never become a statistic. <a href="/evidence">Browse</a></p></div>
</div>

<h2>Honesty, enforced in code</h2>
<p>Every claim in this table is a test in the repository, not a promise in a README.</p>
<div class="panel tight">
<table>
<thead><tr><th>Rule</th><th>Mechanism</th></tr></thead>
<tbody>
<tr><td>No invented statistics</td><td>The honesty firewall blocks unsourced figures and emits <code>[your real number]</code> instead</td></tr>
<tr><td>No fabricated testimonials</td><td>An <em>outbound</em> scan of our own generated text blocks testimonial shapes</td></tr>
<tr><td>No guaranteed outcomes</td><td>Guarantee phrasing is a blocker, and the CLI exits 4</td></tr>
<tr><td>Every plan states a failure condition</td><td>Schema validation throws if one is missing</td></tr>
<tr><td>"Do not launch yet" is valid</td><td>It is a first-class field, a banner in every renderer, and exit code 4</td></tr>
<tr><td>Unknown is stated, not guessed</td><td>Saturation returns <code>unknown</code>, never a default number</td></tr>
<tr><td>No spam</td><td>Outreach is capped at three contacts, at the type level, with no override flag</td></tr>
</tbody>
</table>
</div>

<h2>Start where you are</h2>
<div class="grid g4">
  <a class="panel tight" href="/analyze" style="text-decoration:none;color:inherit"><h3 style="margin-top:0">I published something</h3><p class="small muted">Find the bottleneck.</p></a>
  <a class="panel tight" href="/academy" style="text-decoration:none;color:inherit"><h3 style="margin-top:0">I am about to publish</h3><p class="small muted">Fifteen free modules.</p></a>
  <a class="panel tight" href="/api" style="text-decoration:none;color:inherit"><h3 style="margin-top:0">I build tools</h3><p class="small muted">API, schema, plugins.</p></a>
  <a class="panel tight" href="/museum" style="text-decoration:none;color:inherit"><h3 style="margin-top:0">It already failed</h3><p class="small muted">Learn from honest losses.</p></a>
</div>
`;
}

/* ---------------- Analyzer ---------------- */

export function analyzePage(): string {
  return `
<h1>Analyzer</h1>
<p class="lede">Paste anything: a GitHub repo, a landing page, a README, a PDF, a docx, a folder, a draft. Nothing is uploaded to us — this server is running on the same machine as the analysis, and the report states exactly how many network calls it made.</p>

<form id="f" class="panel" method="post" action="/api/analyze-form">
  <label for="target">URL, repository, or file path</label>
  <input type="text" id="target" name="target" placeholder="owner/repo · https://yoursite.com · ./README.md" autocomplete="off" spellcheck="false">
  <p class="tiny muted" style="margin:6px 0 16px">Leave blank and paste text below instead. Both at once is a usage error, deliberately.</p>

  <label for="text">…or paste the text itself</label>
  <textarea id="text" name="text" placeholder="Paste your landing page copy, your draft, your README…"></textarea>

  <div class="grid g3" style="margin-top:16px">
    <div>
      <label for="audience">Who is it for?</label>
      <select id="audience" name="audience">
        <option value="">Not sure / let the engine infer</option>
        <option value="developer">Developers</option>
        <option value="founder">Founders</option>
        <option value="writer">Writers</option>
        <option value="researcher">Researchers</option>
        <option value="marketer">Marketers</option>
        <option value="student">Students</option>
        <option value="teacher">Teachers</option>
        <option value="nonprofit">Nonprofits</option>
        <option value="artist">Artists</option>
      </select>
    </div>
    <div>
      <label for="channel">Channel you are considering</label>
      <select id="channel" name="channel">
        <option value="">Undecided</option>
        <option value="hackernews">Hacker News</option>
        <option value="github">GitHub</option>
        <option value="x">X / Twitter</option>
        <option value="linkedin">LinkedIn</option>
        <option value="producthunt">Product Hunt</option>
        <option value="email">Email</option>
        <option value="discord">Discord / Slack</option>
        <option value="youtube">YouTube</option>
        <option value="tiktok">TikTok / Reels</option>
      </select>
    </div>
    <div>
      <label for="language">Language</label>
      <select id="language" name="language">
        <option value="en">English</option>
        <option value="hi">हिन्दी (Hindi)</option>
        <option value="es">Español</option>
        <option value="fr">Français</option>
        <option value="pt">Português</option>
        <option value="de">Deutsch</option>
        <option value="ja">日本語</option>
        <option value="zh">中文</option>
        <option value="ar">العربية</option>
        <option value="sw">Kiswahili</option>
      </select>
    </div>
  </div>

  <div class="row" style="margin-top:18px">
    <label class="chk"><input type="checkbox" name="offline" value="1" checked> Offline mode — zero network calls</label>
    <label class="chk"><input type="checkbox" name="strict" value="1"> Strict honesty (warnings block too)</label>
  </div>

  <div class="row" style="margin-top:18px">
    <button type="submit" id="go">Run the diagnosis</button>
    <button type="button" class="btn ghost" id="fill">Try an example</button>
    <span class="tiny muted" id="status" role="status" aria-live="polite"></span>
  </div>
  <p class="tiny muted" style="margin:12px 0 0">This form works with JavaScript disabled: it posts to the server and returns the same report as HTML. With JavaScript, the report renders in place and can be downloaded as Markdown, JSON, or HTML.</p>
</form>

<div id="result" aria-live="polite"></div>

<h2>What you will get</h2>
<div class="grid g2">
  <div class="panel tight">
    <h3 style="margin-top:0">Eight things, in this order</h3>
    <ol class="small">
      <li><strong>Where the leverage is</strong> — ranked by points lost, not by score</li>
      <li><strong>All 25 dimensions</strong> — with evidence, assumptions, missing data</li>
      <li><strong>Category</strong> — what you compete with, and a less crowded adjacent</li>
      <li><strong>The broadcaster</strong> — a role, where to find them, a message that asks for nothing</li>
      <li><strong>Share friction</strong> — why forwarding is expensive, with a fix per friction</li>
      <li><strong>Honesty audit</strong> — what would not survive being checked, with rewrites</li>
      <li><strong>Assets</strong> — HN, X, LinkedIn, Product Hunt, email, chat, hero, one-liner</li>
      <li><strong>Tests and kill criteria</strong> — decided before launch, not after</li>
    </ol>
  </div>
  <div class="panel tight">
    <h3 style="margin-top:0">What it will refuse to do</h3>
    <ul class="small">
      <li>Invent a number to fill a gap. It prints <code>[your real number]</code>.</li>
      <li>Promise an outcome. There is no field for a probability, on purpose.</li>
      <li>Name a private individual. It names roles and discovery methods.</li>
      <li>Write outreach designed to be mass-sent. Three contacts, then stop.</li>
      <li>Guess your category saturation when it cannot measure it. It says <code>unknown</code>.</li>
      <li>Tell you your work is good. It tells you which dimension is losing.</li>
    </ul>
  </div>
</div>

<h2>Inputs it actually reads</h2>
<div class="panel tight">
<table>
<thead><tr><th>Kind</th><th>Examples</th><th>Support</th></tr></thead>
<tbody>
${SUPPORTED_INPUTS.map((i) => `<tr><td><code>${esc(i.kind)}</code></td><td class="small">${esc(i.examples)}</td><td><span class="pill ${i.status === 'full' ? 'ok' : i.status === 'partial' ? 'warn' : ''}">${i.status}</span></td></tr>`).join('\n')}
</tbody>
</table>
<p class="tiny muted" style="margin:10px 0 0"><strong>paste-only</strong> means we will not scrape around a JavaScript wall or a login. We say so instead of returning a confident diagnosis of an empty page.</p>
</div>
`;
}

export const ANALYZE_SCRIPT = `
(function(){
  var f=document.getElementById('f');
  var out=document.getElementById('result');
  var status=document.getElementById('status');
  var go=document.getElementById('go');

  document.getElementById('fill').addEventListener('click',function(){
    document.getElementById('target').value='';
    document.getElementById('text').value="A productivity app for busy professionals. Track habits, manage tasks, stay focused. 10,000+ users already love it. Guaranteed to 10x your output.";
  });

  f.addEventListener('submit',async function(e){
    e.preventDefault();
    var fd=new FormData(f);
    var payload={target:String(fd.get('target')||'').trim(),text:String(fd.get('text')||'').trim(),
      audience:String(fd.get('audience')||'')||undefined,
      channel:String(fd.get('channel')||'')||undefined,
      language:String(fd.get('language')||'en'),
      offline:fd.get('offline')==='1',strict:fd.get('strict')==='1'};
    if(!payload.target&&!payload.text){status.textContent='Nothing to analyse — paste a URL, a path, or some text.';return;}
    status.textContent='Running…';
    go.disabled=true;
    var t0=Date.now();
    try{
      var res=await fetch('/api/analyze',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
      var json=await res.json();
      if(!res.ok){throw new Error(json.error||('HTTP '+res.status));}
      status.textContent='Done in '+((Date.now()-t0)/1000).toFixed(1)+'s · '+json.doc.generator.network_calls+' network call(s).';
      out.innerHTML=json.html;
      window.__lastDoc=json.doc;
      out.scrollIntoView({behavior:'smooth',block:'start'});
    }catch(err){
      status.textContent='';
      out.innerHTML='<div class="stop"><strong>Could not run.</strong><br>'+String(err.message).replace(/[<>&]/g,function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;'}[c];})+'</div>';
    }finally{ go.disabled=false; }
  });

  document.addEventListener('click',function(e){
    var b=e.target.closest('[data-download]');
    if(!b||!window.__lastDoc)return;
    var kind=b.getAttribute('data-download');
    var d=window.__lastDoc;
    var text, mime, name;
    if(kind==='json'){text=JSON.stringify(d,null,2);mime='application/json';name='viral-engine-report.json';}
    else{
      var res=fetch('/api/render',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({doc:d,format:kind})});
      res.then(function(r){return r.text();}).then(function(t){
        var blob=new Blob([t],{type:kind==='markdown'?'text/markdown':'text/html'});
        var a=document.createElement('a');a.href=URL.createObjectURL(blob);
        a.download='viral-engine-report.'+(kind==='markdown'?'md':'html');a.click();
        setTimeout(function(){URL.revokeObjectURL(a.href)},2000);
      });
      return;
    }
    var blob=new Blob([text],{type:mime});
    var a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();
    setTimeout(function(){URL.revokeObjectURL(a.href)},2000);
  });
})();
`;

/* ---------------- Scorecard ---------------- */

export function scorecardPage(): string {
  return `
<h1>The Attempt Quality Index</h1>
<p class="lede">Twenty dimensions, each scored 0–100, each weighted, summing to exactly ${AQI_MAX}. Nothing here predicts reach. What it measures is whether an <em>attempt</em> is defensible — which is the only part you control.</p>

<div class="notice">
  <strong>What this is not.</strong> It is not a forecast, not a probability, and not a ranking of your work. High scores have launched into silence. Low scores have spread. It is a checklist with arithmetic, and the arithmetic is published so you can disagree with it precisely instead of vaguely.
</div>

<h2>The formula</h2>
<pre>attempt_quality = round( Σ ( sub_score_i × weight_i / 100 ) )

where sub_score_i is 0-100 and Σ weight_i = ${AQI_MAX}
so the maximum attainable value is exactly ${AQI_MAX}</pre>
<p class="small muted">Weights live in <code>protocol/aqi-weights.json</code>. TypeScript, Python, Go and Rust read that same file, so a third-party implementation cannot quietly disagree with ours.</p>

<h2>All 25 dimensions</h2>
<div class="panel tight">
<table>
<thead><tr><th class="num">#</th><th>Dimension</th><th class="num">Weight</th><th>The question it asks</th></tr></thead>
<tbody>
${AQI_DIMENSIONS.map((d, i) => `<tr>
  <td class="num muted">${i + 1}</td>
  <td><strong>${esc(d.label)}</strong></td>
  <td class="num">${d.weight}</td>
  <td class="small">${esc(d.question)}</td>
</tr>`).join('\n')}
<tr><td></td><td><strong>Total</strong></td><td class="num"><strong>${AQI_DIMENSIONS.reduce((a, d) => a + d.weight, 0)}</strong></td><td></td></tr>
</tbody>
</table>
</div>

<h2>Bands</h2>
<div class="panel tight">
<table>
<thead><tr><th>Range</th><th>Band</th><th>What it means in practice</th></tr></thead>
<tbody>
${AQI_BANDS.map((b) => `<tr><td class="num">${b.min}–${b.max}</td><td><strong>${esc(b.label)}</strong></td><td class="small">${esc(b.meaning)}</td></tr>`).join('\n')}
</tbody>
</table>
</div>

<h2>What every dimension must carry</h2>
<p>This is the part that makes the index auditable rather than decorative. The type system refuses to build a dimension without all six.</p>
<div class="panel tight">
<table>
<thead><tr><th>Field</th><th>Why it is required</th></tr></thead>
<tbody>
<tr><td><code>evidence</code></td><td>A score with no evidence string is a number pretending to be an argument. The constructor throws.</td></tr>
<tr><td><code>confidence</code></td><td>Low, medium, or high. Marking everything "medium" is how a rubric becomes a vibe.</td></tr>
<tr><td><code>assumptions</code></td><td>What had to be true for this score to mean anything.</td></tr>
<tr><td><code>missing_data</code></td><td>What we did not have. Often the most useful field on the page.</td></tr>
<tr><td><code>improvement</code></td><td>Exactly one action. Not "improve clarity". A sentence you could paste.</td></tr>
<tr><td><code>failure_condition</code></td><td>How you would know this specific score was wrong.</td></tr>
<tr><td><code>do_not_launch_yet</code></td><td>Some dimensions can veto the whole document. Honesty can. Ethical defensibility can.</td></tr>
</tbody>
</table>
</div>

<h2>Worked example</h2>
<div class="panel">
<h3 style="margin-top:0">Category Clarity: 24/100 · 19 of 80 points</h3>
<ul class="small">
<li><strong>Basis:</strong> <span class="pill">structural</span> · <strong>Confidence:</strong> medium</li>
<li><strong>Evidence:</strong> no explicit "not X, but Y" pairing; jargon density 4% is within range; a one-line description exists</li>
<li><strong>Assumption:</strong> a reader meets the first screen first; later clarity cannot repair an unclear first line</li>
<li><strong>Missing data:</strong> no comprehension test with a real outside reader was run</li>
<li><strong>Improvement:</strong> Add one sentence of the form: "It is not &lt;crowded category&gt;. It is &lt;new category&gt; — for &lt;specific person&gt;."</li>
<li><strong>Failure condition:</strong> this score is wrong if readers still describe the artifact as "just another X" in unprompted feedback</li>
</ul>
</div>

<h2>Read the limitations before quoting a number</h2>
<ul>
<li><strong>25 dimensions is a design choice, not a discovery.</strong> A different 25 would produce different scores. Weights were chosen for usefulness; they are not derived from a study.</li>
<li><strong>Some dimensions are counted, some are judged.</strong> Every one is labelled. The judged ones are labelled <code>heuristic</code> and should be argued with.</li>
<li><strong>The rubric has not been validated against outcomes.</strong> Nobody has shown that a higher AQI correlates with more reach, and we will not imply it. That validation is on the roadmap and may well fail to find an effect.</li>
<li><strong>Scores are comparable only within one <code>aqiVersion</code>.</strong> Changing a weight changes every score; published comparisons must state the version.</li>
</ul>
<p><a href="/protocol#conformance">How to implement and test it yourself →</a></p>
`;
}

/* ---------------- Protocol ---------------- */

export function protocolPage(): string {
  return `
<h1>Open Diffusion Spec 1.0</h1>
<p class="lede">A public, implementable, evidence-labelled way to describe an artifact and its diffusion state. Owned by nobody, implementable by anybody. The specification and the schema are dedicated to the public domain (CC0 1.0); the prose around them is CC BY 4.0. No permission, fee, or attribution is required to implement it.</p>

<div class="panel tight">
<h3 style="margin-top:0">Why a protocol exists for this</h3>
<p class="small">There are schemas for products, articles and scientific output. There was no schema for the awkward question in between: <em>this exists, why has it not been found, understood and passed on?</em> Every existing answer lives inside a growth team's private dashboard and is phrased in metrics that only exist after the fact.</p>
<p class="small" style="margin:0">ODS describes the attempt, not the outcome. Three commitments make it different from a JSON dump of opinions: <strong>every judgement carries a basis</strong>, <strong>failure conditions are required</strong>, and <strong>no score may exist without evidence, an improvement, and a failure condition</strong>.</p>
</div>

<h2 id="broadcaster-rule">The Broadcaster Rule</h2>
<blockquote class="panel" style="border-left:4px solid var(--accent2)"><p style="margin:0"><strong>Don't optimise the average share rate. Optimise the ease of one specific broadcast.</strong></p></blockquote>
<p>Standard advice treats sharing as a per-person probability to be nudged up. The diffusion data treats popularity as a function of the largest single broadcast. Optimising a mean when the outcome is driven by a maximum is how people spend six months on the wrong metric. <span class="muted small">(Goel, Watts &amp; Goldstein 2012/2016)</span></p>
<p>So the schema has a <code>broadcaster_analysis</code> block, and it is required to carry <code>consent_posture</code> and <code>anti_spam_rules</code>. A version of this rule without the consent layer is a DM spam playbook with a citation attached.</p>
<p><strong>The honest limit:</strong> the rule raises your ceiling. It does not guarantee the broadcaster shows up.</p>

<h2>Field groups</h2>
<div class="panel tight">
<table>
<thead><tr><th>Group</th><th>Question</th><th>Required</th></tr></thead>
<tbody>
${[
  ['artifact', 'What is this, in machine terms?', true],
  ['provenance', 'Where did the analysed text come from, and was it read in full?', false],
  ['current_positioning', 'What does it claim to be?', true],
  ['category_analysis', 'What is it actually competing with, and how crowded is that?', false],
  ['audience_analysis', 'Who specifically would recognise themselves?', false],
  ['broadcaster_analysis', 'Who carries it, and under what consent?', false],
  ['friction_analysis', 'Why is forwarding expensive?', false],
  ['honesty_audit', 'What would not survive being checked?', true],
  ['scorecard', 'The AQI, 0–1000, with evidence per dimension', true],
  ['launch_assets', 'What a forwarder needs, already made', false],
  ['experiments', 'What small test would change the plan?', false],
  ['failure_conditions', 'How would we know this failed?', true],
  ['post_launch_learning', 'What did we learn, labelled by evidence quality?', false],
  ['ethics_review', 'Would the audience accept this plan if they read it?', true],
  ['accessibility', "Can people outside the author's context read it?", false],
  ['limitations', 'What can this document not tell you?', false],
].map(([g, q, req]) => `<tr><td><code>${g}</code></td><td class="small">${q}</td><td>${req ? '<span class="pill ok">required</span>' : '<span class="pill">optional</span>'}</td></tr>`).join('\n')}
</tbody>
</table>
</div>

<h2>Evidence labels</h2>
<p>These apply to claims about the world — in the Evidence Commons and in <code>post_launch_learning</code>. A public claim that aggregates <code>self-reported</code> numbers into a total is fabrication with extra steps.</p>
<div class="panel tight">
<table>
<thead><tr><th>Label</th><th>Means</th><th>How to treat it</th></tr></thead>
<tbody>
${[
  ['self-reported', 'The author says so, unaudited', 'Interesting, not evidence'],
  ['verified', 'An independent party checked the artefact of the claim', 'Citable'],
  ['reproducible', 'Anyone can rerun the method and get the same result', 'Strongest'],
  ['anecdotal', 'n = 1, honestly labelled', 'A hypothesis generator'],
  ['unclear', 'Provenance is lost', 'Do not aggregate'],
  ['contested', 'Someone disputes it, with reasons attached', 'Read both sides or cite neither'],
  ['private-redacted', 'True, but specifics withheld to protect someone', 'Cite the label, never the number'],
].map(([l, m, t]) => `<tr><td><code>${l}</code></td><td class="small">${m}</td><td class="small">${t}</td></tr>`).join('\n')}
</tbody>
</table>
</div>

<h2 id="conformance">Conformance</h2>
<p>An implementation is <strong>ODS 2.0 conformant</strong> if it:</p>
<ol>
<li>emits a document validating against <code>ods.schema.json</code>, reporting <code>ods_version 2.0.0</code>;</li>
<li>uses <code>unavailable</code> rather than an invented value when it cannot determine something;</li>
<li>includes at least one top-level <code>failure_condition</code>;</li>
<li>sets <code>ethics_review.do_not_launch_yet</code> when its own honesty audit fails;</li>
<li>does not emit a dimension score without evidence, an improvement, and a failure condition;</li>
<li>states in <code>limitations</code> at least one thing it cannot determine.</li>
</ol>
<p>Conformance is self-declared and testable. There is no certification body, no fee, and no badge you can buy. There is a test suite: <code>npm run conformance</code>.</p>

<h2>Versioning</h2>
<div class="panel tight">
<ul class="small" style="margin:0">
<li><strong>Adding an optional field</strong> → minor.</li>
<li><strong>Adding a required field, removing a field, tightening a constraint, changing a meaning</strong> → major.</li>
<li><strong>Changing an AQI weight</strong> → minor for the spec, and a new <code>aqiVersion</code>, because scores are only comparable within one.</li>
<li><strong>A consumer must ignore fields it does not recognise.</strong> A producer must not change the meaning of an existing field. Breaking that turns every consumer into a maintenance burden, which is how protocols die.</li>
<li><strong>Extensions</strong> live under a namespaced key (<code>x_yourorg_...</code>) and may never be required for validation.</li>
<li><strong>Sunset:</strong> if ODS is superseded, the old schema stays published forever and a migration tool ships with the announcement, not after it.</li>
</ul>
</div>

<h2>Implementations</h2>
<div class="panel tight">
<table>
<thead><tr><th>Language</th><th>Location</th><th>Notes</th></tr></thead>
<tbody>
<tr><td>TypeScript</td><td><code>packages/protocol/src/</code></td><td>reference, Zod + JSON Schema</td></tr>
<tr><td>Python</td><td><code>packages/protocol/python/</code></td><td>Pydantic v2, reads the same weights file</td></tr>
<tr><td>Go</td><td><code>packages/protocol/go/</code></td><td>structs, no external dependencies</td></tr>
<tr><td>Rust</td><td><code>packages/protocol/rust/</code></td><td>serde types</td></tr>
</tbody>
</table>
<p class="small" style="margin:10px 0 0">A protocol with one implementation is a product. A protocol with three is a protocol. If you implement ODS elsewhere, open an issue with the link and we will list it.</p>
</div>

<h2>Citing ODS</h2>
<pre>Viral Engine Commons. (2026). Open Diffusion Spec 2.0.0.
https://github.com/mananmodi1487/viral-engine/blob/main/protocol/open-diffusion-spec.md</pre>
<p class="small">The honest citation includes what ODS cannot do: it is a rubric protocol for describing an attempt at diffusion, not a predictive model of diffusion. Its scores are reproducible by design and have no demonstrated causal relationship with reach.</p>
`;
}

/* ---------------- Academy ---------------- */

export const ACADEMY_MODULES = [
  { n: 1, title: 'Why category beats polish', blurb: 'The same artifact, in a crowded category, is invisible. In an empty one, it is the reference. Category is a design decision, not a label you discover later.', exercise: 'Write your one-liner. Then delete every category word from it. If the meaning survives, you never needed the category word — and you probably never had a category.' },
  { n: 2, title: 'The Broadcaster Rule', blurb: 'Popularity tracks the largest single broadcast, not the chain (Goel et al.). So name one person, work out what they need, and stop optimising the average.', exercise: 'Name one real human who would pass this on. Not a persona. If you cannot, write down the reason — that reason is the diagnosis.' },
  { n: 3, title: 'Share friction basics', blurb: 'Sharing requires the forwarder to locate, understand, summarise and risk. Most tools only fix understanding. The summarise step is the one that kills most forwards.', exercise: 'Ask someone to describe your thing in one line. Compare it to yours. Whatever they changed is the friction.' },
  { n: 4, title: 'Honest hooks', blurb: 'A hook built on a fabricated number is a loan against your credibility at a very high interest rate. Every hook shape that works also works with true material.', exercise: 'Take your boldest claim and write the version you could defend in a comment thread. That is the hook.' },
  { n: 5, title: 'Positioning for developers', blurb: 'Developers reward specificity and punish marketing register faster than they punish dullness. The first command is worth more than the first adjective.', exercise: 'Move your one command above every explanation of what the tool is. Then re-read.' },
  { n: 6, title: 'Positioning for writers', blurb: 'Writers under-specify who the piece is for, because the writing already knows. A reader does not. The first sentence has to carry the audience.', exercise: 'Rewrite your title as "for <specific reader> who <specific situation>". Notice whether you can.' },
  { n: 7, title: 'Launching without hype', blurb: 'Hype is a promise of an outcome you cannot control. Trust is a promise of a mechanism you can describe. Only one of those compounds.', exercise: 'Remove every adjective from your launch post. Add back only the ones you can defend with a number or an example.' },
  { n: 8, title: 'Pre-launch experiments', blurb: 'The cheapest test is showing the first screen to five people in the role and asking what it is. Ninety percent of launches skip this and then learn it publicly.', exercise: 'Run the five-person read-back this week. Write down their exact words.' },
  { n: 9, title: 'Reading post-launch signals', blurb: 'Likes measure the frame. Forwards measure the artifact. Returns measure the product. Confusing the three is how a successful launch feels like a failure, and vice versa.', exercise: 'Before you launch, write one number you will read in seven days, and one question you will answer in words.' },
  { n: 10, title: 'Failure conditions and kill criteria', blurb: 'A criterion written before launch cannot be rationalised afterwards. That is its only value, and it is the whole value.', exercise: 'Write: "This fails if <observable thing> has not happened <horizon>." Put it in the file.' },
  { n: 11, title: 'Ethical diffusion', blurb: 'The test is simple and hard: would the audience accept this plan if they read it verbatim? If the plan only works because they do not know how it was made, that is the finding.', exercise: 'Write the one sentence you would have to hide for your plan to work. That sentence is the plan\'s real problem.' },
  { n: 12, title: 'Multilingual positioning', blurb: 'Idioms do not survive translation, and neither do implicit audiences. A claim that only parses inside one subculture is not a claim, it is a password.', exercise: 'Remove every idiom from your headline. Ask someone outside your field if it still means what you think.' },
  { n: 13, title: 'Accessibility in launch copy', blurb: 'A screen-reader user navigates by headings and link text. "Here" is not a link. A scorecard image with no alt text is, to them, a blank rectangle where your best asset is.', exercise: 'Add alt text to every image in your launch. Read the alt text alone. Does it still make the argument?' },
  { n: 14, title: 'Privacy-safe research', blurb: 'You can learn a lot from public artifacts without touching personal data. Reading a community is not the same as scraping it.', exercise: 'Do your broadcaster research using only things people published deliberately. Count how much you still learned.' },
  { n: 15, title: 'Building public case studies', blurb: 'A case study is useful when it is labelled. An unlabelled anecdote becomes a statistic within two conversations, and then it becomes a lie nobody intended.', exercise: 'Write your last attempt as a case study with an evidence label attached to every number. Include the numbers that make you look bad.' },
];

export function academyPage(): string {
  return `
<h1>The free academy</h1>
<p class="lede">Fifteen modules. No signup, no certificate to purchase, no upsell at the end. Each module is a short argument and one exercise you can actually do this week. Classroom and nonprofit use is explicitly permitted under CC BY 4.0 — attribution only.</p>

<div class="notice"><strong>On certificates.</strong> There is a <code>certificates-transparent/</code> folder in the repository, and it is deliberately unimpressive: it records that you completed the exercises, what you wrote, and that nobody verified any of it. A transparent certificate is worth roughly what an untransparent one is worth, minus the lie.</p></div>

${ACADEMY_MODULES.map((m) => `
<details>
<summary>${m.n}. ${esc(m.title)}</summary>
<p style="margin-top:12px">${esc(m.blurb)}</p>
<p class="small"><strong>Exercise:</strong> ${esc(m.exercise)}</p>
<p class="tiny muted" style="margin:0">Run <code>viral-engine analyze ./yourfile --offline</code> before and after the exercise and compare the two AQI totals. A change you cannot see in the score is a change in your own confidence, which is worth knowing about.</p>
</details>`).join('\n')}

<h2>How to use this in a classroom</h2>
<div class="panel tight">
<ul class="small" style="margin:0">
<li><strong>License:</strong> CC BY 4.0. Use it, remix it, translate it, sell a course around it. Attribution is the only requirement, and we will not enforce it aggressively.</li>
<li><strong>Offline:</strong> the whole tool runs with <code>--offline</code> and the modules are static text, so a classroom with unreliable internet is a supported environment, not a degraded one.</li>
<li><strong>Assessment:</strong> the exercises are self-assessed, on purpose. The tool will tell a student their work has a weak category. A teacher has to tell them what to do about it.</li>
<li><strong>Student mode:</strong> <code>viral-engine analyze ./project --audience student</code> tunes the assets away from startup register. Nobody needs another "revolutionary" student project.</li>
</ul>
</div>

<h2>Downloadable workbooks</h2>
<p class="small">Every template in <code>templates/</code> is plain Markdown and prints on one page: positioning, share-structure canvas, launch checklist, failure conditions, broadcaster brief, experiment plan, postmortem. <a href="https://github.com/mananmodi1487/viral-engine/tree/main/templates">Browse the templates →</a></p>
`;
}

/* ---------------- Evidence ---------------- */

export function evidencePage(): string {
  return `
<h1>Evidence Commons</h1>
<p class="lede">A public, labelled record of what worked and what did not. It is only useful if people submit the failures, so the repository gives failures their own directory, their own museum, and equal prominence.</p>

<div class="notice bad">
  <strong>There is no aggregate here yet, and that is deliberate.</strong> This page will not show you "average lift" or "success rate by category" until there are enough labelled records to make such a number honest. Publishing an average of eleven self-reported anecdotes would be the exact failure this project exists to criticise.
</div>

<h2>Labels</h2>
<div class="panel tight">
<table>
<thead><tr><th>Label</th><th>Means</th></tr></thead>
<tbody>
<tr><td><code>reproducible</code></td><td>The method and inputs are published; anyone can rerun it.</td></tr>
<tr><td><code>verified</code></td><td>Every number carries a source a reader can check.</td></tr>
<tr><td><code>self-reported</code></td><td>The author says so. Nothing has been independently checked.</td></tr>
<tr><td><code>anecdotal</code></td><td>n = 1, honestly labelled. A hypothesis generator, not evidence.</td></tr>
<tr><td><code>contested</code></td><td>Someone disputes it, with reasons attached. Read both or cite neither.</td></tr>
<tr><td><code>unclear</code></td><td>Provenance is lost. Do not aggregate.</td></tr>
<tr><td><code>private-redacted</code></td><td>True, but the specifics are withheld to protect someone. Cite the label, never the number.</td></tr>
</tbody>
</table>
</div>

<h2>What every record must say</h2>
<div class="panel tight">
<ul class="small" style="margin:0">
<li><strong>What cannot be concluded from it.</strong> This field is mandatory. "One case is one case" belongs in every record, not in a footnote.</li>
<li><strong>The numbers, with sources, or an explicit self-reported label.</strong></li>
<li><strong>What the author would change.</strong> A record with no lesson is a boast or a wound.</li>
<li><strong>Consent to be named.</strong> Default is no.</li>
</ul>
</div>

<h2>Folders</h2>
<div class="panel tight">
<pre>evidence/
├── wins/                  what worked, labelled
├── failures/              what did not, labelled
├── postmortems/           the reconstruction, with its own uncertainty
├── benchmarks/            the evaluation harness and its results
├── datasets/              public inputs, no personal data
├── case-studies/          longer, structured accounts
├── failed-launches/       submissions to the museum
├── broadcaster-patterns/  who actually forwards what
├── hook-patterns/         hook shapes that worked, and their failure conditions
├── category-shifts/       before/after category changes
└── ethics-incidents/      times this field got it wrong, including us</pre>
</div>

<h2>Submit one</h2>
<pre>npx viral-engine submit-outcome     # prints the schema, then open a PR</pre>
<p class="small">Rules: a number without a source is labelled <code>self-reported</code>, and that is fine. It is not fine to omit the label. Never submit someone else's outcome without their consent. Failures are more valuable than wins and are never hidden from the index.</p>

<h2>Why failures get their own museum</h2>
<p>Every growth case study collection is a survivorship-biased archive. The failures are the ones that teach, because they are the ones where the mechanism was visible and the outcome was not what was promised. <a href="/museum">The Failed Launch Museum →</a></p>
`;
}

/* ---------------- Museum ---------------- */

export function museumPage(): string {
  return `
<h1>The Failed Launch Museum</h1>
<p class="lede">Honest losses, with no blame and no hindsight heroism. Each exhibit is a pattern, a mechanism, and the one thing that would have been testable beforehand.</p>

<div class="notice warn">
<strong>These are composites, and they are labelled as such.</strong> Every exhibit below is assembled from recurring postmortem shapes rather than a specific person's launch. Naming a real failed launch without permission would be a cruel thing to do to someone for the sake of a teaching example, and the lesson does not require it. Real, consented submissions live in <code>evidence/failed-launches/</code>.
</div>

${[
  {
    title: 'The launch with no broadcaster',
    pattern: 'Posted on four platforms in one morning. Got 30 likes across all of them and zero forwards.',
    mechanism: 'There was no single broadcast to be large. Four small posts is not one big one; the diffusion data says popularity tracks the maximum, not the sum.',
    testable: 'Before launch: name one person who would pass it on. If you cannot, the plan has no maximum to optimise.',
    lesson: 'Broadcasting to everyone is indistinguishable, in outcome, from broadcasting to no one.',
  },
  {
    title: 'The category nobody could name',
    pattern: 'Every reader said "cool" and nobody said what it was. Three people compared it to a product it was not.',
    mechanism: 'The reader had to invent a category, and invented the most available one. The most available one was the crowded one, and the comparison was unfavourable.',
    testable: 'Before launch: five-person read-back. If two describe it as a different category, the category is not landing.',
    lesson: 'A reader will always find a category for you. It will not be the one you wanted.',
  },
  {
    title: 'Engagement without adoption',
    pattern: 'The thread did well. Signups spiked. Nobody came back.',
    mechanism: 'The frame was strong and the product was not there yet. Launch traffic measures the frame; returns measure the product.',
    testable: 'Before launch: one week of returns from ten hand-recruited users. That number is worth more than a launch spike.',
    lesson: 'A launch can succeed at the only thing it measures and fail at the thing you wanted.',
  },
  {
    title: 'The forward with no words',
    pattern: 'People said they liked it. Nobody shared it. Two said they "did not know how to describe it".',
    mechanism: 'The artifact was linkable but not describable. Forwarding required composing a sentence, which is unpaid labour with social risk attached.',
    testable: 'Before launch: ask someone to describe it in one line. If they cannot, you have no forwardable unit.',
    lesson: 'Most people do not decline to share. They decline to write.',
  },
  {
    title: 'The number that ended the launch',
    pattern: 'A specific, impressive statistic in the first line. A reply asked for the source. There was no source. The correction thread travelled further than the launch thread.',
    mechanism: 'One unbacked figure converts a launch into a correction, and the correction is what gets screenshotted.',
    testable: 'Before launch: the honesty audit. It would have flagged the shape in under a second, for free, offline.',
    lesson: 'The correction is always more shareable than the claim, because it has a villain.',
  },
  {
    title: 'The wrong room, honestly identified',
    pattern: 'A good launch in a community that was not the audience. Polite interest, no adoption.',
    mechanism: 'Community fit is invisible from the inside. The artifact was fine; the room was not.',
    testable: 'Before launch: check whether a comparable post was accepted, and whether every accepted post came from a long-standing member.',
    lesson: 'This looks identical to "bad product" for about three weeks, which is why it gets misdiagnosed so often.',
  },
].map((e) => `
<div class="panel">
<h3 style="margin-top:0">${esc(e.title)}</h3>
<p class="small"><span class="pill">composite</span> <span class="pill">anecdotal</span></p>
<p><strong>What happened:</strong> ${esc(e.pattern)}</p>
<p><strong>Mechanism:</strong> ${esc(e.mechanism)}</p>
<p><strong>What was testable beforehand:</strong> ${esc(e.testable)}</p>
<p style="margin:0"><strong>Lesson:</strong> ${esc(e.lesson)}</p>
</div>`).join('\n')}

<h2>What the museum cannot tell you</h2>
<ul>
<li><strong>Base rates.</strong> These exhibits are selected for teaching, so they over-represent interesting failures. Most failed launches fail for the boring reason that nobody was ever going to care.</li>
<li><strong>Whether the counterfactual would have worked.</strong> There is no counterfactual launch. Every "what we should have done" is a reconstruction by someone who already knows the result.</li>
<li><strong>Anything about your launch.</strong> Patterns transfer poorly across audiences, platforms and years.</li>
</ul>
<p><a href="/evidence">Submit a real one, with a label →</a></p>
`;
}

/* ---------------- API docs ---------------- */

export function apiPage(): string {
  return `
<h1>API</h1>
<p class="lede">Free, no key, no account, no credit card, no phone number. Rate-limited for abuse prevention only — never for monetisation. Runs locally with <code>viral-engine serve</code> or any static host for the docs.</p>

<div class="notice"><strong>There is no paid tier, so there is no paid tier to compare this to.</strong> The rate limit exists because a public endpoint without one becomes a scraping target. It is generous: 60 requests per minute per IP, no daily cap. If you need more, run it locally — the local server has no limit at all, because it is yours.</div>

<h2>Endpoints</h2>
<div class="panel tight">
<table>
<thead><tr><th>Method</th><th>Path</th><th>What it does</th></tr></thead>
<tbody>
${[
  ['POST', '/api/analyze', 'Full ODS document for a target or text'],
  ['POST', '/api/score', 'AQI only, 0–1000'],
  ['POST', '/api/category', 'Category map and repositioning'],
  ['POST', '/api/broadcaster', 'Broadcaster brief, consent-aware'],
  ['POST', '/api/friction', 'Share friction analysis'],
  ['POST', '/api/assets', 'Launch assets for chosen channels'],
  ['POST', '/api/experiment', 'Pre-launch tests and kill criteria'],
  ['POST', '/api/simulate', 'Simulated critics'],
  ['POST', '/api/honesty-audit', 'Unbacked claims and rewrites'],
  ['POST', '/api/report', 'Rendered report: markdown | html'],
  ['POST', '/api/outcomes', 'Validate an Evidence Commons submission'],
  ['POST', '/api/share', 'Card SVG, alt text, badge, thread, and the one-line forward'],
  ['POST', '/api/mode', 'roast · therapist · kill-my-darling · explain'],
  ['GET', '/api/types', 'All 33 artifact types and what each must contain'],
  ['GET', '/api/calibration', 'Does the score relate to outcomes? Includes the answer "not enough data"'],
  ['GET', '/api/stress-test', 'The 100k-star stress test. Speculative, and says so in the payload'],
  ['GET', '/api/evidence', 'Index of published evidence records'],
  ['GET', '/api/protocol/schema', 'The ODS JSON Schema'],
  ['GET', '/api/protocol/weights', 'The AQI weights file'],
  ['GET', '/api/health', 'Liveness and version, no data'],
].map(([m, p, d]) => `<tr><td><code>${m}</code></td><td><code>${p}</code></td><td class="small">${esc(d)}</td></tr>`).join('\n')}
</tbody>
</table>
</div>

<h2>Request body</h2>
<pre>{
  "target": "owner/repo",        // or a URL, or a local path — optional if text is set
  "text": "pasted copy…",        // optional if target is set
  "audience": "developer",       // optional, improves audience specificity
  "channel": "hackernews",       // optional, narrows the generated assets
  "language": "en",              // BCP-47
  "offline": true,               // true = zero network calls. Default true.
  "saturationCount": 1200,       // optional, if you measured it yourself
  "artifactType": "changelog"    // optional; see /api/types. A wrong type applies the wrong rubric
}</pre>

<h2>Example</h2>
<pre>curl -s https://viralenginecommons.org/api/score \\
  -H 'content-type: application/json' \\
  -d '{"text":"A productivity app for busy professionals. 10,000+ users love it."}'

{"total":412,"max":1000,"band":"Fragile","aqi_version":"2.0.0",
 "do_not_launch_yet":true,
 "disclaimer":"The AQI is a weighted rubric for attempt quality…",
 "dimensions":[{"key":"category_clarity","score":18,"points":14,"weight":85,"basis":"structural","confidence":"medium"}, …]}</pre>

<h2>What the API refuses</h2>
<div class="panel tight">
<table>
<thead><tr><th>Request</th><th>Response</th></tr></thead>
<tbody>
<tr><td>Mass outreach, scraping contact data, astroturfing, harassment</td><td><code>403</code> with a refusal code and an alternative that works</td></tr>
<tr><td>Over 100KB of text in one call</td><td><code>413</code> — split it or run locally, where the limit is your RAM</td></tr>
<tr><td>Anything requiring a phone number or card</td><td>There is no such flow. Nothing here has ever asked for one.</td></tr>
</tbody>
</table>
</div>

<h2>Local deployment</h2>
<pre>git clone https://github.com/mananmodi1487/viral-engine
cd viral-engine &amp;&amp; npm ci
npm run serve            # http://localhost:4173, no rate limit, no egress</pre>
<p class="small">The local server sets no cookies, sends no analytics, makes no outbound request when <code>offline</code> is true (which it is by default), and logs nothing to disk. Point your own reverse proxy at it if you want a public instance — it is MIT licensed and there is nothing to license.</p>

<h2>Schema and SDK</h2>
<pre>curl -s /api/protocol/schema > ods.schema.json</pre>
<p class="small">TypeScript types: <code>npm i @viral-engine/protocol</code>. Python: <code>pip install viral-engine-commons</code>. Both read <code>protocol/aqi-weights.json</code>, so neither can quietly disagree with the reference implementation about a weight.</p>
`;
}

/* ---------------- Local mode ---------------- */

export function localPage(): string {
  return `
<h1>Local mode</h1>
<p class="lede">The system runs with no network, no API key, no account, and no model at all. That is not a fallback for a degraded experience — it is the default, and providers only add prose on top of signals computed locally.</p>

<div class="notice"><strong>The honest claim:</strong> every score, every agent, every asset, and every report works offline. What you lose is one number: the category saturation count, which becomes <code>unknown</code> rather than a guess. That trade is the whole point.</div>

<h2>Three ways to be private</h2>
<div class="panel tight">
<h3 style="margin-top:0">1. Offline flag</h3>
<pre>viral-engine analyze ./README.md --offline</pre>
<p class="small">Makes zero network calls. The report's <code>generator.network_calls</code> field will say <code>0</code>, and that field is not a claim — it is a counter.</p>

<h3>2. Persistent local mode</h3>
<pre>viral-engine local-mode on</pre>
<p class="small">Writes a config file at <code>~/.config/viral-engine/config.json</code> that forces offline behaviour for every future command. Turn it off with <code>local-mode off</code>. Nothing else reads that file.</p>

<h3>3. Your own model</h3>
<pre>ollama serve &amp;              # if you want prose on top of the scores
viral-engine analyze ./README.md --provider ollama --model llama3.1</pre>
<p class="small" style="margin:0">Ollama, llama.cpp, and LM Studio are supported. A local model can write prose. It cannot write a score, a broadcaster identity, or a failure condition — those are computed and validated locally, then a model is allowed to explain them.</p>
</div>

<h2>What "no telemetry" actually means here</h2>
<div class="panel tight">
<table>
<thead><tr><th>Question</th><th>Answer</th></tr></thead>
<tbody>
<tr><td>Does it send analytics?</td><td>There is no analytics code in the repository. Not disabled — absent. You can grep for it.</td></tr>
<tr><td>Does it phone home for updates?</td><td>No. <code>npm install -g viral-engine@latest</code> is how you update, and only you run it.</td></tr>
<tr><td>Does it log my document?</td><td>No file is written anywhere unless you pass <code>-o</code>.</td></tr>
<tr><td>Does it store my API key?</td><td>It reads the environment variable and passes it to the provider. It never writes it anywhere.</td></tr>
<tr><td>What about the hosted API?</td><td>It processes your request in memory and logs nothing to disk. Run it yourself and you can verify that, because the code is 40 lines of routing.</td></tr>
<tr><td>What if a check is missing?</td><td><a href="/privacy">The privacy dashboard</a> lists exactly what each mode sends, and the network counter in every report is auditable.</td></tr>
</tbody>
</table>
</div>

<h2>Old devices and low bandwidth</h2>
<div class="grid g2">
  <div class="panel tight">
    <h3 style="margin-top:0">The web app</h3>
    <ul class="small" style="margin:0">
      <li>No framework. The whole client is under 20KB of hand-written JavaScript.</li>
      <li>System fonts. No webfont download.</li>
      <li>No external requests at all. Not even a favicon from a CDN.</li>
      <li>Server-rendered. JavaScript is an enhancement, not a requirement.</li>
      <li>Works as a PWA with an offline cache after the first visit.</li>
    </ul>
  </div>
  <div class="panel tight">
    <h3 style="margin-top:0">The CLI</h3>
    <ul class="small" style="margin:0">
      <li>One runtime dependency (<code>zod</code>), ~600KB installed.</li>
      <li>Runs on Node 20+ and nothing else. No Python, no compiler, no Docker.</li>
      <li>PDF and DOCX readers are ~200 lines, not 20MB of wasm.</li>
      <li>Cold start under 300ms.</li>
    </ul>
  </div>
</div>

<h2>Offline Launch Pack</h2>
<p>For people with no reliable connection: generate every asset as a single archive, then work offline and publish later.</p>
<pre>viral-engine report ./README.md --offline --output html -o report.html
viral-engine assets ./README.md --offline --output markdown -o launch-kit.md
viral-engine analyze ./README.md --offline --output svg -o assets/</pre>
<p class="small">That gives you a self-contained HTML report (no external assets), a Markdown launch kit, and forwardable SVGs with their alt text in sibling <code>.alt.txt</code> files. Everything opens without a network.</p>
`;
}

/* ---------------- Privacy dashboard ---------------- */

export function privacyPage(): string {
  return `
<h1>Privacy dashboard</h1>
<p class="lede">Not a policy page. A description of the code, so you can check it.</p>

<h2>What each mode sends</h2>
<div class="panel tight">
<table>
<thead><tr><th>Mode</th><th>Network calls</th><th>What leaves the machine</th><th>What is stored</th></tr></thead>
<tbody>
<tr><td><code>--offline</code> (default in the web app)</td><td class="num">0</td><td>Nothing</td><td>Nothing</td></tr>
<tr><td><code>local-mode on</code></td><td class="num">0</td><td>Nothing, ever, until you turn it off</td><td>One config file</td></tr>
<tr><td><code>--provider ollama</code></td><td>Local socket only</td><td>Nothing off-machine</td><td>Nothing (the model server has its own logs)</td></tr>
<tr><td>Online, analysing a URL</td><td class="num">1</td><td>A GET request to the URL you asked for</td><td>Nothing</td></tr>
<tr><td>Online, analysing a repo</td><td class="num">2</td><td>Two GETs to api.github.com</td><td>Nothing</td></tr>
<tr><td><code>--provider anthropic</code></td><td class="num">1+</td><td>Your document text, to Anthropic</td><td>The provider's logs, not ours</td></tr>
</tbody>
</table>
<p class="small" style="margin:10px 0 0">Every report states its own number in <code>generator.network_calls</code>. It is a counter incremented by the code that makes the call, not an estimate.</p>
</div>

<h2>The privacy sentinel</h2>
<p>Every run includes a privacy pass that will:</p>
<ul>
<li>report the network call count for this exact run;</li>
<li>warn if the input appears to contain a credential — and explicitly <em>not</em> redact it, because silent redaction changes the meaning of a quote;</li>
<li>warn if the input contains an email address, before you share the report;</li>
<li>warn if a hosted provider was selected, and name the alternative;</li>
<li>state plainly that it cannot prove the absence of tracking in your artifact — only its own behaviour.</li>
</ul>

<h2>What we do not do</h2>
<div class="panel tight">
<table>
<thead><tr><th>Practice</th><th>Status</th></tr></thead>
<tbody>
<tr><td>Telemetry, analytics, or usage statistics</td><td><span class="pill ok">none — the code does not exist</span></td></tr>
<tr><td>Cookies</td><td><span class="pill ok">none</span></td></tr>
<tr><td>Accounts, email capture, or a waitlist</td><td><span class="pill ok">none</span></td></tr>
<tr><td>Selling or sharing data</td><td><span class="pill ok">no data to sell</span></td></tr>
<tr><td>Scraping personal data</td><td><span class="pill ok">refused at the type level</span></td></tr>
<tr><td>Third-party scripts on this site</td><td><span class="pill ok">none; the page has one inline script</span></td></tr>
<tr><td>Ads, affiliate links, sponsored rankings</td><td><span class="pill ok">none, and prohibited by governance</span></td></tr>
</tbody>
</table>
</div>

<h2>Your access to your own data</h2>
<p class="small">Your data is on your machine, in files you named. There is no account to delete and no export to request. If you used the hosted API, there is nothing retained to ask us about, and that is verifiable by reading the server code.</p>

<h2>If this becomes untrue</h2>
<p>Any change to the above is a change requiring a major version and a public RFC. The governance document includes an anti-capture clause: no owner, sponsor, or funding source may introduce telemetry, a paywall, or a data sale into the core, and a fork is explicitly supported as the remedy. <a href="https://github.com/mananmodi1487/viral-engine/blob/main/governance/privacy.md">governance/privacy.md →</a></p>
`;
}

/* ---------------- Accessibility ---------------- */

export function accessibilityPage(): string {
  return `
<h1>Accessibility settings</h1>
<p class="lede">These settings are stored in your browser's local storage and nowhere else. They are applied before the page paints, so there is no flash of the wrong theme.</p>

<form id="prefs" class="panel">
  <div class="grid g2">
    <div>
      <label for="theme">Theme</label>
      <select id="theme" name="theme">
        <option value="">Follow my system</option>
        <option value="light">Always light</option>
        <option value="dark">Always dark</option>
      </select>
    </div>
    <div>
      <label for="contrast">Contrast</label>
      <select id="contrast" name="contrast">
        <option value="">Default</option>
        <option value="high">High contrast</option>
      </select>
    </div>
    <div>
      <label for="scale">Text size</label>
      <select id="scale" name="scale">
        <option value="">Default</option>
        <option value="large">Large (118%)</option>
        <option value="xlarge">Extra large (134%)</option>
      </select>
    </div>
    <div>
      <label for="motion">Motion</label>
      <select id="motion" name="motion">
        <option value="">Default</option>
        <option value="reduced">Reduce motion</option>
      </select>
    </div>
  </div>
  <div class="row" style="margin-top:18px">
    <button type="submit">Apply</button>
    <button type="button" class="btn ghost" id="reset">Reset to system defaults</button>
    <span class="small muted" id="saved" role="status" aria-live="polite"></span>
  </div>
</form>

<h2>What was built for whom</h2>
<div class="panel tight">
<table>
<thead><tr><th>Need</th><th>What the product does</th></tr></thead>
<tbody>
<tr><td>Screen reader</td><td>Semantic landmarks, a skip link, real headings, real tables with header cells, <code>aria-live</code> on results, and alt text on every generated image.</td></tr>
<tr><td>Keyboard only</td><td>Every control is a native element. No custom widgets, no keyboard traps, visible focus rings at 3px.</td></tr>
<tr><td>Low vision</td><td>Text scales to 134% without layout breakage, high-contrast theme available, no text in images for anything that matters.</td></tr>
<tr><td>Motion sensitivity</td><td>Animations are minimal by default and can be disabled; <code>prefers-reduced-motion</code> is honoured automatically.</td></tr>
<tr><td>Low bandwidth</td><td>System fonts, no external requests, under 20KB of JavaScript, server-rendered HTML, offline PWA.</td></tr>
<tr><td>Dyslexia</td><td>Short sentences, left-aligned text, no justified blocks, generous line height, plain-language rewrite suggestions from the accessibility guardian.</td></tr>
<tr><td>Cognitive load</td><td>One decision per screen. The report leads with the single weakest dimension, not 25 numbers.</td></tr>
<tr><td>Non-native speakers</td><td>Jargon density is scored and flagged; every acronym gets a definition; a plain-language rewrite is generated for the longest sentence.</td></tr>
</tbody>
</table>
</div>

<h2>What this page cannot claim</h2>
<div class="notice warn">
<p style="margin:0 0 10px"><strong>The honest position.</strong> A text heuristic is not an accessibility audit. Specifically:</p>
<ul class="small" style="margin:0">
<li>No real screen reader (NVDA, VoiceOver, Orca) was used during development of this page.</li>
<li>Colour contrast was chosen by eye against WCAG AA targets, not measured with a tool.</li>
<li>No disabled person reviewed this interface before launch.</li>
<li>Non-English readability formulas were not applied; Flesch-Kincaid numbers are invalid outside English.</li>
<li>Cognitive accessibility below a grade-8 reading level was not assessed.</li>
</ul>
<p class="small" style="margin:10px 0 0">These gaps are listed because a product that claims full accessibility without disabled reviewers is doing the thing it criticises. If you hit a barrier, <a href="https://github.com/mananmodi1487/viral-engine/issues">open an issue</a> and it is a bug, not a feature request.</p>
</div>

<h2>Report an accessibility problem</h2>
<p class="small">Open an issue with the label <code>accessibility</code>. Issues in that label are the only ones the project commits to a response time on, because a blocked user cannot wait for a maintainer's motivation.</p>
`;
}

export const PREFS_SCRIPT = `
(function(){
  var form=document.getElementById('prefs');
  var saved=document.getElementById('saved');
  var keys=['theme','contrast','scale','motion'];
  var prefs={};
  try{prefs=JSON.parse(localStorage.getItem('vec.prefs')||'{}')}catch(e){}
  keys.forEach(function(k){if(prefs[k]&&form[k])form[k].value=prefs[k]});
  function apply(p){
    var d=document.documentElement;
    d.dataset.contrast=p.contrast||'';d.dataset.scale=p.scale||'';d.dataset.motion=p.motion||'';
    d.style.colorScheme=p.theme||'';
    localStorage.setItem('vec.prefs',JSON.stringify(p));
    saved.textContent='Saved in this browser only.';
  }
  form.addEventListener('submit',function(e){
    e.preventDefault();
    var p={};keys.forEach(function(k){p[k]=form[k].value});
    apply(p);
  });
  document.getElementById('reset').addEventListener('click',function(){
    try{localStorage.removeItem('vec.prefs')}catch(e){}
    var d=document.documentElement;
    d.dataset.contrast='';d.dataset.scale='';d.dataset.motion='';d.style.colorScheme='';
    keys.forEach(function(k){form[k].value=''});
    saved.textContent='Reset to system defaults.';
  });
})();
`;
