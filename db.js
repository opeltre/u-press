const rdb = require('rethinkdb');

/*
 * - APIs should allow for multiple arguments:
 * 
 * : get (...docs) {
 * :    docs.forEach(d => {...get it...}
 * : }
 *
 * - Two separate classes isn't so convenient...
 *   If Doc is to remain a separate class, it may not
 *   be indexed by url.
 *
 * - Just document server- & surfer-side API and clean
 *   according to needs
 *
 */

function logthen (x) {
    console.log(x);
    return x;
}

class Doc {
    
    // better be indexed by an immutable hash: mv!!

    constructor () {
        this.cxn = null;
        this.db = rdb.db('upress').table('doc');
        rdb.connect({host:'localhost', port:'28015'})
            .then(c => this.cxn = c);
    }    

    get (url) {
        return this.db.get(url)
            .run(this.cxn)
            .then(doc => doc.text);
    }

    post (url, text) {
        return this.db.get(url)
            .update({text:text})
            .run(this.cxn)
    }

    put (url) {
        return this.db
            .insert({
                url: url,
                text: 'write it...',
                fmt: 'jam'
            })
            .run(this.cxn);
    }

    del (urls) {
        return this.db.getAll(...urls).delete()
            .run(this.cxn);
    }

    mv (oldUrls, newUrls) {
        //DIIIRTY 
        return this.db.getAll(...oldUrls).run(this.cxn)
            .then(docs => docs.toArray())
            .then(docs => docs.map((doc,i) => {
                var d = Object.assign({}, doc);
                d.url = newUrls[i];
                return d;
            }))
            .then(newDocs => this.db.insert(newDocs).run(this.cxn))
            .then(() => this.db.getAll(...oldUrls).delete().run(this.cxn))
            .then(logthen);
    }           
}

class Nav { 

    // has control on Doc

    constructor (doc) {
        this.cxn = null;
        this.db = rdb.db('upress').table('nav');
        this.doc = doc || new Doc();
        rdb.connect({host:'localhost', port:'28015'})
            .then(c => this.cxn = c);
    }        
    
    init (url, name) { // data format
        return {
            url: url + name.replace(/[^\w\s]/g,'').replace(/\s/g,'-') + '/',
            name: name,
            parent: url,
            children: []
        };
    }
   
    // ---> User
    get (url, lvl) {
         return this.lvlGet(lvl || 0)(url).run(this.cxn);
    }

    put (url, name) {
        var doc = this.init(url, name);
        console.log(doc);
        return Promise.all([
            this.addChild(doc),
            this.doc.put(doc.url)
        ]);
    }

    del (url) {
        return this.db.get(url).run(this.cxn)
            .then(doc => this.unlinkChild(doc))
            .then(doc => this.dive([doc]))
            .then(docs => Promise.all([
                this.deleteDocs(docs),
                this.doc.del(docs.map(d => d.url)),
            ]));
    }
    
    mv (url, newParent, n) {
        return this.db.get(url).run(this.cxn)
            .then(doc => this.dive([doc]))
            .then(docs => this.move(docs, newParent))
            .then(newDoc => this.indexOf(newDoc))
            .then(k => this.order(newParent, k, n)); 
    }

    // ---> User
    
    // <--- Dirty internals
    runCheck (promise, val) {
        return promise
            .then(res => {
                console.log(res);
                if (res.errors == 0) 
                    return Promise.resolve(val);
                else 
                    throw new Error(res.errors);
            })
            .then(() => val);
    }

    indexOf (doc) {
        return this.db.get(doc.parent)('children')
            .run(this.cxn)
            .then(children => children.indexOf(doc.url));
    }

    order (url, k, n) {
        console.log('hey')
        return this.db.get(url).run(this.cxn)
            .then(p => this.reordered(p.children, k, n))
            .then(logthen)
            .then(reordered => this.db.get(url)
                .update({children: reordered})
                .run(this.cxn)
            )
            .then(res => console.log(res));
    }

    reordered (a, k, n) {
        // place k-th element of a at index n.
        var n = n < a.length ? n : a.length - 1,
            m = Math.min(k,n),
            M = Math.max(k,n);
        return a.slice(0,m)
            .concat([a[M]])
            .concat(a.slice(m+1,M))
            .concat( m != M ? [a[m]] : [])
            .concat(a.slice(M+1,));
    }

    move (docs, newParent) {
        var oldParent = docs[0].parent;
        if (oldParent == newParent) return docs[0];
        return Promise.resolve(docs)
            .then(docs => this.movedDocs(docs, oldParent, newParent)) 
            .then(newDocs => this.runCheck(
                this.db.insert(newDocs).run(this.cxn),
                newDocs
            ))
            .then(newDocs => this.doc // diiirty class Doc
                .mv(docs.map(d => d.url), newDocs.map(d => d.url))
                .then(() => ({oldDoc: docs[0], newDoc: newDocs[0]}))
            )
            //could just be like `link && del`
            .then(d => Promise.resolve()
                .then(() => this.unlinkChild(d.oldDoc, oldParent))
                .then(() => this.linkChild(d.newDoc, newParent))
                .then(() => this.deleteDocs(docs))
                .then(() => d.newDoc)
            );
    }
    
    movedDocs (docs, oldParent, newParent) {
        return docs.map(doc => {
            var d = Object.assign({}, doc);
            d.url = d.url.replace(oldParent, newParent);
            d.parent = d.parent.replace(oldParent, newParent);
            d.children = d.children
                .map(url => url.replace(oldParent, newParent));
            return d;
        });
    }

    lvlGet (lvl) {
        return (lvl == 0)
	    ? url => this.db.get(url)
            : url => this.db.get(url).merge(d => ({
                    children: d('children').map(this.lvlGet(lvl-1)) 
                }));
    }

    addChild (doc) {
        return this.db.insert(doc)
            .run(this.cxn)
            .then(res => {
                if (res.inserted == 1) return doc;
                else throw new Error('! duplicate url !');
            })
            .then(doc => this.linkChild(doc));
    }

    linkChild (doc, prt) {
        return this.db.get(prt || doc.parent)
            .update({children: rdb.row('children').append(doc.url)})
            .run(this.cxn).then(() => doc);
    }

    unlinkChild (doc, prt) {
        return this.db.get(prt || doc.parent)
            .update(p => ({children: p('children').filter(x => x.ne(doc.url))}))
            .run(this.cxn).then(() => doc);
    }

    getChildren (doc) {
        return Promise.all(doc.children.map(
            url => this.db.get(url).run(this.cxn)
        ));
    }

    dive (docs) {
        // dive: [doc] --> [doc, child, subchild, ... ]
        if (!docs.length) return Promise.resolve([]);
        return Promise
            .all(docs.map(d => this.getChildren(d)))
            .then(cs => cs.reduce((a,b) => a.concat(b), []))            
            .then(children => this.dive(children))
            .then(children => docs.concat(children))
            .catch(err => console.log(err));
    }

    deleteDocs (docs) {
        return this.db
            .getAll(...docs.map(d => d.url))
            .delete()
            .run(this.cxn);
    }
        
}

var doc = new Doc();
exports.nav = new Nav(doc);
exports.doc = new Doc();

/*
const get = lvl => (lvl == 0)
    ? url => r.table('documents').get(url)
    : url => r.table('documents').get(url)
        .merge(d => ({
            children: d('children').map(get(lvl-1)) 
        }));

>>> get(2)('/').run(cxn)

*/
