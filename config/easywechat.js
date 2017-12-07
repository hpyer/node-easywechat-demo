
module.exports = {
  // 微信公众号的 app key
  appKey: 'wxe3ddafb949eb3d8b',
  // 微信公众号的 app secret
  appSecret: 'f2a408802fdd5fb8ecb860ec4c973c74',
  // 微信公众号的 token
  token: '1q2w3e4r5t6y7u8i9o0p',

  // 网页授权认证
  oauth: {
    // 网页授权类型
    scope: 'snsapi_userinfo',
    // 网页授权回调地址，完整的URL
    redirect: 'http://node-easywecaht.hpyer.cn/wxlogin/callback'
  }
};
