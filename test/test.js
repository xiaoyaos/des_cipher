const DES = require('../index');
// 字符串加解密
// const result = AES.EncryptText("_+", "ArcVideo")
// console.log("*-*-*",result)

// const result1 = AES.DecryptText(result, "ArcVideo")
// console.log("*-*-*["+result1+"]")

//文件加解密
// DES.EncryptFile("./plain.txt", "./plain.txt_aes", "test_password");
 
DES.DecryptFile("./plain.txt_aes", "./plain_1.txt", "test_password")