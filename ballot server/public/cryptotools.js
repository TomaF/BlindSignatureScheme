function strToBigInt(s) {
   var eb = forge.util.createBuffer();
   eb.putBytes(s);
   return new BigInteger(eb.toHex(), 16);
}

function bigIntToStr(bigInt) {
  var yhex = bigInt.toString(16);
  var ed = forge.util.createBuffer();
  ed.putBytes(forge.util.hexToBytes(yhex));
  return ed.getBytes();
}

function hashValue(data, type) {
  try{
   type = type || "sha256";
   var md;
   switch(type) {
      case "md5": md = forge.md.md5.create();  break;
      case "sha1": md = forge.md.sha1.create();  break;
      default: md = forge.md.sha256.create();
   }
   md.start();  
  arrayDataBase64 = [data];
  for (var i = 0; i < arrayDataBase64.length; i++) {
                    md.update(arrayDataBase64[i]);
                }
   return forge.util.encode64(md.digest().getBytes());
  } catch(error){
    return error;
  }
};




function generateSymKey(password, salt) {
   var pass = forge.util.decode64(password);
   var s = forge.util.decode64(salt);
   var derivedKey = forge.pkcs5.pbkdf2(pass, s, 32000, 32 , forge.md.sha1.create());
   return  forge.util.encode64(derivedKey);
};


 function bytesToString (bytes) {
            var string = '';
            for (var i = 0; i < bytes.length; i++) {
                string += String.fromCharCode(bytes[i]);
            }
            return string;
        }

 function bytesFromString(str) {
            var bytes = [];
            for (var i = 0; i < str.length; i++) {
                bytes.push(str.charCodeAt(i));
            }
            return bytes;
        }

 function extract(concatData, offset, size) {
            try {  
                var concatDataBytes = bytesFromString(concatData);
                var dataSubsetBytes = concatDataBytes.slice(offset, size);
                return bytesToString(dataSubsetBytes);
            } catch (error) {
              return error;
            }
        }

function symEncrypt(data,keyB64) {
  try{
      var initVec = forge.random.getBytesSync(12);
      var key = forge.util.decode64(keyB64);
      // Create a byte buffer for data.
      var dataBuffer = new forge.util.ByteBuffer(data);
      var cipher = forge.cipher.createCipher('AES-GCM', key);
      cipher.start({iv : initVec});
      cipher.update(dataBuffer);
      cipher.finish();
      var encryptedData = cipher.output.getBytes().toString();
      var gcmAuthTag = cipher.mode.tag.getBytes();
      encryptedData = encryptedData + gcmAuthTag.toString();
      var initVectorAndEncryptedData = initVec + encryptedData;
      var initVectorAndEncryptedDataBase64 = forge.util.encode64(initVectorAndEncryptedData);
      return initVectorAndEncryptedDataBase64;
  } catch(error){
   return error;
  }
};


function symDecrypt(initVectorAndEncryptedDataBase64,keyB64) {
   try{  
                //var key =  forge.util.decode64(keyB64);
                var key =  forge.util.decode64(keyB64);
                var cipher = forge.cipher.createDecipher('AES-GCM', key);

                var initVectorAndEncryptedData = forge.util.decode64(initVectorAndEncryptedDataBase64);
               
                var initVector = extract(initVectorAndEncryptedData,0,12);
                 
                var encryptedData = extract(initVectorAndEncryptedData,12,initVectorAndEncryptedData.length);
                // Only for the GCM mode
                var gcmAuthTagByteLength = 16;
                var offset = encryptedData.length - gcmAuthTagByteLength;

                    var gcmAuthTag = extract(encryptedData,
                            offset, encryptedData.length);

                    encryptedData = extract(encryptedData, 0, offset);

                    var gcmAuthTagBitLength = gcmAuthTagByteLength * 8;

                    cipher.start({
                        iv : initVector,
                        tagLength : gcmAuthTagBitLength,
                        tag : gcmAuthTag
                    });
               
                var encryptedDataBuffer = new forge.util.ByteBuffer(encryptedData);
                cipher.update(encryptedDataBuffer);
                cipher.finish();
                var outputBase64 = cipher.output.getBytes().toString();
                return outputBase64;
   } catch (error){
      return error;
   }
};

function registration(x,z,password,salt, pkeyStr,n) {
  try{
    var hash = hashValue(x);
    var b =  strToBigInt(hash);
    var enZ = asymEncrypt(z,pkeyStr, n);
    var pp = enZ.multiply(b);
    var p = pp.modPow(BigInteger(1),BigInteger(n));

    //p back to str
    var bytes = forge.util.encode64(bigIntToStr(p));
    
    var skey = generateSymKey(password, salt);
    var aesX = symEncrypt(x,skey);
    var aesZ = symEncrypt(z,skey);
    
    return [bytes,aesX,aesZ,hash];
  }
  catch (error) {
    return error;
  }
}

function _invmod ( a, n ) {
  var t = BigInteger('0');
  var nt = BigInteger('1');
  var r = n;
  var nr = a.modPow(BigInteger(1),n);
  var tmp;
  while (! nr.isZero() ) {
    var quot = r.divide(nr);
    tmp = nt;
    nt = t.subtract(quot.multiply(nt));
    t = tmp;
    tmp = nr;
    nr = r.subtract(quot.multiply(nr));
    r = tmp;
  };
  if ( r.compare(1) ) return BigInteger(0);
  if ( t.isNegative() ) t = t.add(n);
  return t;
}

function createSign(z,sign,n){
  try
  {
    var m = BigInteger(n);
    var s =  strToBigInt(forge.util.decode64(sign));
    var nz = _invmod(BigInteger(z),m);
    var res = nz.multiply(s).modPow(BigInteger(1),m);
    var result = bigIntToStr(res);
    return forge.util.encode64(result);
  } catch (error) {
    return error;
  }
}

function decryptValues(password, salt, aesX, aesZ){
   try{
    var skey = generateSymKey(password, salt);
    var x = symDecrypt(aesX,skey);
    var z = symDecrypt(aesZ,skey);
    var hash = hashValue(x);
    return [x,z,hash];
   } catch (error) {
    throw error;
  }
}

function proofOfKnow(cipher, signB64, pkey, n){
    try{
var a =  strToBigInt(forge.random.getBytesSync(128));
var r = asymEncrypt(a, pkey, n);
var c = hashValue(forge.util.decode64(cipher) + r);
var cc = strToBigInt(c);
var sign = strToBigInt(forge.util.decode64(signB64));
var tmp = asymEncrypt(sign,cc, n).multiply(a).modPow(BigInteger(1),n);
var s =  forge.util.encode64(bigIntToStr(tmp));
return [c,s];
    } catch(error){
        throw error;
    }
}
   
function verification(cipher,pkey, xx,c,s,n){
  try{
    var x = hashValue(xx);
   // alert(cipher +'\n'+pkey+'\n'+x+'\n'+c+'\n'+s+'\n'+n);
    var den =  asymEncrypt(strToBigInt(x), strToBigInt(c),n);
    var inv =  _invmod(den,BigInteger(n));
    var ss = asymEncrypt(strToBigInt(forge.util.decode64(s)), pkey, n);
    var r =  ss.multiply(inv).modPow(BigInteger(1),n);
    var cc = hashValue(forge.util.decode64(cipher) + r);
    var verify = (c===cc);
    return verify;
  }
  catch (error) {
    return error;
  }
}

function verify(signature, x, pkeyStr,n) {
  try{
    var i = asymEncrypt(strToBigInt(forge.util.decode64(signature)), pkeyStr,n);
    var signed = bigIntToStr(i);
    var hash = hashValue(x);
    var verify = (hash===signed)+"\nsigned value: \n"+ signed +"\nhash(x): \n"+ hash;
    return verify;
  }
  catch (error) {
    return error;
  }
}

function asymEncrypt(m, key, n){
 var result = BigInteger(m).modPow(BigInteger(key),BigInteger(n));
  return BigInteger(result);
}

function blindSign(dataStr,skey, n) {
   var num = asymEncrypt(strToBigInt(forge.util.decode64(dataStr)), skey,n);//rase in power of d mod N
   return forge.util.encode64(bigIntToStr(num));
}
function generateAsymKeys(){
   try{
         var keys = forge.pki.rsa.generateKeyPair(1024,65537);
         var pkey = keys.publicKey.e.toString();
         var key = keys.privateKey;
         var skey = key.d;
         var n = big.BigInteger(key.n).toString();
         return [pkey, skey,n];
   } catch(error){
      throw error;
   }
}

function forgeAsymEncrypt(data,publicKeyPem) {
  try {
    var publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    var deriver = new forge.kem.kdf1(forge.md.sha256.create());
    var kem = forge.kem.rsa.create(deriver);
    var result = kem.encrypt(publicKey, 16);
    var iv = forge.random.getBytesSync(12);
    var cipher = forge.cipher.createCipher( 'AES-GCM', result.key);
    cipher.start({iv: iv});
    cipher.update(forge.util.createBuffer(data));
    cipher.finish();
    var encryptedData = cipher.output.getBytes();
    var tag = cipher.mode.tag.getBytes();                           
    var output = result.encapsulation.toString() + iv.toString() + encryptedData.toString() + tag.toString();
    return forge.util.encode64(output);
  } catch (error) {
    return error;
  }
}


