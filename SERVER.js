// ./SERVER.js

//STATIC ROOTS & ROUTING SEEDS:
const STATIC = ['lib','style','images','fonts','sounds'];
const SEEDS = ['hublot'];   

const router = require('./router'); 
const express = require('express');
const path = require('path');
const rdb = require('rethinkdb');

//SURF BOARD:
const fs = require('fs');
const html = fs.readFileSync("index.html", "utf-8"); 

// connect to rethinkdb
var cxn;
rdb.connect({host:'localhost', port:'28015'}, (e,c) => cxn = c);
// launch the server 
var app = express();

//@route/:url
var CHART = Object.create(router.Chart).explore(SEEDS);
var ROUTES = CHART.map();

app.get('/route/:url', function (req, res) {
    console.log(`SURFER requesting route @${req.params.url}`);
    res.setHeader("Content-Type","text/plain");
    res.end(JSON.stringify(CHART));
}); 

//@/
app.get('/', function(req, res) {
    res.redirect('/surf/index.html');
});

//@alarm
app.get('/alarm', function(req, res) {
    console.log("alarmpi waving at %s", req.ip);
    res.setHeader("Content-Type","text/plain");
    res.end(req.ip);
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

//@surf
app.get('/surf/*', function(req, res) {
    console.log("surfer surfing @" + req.path);
    let route = ROUTES[req.url.replace('/surf','hublot')];
    console.log(ROUTES);
    if (route == undefined) {
        res.end(req.url);
        return 0;
    }
    res.setHeader("Content-Type","text/html");
    route.serveDom(res,html);
});

//@hublot
app.use('/hublot', express.static('hublot'));
//@STATIC
for ( i in STATIC ) {
    app.use('/' + STATIC[i], express.static(STATIC[i]));
}

//@404
app.use(function(req,res){
    res.setHeader('Content-Type','text/html');
    res.status(404).send("Tu t'es perdu!");
    res.end();
});
//

// listen on 80 as root
app.listen(8080);
