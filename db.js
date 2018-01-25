const rdb = require('rethinkdb');

class Doc {

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
}

class Nav { 

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
    get (url) {
         return this.lvlGet(2)(url).run(this.cxn);
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
    // ---> User
    
    // <--- Doc 
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

    linkChild (doc) {
        console.log(doc);
        console.log(this);
        return this.db.get(doc.parent)
            .update({children: rdb.row('children').append(doc.url)})
            .run(this.cxn).then(() => doc);
    }

    unlinkChild (doc) {
        return this.db.get(doc.parent)
            .update(p => ({children: p('children').filter(x => x.ne(doc.url))}))
            .run(this.cxn).then(() => doc);
    }

    getChildren (doc) {
        return Promise.all(doc.children.map(
            url => this.db.get(url).run(this.cxn)
        ));
    }

    dive (docs) {
        if (!docs.length) return Promise.resolve([]);
        return Promise
            .all(docs.map(d => this.getChildren(d)))
            .then(cs => cs.reduce((a,b) => a.concat(b), []))            
            .then(children => this.dive(children))
            .then(children => docs.concat(children));
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
