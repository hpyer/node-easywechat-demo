'use strict';

const Express = require('express');
const ExpressSession = require('express-session');
const ExpressCookieParser = require('cookie-parser');

const EasyWechat = require('node-easywechat');

const serverConfig = require('./config/server');
const easywechatConfig = require('./config/easywechat');

const app = Express();

app.use(ExpressCookieParser());
app.use(ExpressSession(serverConfig.sessionExpress));

let easywechat = new EasyWechat(easywechatConfig);

app.get('/', async function (req, res) {
  easywechat.jssdk.setUrl(serverConfig.serverUrl + req.url);
  let jssdkConfig = await easywechat.jssdk.config(['onMenuShareTimeline', 'onMenuShareAppMessage'], true);
  let html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>微信公众号测试</title>
    <script src="//res.wx.qq.com/open/js/jweixin-1.2.0.js"></script>
  </head>
  <body>
    <div><a href="/wxlogin">微信授权登录（请在微信中打开）</a></div>
    <script>
    var wxConfig = ${jssdkConfig};
    wx.config(wxConfig);
    </script>
  </body>
  </html>
  `;
  res.send(html);
});

app.get('/wxlogin', function (req, res) {
  if (!req.session.wxuser) {
    let url = easywechat.oauth.redirect();
    res.redirect(url);
  }
  else {
    let user = req.session.wxuser;
    res.send('Hello ' + user.name);
  }
});

app.get('/wxlogin/callback', async function (req, res) {
  let code = req.query.code;
  let user = await easywechat.oauth.user(code);
  req.session.wxuser = user;
  res.redirect('/wxlogin');
});

app.use('/server', async function (req, res) {
  easywechat.setAppServerExpress(req, res);

  let handler = function (message) {
    console.log('aa', message);

    // easywechat.server.send('Hi');
    return 'Hi';
  };
  easywechat.server.setMessageHandler(handler);

  await easywechat.server.serve();
});

app.get('/notice', async function (req, res) {
  let openid = 'oj4-ZwX5jyygQmPU1pF-jWUznNNE';
  let templateid = 'VSTKsTPv7-eM7T5Rjf4AnNn-0E1ULEDDmjvDY7mxi04';
  let data = {
    first: {
      value: '恭喜你购买成功！'
    },
    name: ['巧克力', '#0000ff'],
    price: {
      value: '39.8元',
      color: '#ff0000'
    },
    remark: '欢迎再次购买！'
  };
  let result
  result = await easywechat.notice.send({
    touser: openid,
    template_id: templateid,
    data
  });
  console.log(result);
  res.send('发送成功');
});

app.get('/qrcode', async function (req, res) {
  // temporary
  let seconds = 300;
  let result, qrcode;
  result = await easywechat.qrcode.temporary(1, seconds);
  console.log('temporary', result);
  qrcode = await easywechat.qrcode.url(result.ticket);
  fs.writeFileSync('./static/temporary.jpg', qrcode, 'binary');

  // forever
  result = await easywechat.qrcode.forever(1);
  console.log('forever', result);
  qrcode = await easywechat.qrcode.url(result.ticket);
  fs.writeFileSync('./static/forever.jpg', qrcode, 'binary');

  res.send(`
  <div><img width="200" height="200" src="/temporary.jpg" /><br>临时二维码（${seconds/60}分钟）</div>
  <div><img width="200" height="200" src="/forever.jpg" /><br>永久二维码</div>`);
});

app.listen(serverConfig.serverPort, function () {
  console.log('Server running at http://127.0.0.1:' + serverConfig.serverPort + '/');
});
