/*
Creating Asynchronous Readable Stream in NodeJS
--------------------------------------------------------
When data is pushed asynchronously to internal buffer, you'll get an asynchronous 
behaviour of the stream. 
See Synchronous Version: https://gist.github.com/hassansin/7f3250d79a386007ce45
*/
var Readable = require("stream").Readable;


var RTM = require("satori-rtm-sdk");
//var RTM = require('..');
//RTM.logger.DEBUG = true;
var express = require('express');
var cors = require('cors');
var path = require('path'); //Code module so don't need to install.
var app = express();
var stream = require("stream");
var chalk = require("chalk");
var util = require("util");
var http = require("http");
var fileSystem = require("fs");


//const route = require('./routes/route');


const appkey = 'Edf3Ae9DFAbf87Ef01469Fba234C3DF1';
//wss://hv1p4ro0.api.satori.com'

const endpoint = 'wss://open-data.api.satori.com';
const channelName = "Meetup-RSVP";
var rtm = new RTM(endpoint, appkey);
var counter = 0;
var channel = rtm.subscribe(channelName, RTM.SubscriptionMode.SIMPLE);

var convertTime = (unix_timestamp) => {
  var date = new Date(unix_timestamp * 1000);
  var day = date.toDateString();
  var time = date.toTimeString();
  var formattedTime = day + ':' + time;
  return formattedTime;
}

var channel = rtm.subscribe('channel', RTM.SubscriptionMode.SIMPLE, {
  history: {
    count: 10
  },
  filter: "select * from `Meetup-RSVP` where group.group_country = 'us'"
});

rtm.on('enter-connected', function () {
  //console.log(JSON.stringify(channel));
  console.log('Connected to RTM!');
});

/* set callback for state transition */
channel.on('enter-subscribed', function () {
  console.log('Subscribed to: ' + channel.subscriptionId);
});

/* set callback for PDU with specific action */
channel.on('rtm/subscribe/ok', function (pdu) {
  // console.log(JSON.stringify(channel));
});




rtm.on("error", function (error) {
  console.log("Error connecting to RTM: " + error.message);
  rtm.stop();
});

/* set callback for all subscription PDUs */
channel.on('data', function (pdu) {
  if (pdu.action.endsWith('/error')) {
    console.log('Subscription is failed: ', pdu.body);
  }
});

rtm.start();


function ReadStreamAsync(opts) {
  Readable.call(this, opts);
  this._max = 10;
  this._index = 1;
  this.rtmConnected = true;
}
require("util").inherits(ReadStreamAsync, Readable)

ReadStreamAsync.prototype._read = function (n) {
  var self = this;

  channel.on('rtm/subscription/data', function (pdu) {
    var buf = new Buffer(JSON.stringify(pdu.body.messages), 'ascii');
    self.push(buf);
    self.push(null);
  });
}


// Create a web server that streams the cached file back on every request.
var server = http.createServer(
  function handleHttpRequest(request, response) {

    // We're hard-coding this stuff since there's nothing dynamic about the demo.
    response.writeHead(
      200,
      "OK",
      {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin" : "*",
      }
    );

    
    // Crate a new instance of the Buffer Stream to wrap the cached buffer. Then,
    // pipe that stream into the HTTP response.
    // --
    // NOTE: Once the BufferStream "ends", it will automatically end the HTTP
    // response stream as well.
    new ReadStreamAsync()
      .pipe(response)
      ;

  }
);

server.listen(8080);

console.log(chalk.yellow("Server running on port 8080."))