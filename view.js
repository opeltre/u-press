// ./view.js
//  
//  : view = require('./view.js');
//  : html = view('index').browse(docs).render();

const PREFIX = "/srv/http/scriptorium/surf/";
const SURF = "/surf/";

function ModView(name) {
    return new View(name);
}

// imports
const nav = require('./nav');
const jam = require('jam');

const fs = require('fs');
const { JSDOM } = require('jsdom');
const d3 = require('d3');

// sync load resources 
const style = fs.readdirSync(PREFIX + "style");
const deps = JSON.parse(fs.readFileSync(PREFIX + "deps.json")); 
const html = {
    index: fs.readFileSync(PREFIX + "index.html", "utf-8"),
    login: fs.readFileSync(PREFIX + "login.html", "utf-8")
};

class View {
    
    constructor (name) {
        this.dom = new JSDOM(html[name || 'index']);
        this.doc = this.dom.window.document;
        style.forEach( s => this.style(s));
        deps.forEach( dep => this.script(dep.src));
        return this;
    }

    render() {
        return this.dom.serialize();
    }

    style (s) {
        var sheet = this.doc.createElement('link');
        sheet.rel = "stylesheet";
        sheet.href = SURF + "style/" + s;
        this.doc.head.appendChild(sheet);
    }

    script (s) {
        var script = this.doc.createElement('script');
        script.src = SURF + "lib/" + s;
        this.doc.head.appendChild(script);
    }

    d3 (selector) {
        return d3.select(this.doc).select(selector);
    }

    read (text) {
        this.d3('.browse').remove();
        this.d3('#page')
            .html(jam.parse(text));
        return this;
    }

    browse (docs) {
        this.d3('.read').remove();
        this.d3('#page')
            .call(nav, docs);
        return this;
    }
    
};

module.exports = ModView;
