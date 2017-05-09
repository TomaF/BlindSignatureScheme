function proofOfKnow(cipher, sign, pkey, n){
    try{
var a =  strToBigInt(forge.random.getBytesSync(128));
var r = asymEncrypt(a, pkey, n);
var c = hashValue(cipher + r);
var cc = strToBigInt(c);
var s =  forge.util.encode64(bigIntToStr(asymEncrypt(sign,cc, n).multiply(a).modPow(BigInteger(1),n)));
return [c,s];
    } catch(error){
        throw error;
    }
}

function checkProofs(cipher,pkey, x,c,s,n){
    try{
    var den =  asymEncrypt(strToBigInt(x), strToBigInt(c),n);
    var inv =  _invmod(den,BigInteger(n));
    var ss = asymEncrypt(strToBigInt(forge.util.decode64(s)), pkey, n);
    var r =  ss.multiply(inv).modPow(BigInteger(1),n);
    var cc = hashValue(cipher + r);
    return cc;
    } catch (error){
        throw error;
    }
}

function proof(){
    try{
    
var pkey = '65537';
var skey = '41578192547847912334404909034234188499792817931691881406705606186813096919372161504163179761314794791409670399806575010128113730409382078042799385493773588700439864392695301235938809474114822398675148394253151109679525299014542432829898764010226470989380898558734978460528717998327796222845314854611572352833';
var n = '108260230632034510554624335453977195538773218466002814133939821718918153865907562514832829241846948996607690464526162353546531170037333065104924248196481534256280046675996953811210834791832545203279686741155607299776720095057210523540525645623654724179434074905287904866609596384161059407786542126978320214627';

    document.form1.n.value = n;
    document.form1.pkey.value = pkey;
    document.form1.skey.value = skey;
    var x =  hashValue('hello world');
    var sign = asymEncrypt(strToBigInt(x), skey, n);
    document.form1.x.value = x;
    document.form1.sign.value = sign;
    var cipher = 'vote';
    
    [ document.form1.c.value,  document.form1.s.value ]  = proofOfKnow(cipher, sign, pkey, n);
    document.form1.cc.value = checkProofs(cipher,sign, pkey, x, document.form1.c.value, document.form1.s.value,n);
    document.form1.valid.value = (document.form1.cc.value === document.form1.c.value);
    } catch (error){
        alert(error);
    }
}