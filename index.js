// ./SERVER.js

const STATIC = ['surf','media','audio'];

const jam = require('jam')
const view = require('./view.js');
const db = require('./db');

const fs = require('fs');
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');

// launch & configure the express server
var app = express();
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
STATIC.forEach((dir) => app.use('/'+dir, express.static(dir)))

// promise.catch(onErr(res))
const onErr = (res) => (err) => {
    console.log(err);
    res.setHeader('Content-Type','application/json')
    res.end(JSON.stringify({error: `${err}`}));
};

const sms = (res) => (text) => {
    res.setHeader('Content-Type','text/plain')
    res.end(text)
};

////////////// @ root

app.get('/', (req, res) => res.redirect('/read/') )

////////////// @ ip

app.get('/ip', (req, res) => res.end(req.connection.remoteAddress));

////////////// @ read

app.get('/read*', (req,res) => {
    res.end(view('read').render(''));
});

///////////// @ doc: ajax <---> db 
app.get('/doc*', (req,res) => {
    res.setHeader("Content-Type","text/plain");
    db.doc
        .get(req.params[0])
        .then(text => res.end(text))
        .catch(onErr(res));
});

app.post('/doc*', (req,res) => {
    [text] = req.body;
    db.doc
        .post(req.params[0], text)
        .then(() => res.end('write'))
        .catch(onErr(res));
});

////////////// @ route: ajax <---> db

app.get('/route*', (req,res) => {
    res.setHeader("Content-Type","application/json");
    db.nav
        .get(req.params[0], 2)
        .then(doc => res.end(JSON.stringify(doc)))
        .catch(onErr(res));
});

app.put('/route*', (req,res) => {
    db.nav
        .put(req.params[0], req.body.name)
        .then(() => res.end('put'))
        .catch(onErr(res));
});

app.delete('/route*', (req,res) => {
    db.nav
        .del(req.params[0])
        .then(children => {
            res.setHeader("Content-Type","text/plain");
            res.end(JSON.stringify(children, null,2));
        })
        .catch(onErr(res));
});

app.move('/route*', (req,res) => {
    db.nav
        .mv(req.params[0], req.body.to, req.body.n)
        .then(() => sms(res)('mv'))
        .catch(onErr(res));
});

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
