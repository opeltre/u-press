// /surf/dom.js

const PREFIX = "/srv/http/scriptorium/surf/";
const SURF = "/surf/";

const fs = require('fs');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

const html = fs.readFileSync(PREFIX + "index.html","utf-8");

const deps = JSON.parse(fs.readFileSync(PREFIX + "deps.json","utf-8"));

const stylesheets = fs.readdirSync(PREFIX + "style");

var dom = new JSDOM(html);
var doc = dom.window.document;

deps.forEach( s => {
    var script = doc.createElement('script');
    script.src = SURF  + s.src;
    doc.head.appendChild(script);
});

stylesheets.forEach( s => {
    var sheet = doc.createElement('link');
    sheet.rel = "stylesheet";
    sheet.href = SURF + "style/" + s;
    doc.head.appendChild(sheet);
});

console.log(JSON.stringify(dom.serialize()));

exports.dom = dom;
