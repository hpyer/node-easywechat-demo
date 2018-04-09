
module.exports = {
  // 微信公众号的 app key
  appKey: 'wxe3ddafb949eb3d8b',
  // 微信公众号的 app secret
  appSecret: 'f2a408802fdd5fb8ecb860ec4c973c74',
  // 微信公众号的 token
  token: '1q2w3e4r5t6y7u8i9o0p',
  // 微信公众号的 token
  aesKey: 'i5DyhTuCG3HvY0CjrCsuKfr0HKdzGb2EwSSpDyqrZmo',

  // access_token 的缓存名称
  access_token_cache_key: 'NODE_EASYWECHAT_ACCESS_TOKEN',

  // jssdk 的缓存名称
  jssdk_cache_key: 'NODE_EASYWECHAT_JSSKD_TICKET',

  // 缓存驱动，可选值：memory（内存存储）、file（文件存储），默认：memory
  cache_driver: 'file',
  // 缓存以文件存储时，需要的配置项
  cache_options: {
    path: './cache/', // 文件存储目录（请确保该目录有读写权限）
    fileMode: 0o666,  // 文件权限
    ext: '.cache'     // 文件扩展名
  },
  // // 自定义缓存驱动
  // // 您需要实现一个继承 EasyWechat.Cache.CacheInterface 的缓存驱动类
  // // 实例化以后赋值给 cache 选项即可
  // cache: customCacheDriver

  // 网页授权认证
  oauth: {
    // 网页授权类型
    scope: 'snsapi_userinfo',
    // 网页授权回调地址，完整的URL
    redirect: 'http://node-easywechat.hpyer.cn/wxlogin/callback'
  },

  // 支付
  payment: {
    // 商户号
    merchant_id: 'your-mch-id',
    // 签名密钥
    key: 'key-for-signature',
    // 默认回调地址，也可以在下单时单独设置来覆盖它，完整URL，不带参数
    notify_url: '默认的订单回调地址'
  }
};
