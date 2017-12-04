// ./SERVER.js

const STATIC = ['surf','media'];

const express = require('express');
const path = require('path');
const rdb = require('rethinkdb');
const fs = require('fs');

const surf = require('./dom.js');

// connect to rethinkdb
var cxn;
rdb.connect({host:'localhost', port:'28015'}, (e,c) => cxn = c);
// launch the server 
var app = express();

//@/
app.get('/', (req, res) => {
    res.setHeader("Content-Type","text/html");
    res.end(surf.dom.serialize());
});

//@rdb
app.get('/rdb/*', (req,res) => {
    res.setHeader("Content-Type","text/plain");
    rdb.table('booklets')
        .pluck('title','chapters')
        .run(cxn, (e,c) => {
            c.toArray( (e,r) => {
                res.end(JSON.stringify(r,null,2));
            });
        });
});

//@STATIC
for ( i in STATIC ) {
    app.use('/' + STATIC[i], express.static(STATIC[i]));
}

//@404
app.use((req,res) => {
    res.setHeader('Content-Type','text/html');
    res.status(404).send("Tu t'es perdu!");
    res.end();
});
//

// listen on 80 as root
app.listen(8080);
