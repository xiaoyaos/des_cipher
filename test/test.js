const DES = require('../index');
const fs = require("fs");
(async ()=>{
  // 字符串加密
  // const result = AES.EncryptText("_+", "ArcVideo")
  // console.log("*-*-*",result)

  // 字符串加解密
  // const result1 = AES.DecryptText(result, "ArcVideo")
  // console.log("*-*-*["+result1+"]")

  // 获取文件加密的二进制数据
  // console.time("加密文件返回buffer")
  // const pwdBuffer = await DES.EncryptFileBuffer("./plain.txt", "test_password");
  // if(pwdBuffer.length){
  //   fs.writeFileSync("buffer.txt_aes", pwdBuffer)
  // }
  // console.timeEnd("加密文件返回buffer")

  // 获取文件解密的二进制数据
  // console.time("解密文件返回buffer")
  // const plainBuffer = await DES.DecryptFileBuffer("./buffer.txt_aes", "test_password")
  // if(plainBuffer.length){
  //   fs.writeFileSync("buffer.txt", plainBuffer)
  // }
  // console.timeEnd("解密文件返回buffer")

  // 加密文件
  // await DES.EncryptFile("./plain.txt", "./plain.txt_aes", "test_password");

  //解密文件
  await DES.DecryptFile("./plain.txt_aes", "./plain_1.txt", "test_password")
})()
