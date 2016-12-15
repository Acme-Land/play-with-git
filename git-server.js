#!/usr/bin/env node
const express = require('express');
const bodyParser = require('body-parser');

const spawn = require('child_process').spawn;
const path = require('path');
const backend = require('git-http-backend');

/*
Express application
*/
let app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('./public'));

app.all('/gitsrv/*', (req, res) => {

  console.log("---------------------------------------")
  console.log("url", req.url);
  console.log("params", req.params);
  console.log("query", req.query);

  console.log("method", req.method);
  console.log("headers", req.headers);
  console.log("---------------------------------------")

  let splittedURL = req.url.split('/');
  let user = splittedURL[2];
  let repo = splittedURL[3];

  var dir = path.join(__dirname, `${process.env.GIT_SHARED_REPOSITORIES_LOCATION}/${user}`, repo);

  req.pipe(backend(req.url, (err, service) => {
      if (err) return res.end(err + '\n');

      res.setHeader('content-type', service.type);

      console.log("+++++++++++++++++++++++++++++++++++++++")
      console.log(`service.action: ${service.action}`);
      console.log(`repo: ${repo}`);
      console.log('service.fields: ', service.fields);
      console.log(`service.cmd: ${service.cmd}`);
      console.log(`service.args: ${service.args}`);
      console.log("+++++++++++++++++++++++++++++++++++++++")

      var ps = spawn(service.cmd, service.args.concat(dir));
      ps.stdout.pipe(service.createStream()).pipe(ps.stdin);

  })).pipe(res);
});

app.listen(process.env.GIT_HTTP_PORT)

console.log(`🚀 Git Server is started - listening on ${process.env.GIT_HTTP_PORT}`);
console.log(__dirname);
