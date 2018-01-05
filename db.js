const rdb = require('rethinkdb');

var cxn;
rdb.connect({host:'localhost', port:'28015'})
    .then(c => cxn=c);

// promise | promise | promise
const pipe = (p1, p2) => p1.then(p2);
const pipeline = (...promises) => {
    return (...x) => promises.reduce(pipe, Promise.resolve(...x));
}

const Doc = { 
    
    init: (url, name) => { 
        
        return {
            name: name,
            url: url + name.replace(/[^\w\s]/g,'').replace(/\s/g,'-') + '/',
            parent: url,
            children: [],
            text: ''
        }
    },
    
    get : (url) => {

         return rdb.table('documents').get(url).merge(
             d=>({children: d('children').map(c => rdb.table('documents').get(c))})
         ).run(cxn)
    },

    put : (url, name) => {
        
        var doc = Doc.init(url, name);
        return Doc.addChild(doc)
            .then(Doc.linkChild)
    },

    del : (url) => {
        return rdb.table('documents').get(url)
            .run(cxn)
            .then(Doc.unlinkChild)
            .then(doc => Doc.dive([doc]))
            .then(Doc.deleteDocs)
    },

    write: (url, text) => {
        return rdb.table('documents').get(url)
            .update({text: text})
            .run(cxn);
    },
    // ---> User
    
    // <--- this
    addChild : (doc) => {
        
        return rdb.table('documents').insert(doc)
            .run(cxn)
            .then(res => {
                if (res.inserted == 1) return doc;
                else throw new Error('! duplicate url !');
            })
    },

    linkChild : (doc) => {
        
        return rdb.table('documents').get(doc.parent)
            .update({children: rdb.row('children').append(doc.url)})
            .run(cxn)
            .then(() => doc)
    },

    unlinkChild : (doc) => {

        return rdb.table('documents').get(doc.parent)
            .update(
                p => ({children: p('children').filter(x => x.ne(doc.url))})
            )
            .run(cxn)
            .then(() => doc)
    },

    getChildren : (doc) => {

        return Promise.all(
            doc.children.map(
                url => rdb.table('documents').get(url).run(cxn)
            )
        )
    },

    dive : (docs) => {
        if (docs.length) {
            return Promise.all(docs.map(Doc.getChildren))
                .then(cs => cs.reduce((a,b) => a.concat(b), []))            
                .then(children => {
                    console.log(JSON.stringify(children, null,2));
                    return Doc.dive(children);
                })
                .then(children => docs.concat(children))
        } else {
            return Promise.resolve([]);
        }
    },

    deleteDocs : (docs) => {
        
        return rdb.table('documents')
            .getAll(...docs.map(d => d.url))
            .delete()
            .run(cxn)
    }
        
}

const join = (...arrays) => arrays.reduce((x,y)=>x.concat(y), [])

exports.doc = Doc;
