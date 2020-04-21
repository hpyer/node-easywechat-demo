
module.exports = {
  // 微信公众号的 app key
  app_id: 'wxa21ea61055789ebc',
  // 微信公众号的 app secret
  secret: '2ad89ed91852e0302c9d7d48f35febf6',
  // 微信公众号的 token
  token: '1qaz2wsx3edc4rfv',
  // EncodingAESKey
  aes_key: '',

  // 网页授权认证
  oauth: {
    // 网页授权类型
    scope: 'snsapi_userinfo',
    // 网页授权回调地址，完整的URL
    callback: 'http://node-easywechat.hpyer.cn/wxlogin/callback'
  },
};
