
module.exports = {
  // 微信公众号的 app key
  appKey: 'wxe3ddafb949eb3d8b',
  // 微信公众号的 app secret
  appSecret: 'f2a408802fdd5fb8ecb860ec4c973c74',
  // 微信公众号的 token
  token: '1q2w3e4r5t6y7u8i9o0p',

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
    redirect: 'http://node-easywecaht.hpyer.cn/wxlogin/callback'
  }
};
