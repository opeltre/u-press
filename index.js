// ./SERVER.js

const STATIC = ['surf','media','audio'];

const jam = require('jam')
const view = require('./view.js');

const fs = require('fs');
const rdb = require('rethinkdb');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

// some data
let docs = JSON.parse(fs.readFileSync("data/docs.json","utf-8"));
let users = JSON.parse(fs.readFileSync("data/users.json","utf-8"));
let text = fs.readFileSync("data/math.md","utf-8");

// open a connexion to rethinkdb
var cxn;
rdb.connect({host:'localhost', port:'28015'}, (e,c) => cxn = c);

// launch & configure the express server
var app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
STATIC.forEach((dir) => app.use('/'+dir, express.static(dir)))

//@root
app.get('/', (req, res) => res.redirect('read') )

//@read
app.get('/read', (req,res) => {
    res.end(view().read(text).render());
});
app.get('/read/md', (req,res) => {
    res.setHeader("Content-Type","text/plain");
    res.end(text);
});
app.post('/read', (req,res) => {
    [text] = req.body;
    res.redirect(req.url);
});

//@browse
app.get('/browse', (req,res) => {
    rdb.table("documents")
        .filter(req.query)
        .run(cxn, (e,c) => {
            if (e) throw e;
            c.toArray( (e,r) => {
                res.end(JSON.stringify(r,null,2));
            });
        });
});
//    res.end(view().browse(docs).render());

//@login
app.get('/login', (req, res) => {
    res.end(view('login').dom.serialize());
});
app.post('/login', (req, res) => {
    console.log(`==LOGIN== \n usr:${req.body.usr} \n pwd:${req.body.pwd}`)
    if ( users[req.body.usr]?1:0 && users[req.body.usr] == users[req.body.pwd] ) {
        res.redirect('/read')
    }
    else { res.redirect('/') }
});

//@rdb
app.get('/rdb/*', (req,res) => {
    res.setHeader("Content-Type","text/plain");
    rdb.table('documents')
        .pluck('title','chapters')
        .run(cxn, (e,c) => {
            c.toArray( (e,r) => {
                res.end(JSON.stringify(r,null,2));
            });
        });
});

//@404
app.use((req,res) => {
    res.setHeader('Content-Type','text/html');
    res.status(404).send("Tu t'es perdu!");
    res.end();
});
//

// listen on 80 as root
app.listen(8080);
