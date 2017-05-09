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
var testN = '108260230632034510554624335453977195538773218466002814133939821718918153865907562514832829241846948996607690464526162353546531170037333065104924248196481534256280046675996953811210834791832545203279686741155607299776720095057210523540525645623654724179434074905287904866609596384161059407786542126978320214627';
var testPemPublic ='-----BEGIN PUBLIC KEY-----MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC4+Bf7srgOh9b04dy6Eeyl//w5RaOkf66dI+uhMQHG+Km0MsNld8oS1os5xb38z+UrsmShzCmMPjfTrucKfNmk1eABRBfvUP6O9DNF026YrpDKuZC47kfgn5/xsXkXPcUhZlnEAA7Ht24MHIDiG7pKfB+mmvjnJppHmBZ5pkkVaQIDAQAB-----END PUBLIC KEY-----';
var testPemPrivate = '-----BEGIN RSA PRIVATE KEY-----MIICXAIBAAKBgQC4+Bf7srgOh9b04dy6Eeyl//w5RaOkf66dI+uhMQHG+Km0MsNld8oS1os5xb38z+UrsmShzCmMPjfTrucKfNmk1eABRBfvUP6O9DNF026YrpDKuZC47kfgn5/xsXkXPcUhZlnEAA7Ht24MHIDiG7pKfB+mmvjnJppHmBZ5pkkVaQIDAQABAoGAaJxfrAl60TUAXIT0+gMzLPsm4hlBoMJZtiPfms2FrMtr5y8ilVt3XMob+bOdbMMDYIBHK7607M0vc7gikSrlR7yV/oai7MTAErC/SQNdVNzouDQcmM/HEWNdI7PfV+QiuhNRPgtcgTdAHKRF7yvUHlkqIua3ZlNQt8J1h150yHUCQQD8cdzqSANVcpiSXBtriy2zUzcTeWcnECdrQEul0/c4YAU1gAN+9yq89aJ5ThVoCh6I98O8mn+En6FauHgXhvmXAkEAu5L2F3u0XxTdnZ5vWg064YI8gAk8rqo1jSZZdoUyV2ppvy71Xx0tE4vwWgfnyPkOyZScxAm792+7kQ/H8PxI/wJAO4sX0mK99o+bERqMlSc01lFQclV2US5sPc3iifCfJTrwv5e8O1xNRlihw/746ZtJbIEUOA4w+bU1N9K+8L2zbQJBAAk6OZD+LOlghWZznNa5P+RIG+HQkoOlK+09rbj+5HMYcQtOrBN5w/XqNHC5YtWoKuoPvYaHVA/gF0ITnKpmPtECQBGYFDPRH9tp6vJGMuketUhLgEay//FWux9MRGtqrOCbIcQHCC5R9FbDtR9+TOeLyA1SeD/Jq3k2gLixAw5dfjk=-----END RSA PRIVATE KEY-----';

function Keys(){
  var privateKeyPem;
  this.init = function() {
   try{
    //[this.publicKeyPem, privateKeyPem] = crypto.generatePemAsymKey();
    //console.log(this.publicKeyPem + '\n' + privateKeyPem);
    this.publicKeyPem = testPemPublic;
    privateKeyPem = testPemPrivate;
    this.pkey = testPkey;
    this.n = testN;
    return true;
   } catch (error){
      console.log(error);
      return false;
   }
  };
  this.decrypt = function(data) {
   try{
      return crypto.forgeAsymDecrypt(data,privateKeyPem);
   } catch (error){
      console.log(error);
   }
  };
}


var keys;

var server = https.createServer(options, app).listen(3333, function () {
   console.log('Started!');
   keys = new Keys();
   if(keys.init()) {
      console.log('Keys created!');
   } else{console.log('Keys failed!');}
});
var rootIo = require('socket.io')(server); //default '/' as namespace.
var socketUsers = require('socket.io.users');
socketUsers.Session(app);//IMPORTANT

var logIo = rootIo.of('/showlog');
var castIo = rootIo.of('/castvote');
var checkIo = rootIo.of('/checkvote');
var decrIo = rootIo.of('/decrypt');
var myIo = rootIo.of('/myvote');

app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));

app.get('/',function(req,res){
  res.sendFile('/pages/index.html', { root: __dirname });
  //__dirname : It will resolve to your project folder.
});

app.get('/showlog', function (req, res) {
   res.sendFile('/pages/log.html', { root: __dirname });
});

app.get('/castvote', function (req, res) {
   res.sendFile('/pages/vote.html', { root: __dirname });
});

app.get('/checkvote', function (req, res) {
    res.sendFile('/pages/check.html', { root: __dirname });
});
app.get('/decrypt', function (req, res) {
    res.sendFile('/pages/decrypt.html', { root: __dirname });
});
app.get('/myvote', function (req, res) {
    res.sendFile('/pages/qrcheck.html', { root: __dirname });
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

logIo.on('connection', function(socket) { 
    connection.query('SELECT * FROM log', function(err, rows) {
            if (err) {
                console.log(err);
            } else 
                socket.emit('get log', rows);
        });
});

myIo.on('connection', function(socket) {  
     socket.on('get vote',function(data){
     
           connection.query('SELECT * FROM log WHERE hash = ?',data, function(err, rows) {
             var result = {};
            if (err) {
                console.log(err);
                result.error = err;
            } else if(rows.length)
            {
                  var tmp = rows[0];
                  result.decrvote = tmp.decrvote;
                  result.vote = tmp.vote;
                  var hash = crypto.sha256(tmp.x);
                  //console.log(tmp.vote+'\n'+ keys.pkey+'\n'+hash+'\n'+ tmp.c+'\n'+ tmp.s+'\n'+keys.n);
                  result.verify = crypto.verify(tmp.vote, keys.pkey,hash, tmp.c, tmp.s,keys.n);
                  console.log('result');
            }
            else
               result.error = 'There is no vote with the given hash(x)';
            socket.emit('vote', result);
        });

    });   
});


castIo.on('connection', function(socket) {
   
   socket.on('get pem',function(){
          console.log("get Pem key");
          socket.emit('pem',keys.publicKeyPem);
    });   
   
   socket.on('add vote',function(data){
   	var post = {
        x: data.x,
        c: data.c,
        s: data.s,
        vote: data.vote,
        hash: crypto.sha256(data.x)
    };
    
     connection.query('SELECT vote FROM log WHERE x = ?', post.x, function(error, result) {
        if (error) {
            console.log(error.message);
            socket.emit('response',error.message);
        }
        else if(!result.length){
         //console.log("HERE");
         //console.log(data.vote + '\n'+keys.pkey+'\n'+post.hash+'\n'+ post.c+'\n'+ post.s +'\n'+keys.n);
         if(crypto.verify(data.vote, keys.pkey,post.hash, post.c, post.s ,keys.n)) {
            connection.query('INSERT INTO log SET ?', post, function(error) {
        if (error) {
            console.log(error.message);
            socket.emit('response',error.message);
        } else {
            console.log('insert new vote - success');
            socket.emit('response','New vote successfully inserted!');
        }
    });
         } else {
            socket.emit('response','ERROR: signature is not valid');
         }
        } else {
            var text = 'ERROR: user with such x is already exists. Try to be more original J.';
            console.log(text);
            socket.emit('response',text);
        }
    });

   });
   
});


checkIo.on('connection', function(socket) {
   socket.on('get params',function(data){
    connection.query('SELECT x,vote,c,s FROM log WHERE id = ?', data, function(err, rows) {
            if (err) {
                console.log(err);
                socket.emit('response', err);
            } else if(!rows.length){
                socket.emit('response', 'There is no ballot with id '+ data);
            } else{
               rows[0].n = keys.n;
               rows[0].pkey = keys.pkey;
               socket.emit('params', rows[0]);
            }
        });
    });
});

decrIo.on('connection', function(socket) {
   socket.on('decrypt all',function(){
    connection.query('SELECT id, vote FROM log WHERE decrvote is NULL',function(err, rows) {
            if (err) {
                console.log(err);
            } else{
               var voteid =[];
               var decrypted = [];
              for (var i = 0, len = rows.length; i < len; i++) {
                     voteid.push(rows[i].id);
                     decrypted.push(keys.decrypt(rows[i].vote));
              }
            //console.log("decrypted: "+decrypted);
            var sql = '';
            for( var j = 0; j< voteid.length; j++){
               sql += mysql.format("UPDATE log SET decrvote = ? WHERE id = ?; ", [decrypted[j],voteid[j]]);
            }
              connection.query(sql,function(error) {
                            if (error) {
                                 console.log(error.message);
                               } else {
                                 console.log('update all ballots - success');    
                               }
                        });
            }
        });
    });
});

