const fs = require("fs");

const PLAIN_FILE_OPEN_ERROR = -1
const KEY_FILE_OPEN_ERROR = -2
const CIPHER_FILE_OPEN_ERROR = -3
const OK = 1
const PARAM_ERROR = -1


/*初始置换表IP*/
const IP_Table = [57, 49, 41, 33, 25, 17, 9, 1,
  59, 51, 43, 35, 27, 19, 11, 3,
  61, 53, 45, 37, 29, 21, 13, 5,
  63, 55, 47, 39, 31, 23, 15, 7,
  56, 48, 40, 32, 24, 16, 8, 0,
  58, 50, 42, 34, 26, 18, 10, 2,
  60, 52, 44, 36, 28, 20, 12, 4,
  62, 54, 46, 38, 30, 22, 14, 6];
/*逆初始置换表IP^-1*/
const IP_1_Table = [39, 7, 47, 15, 55, 23, 63, 31,
  38, 6, 46, 14, 54, 22, 62, 30,
  37, 5, 45, 13, 53, 21, 61, 29,
  36, 4, 44, 12, 52, 20, 60, 28,
  35, 3, 43, 11, 51, 19, 59, 27,
  34, 2, 42, 10, 50, 18, 58, 26,
  33, 1, 41, 9, 49, 17, 57, 25,
  32, 0, 40, 8, 48, 16, 56, 24];

/*扩充置换表E*/
const E_Table = [31, 0, 1, 2, 3, 4,
  3, 4, 5, 6, 7, 8,
  7, 8, 9, 10, 11, 12,
  11, 12, 13, 14, 15, 16,
  15, 16, 17, 18, 19, 20,
  19, 20, 21, 22, 23, 24,
  23, 24, 25, 26, 27, 28,
  27, 28, 29, 30, 31, 0];

/*置换函数P*/
const P_Table = [15, 6, 19, 20, 28, 11, 27, 16,
  0, 14, 22, 25, 4, 17, 30, 9,
  1, 7, 23, 13, 31, 26, 2, 8,
  18, 12, 29, 5, 21, 10, 3, 24];

/*S盒*/
const S =
  /*S1*/
  [[[14, 4, 13, 1, 2, 15, 11, 8, 3, 10, 6, 12, 5, 9, 0, 7],
  [0, 15, 7, 4, 14, 2, 13, 1, 10, 6, 12, 11, 9, 5, 3, 8],
  [4, 1, 14, 8, 13, 6, 2, 11, 15, 12, 9, 7, 3, 10, 5, 0],
  [15, 12, 8, 2, 4, 9, 1, 7, 5, 11, 3, 14, 10, 0, 6, 13]],
  /*S2*/
  [[15, 1, 8, 14, 6, 11, 3, 4, 9, 7, 2, 13, 12, 0, 5, 10],
  [3, 13, 4, 7, 15, 2, 8, 14, 12, 0, 1, 10, 6, 9, 11, 5],
  [0, 14, 7, 11, 10, 4, 13, 1, 5, 8, 12, 6, 9, 3, 2, 15],
  [13, 8, 10, 1, 3, 15, 4, 2, 11, 6, 7, 12, 0, 5, 14, 9]],
  /*S3*/
  [[10, 0, 9, 14, 6, 3, 15, 5, 1, 13, 12, 7, 11, 4, 2, 8],
  [13, 7, 0, 9, 3, 4, 6, 10, 2, 8, 5, 14, 12, 11, 15, 1],
  [13, 6, 4, 9, 8, 15, 3, 0, 11, 1, 2, 12, 5, 10, 14, 7],
  [1, 10, 13, 0, 6, 9, 8, 7, 4, 15, 14, 3, 11, 5, 2, 12]],
  /*S4*/
  [[7, 13, 14, 3, 0, 6, 9, 10, 1, 2, 8, 5, 11, 12, 4, 15],
  [13, 8, 11, 5, 6, 15, 0, 3, 4, 7, 2, 12, 1, 10, 14, 9],
  [10, 6, 9, 0, 12, 11, 7, 13, 15, 1, 3, 14, 5, 2, 8, 4],
  [3, 15, 0, 6, 10, 1, 13, 8, 9, 4, 5, 11, 12, 7, 2, 14]],
  /*S5*/
  [[2, 12, 4, 1, 7, 10, 11, 6, 8, 5, 3, 15, 13, 0, 14, 9],
  [14, 11, 2, 12, 4, 7, 13, 1, 5, 0, 15, 10, 3, 9, 8, 6],
  [4, 2, 1, 11, 10, 13, 7, 8, 15, 9, 12, 5, 6, 3, 0, 14],
  [11, 8, 12, 7, 1, 14, 2, 13, 6, 15, 0, 9, 10, 4, 5, 3]],
  /*S6*/
  [[12, 1, 10, 15, 9, 2, 6, 8, 0, 13, 3, 4, 14, 7, 5, 11],
  [10, 15, 4, 2, 7, 12, 9, 5, 6, 1, 13, 14, 0, 11, 3, 8],
  [9, 14, 15, 5, 2, 8, 12, 3, 7, 0, 4, 10, 1, 13, 11, 6],
  [4, 3, 2, 12, 9, 5, 15, 10, 11, 14, 1, 7, 6, 0, 8, 13]],
  /*S7*/
  [[4, 11, 2, 14, 15, 0, 8, 13, 3, 12, 9, 7, 5, 10, 6, 1],
  [13, 0, 11, 7, 4, 9, 1, 10, 14, 3, 5, 12, 2, 15, 8, 6],
  [1, 4, 11, 13, 12, 3, 7, 14, 10, 15, 6, 8, 0, 5, 9, 2],
  [6, 11, 13, 8, 1, 4, 10, 7, 9, 5, 0, 15, 14, 2, 3, 12]],
  /*S8*/
  [[13, 2, 8, 4, 6, 15, 11, 1, 10, 9, 3, 14, 5, 0, 12, 7],
  [1, 15, 13, 8, 10, 3, 7, 4, 12, 5, 6, 11, 0, 14, 9, 2],
  [7, 11, 4, 1, 9, 12, 14, 2, 0, 6, 10, 13, 15, 3, 5, 8],
  [2, 1, 14, 7, 4, 10, 8, 13, 15, 12, 9, 0, 3, 5, 6, 11]]];
/*置换选择1*/
const PC_1 = [56, 48, 40, 32, 24, 16, 8,
  0, 57, 49, 41, 33, 25, 17,
  9, 1, 58, 50, 42, 34, 26,
  18, 10, 2, 59, 51, 43, 35,
  62, 54, 46, 38, 30, 22, 14,
  6, 61, 53, 45, 37, 29, 21,
  13, 5, 60, 52, 44, 36, 28,
  20, 12, 4, 27, 19, 11, 3];

/*置换选择2*/
const PC_2 = [13, 16, 10, 23, 0, 4, 2, 27,
  14, 5, 20, 9, 22, 18, 11, 3,
  25, 7, 15, 6, 26, 19, 12, 1,
  40, 51, 30, 36, 46, 54, 29, 39,
  50, 44, 32, 46, 43, 48, 38, 55,
  33, 52, 45, 41, 49, 35, 28, 31];

/*对左移次数的规定*/
const MOVE_TIMES = [1, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1];

// 数组填充
function memset(obj, fill, length, first= 0){
  for (let i = 0; i < length; i++) {
    obj[i + first] = fill;
  }
}

function memcpy(tmp, len, data, count){
  for (let i = 0; i < count; i++) {
    tmp[i+len] = data[i];
  }
  return tmp;
}

class DES {
  static ByteToBit(ch, bit = null) {
    if (bit == null) {
      return PARAM_ERROR;
    }
    let cnt = 0;
    for (cnt = 0; cnt < 8; cnt++) {
      bit[cnt] = ch >> cnt & 1;
    }
    return bit.join("");
  }

  static BitToByte(bit, ch) {
    if ((bit == null)) {
      return PARAM_ERROR;
    }
    let cnt = 0;
    for (cnt = 0; cnt < 8; cnt++) {
      ch = ch | bit[cnt] << cnt;
    }
    return ch;
  }

  static Char8ToBit64(str, bit_str) {
    bit_str = Array(64).fill(0);
    const result_bit = [];
    for (let cnt = 0; cnt < 8; cnt++) {
      if(typeof(str[cnt]) ==  "number"){
        let result = DES.ByteToBit(str[cnt], bit_str.slice(cnt * 8, 8*(cnt+1)))
        result_bit.push(result)
      }else{
        let result = DES.ByteToBit(str[cnt].charCodeAt(), bit_str.slice(cnt * 8, 8*(cnt+1)))
        result_bit.push(result)
      }
      
    }
    return result_bit.join("").split("")
  }

  static Bit64ToChar8(bit, ch) {
    if (bit == null) {
      return PARAM_ERROR;
    }
    const result_str = [];
    let cnt = 0;
    for (cnt = 0; cnt < 8; cnt++) {
      let result = DES.BitToByte(bit.slice(cnt * 8, 8*(cnt+1)), 0);
      result_str.push(result)
    }
    return result_str
  }

  static DES_MakeSubKeys(key, subKeys) {
    if (key == null)
    {
      return PARAM_ERROR;
    }
  
    let temp = Array(56).fill(0);
    let cnt = 0;
    temp = DES.DES_PC1_Transform(key, temp);
    
    if ( temp < 0)/*PC1�û�*/
    {
      return -2;
    }
    const resultKeys = [];
    for (cnt = 0; cnt < 16; cnt++) {/*16�ֵ���������16������Կ*/
      temp = DES.DES_ROL(temp, MOVE_TIMES[cnt]);/*ѭ������*/
      let result = DES.DES_PC2_Transform(temp, subKeys[cnt]);
      resultKeys.push([...result]);
    }
    return resultKeys;
  }

  static DES_PC1_Transform(key, tempbts) {
    if ((key == null) || (tempbts == null))
    {
      return PARAM_ERROR;
    }

    let cnt = 0;
    for (cnt = 0; cnt < 56; cnt++) {
      tempbts[cnt] = key[PC_1[cnt]];
    }
    return tempbts;
  }

  static DES_PC2_Transform(key, tempbts) {
    if ((key == null) || (tempbts == null))
    {
      return PARAM_ERROR;
    }
    let cnt = 0;
    for (cnt = 0; cnt < 48; cnt++) {
      tempbts[cnt] = key[PC_2[cnt]];
    }
    return tempbts;
  }

  static DES_ROL(data, time) {
    if ((data == null) || (time < 0))
    {
      return PARAM_ERROR;
    }
  
    let temp = Array(56).fill(0);
  
    /*���潫Ҫѭ���ƶ����ұߵ�λ*/
    memcpy(temp,0, data, time);
    memcpy(temp,time, data.slice(28), time);
  
    /*ǰ28λ�ƶ�*/
    memcpy(data,0, data.slice(time), 28 - time);
    memcpy(data,28 - time, temp, time);
  
    /*��28λ�ƶ�*/
    memcpy(data, 28, data.slice(28 + time), 28 - time);
    memcpy(data, 56 - time, temp.slice(time), time);
    return data;
  }

  static DES_IP_Transform(data) {
    let cnt = 0;
    let temp = Array(64).fill(0);
    for (cnt = 0; cnt < 64; cnt++) {
      temp[cnt] = data[IP_Table[cnt]];
    }
    // memcpy(data, temp, 64);
    data = temp;
    return data;
  }

  static DES_IP_1_Transform(data) {
    let cnt = 0;
    let temp = Array(64).fill(0);
    for (cnt = 0; cnt < 64; cnt++) {
      temp[cnt] = data[IP_1_Table[cnt]];
    }
    // memcpy(data, temp, 64);
    data = temp;
    return data;
  }

  static DES_E_Transform(data) {
    let cnt = 0;
    let temp = Array(48).fill(0);
    for (cnt = 0; cnt < 48; cnt++) {
      temp[cnt] = data[E_Table[cnt]];
    }
    data = temp;
    return data;
  }

  static DES_P_Transform(data) {
    let cnt = 0;
    let temp = Array(32).fill(0);
    for (cnt = 0; cnt < 32; cnt++) {
      temp[cnt] = data[P_Table[cnt]];
    }
    data = memcpy(data, 0, temp, 32)
    return data;
  }

  static DES_XOR(R, L, count) {
    // console.log(count, R)
    let cnt = 0;
    for (cnt = 0; cnt < count; cnt++) {
      R[cnt] ^= L[cnt];
    }
    return R;
  }

  static DES_SBOX(data) {
    let cnt = 0;
    let line = 0;
    let row = 0;
    let output = 0;
    let cur1 = 0, cur2 = 0;
    for (cnt = 0; cnt < 8; cnt++) {
      cur1 = cnt * 6;
      cur2 = cnt << 2;
  
      /*������S���е�������*/
      line = (data[cur1] << 1) + data[cur1 + 5];
      row = (data[cur1 + 1] << 3) + (data[cur1 + 2] << 2)
        + (data[cur1 + 3] << 1) + data[cur1 + 4];
      output = S[cnt][line][row];
  
      /*��Ϊ2����*/
      data[cur2] = (output & 0X08) >> 3;
      data[cur2 + 1] = (output & 0X04) >> 2;
      data[cur2 + 2] = (output & 0X02) >> 1;
      data[cur2 + 3] = output & 0x01;
    }
    return data;
  }

  static DES_Swap(left, right) {
    let temp = [];
    // memcpy(temp,0, left, 32);
    // memcpy(left,0, right, 32);
    // memcpy(right,0, temp, 32);
    
    temp = right;
    temp =temp.concat(left);
    return temp;
  }

  static DES_EncryptBlock(plainBlock, subKeys, cipherBlock) {
    if ((plainBlock == null) || (subKeys == null) || (cipherBlock == null)){
      return PARAM_ERROR;
    }
  
    let plainBits = Array(64).fill(0);
    let copyRight = Array(48).fill(0);
    let cnt = 0;
    plainBits = DES.Char8ToBit64(plainBlock, plainBits);
    plainBits = DES.DES_IP_Transform(plainBits);
    // 以上都正确
    
    for (cnt = 0; cnt < 16; cnt++) {
      memcpy(copyRight,0, plainBits.slice(32), 32);
      
      copyRight = DES.DES_E_Transform(copyRight);
      copyRight = DES.DES_XOR(copyRight, subKeys[cnt], 48);
      copyRight = DES.DES_SBOX(copyRight);
      copyRight = DES.DES_P_Transform(copyRight);
      plainBits = DES.DES_XOR(plainBits, copyRight, 32);
      if (cnt != 15) {
        plainBits = DES.DES_Swap(plainBits.slice(0,32), plainBits.slice(32));
      }
    }
    plainBits = DES.DES_IP_1_Transform(plainBits);
    
    cipherBlock = DES.Bit64ToChar8(plainBits, cipherBlock);
    // for (const t of cipherBlock) {
    //   console.log(t.toString(16))
    // }
    return cipherBlock;
  }

  static DES_DecryptBlock(cipherBlock, subKeys, plainBlock) {
    let cipherBits = Array(64).fill(0);
    let copyRight = Array(48).fill(0);
    let cnt = 0;
    
    cipherBits = DES.Char8ToBit64(cipherBlock, cipherBits);
    cipherBits = DES.DES_IP_Transform(cipherBits);
    for (cnt = 15; cnt >= 0; cnt--) {
      memcpy(copyRight,0, cipherBits.slice(32), 32);
      copyRight = DES.DES_E_Transform(copyRight);
      copyRight = DES.DES_XOR(copyRight, subKeys[cnt], 48);
      copyRight = DES.DES_SBOX(copyRight);
      copyRight = DES.DES_P_Transform(copyRight);
      cipherBits = DES.DES_XOR(cipherBits, copyRight, 32);
      if (cnt != 0) {
        cipherBits = DES.DES_Swap(cipherBits.slice(0,32), cipherBits.slice(32));
      }
    }

    cipherBits = DES.DES_IP_1_Transform(cipherBits);
    
    plainBlock = DES.Bit64ToChar8(cipherBits, plainBlock);
    
    return plainBlock;
  }

  /**
   * 加密文件返回二进制数据
   * @param {*} cszpSourceFileName  源文件名
   * @param {*} cszpKey             密码
   */
  static async EncryptFileBuffer(cszpSourceFileName, cszpKey) {
    if ((cszpSourceFileName == null) || (cszpKey == null))
    {
      return PARAM_ERROR;
    }
    let plain = null;
    let count = 0;
    let plainBlock = Buffer.alloc(8);
    let cipherBlock = Array(8).fill(0);
    let keyBlock = Array(8).fill(0);
    let bKey = Array(64).fill(0);
    let subKeys = Array(16).fill(Array(48).fill(0));

    if(!fs.existsSync(cszpSourceFileName)){
      return PLAIN_FILE_OPEN_ERROR;
    }

    plain = fs.readFileSync(cszpSourceFileName);

    memcpy(keyBlock,0, cszpKey, 8);
    bKey = DES.Char8ToBit64(keyBlock, bKey);
    subKeys = DES.DES_MakeSubKeys(bKey, subKeys);

    let pwdBuffer = [];

    let cnt = 0;
    pwdBuffer = await new Promise((res)=>{
      while(1){
        plainBlock = plain.slice(8*cnt, 8*(cnt+1));
        count =  plainBlock.length;
        if(count === 8){
          cipherBlock = DES.DES_EncryptBlock(plainBlock, subKeys, cipherBlock);
          pwdBuffer.push(...cipherBlock);
        }else{
          break;
        }
        cnt++;
      }
  
      if (count){
        let plainBlockArr = [...plainBlock];
        for (let i = 0; i < 7 - count; i++) {
          plainBlockArr.push("\0");
        }
        // memset(plainBlockArr.slice(count), '\0', 7 - count, count);
        /*最后一个字符保存包括最后一个字符在内的所填充的字符数量*/
        plainBlockArr[7] = 8 - count;
        cipherBlock = DES.DES_EncryptBlock(plainBlockArr, subKeys, cipherBlock);
        pwdBuffer.push(...cipherBlock)
      }
      res(pwdBuffer);
    })
    return Buffer.from(pwdBuffer);
  }

  /**
   * 加密文件
   * @param {*} cszpSourceFileName  源文件名
   * @param {*} cszpPwdFileName     目标文件名
   * @param {*} cszpKey             密码
   */
  static async EncryptFile(cszpSourceFileName, cszpPwdFileName, cszpKey) {
    if ((cszpSourceFileName == null) || (cszpPwdFileName == null) || (cszpKey == null))
    {
      return PARAM_ERROR;
    }
    let plain = null, cipher = null;
    let count = 0;
    let plainBlock = Buffer.alloc(8);
    let cipherBlock = Array(8).fill(0);
    let keyBlock = Array(8).fill(0);
    let bKey = Array(64).fill(0);
    let subKeys = Array(16).fill(Array(48).fill(0));

    if(!fs.existsSync(cszpSourceFileName)){
      return PLAIN_FILE_OPEN_ERROR;
    }

    plain = fs.readFileSync(cszpSourceFileName);
    cipher = fs.createWriteStream(cszpPwdFileName);

    memcpy(keyBlock,0, cszpKey, 8);
    bKey = DES.Char8ToBit64(keyBlock, bKey);
    subKeys = DES.DES_MakeSubKeys(bKey, subKeys);

    let cnt = 0;
    cipher.on("open", ()=>{
      while(1){
        plainBlock = plain.slice(8*cnt, 8*(cnt+1));
        count =  plainBlock.length;
        if(count === 8){
          cipherBlock = DES.DES_EncryptBlock(plainBlock, subKeys, cipherBlock);
          let cipbuf = Buffer.from(cipherBlock); 
          cipher.write(cipbuf);
        }else{
          break;
        }
        cnt++;
      }
  
      if (count){
        let plainBlockArr = [...plainBlock];
        for (let i = 0; i < 7 - count; i++) {
          plainBlockArr.push("\0");
        }
        // memset(plainBlockArr.slice(count), '\0', 7 - count, count);
        /*最后一个字符保存包括最后一个字符在内的所填充的字符数量*/
        plainBlockArr[7] = 8 - count;
        cipherBlock = DES.DES_EncryptBlock(plainBlockArr, subKeys, cipherBlock);
        let cipbuf = Buffer.from(cipherBlock); 
        cipher.write(cipbuf);
      }
      cipher.close();
    });
    
    cipher.on('error', (err) => { console.log("cuowu"); });
    cipher.on('finish', () => { console.log("加密文件结束");});
  }

  /**
   * 解密文件返回二进制数据
   * @param {*} cszpPwdFileName     加密文件名
   * @param {*} cszpKey             密码
   */
  static async DecryptFileBuffer(cszpPwdFileName, cszpKey) {
    let plain = null, cipher = null;
    let count,times = 0;
    let plainBlock = Buffer.alloc(8);
    let cipherBlock = Array(8).fill(0);
    let keyBlock = Array(8).fill(0);
    let bKey = Array(64).fill(0);
    let subKeys = Array(16).fill(Array(48).fill(0));

    if(!fs.existsSync(cszpPwdFileName)){
      return PLAIN_FILE_OPEN_ERROR;
    }

    cipher = fs.readFileSync(cszpPwdFileName);

    memcpy(keyBlock,0, cszpKey, 8);
    bKey = DES.Char8ToBit64(keyBlock, bKey);
    subKeys = DES.DES_MakeSubKeys(bKey, subKeys);

    let plainBuffer = [];
    let cnt = 0;
    plainBuffer = await new Promise((res)=>{
      while(1){
        cipherBlock = cipher.slice(8*cnt, 8*(cnt+1));
        count =  cipherBlock.length;
        plainBlock = DES.DES_DecryptBlock(cipherBlock, subKeys, plainBlock);
        times += 8
        if(times < cipher.length){
          plainBuffer.push(...plainBlock)
        }else{
          break;
        }
        cnt++;
      }
      /*判断末尾是否被填充*/
      let plainBlockArr = [...plainBlock];
      if (plainBlockArr[7] < 8) {
        for (count = 8 - plainBlockArr[7]; count < 7; count++) {
          if (String.fromCharCode(plainBlockArr[count]) != '\0') {
            break;
          }
        }
      }
      if (count == 7) {/*有填充*/
        plainBuffer.push(...plainBlock.slice(0, 8-plainBlockArr[7]))
      }
      else {/*无填充*/
        plainBuffer.push(...plainBlock)
      }
      res(plainBuffer);
    })

    return Buffer.from(plainBuffer);
  }

  /**
   * 解密文件
   * @param {*} cszpPwdFileName     加密文件名
   * @param {*} cszpResultFileName  解密文件名
   * @param {*} cszpKey             密码
   */
  static async DecryptFile(cszpPwdFileName, cszpResultFileName, cszpKey) {
    let plain = null, cipher = null;
    let count,times = 0;
    let plainBlock = Buffer.alloc(8);
    let cipherBlock = Array(8).fill(0);
    let keyBlock = Array(8).fill(0);
    let bKey = Array(64).fill(0);
    let subKeys = Array(16).fill(Array(48).fill(0));

    if(!fs.existsSync(cszpPwdFileName)){
      return PLAIN_FILE_OPEN_ERROR;
    }

    cipher = fs.readFileSync(cszpPwdFileName);
    plain = fs.createWriteStream(cszpResultFileName);

    memcpy(keyBlock,0, cszpKey, 8);
    bKey = DES.Char8ToBit64(keyBlock, bKey);
    subKeys = DES.DES_MakeSubKeys(bKey, subKeys);

    let cnt = 0;
    await (new Promise(res=>{
      plain.on("open", ()=>{
        while(1){
          cipherBlock = cipher.slice(8*cnt, 8*(cnt+1));
          count =  cipherBlock.length;
          plainBlock = DES.DES_DecryptBlock(cipherBlock, subKeys, plainBlock);
          times += 8
          if(times < cipher.length){
            let cipbuf = Buffer.from(plainBlock);
            plain.write(cipbuf);
          }else{
            break;
          }
          cnt++;
        }
        /*判断末尾是否被填充*/
        let plainBlockArr = [...plainBlock];
        if (plainBlockArr[7] < 8) {
          for (count = 8 - plainBlockArr[7]; count < 7; count++) {
            if (String.fromCharCode(plainBlockArr[count]) != '\0') {
              break;
            }
          }
        }
        if (count == 7) {/*有填充*/
          let cipbuf = Buffer.from(plainBlockArr.slice(0, 8-plainBlockArr[7])); 
          plain.write(cipbuf);
        }
        else {/*无填充*/
          let cipbuf = Buffer.from(plainBlock); 
          plain.write(cipbuf);
        }
        plain.close()
        res();
      });
    }))

    plain.on('error', (err) => { console.log("cuowu"); });
    plain.on('finish', () => { console.log("解密文件结束"); });

    return OK;
  }

  /**
   * 加密字符串
   * @param {*} pszInText 明文
   * @param {*} cszpKey   密码
   */
  static EncryptText(pszInText, cszpKey) {
    if ((pszInText == null) || (cszpKey == null)){
      return "";
    }

    let count = 0;
    let plainBlock = Array(8).fill(0);
    let cipherBlock = Array(8).fill(0);
    let keyBlock = Array(8).fill(0);
    let bKey = Array(64).fill(0);
    let subKeys = Array(16).fill(Array(48).fill(0));

    let nSize = pszInText.length;
    let pchData = "";

    pchData = Array(nSize).fill(0);
    memcpy(pchData,0, pszInText, nSize);
    memcpy(keyBlock,0, cszpKey, 8);
    bKey = DES.Char8ToBit64(keyBlock, bKey);
    subKeys = DES.DES_MakeSubKeys(bKey, subKeys);
    
    let strData = "";
    let pch = pchData;
    
    let pch_index = 0;
    do
    {
      memset(plainBlock, 0, 8);
      let tmp = pch.slice(pch_index, pch_index+8);
      memcpy(plainBlock,0, tmp, tmp.length);
      let nLen = tmp.length;
      if (nLen < 8){
        count = nLen;
        break;
      }else{
        cipherBlock = DES.DES_EncryptBlock(plainBlock, subKeys, cipherBlock);
        for (const t of cipherBlock) {
          strData += String.fromCharCode(t)
        }
        pch_index += 8;
      }
    } while (true);

    if (count) {
      memset(plainBlock, '\0', 7 - count, count)
      plainBlock[7] = 8 - count;
      cipherBlock = DES.DES_EncryptBlock(plainBlock, subKeys, cipherBlock);
      for (const t of cipherBlock) {
        strData += String.fromCharCode(t)
      }
    }
    return strData;
  }

  /**
   * 解密字符串
   * @param {*} pszInText  密文
   * @param {*} cszpKey   密码
   */
  static DecryptText(pszInText, cszpKey) {
    if ((pszInText == null) || (cszpKey == null)){
      return "";
    }

    let count = 0;
    let times = 0;
    let plainBlock = Array(8).fill(0);
    let cipherBlock = Array(8).fill(0);
    let keyBlock = Array(8).fill(0);
    let bKey = Array(64).fill(0);
    let subKeys = Array(16).fill(Array(48).fill(0));


    let nSize = pszInText.length;
    let pchData = "";

    pchData = Array(nSize).fill(0);
    memcpy(pchData,0, pszInText, nSize);
    memcpy(keyBlock,0, cszpKey, 8);
    bKey = DES.Char8ToBit64(keyBlock, bKey);
    subKeys = DES.DES_MakeSubKeys(bKey, subKeys);
    
    let strData = "";
    let pch = pchData;
    let pch_index = 0;

    while (true) {
      /*密文的字节数一定是8的整数倍*/
      memset(cipherBlock, 0, 8);
      memset(plainBlock, 0, 8);
      let tmp = pch.slice(pch_index, pch_index+8);
      memcpy(cipherBlock,0, tmp, tmp.length);
      
      plainBlock = DES.DES_DecryptBlock(cipherBlock, subKeys, plainBlock);
      times += 8;
      pch_index += 8;
      if (times < nSize) {
        for (const t of plainBlock) {
          strData += String.fromCharCode(t)
        }
      }
      else {
        break;
      }
    }
    /*判断末尾是否被填充*/
    if (plainBlock[7] < 8) {
      for (count = 8 - plainBlock[7]; count < 7; count++) {
        let t = String.fromCharCode(plainBlock[count]);
        if (t != '\0') {
          break;
        }
      }
    }
    if (count == 7) {/*有填充*/
      memset(cipherBlock, 0, 8);
      memcpy(cipherBlock,0, plainBlock, 8 - plainBlock[7]);
      cipherBlock = cipherBlock.slice(0,8 - plainBlock[7]);
      // strData += cipherBlock;
      for (const t of cipherBlock) {
        strData += String.fromCharCode(t)
      }
    }
    else {/*无填充*/
      memset(cipherBlock, 0, 8);
      memcpy(cipherBlock,0, plainBlock, 8);
      // strData += cipherBlock;
      for (const t of cipherBlock) {
        strData += String.fromCharCode(t)
      }
    }

    return strData;
  }
}

module.exports = DES;
