(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.jam = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// ./jam/index.js

const jam = require('./jam');
const lex = require('./lexers');
const fs = require('fs');

function parse (text) {

    // * instantiate lexers *
    var lexA = lex.A()
    var lexB = lex.B()
    var lexC = lex.C()

    // * BLOCK GRAMMAR *
    text = text.split("\n");
    text.push("");
    lexA.read(text,'EOF');
    
    // * PARAGRAPH RECOGNITION *
    // >> do something for the blank lines...
    var viewA = lexA
        .view(
            false,
            s => s.lexeme.esc ? "<e>" : (s.lexeme.branch ? "<b>" : "<l>"),
            s => s.lexeme.esc ? "</e>" : (s.lexeme.branch ? "</b>" : "</l>")
        );  
    
    var inB = viewA
        .render();
    lexB.read(inB);

    var viewB = lexB.view();     

    // * MERGE && GET LEAVES  *  
    var inC = viewA
        .embed(viewB)
        .render();

    var leaves = lexC          // some class & methods could be defined here...
        .read(inC)
        .S
        .map( s => {            // ...remembering breaks
            var lines = lexA.content
                .slice(s.i[0], s.i[1])
                .map( line => line.split(/\s/) );
            return {
                i: s.i[0],
                esc: s.lexeme.esc,
                text: lines.reduce( (l1,l2) => l1.concat(l2)),
                breaks: lines.map( l => l.length )
            };
        })
        // * INLINE GRAMMAR  *
        .map( leaf => {         // lexing
            if (!leaf.esc) {
                leaf.text = lex.inline()
                    .read(leaf.text)
                    .view(true)
                    .render()
            } 
            return leaf;
        })
    leaves
        .forEach( leaf => {     // join, respecting breaks
            var t = leaf.text;
            leaf.text = [];
            leaf.breaks.forEach( br => {
                leaf.text.push(t.slice(0,br).join(" "));
                t = t.slice(br);
            });
        });

    var tokens = lexA
        .view()
        .embed(viewB)
        .render(); 

    leaves.forEach( leaf => { 
        leaf.text.forEach( (line, j) => {
            tokens[leaf.i + j] += line ;
        });
    });

    return tokens.join("\n").replace(/<\/*_>/g,'');
}

exports.parse = parse;

},{"./jam":2,"./lexers":3,"fs":4}],2:[function(require,module,exports){
// ./jam.js

/* V2:
 * Redefine Lexemes as factory functions:
 *  
 *  : var b = Lexeme('blank_line')
 *  :     .open(/^\s$/)   // configure...
 *  :     .close(/\S/)
 *  :     ();             // init lexeme!
 *
 * then Lexers can truly be reinstantiated on demand:
 * this is really necessary for stability.
 *
 * Separate each class in its own file.
 * 
 * jam/
 *  :--index.js
 *  :--core/
 *  :   :--lexeme.js
 *  :   :--lexer.js
 *  :   `--view.js
 *  `--lexers/
 *      :--paragraph.js
 *      :--leaves.js
 *      :--inline/
 *      :   :--md.js
 *      :   `--jam.js
 *      `--block/
 *          :--md.js
 *          `--jam.js
 */

//$ f && g
const ifdo = (f,g) => ( (...x) => {y=f(...x); if (y) g(y); return y;} );
const iffeed = (f,g) => ( (...x) => {y=f(...x); if (y) return g(y);} );

function splitMatch (m) {
    // RegExp.exec(String) --->  m  ---> [ match, stripped_input, $1, $2, ... ]
    if (m) return [m[0], m.input.replace(m[0],'')].concat(m.slice(1));
}

class Lexeme {
/*  : ## Jam   --->  ['## ','Jam']  --->  ['<h2>', 'Jam']
 *  : ming     --->  ['m','ing']    --->  ['</h2>', 'ming']
 */
    constructor (name, open, close, opt, val) {
        
        // read options:
        this.name = name;
        this.val = val;
        this.esc = /esc/.test(opt) ? true : false;
        this.lvl = /lvl/.test(opt) ? 0 : -1;
        this.stop = /stop/.test(opt) ? true : false;
        this.branch = /\bb\b/.test(opt) ? true : false;

        // recognition:
        this.oTest = s => splitMatch(open.exec(s));
        this.cTest = s => splitMatch(close.exec(s));
        // reaction:
        this.oDo = () => {};
        this.cDo = () => {};
        // representation:
        this.oRdr = ([a,b]) => [`<${this.name}>`, /!o/.test(opt) ? (a+b) : b]; 
        this.cRdr = ([a,b]) => [`</${this.name}>`, /!c/.test(opt) ? (a+b) : b];
        // strippers only:
        this.stripper = s => (this.oTest(s) || ['', s]);
    }
    
    // <--- Lexer
    open (s) {
        return iffeed(ifdo(this.oTest, this.oDo), this.oRdr)(s);
    }
    close (s) {
        return iffeed(ifdo(this.cTest, this.cDo), this.cRdr)(s);
    }
    static SOF () { 
        return new Lexeme('SOF',/>>SOF<</,/>>EOF<</,' b stop');
    }// ---> Lexer
    
    // <--- User
    test (o_c, reg) {
        // reg: Lexeme ---> RegExp
        if (o_c == 'open') this.oTest = s => splitMatch(reg(this).exec(s));
        if (o_c == 'close') this.cTest = s => splitMatch(reg(this).exec(s));
        return this;
    }
    on (o_c, dothen) {
        // dothen: Match  (a, b, ...c) --->  0
        if (o_c == 'open') this.oDo = a => dothen(...a);
        if (o_c == 'close') this.cDo = a => dothen(...a);
        return this;
    }
    render (o_c, rdr) {
        // dothen: Match (a, b, ...c) --->  [a',b'] = ["token", "content"]  
        if (o_c == 'open') this.oRdr = a => rdr(...a);
        if (o_c == 'close') this.cRdr = a => rdr(...a);
        return this;
    }
    strip (reg) {
        this.stripper = s => (splitMatch(reg(this).exec(s)) || ['', s]);
        return this;
    }// ---> User
}

class Lexer {
    
    constructor (lexemes, opt) {
              
        this.scheme = /o_c/.test(opt) ? "o_c" : "co_";
        this.lexemes = lexemes;
        this.escaping = false;
        this.u = [];                    //lexeme stack
        this.u_strip = [];              //stripper stack
        // >> OUTBOUND >> //
        this.content = [];              //stripped input
        this.S = [];                    //segments
    }

    // <--- User
    read (input, EOF) {
        this.flush();
        input.forEach( (v_j,j) => {
            if (this.scheme == "co_") {
                var v_js = this.strip(v_j);
                v_j = this.cLoop(v_js, j);
                if (!this.escaping) v_j = this.oLoop(v_j, j);
            } else if (this.scheme == "o_c") {
                if (!this.escaping) v_j = this.oLoop(v_j, j);
                var v_js = this.strip(v_j);
                v_j = this.cLoop(v_js, j);
            }
            this.content.push(v_j);
        });
        if (EOF) this.EOF(input);
        return this;
    }
    
    view (content, oRdr, cRdr) {
        return new View(this, content, oRdr, cRdr);
    }// ---> User

    strip (v_j) { 
        var v_js = [],
            len = this.u_strip.length;
        if ( len ) {
            this.u_strip.slice(0,len-1).forEach(u => {
                var strip = u.stripper(v_j);
                v_js.push(strip[0]);
                v_j = strip[1];
            });
        }
        v_js.push(v_j);
        return v_js;
    }

    cLoop (v_js, j) {
        var v_j = v_js.pop();
        do { 
            var u = this.u[this.u.length - 1],
                c = u.lexeme.close(v_j);
            if (c) {
                this.close(j,c);
                v_j = c[1];
                if (u.lexeme.lvl >= 0 && v_js.length) {
                    v_j = v_js.pop() + v_j;
                }
            } 
            else if (u.lexeme.lvl >= 0) {
                v_j = u.lexeme.stripper(v_j)[1]
            }
        } while (c && !u.lexeme.stop);
        return v_j;
    }

    oLoop (v_j, j) {
        this.lexemes.forEach( l => {
            if (!this.escaping) {
                var o = l.open(v_j);
                if (o) {
                    this.open(l,j,o);
                    v_j = o[1];
                }
            }
        });
        return v_j;
    }

    open (l, i, o) {
        let iS = this.S.length;
        if (l.esc) this.escaping = true;
        if (l.lvl >= 0) this.u_strip.push(l);
        this.u.push({lexeme:l, i:i, iS:iS, token:o[0]});
    }

    close (j, c) {
        let jS = this.S.length,
            u = this.u.pop();
        if (u.lexeme.esc) this.escaping = false;
        if (u.lexeme.lvl >= 0) this.u_strip.pop();
        this.S.push(this.segment(u,j,jS,c));
    }

    segment (u, j, jS, c) {
        return {lexeme:u.lexeme, i:[u.i,j], iS:[u.iS,jS], token:[u.token,c[0]]};
    }

    flush () {
        this.content = [];
        this.u = [{lexeme:Lexeme.SOF(), i:0, iS:0, token:''}];
        this.u_strip = [];
        this.S = [];
        return this;
    }

    EOF (input) {
        this.u.reverse()
            .forEach( u => this.S.push({
                lexeme: u.lexeme, 
                i:      [u.i, input.length -1 ], 
                iS:     [u.iS, this.S.length -1 ], 
                token:  [u.token, u.token.replace('<','</')]
        }));
    }

}

class View {

    constructor (lexer, content, oRdr, cRdr) {
        
        var line = l => ({open: [], close: [], content: (content ? l : '')}),
            oRdr = oRdr || ( s => s.token[0] ),
            cRdr = cRdr || ( s => s.token[1] );
        this.scheme = lexer.scheme;
        this.lines = lexer.content.map(line); 
        lexer.S.forEach( s => {
            this.lines[s.i[0]].open.unshift(oRdr(s));
            this.lines[s.i[1]].close.push(cRdr(s));
        });
    }

    embed (view) {
        view.lines.forEach( (t,i) => {
            this.lines[i].open  = this.lines[i].open.concat(t.open);
            this.lines[i].close = t.close.concat(this.lines[i].close);
        });
        return this;
    }

    render (sep) {
        var sep = sep || '';
        var rdr = this.scheme == "co_" 
            ? t => t.close.concat(t.open).join(sep) + t.content
            : t => t.open.join(sep) + t.content + t.close.join(sep);
        return this.lines.map(rdr);
    }
}

exports.tok = (...args) => new Lexeme(...args);
exports.lex = (...args) => new Lexer(...args);

/* If so desired, pass z as an additional argument to g:
 *
 * const ifdo = (f,g,z) => ( (...x) => {y=f(...x); if (y) g(y,z); return y;} );
 * const iffeed = (f,g,z) => ( (...x) => {y=f(...x); if (y) return g(y,z);} );
 */

},{}],3:[function(require,module,exports){
const jam = require('./jam');

/* * * * * * * * *        
 * BLOCK GRAMMAR *         
 * * * * * * * * */
/*
 * Each lexer should be in a separate file, 
 * inside a function body -> v2.
 *
 * Even better, markdown, tex, and custom functionality
 * should be made as independent as possible,
 * so as to provide a bare markdown parser to tweak at will.
 */

function lexBlock (lang) {
    
    var lang = lang || 'fr';

    var q = jam.tok('blockquote', /^> /, /^(?!> )/, "lvl b !c");

    var b = jam.tok('_', /^\s*$/, /^./, "!c");

    var ul = jam.tok('ul', /^\* /, /^(?!\* )/, "!o !c b ");
    ul
        .on('open', () => {
            ul.test('open', () => /^(?!.*)/);
        })
        .on('close', () => {
            ul.test('open', () => /^\* /);
        });

    var li = jam.tok('li', /^\* /, /^\* /, "lvl b !c");
    li
        .strip(() => /^(?:\s{4})/)
        .on('open', () => {
            ul.test('close', () => /^(?!.*)/);
            b.on('open', () => {
                li.test('close', () => /^(?!\s{4})/)
                    .render('close', (a,b) => ['</li>', a + b]);
            });
        })
        .on('close', () => {
            ul.test('close', () => /^(?!\* )/);
            b.on('open', () => {});
            li.test('close', () => /^\* /)
                .render('close', (a,b) => ['</li>', a + b]);
        });


    var h = jam.tok('h',/#+ /,/^(?! {2})/,"!c")
        .on('open', (a,b) => {h.val = a.length - 1;})
        .render('open', (a,b) => [`<h${h.val}>`, b])
        .render('close', (a,b) => [`</h${h.val}>`, a+b]);

    var c = jam.tok('code',/`{3,}/, /./, "esc stop", [/./])
        .on('open', a => { 
            c.val.push(new RegExp(a)); 
            c.test('close', self => c.val[self.val.length - 1]);
        })
        .on('close', () => c.val.pop() )
        .render('open',() => ["<pre><code>", ''])
        .render('close',() => ["</pre></code>",'']);

    var eq = jam.tok('eq', /^'{3}\s*/, /^'{3}/, "stop")
        .render('open', () => ['<script type="math/tex; mode=display">',''])
        .render('close', () => ['</script>','']);

    const idfy = c => c
        .replace(/\s$/,'')
        .replace(/\s/,'-')
        .toLowerCase();

    var def = jam.tok('def', /^,{3,}(\w*)\s*$/, /^,{3,}\s*/, "stop b")
        .render('open',(a,b,c) => [
            `<div class="def" id="def-${idfy(c)}">`, 
            "**Definition:**" + b
        ])
        .render('close', () => ["</div>",""]);

    var prop = jam.tok('prop', /^;{3,}(\w*)\s*$/, /^;{3,}\s*/, "stop b")
        .render('open',(a,b,c) => [
            `<div class="prop" id="prop-${idfy(c)}">`, 
            "**Proposition:**" + b
        ])
        .render('close', () => ["</div>",""]);

    var thm = jam.tok('thm', /^:{3,}(\w*)\s*$/, /^:{3,}\s*/, "stop b")
        .render('open',(a,b,c) => [
            `<div class="thm" id="thm-${idfy(c)}">`, 
            "**Theorem:** " + b
        ])
        .render('close', () => ["</div>",""]);

    return jam.lex([q, h, c, b, eq, ul, li, def, prop, thm]);
}

/* * * * * * * * * * * * *
 * PARAGRAPH RECOGNITION *
 * * * * * * * * * * * * */
/* see to blank lines, so as not wrap last <li>
 *
 * really assumes input is as viewA in index.js!
 * ideally link these two lexers in a more abstract way,
 * or at least group these two definitions...
 *
 *  : lex.A.view( s => {...}, ...)
 *  : lex.B.lexemes = [jam.tok(...)]
 */
function lexParagraph () {
 
    var p = jam.tok('p', /(?:<\/[leb]>$)|(?:<b>$)/, /./,"stop !o !c")
        .on('open',a => { 
            // prevent p wrapping of branches w/o blocks nor blank lines
            p.val = (a=="<b>") ? "<b>" : "coucou";
            p.test('close', p => new RegExp(
                p.val == "<b>" 
                    ? "(?:^<[leb]>)"
                    : "(?:^<[leb]>)|(?:^<\/[leb]>)" 
            ));
        });

    return jam.lex([p]);
}

/* * * * * * * * * * * * * * * *
 * MERGE TOKENS && FEED BLOCKS *  
 * * * * * * * * * * * * * * * */
function lexLeaf () {
    var inline = jam.tok('inline',/<\/?[lpb]>$/, /^<\/?[lpb]>/,'stop');
    var escaped = jam.tok('esc',/<e>$/, /^<\/e>/,'esc stop');
    return jam.lex([inline,escaped]);
}

/* * * * * * * * * *
 * INLINE GRAMMAR  *
 * * * * * * * * * */

function lexInline () {
    const punctuation = "([,;:\.\!\?]*)$";
    const endP = re => new RegExp(re.source.replace('$',punctuation));

    var em = jam.tok('em', /^\*(?!\*)/, endP(/\*(?!\*)$/), 'o_c' );
    var strong = jam.tok('strong', /^\*\*(?!\*)/, endP(/\*\*(?!\*)$/), 'o_c');
    var code = jam.tok('code', /^`/, endP(/`$/), 'o_c');

    var ieq = jam.tok('ieq', /^''/, endP(/''$/), 'o_c esc')
        .render('open', (a, b) => ['<script type="math/tex">', b])
        .render('close', (a, b, c) => ['</script>' + c, b])


    var inlines = [em, strong, code]
        .map( lexeme => lexeme
            .render('close', (a, b, c) => [`</${lexeme.name}>${c}`, b])
        )
        .concat([ieq])

    return jam.lex(inlines, "o_c");
}

exports.A = lexBlock;
exports.B = lexParagraph;
exports.C = lexLeaf;
exports.inline = lexInline;

},{"./jam":2}],4:[function(require,module,exports){

},{}]},{},[1])(1)
});