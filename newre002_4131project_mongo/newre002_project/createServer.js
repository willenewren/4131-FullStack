const http = require('http');
const url = require('url');
const fs = require('fs');
const qs = require('querystring');
const { MongoClient } = require("mongodb");


const uri =
  "mongodb+srv://newre002:mGRIsz0xBwvsHxYy@cluster0.oz29m.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";

const port = 9001;


  function run() {
    console.log("listening on port 9001");
    MongoClient.connect(uri, function(err, database) {
      if (err){
        throw err;
      }

      http.createServer(function(req, res) {
        const schedule = database.db("ScheduleDB").collection("schedule");

        var q = url.parse(req.url, true);
        if (q.pathname === '/') {
          indexPage(req, res);
        }
        else if (q.pathname === '/index.html') {
          indexPage(req, res);
        }
        else if(q.pathname === '/schedule.html'){
          schedulePage(req, res);
        }
        else if(q.pathname === '/addEvent.html'){
          addEventPage(req, res);
        }
        else if(q.pathname === '/postEventEntry'){
          console.log("postParse");
          var reqBody = '';
          req.on('data', function(data){
            reqBody+=data;
            console.log(reqBody);
          });
          req.on('end', function(req, res/*, reqBody*/){
            //add reqBody to shedule.json
            console.log("reqbody is:");  //undefined even though reqBody just printed before this on line 53
            console.log(reqBody);
            var postObj = qs.parse(reqBody);  //also undefined
            console.log(postObj);
            var day = postObj.day.toLowerCase();
            var name = postObj.event;
            var start = postObj.start;
            var end = postObj.end;
            var phone = postObj.phone;
            var location = postObj.location;
            var info = postObj.info;
            var url = postObj.url;

            event_query = {"name": name, "start": start, "end": end, "phone": phone, "location": location, "info": info, "url": url, "day": day};
            schedule.insert(event_query);

          });

          res.writeHead(302,{
            'Location':'/schedule.html'
          });
          res.end();


          //postParse(req, res);
        }
        //*******************************************************
        else if(q.pathname === '/getSchedule'){
          console.log("called readSchedule() inline");

          var q = url.parse(req.url, true);
          var day = q.query.dayOfWeek;
          const query = { day:  day  };
          const options = {
            // sort returned documents in ascending order by start time
            sort: { start: 1 },
          };


          schedule.find(query, options).toArray(function(err, result){
              if(err){
                throw err;
              }
              console.log(result);
              scheduleString = JSON.stringify(result);
              console.log("scheduleString:");
              console.log(scheduleString);
              res.write(scheduleString);
              res.end();
          });

        }
        //**********************************************************
        else if(q.pathname === '/eventInterferes'){
          console.log("overlap check backend");
          var q = url.parse(req.url, true);
          var day = q.query.dayOfWeek;
          var start = q.query.start;
          var end = q.query.end;
          const query = { day:  day, $and: [ {start: {$lte: end}}, {end: {$gte: start}} ] };

          const options = {
            // sort returned documents in ascending order by start time
            sort: { start: 1 },
          };
          schedule.find(query, options).toArray(function(err, result){
              if(err){
                throw err;
              }
              console.log(result);
              overlapString = JSON.stringify(result);
              console.log(overlapString);
              res.write(overlapString);
              res.end();
          });


        }


        //**********************************************************
        else {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          return res.end("404 Not Found");
        }
      }).listen(port);

    });
  }

  run();  //main server loop









function readSchedule(req, res){

    console.log("called readSchedule()");

    var q = url.parse(req.url, true);
    //let day = q.query.dayOfWeek;
    const schedule = database.db("ScheduleDB").collection("schedule");
    const findResult = schedule.find().toArray(function(err, result){ //todo: form and insert query in find()
        if(err){
          throw err;
        }
        console.log(result);
    });

    /*
    var scheduleObj= JSON.parse(jsonString);
    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    scheduleString = JSON.stringify(scheduleObj);
    res.write(scheduleString);
    res.end();
    */

}

function postParse(req, res){
  var reqBody = '';
  req.on('data', function(data){
    reqBody+=data;
    console.log(reqBody);
  });
  req.on('end', function(req, res/*, reqBody*/){
    //add reqBody to shedule.json
    console.log("reqbody is:");  //undefined even though reqBody just printed before this on line 53
    console.log(reqBody);
    var postObj = qs.parse(reqBody);  //also undefined
    console.log(postObj);
    var day = postObj.day.toLowerCase();
    var name = postObj.event;
    var start = postObj.start;
    var end = postObj.end;
    var phone = postObj.phone;
    var location = postObj.location;
    var info = postObj.info;
    var url = postObj.url;

    //variables for all fields
    var jsonObj = {};
    jsonObj.name = name;
    jsonObj.start = start
    jsonObj.end= end;  //Does this work??????? found in AddingEventToJsonOnServerSide.pdf, page 2
    jsonObj.phone = phone;
    jsonObj.location = location;
    jsonObj.info = info;
    jsonObj.url = url;

    fs.readFile('schedule.json', function(err, fileJsonString){
      if (err) {
        throw err;
      }
      console.log(fileJsonString);
      var parsedJson = JSON.parse(fileJsonString);
      console.log(parsedJson);
      parsedJson[day].push(jsonObj);  //append the new event jsonObj to the end of the event array for that day
      const events =  parsedJson[day];
      console.log("new json");
      console.log(parsedJson);

      events.sort((a,b)=> a.start.localeCompare(b.start));  //Not sure if this will work
      var fileJsonString = JSON.stringify(parsedJson);
      //console.log("parse json");
      //console.log(parsedJson);


      fs.writeFile('schedule.json', fileJsonString, function(err){
        if (err) {
          throw err;
        }
        console.log(fileJsonString);
      });
    });
  });

  res.writeHead(302,{
    'Location':'/schedule.html'
  });
  res.end();
}


function indexPage(req, res) {
  fs.readFile('client/index.html', (err, html) => {
    if (err) {
      throw err;
    }
    res.statusCode = 200;
    res.setHeader('Content-type', 'text/html');
    res.write(html);
    res.end();
  });
}

function schedulePage(req, res){
  fs.readFile('client/schedule.html', (err, html) => {
    if (err) {
      throw err;
    }
    res.statusCode = 200;
    res.setHeader('Content-type', 'text/html');
    res.write(html);
    res.end();
  });
}

function addEventPage(req, res){
  fs.readFile('client/addEvent.html', (err, html) => {
    if (err) {
      throw err;
    }
    res.statusCode = 200;
    res.setHeader('Content-type', 'text/html');
    res.write(html);
    res.end();
  });

}

function convertMil(timeStr){
    var time = timeStr.split(':'); // convert to array

    // fetch
    var hours = Number(time[0]);
    var minutes = Number(time[1]);
    //var seconds = Number(time[2]);

    // calculate
    var timeValue;

    if (hours > 0 && hours <= 12) {
      timeValue= "" + hours;
    } else if (hours > 12) {
      timeValue= "" + (hours - 12);
    } else if (hours == 0) {
      timeValue= "12";
    }

    timeValue += (minutes < 10) ? ":0" + minutes : ":" + minutes;  // get minutes
    //timeValue += (seconds < 10) ? ":0" + seconds : ":" + seconds;  // get seconds
    timeValue += (hours >= 12) ? " P.M." : " A.M.";  // get AM/PM
    return timeValue;
}
