
const { DOMParser } = require("jsdom").JSDOM.prototype.window;
const parser = new DOMParser();
const html = `<x-turndown><p><table class="markdown-table"><thead><tr><th>Location</th><th>Scope</th></tr></thead><tbody><tr><td><code>&lt;workspace-root&gt;/.agents/skills/&lt;skill-folder&gt;/</code></td><td>Workspace-specific</td></tr><tr><td><code>~/.gemini/config/skills/&lt;skill-folder&gt;/</code></td><td>Global (all workspaces)</td></tr></tbody></table></p></x-turndown>`;
const doc = parser.parseFromString(html, "text/html");
console.log(doc.querySelector("x-turndown").innerHTML);

