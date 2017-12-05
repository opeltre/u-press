// ./view.js

const PREFIX = "/srv/http/scriptorium/surf/";
const SURF = "/surf/";

// imports
const fs = require('fs');
const { JSDOM } = require('jsdom');
const d3 = require('d3');
const marked = require('marked');

// sync load resources:
const deps = JSON.parse(fs.readFileSync(PREFIX + "deps.json","utf-8"));
const style = fs.readdirSync(PREFIX + "style");
const html = {
    index: fs.readFileSync(PREFIX + "index.html","utf-8"),
    scriptor: fs.readFileSync(PREFIX + "scriptor.html","utf-8")
};

const Doc = {
    repr : (d) => `<h2><a href="${d.url}">${d.name}</a></h2>`
};
const Section = {
    repr : (d) => `<a href="${d.url}">${d.name}</a>`
};
    

// module.exports:
class View {
    
    constructor () {
        this.html = html;
        this.dom = new JSDOM(html['index']);
        this.doc = this.dom.window.document;
        deps.forEach( s => {
            var script = this.doc.createElement('script');
            script.src = SURF + s.src;
            this.doc.head.appendChild(script);
        });
        style.forEach( s => {
            var sheet = this.doc.createElement('link');
            sheet.rel = "stylesheet";
            sheet.href = SURF + "style/" + s;
            this.doc.head.appendChild(sheet);
        });
        return this;
    }

    d3 (selector) {
        return d3.select(this.doc).select(selector);
    }

    browse (docs) {
        this.d3('#page')
            .selectAll('.doc')
            .data(docs)
            .enter().append('div')
                .attr('class','doc')
                .html((d) => Doc.repr(d))
                .selectAll('.section')
                .data((d) => d.sections)
                .enter().append('div')
                    .attr('class','section')
                    .html((d) => Section.repr(d));
        return this;
    }

    read (text) {
        this.d3('#page')
            .html(marked(text));
        return this;
    }

    flush () {
        this.d3('#page')
            .html('');
        return this;
    }

};

module.exports = new View();
