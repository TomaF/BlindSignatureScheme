module.exports = function(big,forge) {
var module = {};

function strToBigInt(s) {
   try{
   var eb = forge.util.createBuffer();
   eb.putBytes(s);
   return new big.BigInteger(eb.toHex(), 16);
   } catch(error){
      throw error;
   }
}

function bigIntToStr(bigInt) {
   try{
  var yhex = big.BigInteger(bigInt).toString(16);
  var ed = forge.util.createBuffer();
  ed.putBytes(forge.util.hexToBytes(yhex));
  return ed.getBytes();
   } catch(error){
      throw error;
   }
}


 module.generateAsymKeys = function(){
   try{
         var keys = forge.pki.rsa.generateKeyPair(1024,65537);
         var pkey = big.BigInteger(keys.publicKey.e).toString();
         var key = keys.privateKey;
         var skey = big.BigInteger(key.d).toString();
         var n = big.BigInteger(key.n).toString();
         return [pkey, skey,n];
   } catch(error){
      throw error;
   }
};

function asymEncrypt(m, key, n){
   try{
 var result = big.BigInteger(m).modPow(big.BigInteger(key),big.BigInteger(n));
  return big.BigInteger(result);
   } catch(error){
      throw error;
   }
}

module.blindSign = function(dataStr,skey, n) {
   try{
   var num = asymEncrypt(strToBigInt(forge.util.decode64(dataStr)), skey,n);//rase in power of d mod N
   return forge.util.encode64(bigIntToStr(num));
   } catch(error){
      throw error;
   }
};
 function bytesFromString(str) {
            var bytes = [];
            for (var i = 0; i < str.length; i++) {
                bytes.push(str.charCodeAt(i));
            }

            return bytes;
        }

function  bytesToString(bytes) {
  var string = '';
  for (var i = 0; i < bytes.length; i++) {
    string += String.fromCharCode(bytes[i]);
    }
  return string;
}

function extract(concatData, offset, size) {
            try {
                var concatDataBytes = bytesFromString(concatData);
                var dataSubsetBytes = concatDataBytes.slice(offset, size);
                return bytesToString(dataSubsetBytes);
            } catch (error) {
                throw new exceptions.CryptoLibException(
                        "Data could not be bit-wise extracted.", error);
            }
        }

function parseParts(privateKey, encryptedData) {
        
            var ivLengthBytes = 12;
            var tagLengthBytes = 16;
            var encapsulationLengthBytes = privateKey.n.bitLength() / 8;

            var totalLenth = encryptedData.length;
            var totalKnownLength = encapsulationLengthBytes + ivLengthBytes + tagLengthBytes;
            var encryptedDataLength = totalLenth - totalKnownLength;

            var startIndexOfSecondPart = encapsulationLengthBytes;
            var startIndexOfThirdPart = startIndexOfSecondPart + ivLengthBytes;
            var startIndexOfFourthPart = startIndexOfThirdPart + encryptedDataLength;
            
          
            var encapsulation = extract(
                    encryptedData, 0,
                    startIndexOfSecondPart);

            var iv =extract(encryptedData,
                    startIndexOfSecondPart,
                    startIndexOfThirdPart);

            var data =extract(
                encryptedData,
                startIndexOfThirdPart,
                startIndexOfFourthPart);

            var tag = extract(
                encryptedData,
                startIndexOfFourthPart);
            
            return {
                encapsulation: encapsulation,
                iv: iv,
                data: data,
                tag: tag
            };
        }
        


module.forgeAsymDecrypt = function (encryptedData, privateKeyPem) {
  try {
    var data = forge.util.decode64(encryptedData);
    var privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    var encryptedDataParts = parseParts(privateKey, data);
    var deriver = new forge.kem.kdf1(forge.md.sha256.create());
    var kem = forge.kem.rsa.create(deriver);
    var key = kem.decrypt(privateKey, encryptedDataParts.encapsulation, 16);
    var decipher = forge.cipher.createDecipher('AES-GCM', key);
    decipher.start({iv: encryptedDataParts.iv, tag: encryptedDataParts.tag});
    decipher.update(forge.util.createBuffer(encryptedDataParts.data));
    var result = decipher.finish();
    if(result) {
        return decipher.output.getBytes();
    } else {
       console.log("Error while decrypting data.");
       return null;
     }

  } catch (error) {
   console.log('error in forgeAsymDecrypt '+error);
    return null;
  }
};

module.generatePemAsymKey = function() {
   try{
    var keys = forge.pki.rsa.generateKeyPair(1024,65537);
    var forgePublicKey = keys.publicKey;
    var forgePrivateKey = keys.privateKey;
    var publicKeyPem = forge.pki.publicKeyToPem(forgePublicKey);
    var privateKeyPem = forge.pki.privateKeyToPem(forgePrivateKey);
    return [publicKeyPem, privateKeyPem];
   }catch (error) {
    throw error;
  }

};
module.sha256 = function(data) {
  try{
   var md = forge.md.sha256.create();
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
function _invmod ( a, n ) {
  var t = big.BigInteger('0');
  var nt = big.BigInteger('1');
  var r = n;
  var nr = a.modPow(big.BigInteger(1),n);
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
  if ( r.compare(1) ) return big.BigInteger(0);
  if ( t.isNegative() ) t = t.add(n);
  return t;
}

module.verify = function(cipher,pkey, x,c,s,n) {
 try{
    var den =  asymEncrypt(strToBigInt(x), strToBigInt(c),n);
    var inv =  _invmod(den,big.BigInteger(n));
    var ss = asymEncrypt(strToBigInt(forge.util.decode64(s)), pkey, n);
    var r =  ss.multiply(inv).modPow(big.BigInteger(1),n);
    var cc = this.sha256(forge.util.decode64(cipher) + r);
    var verify = (c===cc);
    return verify;
  }
  catch (error) {
    console.log(error);
    return false;
  }
};

 return module;
};

