var fs = require('fs');
var https = require('https');
var express = require('express');
var forge = require('./public/js/forge.js');
var big = require('./public/biginteger.js');
var crypto= require('./public/cryptomodule.js')(big,forge);
var app = express();
var bodyParser = require('body-parser');
var mysql      = require('mysql');
var options = {
   key  : fs.readFileSync('server.key'),
   cert : fs.readFileSync('server.crt')
};

var testPkey = '65537';
var testSkey = '41578192547847912334404909034234188499792817931691881406705606186813096919372161504163179761314794791409670399806575010128113730409382078042799385493773588700439864392695301235938809474114822398675148394253151109679525299014542432829898764010226470989380898558734978460528717998327796222845314854611572352833';
var testN = '108260230632034510554624335453977195538773218466002814133939821718918153865907562514832829241846948996607690464526162353546531170037333065104924248196481534256280046675996953811210834791832545203279686741155607299776720095057210523540525645623654724179434074905287904866609596384161059407786542126978320214627';

function Keys(){
  //this.salt = 'CpHq+38iqF3Ls7j97qBQ2A9Diy8=';
  var skey;
  this.init = function() {
   try{
    //[this.pkey, skey ,this.n] = crypto.generateAsymKeys();
    //console.log(this.pkey +"\n" + skey + "\n" + this.n);
    this.pkey = testPkey;
    skey = testSkey;
    this.n = testN;
    return true;
   } catch (error){
      console.log(error);
      return false;
   }
  };
  this.sign = function(data) {
   try{
      return crypto.blindSign(data,skey, this.n);
   } catch (error){
      console.log(error);
   }
  };
}

var keys;
var server = https.createServer(options, app).listen(3000, function () {
   console.log('Started!');
   keys = new Keys();
   if(keys.init()) {
      console.log('Keys created!');
   } else{console.log('Keys failed!');}
});
var rootIo = require('socket.io')(server); //default '/' as namespace.
var socketUsers = require('socket.io.users');
socketUsers.Session(app);//IMPORTANT
var listIo = rootIo.of('/showlist');
var regIo = rootIo.of('/registration');
var signIo = rootIo.of('/sign');


app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

app.get('/',function(req,res){
  res.sendFile('/pages/index.html', { root: __dirname });
  //__dirname : It will resolve to your project folder.
});

app.get('/registration', function (req, res) {
    res.sendFile('/pages/registration.html', { root: __dirname });
});

app.get('/sign', function (req, res) {
    res.sendFile('/pages/sign.html', { root: __dirname });
});

app.get('/showlist', function (req, res) {
    res.sendFile('/pages/list.html', { root: __dirname });
});

var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'gm',
  password : 'qaz',
  database : 'election',
  multipleStatements: true
});

connection.connect(function(err){
if(!err) {
    console.log("Database is connected ... nn");    
} else {
    console.log("Error connecting database ... nn");    
}
});


regIo.on('connection', function(socket) {
   
  /* socket.on('fill db',function(data){
      var post = {
         login: data.login,
         password: crypto.sha256(data.password)
      };
    connection.query('INSERT INTO users SET ?', post, function(error) {
        if (error) {
            console.log(error.message);
        } else {
            console.log('insert new user in db - success');    
        }
    });
    });*/
  
  var pinfo = {
      //salt: keys.salt,
      pkey: keys.pkey,
      n: keys.n
   };
   socket.emit('init',pinfo);
   socket.on('add entry',function(data){
   	var post = {
        p: data.p,
        id: data.id,
        x: data.x,
        z: data.z
    };
    
     connection.query('SELECT p FROM list WHERE id = ?', post.id, function(error,result) {
        if (error) {
            console.log('Got error while select '+ error.message );
            socket.emit('alert error',error.message);
        } else if(!result.length){
            connection.query('INSERT INTO list SET ?', post, function(error) {
            if (error) {
                  console.log('Got error while insert ' + error.message);
                   socket.emit('alert error',error.message);
               } else {
                  console.log('insert new entry - success');
                  socket.emit('alert error', 'Thanks for registration!');
               }
            });
         } else {
            var mes = 'WARNING: user with such login is already registered! Try something new =)';
            console.log(mes);
            socket.emit('alert error', mes);
         }
    });
    
    
   });
});

listIo.on('connection', function(socket) {
    connection.query('SELECT * FROM list', function(err, rows) {
            if (err) {
                console.log(err);
            } else 
               socket.emit('welcome', rows);
        });
});


rootIo.on( "connection", function ( socket ) {
   console.log( 'Server: Incoming connection 3333.' );
   socket.on('get params',function(data){
   console.log("wow");
    connection.query('SELECT z, x, psign FROM list WHERE id = ?', data, function(err, rows) {
            if (err) {
                console.log(err);
            } else{
               //rows[0].salt = keys.salt;
               rows[0].n = keys.n;
               rows[0].pkey = keys.pkey;
               socket.emit('params', rows[0]);
            }
        });
    });   
});

signIo.on('connection', function(socket) {
   socket.on('sign all',function(){
    connection.query('SELECT p FROM list WHERE psign is NULL',function(err, rows) {
            if (err) {
                console.log(err);
            } else{
               var signature =[];
               var array = [];
              for (var i = 0, len = rows.length; i < len; i++) {
                     var p = rows[i].p;
                     array.push(p);
                       var signed = keys.sign(p);
                       signature.push(signed);
              }
              
            var sql = '';
            for( var j = 0; j< array.length; j++){
               sql += mysql.format("UPDATE list SET psign = ? WHERE p = ?; ", [signature[j],array[j]]);
            }
              connection.query(sql,function(error) {
                            if (error) {
                                 console.log(error.message);
                               } else {
                                 console.log('update all signatures - success');    
                               }
                        });
            }
        });
    });
});


