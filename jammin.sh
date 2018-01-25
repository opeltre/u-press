#!/bin/bash
# make it a pm2 startup task!

cd jam;
git pull;
cd ../;
browserify jam/index.js --standalone jam > JAM.js;
mv JAM.js surf/lib;
