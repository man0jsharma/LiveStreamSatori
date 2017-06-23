var RTM = require("satori-rtm-sdk");
//var RTM = require('..');
//RTM.logger.DEBUG = true;
var express = require('express');
var cors = require('cors');

var path = require('path'); //Code module so don't need to install.

var app = express();

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
  history: { age: 2 },//seconds
  filter: "select * from `Meetup-RSVP` where group.group_country = 'us'"
});

rtm.on('enter-connected', function () {
  console.log(JSON.stringify(channel));
  console.log('**************************************Connected to RTM!');
});

/* set callback for state transition */
channel.on('enter-subscribed', function () {
  console.log('**************************************Subscribed to: ' + channel.subscriptionId);
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
    console.log('**************************************Subscription is failed: ', pdu.body);
  }
});

rtm.start();


///port number
const port = 3000;

//Adding middleware - cors
app.use(cors());

//static files
app.use(express.static(path.join(__dirname, 'public'))); // you can also give the actual path

//testing Server
app.get('/client', (req, res) => {
  channel.on('rtm/subscription/data', function (pdu) {
    console.log(JSON.stringify(channel));
   /* pdu.body.messages.forEach(function (user) {
      console.log('Counter ' + counter++);
      console.log('Country ' + user.group.group_country);
      console.log('TimeStamp ' + user.mtime + " => " + convertTime(user.mtime));
    });*/
    pdu.body.messages.forEach(function (pdu){
        res.send(pdu);
    });
  });
 
});


app.listen(process.env.PORT || 5000, () => {
  console.log("Server Started at port" + port);
});