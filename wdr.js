//------------------------------------------------------------------------------
//  PACKAGE REQUIREMENTS
//------------------------------------------------------------------------------
const fs = require('fs');
const os = require('os');
const ini = require('ini');
const express = require('express');
const cluster = require('cluster');
const bodyParser = require('body-parser');
const config = ini.parse(fs.readFileSync('./config/config.ini', 'utf-8'));
let cpuCount = os.cpus().length;

//------------------------------------------------------------------------------
//  MASTER PROCESS
//------------------------------------------------------------------------------
if (cluster.isMaster) {
  console.info('[wdr.js] Now Listening on port '+config.LISTENING_PORT+'.');

  // SPAWN A FORK FOR EACH CORE/THREAD AVAILABLE
  if(cpuCount > 4){ cpuCount = 4; }
  for (let i = 0; i < cpuCount; i++) {
    cluster.fork({ "fork": i });
  }

  // RESTART FORK ON EXIT
  cluster.on('exit', (worker, code, signal) => {
    if(code !== 0){
      console.error('[wdr.js] Worker #'+code+' Died. Respawning...');
      cluster.fork({ "fork": code });
    } else{
      console.info('[wdr.js] Command Handler Died, Restarting.');
      process.exit(code);
    }
  });

//------------------------------------------------------------------------------
//  CHILD PROCESSES
//------------------------------------------------------------------------------
} else {

  // LOAD MAIN FOR EACH PROCESS (MANDATORY)
  const MAIN = require('./modules/base/bot.js');

  // DON'T ACCECT WEBOOKS FOR COMMAND HANDLER

  if(process.env.fork == 0 && cpuCount > 1){
    return MAIN;
  } else{
    // DEFINE THE EXPRESS SERVER
    var server = express().use(express.json({ limit: "1mb" }));

    // CATCH REQUESTS AND SEND FOR PARSING
    server.post('/', async (webhook, resolve) => {
      resolve.end();
      return MAIN.webhookParse(webhook.body);
    });

    // LISTEN TO THE SPECIFIED PORT FOR TRAFFIC
    server.listen(config.LISTENING_PORT);
  }
}
