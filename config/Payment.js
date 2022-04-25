
module.exports = {
  // 应用的 app_id
  app_id: 'wxa21ea61055789ebc',
  // 商户号
  mch_id: 'your-mch-id',
  // 32位签名密钥
  key: 'key-for-signature',
  // 默认回调地址，也可以在下单时单独设置来覆盖它，完整URL，不带参数
  notify_url: 'http://xxx.com/pay/notify',
  // 证书地址，Node.js 只需要 apiclient_cert.p12 证书文件即可
  cert_path: 'path/to/your/apiclient_cert.p12', // XXX: 绝对路径！！！！
};
