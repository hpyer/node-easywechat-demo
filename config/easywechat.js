
module.exports = {
  // 微信公众号的 app key
  appKey: '',
  // 微信公众号的 app secret
  appSecret: '',
  // 微信公众号的 token
  token: '',

  // 网页授权认证
  oauth: {
    // 网页授权类型
    scope: 'snsapi_userinfo',
    // 网页授权回调地址，完整的URL
    redirect: 'http://www.test.com/wxlogin/callback'
  }
};
