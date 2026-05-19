/**
 * 鸡你太美加密算法
 * 
 * 词库（12个词）：对应12进制的 0~11
 * 通过密钥派生词表的排列顺序（置换密码）
 * 每个字节 (0-255) 用 3 个词表达（12^3 = 1728 > 255）
 * 词之间用分隔符「·」连接，每字节用「—」分隔
 */

const JNTM = (() => {
  // 原始词库
  const BASE_VOCAB = [
    '鸡你太美',
    '你干嘛哈哈',
    '就会爆炸',
    '会被融化',
    '唱',
    '跳',
    'rap',
    '篮球',
    '蔡徐坤',
    '两年半',
    '铁山靠',
    '练习生'
  ];

  const WORD_SEP  = '';    // 词与词之间无分隔符（12词首字符各异，贪心解析无歧义）
  const BYTE_SEP  = '—';   // 字节之间的分隔符

  /**
   * 用密钥派生伪随机数序列（简单线性同余）
   */
  function keyToSeed(key) {
    let seed = 0;
    for (let i = 0; i < key.length; i++) {
      seed = (seed * 131 + key.charCodeAt(i)) >>> 0;
    }
    return seed;
  }

  function lcgNext(seed) {
    // 线性同余生成器：a=1664525, c=1013904223, m=2^32
    return ((seed * 1664525 + 1013904223) >>> 0);
  }

  /**
   * 用密钥派生词表排列（Fisher-Yates 洗牌）
   */
  function deriveVocab(key) {
    const vocab = [...BASE_VOCAB];
    let seed = keyToSeed(key);
    for (let i = vocab.length - 1; i > 0; i--) {
      seed = lcgNext(seed);
      const j = seed % (i + 1);
      [vocab[i], vocab[j]] = [vocab[j], vocab[i]];
    }
    return vocab;
  }

  /**
   * 将单个字节编码为3个词直接拼接（base-12，高位在前）
   * byte: 0~255  ->  d2 d1 d0  (base-12)
   */
  function encodeByte(byte, vocab) {
    const d2 = Math.floor(byte / 144);      // 144 = 12^2
    const d1 = Math.floor((byte % 144) / 12);
    const d0 = byte % 12;
    return vocab[d2] + vocab[d1] + vocab[d0];
  }

  /**
   * 贪心解析：从拼接字符串中连续匹配3个词，还原单个字节
   * wordConcat: "词A词B词C"（词之间无分隔）
   */
  function decodeByte(wordConcat, vocab) {
    let pos = 0;
    const indices = [];
    for (let i = 0; i < 3; i++) {
      let matched = false;
      // 按词长降序尝试，优先匹配最长词（避免短词误匹配）
      const sorted = vocab.map((w, idx) => ({ w, idx }))
                          .sort((a, b) => b.w.length - a.w.length);
      for (const { w, idx } of sorted) {
        if (wordConcat.startsWith(w, pos)) {
          indices.push(idx);
          pos += w.length;
          matched = true;
          break;
        }
      }
      if (!matched) return null;
    }
    if (pos !== wordConcat.length) return null; // 有多余字符
    return indices[0] * 144 + indices[1] * 12 + indices[2];
  }

  /**
   * 加密：普通文本 → 鸡你太美语言
   */
  function encode(text, key) {
    if (!text) return '';
    const vocab = deriveVocab(key);

    // 将文本转为 UTF-8 字节数组
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);

    // 每字节编码为3个词，字节之间用 BYTE_SEP 隔开
    const parts = [];
    for (const b of bytes) {
      parts.push(encodeByte(b, vocab));
    }
    return parts.join(BYTE_SEP);
  }

  /**
   * 解密：鸡你太美语言 → 普通文本
   */
  function decode(cipher, key) {
    if (!cipher) return '';
    const vocab = deriveVocab(key);
    const vocab_clean = vocab.map(v => v.trim());

    // 按 BYTE_SEP 切分字节组
    const parts = cipher.trim().split(BYTE_SEP);
    const byteArr = [];

    for (const part of parts) {
      const b = decodeByte(part.trim(), vocab_clean);
      if (b === null) {
        return null; // 密钥错误或格式损坏
      }
      byteArr.push(b);
    }

    // UTF-8 字节数组 → 文本
    try {
      const decoder = new TextDecoder('utf-8', { fatal: true });
      return decoder.decode(new Uint8Array(byteArr));
    } catch (e) {
      return null;
    }
  }

  /**
   * 验证密钥合法性：4~8位，字母/数字
   */
  function validateKey(key) {
    if (!key) return '请输入密钥';
    if (key.length < 4) return '密钥至少4位';
    if (key.length > 8) return '密钥最多8位';
    if (!/^[a-zA-Z0-9\u4e00-\u9fa5]+$/.test(key)) return '密钥只能包含字母、数字或汉字';
    return null;
  }

  return {
    encode,
    decode,
    validateKey,
    deriveVocab,
    BASE_VOCAB,
    WORD_SEP,
    BYTE_SEP
  };
})();
