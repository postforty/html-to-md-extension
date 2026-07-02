
const fs = require("fs");
const { JSDOM } = require("jsdom");
const dom = new JSDOM();
global.window = dom.window;
global.document = dom.window.document;
global.Node = dom.window.Node;

const TurndownService = require("./turndown.js");
const turndownPluginGfm = require("./turndown-plugin-gfm.js");

const html = fs.readFileSync("test.html", "utf-8");

const turndownService = new TurndownService({ headingStyle: "atx" });
const gfm = turndownPluginGfm.gfm;
turndownService.use(gfm);

const markdownContent = turndownService.turndown(html);
console.log(markdownContent);

