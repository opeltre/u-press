// ./SERVER.js

const STATIC = ['surf','media','audio'];

const jam = require('jam')
const view = require('./view.js');
const db = require('./db');

const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

// some data
let docs = JSON.parse(fs.readFileSync("data/docs.json","utf-8"));
let users = JSON.parse(fs.readFileSync("data/users.json","utf-8"));
let text = fs.readFileSync("data/math.md","utf-8");

// launch & configure the express server
var app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
STATIC.forEach((dir) => app.use('/'+dir, express.static(dir)))

////////////// @ root

app.get('/', (req, res) => res.redirect('read') )

////////////// @ read

app.get('/read', (req,res) => {
    res.end(view('read').render(text));
});

app.get('/read/md', (req,res) => {
    res.setHeader("Content-Type","text/plain");
    res.end(text);
});

app.post('/read', (req,res) => {
    [text] = req.body;
    res.redirect(req.url);
});

////////////// @ browse --> db.js

app.get('/browse*', (req,res) => {
    db.doc
        .get(req.params[0])
        .then(doc => res.end(view('nav').render(doc)))
});

app.put('/browse*', (req,res) => {
    db.doc
        .put(req.params[0], req.body.name)
        .then(() => res.end('put'))
        .catch(err => res.end('doc exists'));
});

app.delete('/browse*', (req,res) => {
    db.doc
        .del(req.params[0])
        .then(children => {
            res.setHeader("Content-Type","text/plain");
            res.end(JSON.stringify(children, null,2));
        })
        .catch(e => console.log(e));
})

////////////// @ login

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

///////////// @404
app.use((req,res) => {
    res.setHeader('Content-Type','text/html');
    res.status(404).send("Tu t'es perdu!");
    res.end();
});
//

// listen on 80 as root
app.listen(8080);
