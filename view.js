// ./view.js

const PREFIX = "/srv/http/scriptorium/surf/";
const SURF = "/surf/";

// imports
const fs = require('fs');
const { JSDOM } = require('jsdom');
const d3 = require('d3');
const jam = require('jam');

// sync load resources 
const style = fs.readdirSync(PREFIX + "style");
const html = {
    index: fs.readFileSync(PREFIX + "index.html", "utf-8"),
    scriptor: fs.readFileSync(PREFIX + "scriptor.html", "utf-8"),
    login: fs.readFileSync(PREFIX + "login.html", "utf-8")
};

const Doc = {
    repr : (d) => `<h2><a href="${d.url}">${d.name}</a></h2>`
};
const Section = {
    repr : (d) => `<a href="${d.url}">${d.name}</a>`
};
    

// module.exports:
//  : view = require('./view.js');
//  : html = view('index').browse(docs).dom.serialize();

function ModView(name) {
    return new View(name);
}

class View {
    
    constructor (name) {
        this.dom = new JSDOM(name?html[name]:html['index']);
        this.doc = this.dom.window.document;
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
            .html(jam.parse(text));
        return this;
    }

    /* > now unnecessary ?
    login () {
        this.d3('body').html(html['login']);
    }

    flush (name) {
        this.d3('html').html(
            name ? html[name] : html['index']
        );
        return this;
    }
    */

};

module.exports = ModView;
