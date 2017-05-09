function testRegistration() {
   try{
   generateSalt();
   [document.form1.p.value,document.form1.aesX.value,document.form1.aesZ.value,document.form1.hash.value] = registration(document.form1.x.value,
                                                                                                                         document.form1.z.value,
                                                                                                                         document.form1.password.value,
                                                                                                                         document.form1.salt.value,
                                                                                                                         document.form1.pkeyStr.value,
                                                                                                                         document.form1.n.value);
   } catch(error){
      console.log(error);
       alert(error);
   }
};
   
function sendToServer(){
   try{
      var c = gcd(document.form1.z.value,document.form1.n.value);
         if(!c.isUnit())
         {
            alert('gcd(z,N)!=1 ERROR!!!');
            return;
         }
      	var data = {};
			data.id = document.form1.id.value;
			data.p = document.form1.p.value;
         data.z = document.form1.aesZ.value;                                           
         data.x = document.form1.aesX.value; 
         var socket = io('/registration');
         socket.emit('add entry', data);
         socket.on('alert error',  function(data) {
            alert(data);});
      
   } catch(error){
      console.log(error);
       alert(error);
   }
}

function generateSalt(){
   try{
      document.form1.salt.value = hashValue(document.form1.id.value);
   }  catch(error){
      console.log(error);
       alert(error);
   }
}

function gcd(aa,bb) {
   
    var a = BigInteger(aa);
    var b = BigInteger(bb);
    if (a.isNegative() ) a = -a;
    if (b.isNegative() ) b = -b;
    if (b.compare(a)) {
      var temp = a; a = b; b = temp;
      }
    while (true) {
        if (b.isZero()) return a;
        a =a.remainder(b);
        if (a.isZero()) return b;
        b = b.remainder(a);
    }
}

function init(){
   try{
      generatePrime();
      generateToken();
   } catch(error){
       console.log(error);
       alert(error);
   }
}

function generatePrime(){
   try{
      var bits = 128;
      forge.prime.generateProbablePrime(bits, function(err, num) {
           document.form1.z.value = num;
      });
   } catch(error){
       console.log(error);
       alert(error);
   }
}

function generateToken(){
    try{
      document.form1.x.value =  forge.util.encode64(forge.random.getBytesSync(56));
   } catch(error){
       console.log(error);
       alert(error);
   }
}


function signAll(){
   try{
      var socket = io('/sign');
      socket.emit('sign all');
   }catch (error){
      console.log(error);
       alert(error);
   }
}

