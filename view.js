// ./view.js
//  
//  : view = require('./view.js');
//  : html = view('read').render(text);
//  : html = view('nav').render(docs);

const PREFIX = "/srv/http/scriptorium/surf/";
const SURF = "/surf/";

function ModView(name) {
    var Views = { 
        read : View_read,
        nav : View_nav
    }
    return new ( Views[name] || View ) ();
}

// imports
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

    bind() {
        return this;
    }

    render(...data) {
        return this.bind(...data).dom.serialize();
    }

    style (s) {
        var sheet = this.doc.createElement('link');
        sheet.rel = "stylesheet";
        sheet.href = SURF + "style/" + s;
        this.doc.head.appendChild(sheet);
    }

    script (s, selector) {
        var node = this.doc.querySelector(selector || 'head')
        var script = this.doc.createElement('script');
        script.src = SURF + s;
        node.appendChild(script);
    }

    d3 (selector) {
        return d3.select(this.doc).select(selector);
    }

}

class View_read extends View {

    constructor () {
        super();
        this.script("lib/desk.js");
    }
    
    bind (text) {
        return this.read(text);
    }
    
    read (text) {
        this.d3('.browse').remove();
        this.d3('#page')
            .html(text);
        return this;
    }

}

class View_nav extends View {

    constructor () {
        super();
    }

    bind (doc) {
        this.d3('.read').remove();
        this.d3('#page')
            .append('pre').attr('class','data')
            .append('code')
                .html(JSON.stringify(doc, null, 2));
        this.script('lib/nav.js','#page');
        return this;
    }
    
}

module.exports = ModView;
