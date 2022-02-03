// YOU CAN USE THIS FILE AS REFERENCE FOR SERVER DEVELOPMENT

// include the express modules
var express = require("express");

// create an express application
var app = express();
const url = require('url');

// helps in extracting the body portion of an incoming request stream
var bodyparser = require('body-parser');

// fs module - provides an API for interacting with the file system
var fs = require("fs");

// helps in managing user sessions
var session = require('express-session');

// include the mysql module
var mysql = require("mysql");

// Bcrypt library for comparing password hashes
const bcrypt = require('bcrypt');
var xmlParser = require('xml2json');
// A possible library helps reading uploaded file.
//**********************************************************************error:MODULE_NOT_FOUND
var formidable = require('formidable')
//**********************************************************************************************

//***********************************************************************************************************


const db_xml = fs.readFileSync('./dbconfig.xml');
var db_json = xmlParser.toJson(db_xml);
console.log(db_json);
db_json = JSON.parse(db_json);
//console.log(db_json.dbconfig);
var con = mysql.createConnection(db_json.dbconfig);
/*
var con = mysql.createConnection({
    host: "cse-mysql-classes-01.cse.umn.edu",
    user: "C4131F21U58",         // replace with the database user provided to you
    password: "3394",     // replace with the database password provided to you
    database: "C4131F21U58",     // replace with the database user provided to you
    port: 3306
});*/

//***********************************************************************************************************






// apply the body-parser middleware to all incoming requests
app.use(bodyparser());

// use express-session
// in mremory session is sufficient for this assignment

app.use(session({
  secret: "csci4131secretkey",
  saveUninitialized: true,
  resave: false
}
));

// server listens on port 9374 for incoming connections
app.listen(9374, () => console.log('Listening on port 9374!'));


// function to return the welcome page
//********************************************************************************************************
app.get('/',function(req, res) {
  res.sendFile(__dirname + '/client/welcome.html');
});

app.get('/login', function(req,res){
  console.log("loading login page");
  res.sendFile(__dirname + '/client/login.html');
});
app.get('/welcome', function(req,res){
  res.sendFile(__dirname + '/client/welcome.html');
});
app.get('/allEvents', function(req,res){
  if(req.session.value){
    res.sendFile(__dirname + '/client/allEvents.html');
  }
  else{
    res.sendFile(__dirname + '/client/login.html');
  }

});
app.get('/schedule', function(req,res){
  if(req.session.value){
    res.sendFile(__dirname + '/client/schedule.html');
  }
  else{
    res.sendFile(__dirname + '/client/login.html');
  }
});
app.get('/addEvent', function(req,res){
  console.log("add page");
  if(req.session.value){
    res.sendFile(__dirname + '/client/addEvent.html');
  }
  else{
    res.sendFile(__dirname + '/client/login.html');
  }
});

app.get('/admin', function(req, res){
  if(req.session.value){
    res.sendFile(__dirname + '/client/admin.html');
  }
  else{
    res.sendFile(__dirname + '/client/login.html');
  }
});

app.get('/logout', function(req,res){
  console.log("req.session");
  console.log(req.session);
  console.log("req.session.value");
  console.log(req.session.value);

  if(req.session.value = 1){
    req.session.user = 0;
    req.session.value = 0;
    req.session.destroy();

    res.redirect(302, '/login');
    res.send();


  }
  else{
    res.send('Session not started, can not logout!');
  }
});

app.get('/getListOfUsers', function(req,res){//****************************************************
  console.log("list all users");
  con.query('SELECT acc_id, acc_name, acc_login, acc_password FROM tbl_accounts', function(err, result){
    if(err){
      throw err;
    }
    else{
      console.log(result);
      res.send(JSON.stringify(result));
    }
  });
});

app.get('/getCurrentUser', function(req,res){
  var userInfo = req.session.user;
  console.log(userInfo);
  res.send(userInfo);
});

app.post('/addUser', function(req,res){
  console.log("adduser backend");
  var userInfo = req.body;
  console.log("creds:");
  console.log(userInfo);
  var do_insert = true;
  //insert query
 con.query('SELECT acc_name, acc_login, acc_password FROM tbl_accounts WHERE acc_login = ?', [userInfo.login], function(err, result){
   console.log(result.length);
   console.log(result);
    if(err){
      throw err;
    }

    if(result.length < 1){

        console.log("inserting");
        con.query('INSERT INTO tbl_accounts (acc_name, acc_login, acc_password) VALUES (?, ?, ?)', [userInfo.name, userInfo.login, userInfo.password], function(err, result){
          if(err){
            throw err;
          }
          else{
            res.json({status: "success"});
          }
        });
    }
  });
});

app.post('/updateUser', function(req, res){

  console.log("backend update");
  var userInfo = req.body;
  console.log("creds:");
  console.log(userInfo);

  con.query('SELECT acc_name, acc_login, acc_password FROM tbl_accounts WHERE acc_login = ?', [userInfo.login], function(err,result){
    console.log("rows returned:");
    console.log(result.length);
    if(result.length<2){
      console.log("updating");
      if(userInfo.password.localeCompare('')==0){//no password change query
        con.query('UPDATE tbl_accounts SET acc_name = ?, acc_login = ? WHERE acc_login = ?',[userInfo.name, userInfo.login, userInfo.login], function(err,result){
          if(err){throw err;}
          else{
            res.json({status: "success"});
          }
        });
      }
      else{ //update the password too
        con.query('UPDATE tbl_accounts SET acc_name = ?, acc_login = ?, acc_password = ? WHERE acc_login = ?',[userInfo.name, userInfo.login, userInfo.password, userInfo.login], function(err,result){
          if(err){throw err;}
          else{
            res.json({status: "success"});
          }
        });
      }

    }
  });

});

app.post('/deleteUser', function(req,res){
  console.log("backend delete");
  var userInfo = req.body;
  if(req.session.user == userInfo.login){
    console.log("trying to delete logged user");
    res.send({error: 'cannot delete logged in User!'});
  }
  else{
    con.query('DELETE FROM tbl_accounts WHERE acc_login = ?', [userInfo.login], function(err, result){
      if(err){
        throw err;
      }
      else{
        res.json({status: "success"});
      }
    });
  }

});

app.get('/listEvents', function(req,res){ //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  console.log("list all events");
  con.query('SELECT event_day, event_event, event_start, event_end, event_location, event_phone, event_info, event_url FROM tbl_events;', function(err, result){
    if(err){
      throw err;
    }
    else{
      console.log("returning all events");
      console.log(result);
      json_ret2 = result;
      json_ret2.sort(function(a,b){
        return a.event_start.localeCompare(b.event_start);
      });
      res.send(JSON.stringify(result));
    }
  });

});

app.get('/getSchedule', function(req,res){
  console.log("get day sched");
  var q = url.parse(req.url, true);
  let day = q.query.dayOfWeek;

  console.log(day);    //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1UNDEFINED!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  //query db for scheduleTable
  con.query('SELECT event_event, event_start, event_end, event_location, event_phone, event_info, event_url FROM tbl_events WHERE event_day = ?', [day], function(err, result){
      console.log("day query");
      if(err){
        throw err;
      }
      else{


        var rows=result;
        console.log(JSON.stringify(rows));
        var json_ret =rows;

        json_ret.sort(function(a,b){
          return a.event_start.localeCompare(b.event_start);
        });

        res.send(JSON.stringify(rows));
      }
  });


});

//*****************POST*****************************POST******************POST****************************************
app.post('/login_req',function(req,res){
  console.log("login req");
    var loginInfo = req.body;
    var login = loginInfo.username;
    console.log(login);
    var pwd = loginInfo.password;
  //query db for credentials
  con.query(`SELECT acc_login, acc_password FROM tbl_accounts WHERE acc_login= ?`, [login], function(err, result) {
    var rows = result; //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    console.log("test");
    if(err) {
      console.log("error occurred");
      throw err;
    }
    else{
      console.log(result);
      console.log(result.length);
      console.log(result[0].acc_password);
      //console.log(result[0].acc_login);

      if(result.length >=1){

        if(bcrypt.compareSync(pwd, result[0].acc_password)){
          req.session.user = login;
          req.session.value = 1;
          res.json({status: 'success'});
        }
        if(pwd.localeCompare(result[0].acc_password)==0){
          req.session.user = login;
          req.session.value = 1;
          res.json({status: 'success'});
        }
        else{
          console.log("no match");
          res.json({status: 'login failed'});
        }
      }
      else{
        console.log("2short");
        res.json({status: 'login failed'});
      }
    }


  });

});


app.post('/newEvent', function(req,res){

  var eventInfo = req.body;
  var rowToBeInserted = {
    event_day: eventInfo.day,
    event_event: eventInfo.name,
    event_start: eventInfo.start,
    event_end: eventInfo.end,
    event_location: eventInfo.location,
    event_phone: eventInfo.phone,
    event_info: eventInfo.info,
    event_url: eventInfo.url
  };
  console.log(rowToBeInserted);



  con.query('INSERT tbl_events SET ?;', rowToBeInserted, function(err, result) {
    console.log("in callback");
    console.log(result);
    if(err){
      console.log("fail");
      throw err;
    }
    console.log("inserted");
    res.json({status: "success"});

  });





});

/*
con.connect(function(err) {
  if (err) {
    throw err;
  }

  console.log("Connected!");
  con.query('INSERT INTO tbl_events SET ?', rowToBeInserted, function(err, result) {
    if(err){
      throw err;
    }
    console.log("inserted");
  });
con.end();
});
*/

//********************************************************************************************************


// middle ware to serve static files
app.use('/client', express.static(__dirname + '/client'));


// function to return the 404 message and error to client
app.get('*', function(req, res) {
  // add details
  res.sendStatus(404);
});
