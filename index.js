// ./SERVER.js

const STATIC = ['surf','media'];

const fs = require('fs');
const rdb = require('rethinkdb');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

const view = require('./view.js');

// some data
let docs = JSON.parse(fs.readFileSync("docs.json","utf-8"));
let users = JSON.parse(fs.readFileSync("users.json","utf-8"));
let text = "# Hey\nI'm using Markdown!\n## Yay :)";

// open a connexion to rethinkdb
var cxn;
rdb.connect({host:'localhost', port:'28015'}, (e,c) => cxn = c);

// launch & configure the express server
var app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
STATIC.forEach((dir) => app.use('/'+dir, express.static(dir)))

//@/
app.get('/', (req, res) => {
    res.end(view('login').dom.serialize());
});

//@login
app.post('/login', (req, res) => {
    console.log(`==LOGIN== \n usr:${req.body.usr} \n pwd:${req.body.pwd}`)
    if ( users[req.body.usr]?1:0 && users[req.body.usr] == users[req.body.pwd] ) {
        res.redirect('/read')
    }
    else { res.redirect('/') }
});

//@read

app.get('/read', (req,res) => {
    res.end(view().read(text).dom.serialize());
});
app.get('/read/md', (req,res) => {
    res.setHeader("Content-Type","text/plain");
    res.end(text);
});
app.post('/read', (req,res) => {
    [text] = req.body;
    res.redirect(req.url);
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
