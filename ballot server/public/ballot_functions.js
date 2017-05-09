function testCreateSign(){
   try{
  document.form1.signHx.value = createSign(document.form1.decrz.value, document.form1.signature.value, document.form1.n.value );
  document.form1.verify.value = verify(document.form1.signHx.value,
                                              document.form1.decrx.value,
                                             document.form1.pkey.value,
                                             document.form1.n.value);
   }catch(error){
      console.log(error);
      alert(error);
   }
}
    
function createQR()
{
  try{
      var x =  document.form1.decrx.value;
jQuery(function(){
  var hash = hashValue(x);
  jQuery('#qrcode').empty();
  jQuery('#qrcode').qrcode(hash);
  var canvas = document.querySelector("#qrcode canvas");
  var img = canvas.toDataURL("image/png");
  $(canvas).on('click', function() {
            var a = document.createElement('a');
            a.href = img;
            a.download = 'qrcode.png';
            document.body.appendChild(a);
            a.click();
  });
  
});
  } catch(error){
      console.log(error);
      alert(error);
   }
}

function castVote(){
      try{
        
        var x =  document.form1.decrx.value || "";
        var pem = document.form1.publicKeyPem.value || "";
        var sign = document.form1.signHx.value || "";
        var vote = document.form1.vote.value;
        var pkey = document.form1.pkey.value|| "";
        var n = document.form1.n.value || "";
        if( x === "" ||  pem === "" || sign === "" || vote === "" || n === "" || pkey === "") {
          alert("Please Fill All Required Field");
          return;
        }
      	var data = {};
         data.x = x;
         data.sign = sign;
         data.vote = forgeAsymEncrypt(vote,pem);
         [data.c, data.s] = proofOfKnow(data.vote, sign, pkey, n);
         document.form1.encvote.value = data.vote;
         var socket = io('/castvote');
         socket.emit('add vote', data);
         socket.on('response', function(data){ alert(data);});
      
   } catch(error){
      console.log(error);
       alert(error);
   }
   
}

function cast(){
   try{
    var password = document.form1.password.value  ||"";
    var username = document.form1.id.value || "";
    if ( username === "" || password === ""){
      alert("Please Fill All Required Field");
      return;
      }
      
       var s = io('/castvote');
       s.emit('get pem');
       s.on('pem', function(data) {
          document.form1.publicKeyPem.value  = data;
          var socket = io.connect("https://localhost:3000/");
          socket.emit('get params', username);
          socket.on('params', function(data) {
                document.form1.aesX.value = data.x;
                document.form1.aesZ.value = data.z;
                document.form1.signature.value = data.psign;
                document.form1.n.value = data.n;
                document.form1.pkey.value = data.pkey;
                document.form1.salt.value = hashValue(document.form1.id.value);
                [document.form1.decrx.value,document.form1.decrz.value,document.form1.hash.value] = decryptValues(password,
                                                                                                     document.form1.salt.value,
                                                                                                     document.form1.aesX.value,
                                                                                                      document.form1.aesZ.value);       
              createQR();
       });
       });
       
   }catch (error){
      console.log(error);
       alert(error);
   }
   
}


function getSignature(){
   try{
      var socket = io('/checkvote');
      socket.emit('get params',  document.form1.id.value);
      socket.on('params', function(data) {
                document.form1.x.value = data.x;
                document.form1.encr.value = data.vote;
                document.form1.s.value = data.s;
                document.form1.c.value = data.c;
                document.form1.n.value = data.n;
                document.form1.pkey.value = data.pkey;
                document.form1.verify.value = verification(data.vote,
                                              data.pkey,
                                             data.x,
                                             data.c,
                                             data.s,
                                             data.n);
       });
      socket.on('response', function(data) {alert(data);});
   }catch (error){
      console.log(error);
       alert(error);
   }
   
}

function decryptAll(){
   try{
      var socket = io('/decrypt');
      socket.emit('decrypt all');
   }catch (error){
      console.log(error);
       alert(error);
   }
}