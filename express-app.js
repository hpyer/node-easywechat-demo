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
    <ul>
      <li><a href="/wxlogin">微信授权登录（请在微信中打开）</a></li>
      <li><a href="/notice">发送模板消息</a></li>
      <li><a href="/server?signature=9a39e983e5743d01e23507ad58ca3e90dbb9ebab&echostr=15947793626788132863&timestamp=1505801645&nonce=2830267549">服务器</a></li>
      <li><a href="/qrcode">生成二维码</a></li>
      <li><a href="/menu">自定义菜单</a></li>
    </ul>
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
    console.log('received', message);

    switch (message.MsgType) {
      case 'text':
        // 关键字自动回复
        if (message.Content == '图文') {
          let news1 = new EasyWechat.Message.News({
            title: '测试新闻11',
            description: '测试新闻描述11',
            url: 'https://www.baidu.com',
            image: 'http://img5.imgtn.bdimg.com/it/u=161888459,1712714238&fm=27&gp=0.jpg',
          });
          let news2 = new EasyWechat.Message.News({
            title: '测试新闻22',
            description: '测试新闻描述22',
            url: 'https://www.baidu.com',
            image: 'http://img5.imgtn.bdimg.com/it/u=161888459,1712714238&fm=27&gp=0.jpg',
          });
          let news3 = new EasyWechat.Message.News({
            title: '测试新闻33',
            description: '测试新闻描述33',
            url: 'https://www.baidu.com',
            image: 'http://img5.imgtn.bdimg.com/it/u=161888459,1712714238&fm=27&gp=0.jpg',
          });
          return [news1, news2, news3];
        }
        else {
          return new EasyWechat.Message.Text({
            content: '您说：' + message.Content
          });
        }
        break;
      case 'event':
        // 消息事件
        switch (message.Event) {
          case 'subscribe':
            // 用户关注
            break;
          case 'unsubscribe':
            // 用户取关
            break;
        }
        break;
      default:
    }

    // 返回空或者success，表示程序不做任何响应
    return;
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
  // 直接输出到浏览器
  res.type('image/png');
  res.send(new Buffer(qrcode, 'binary'));
  // 写入文件
  // fs.writeFileSync('./temporary.jpg', qrcode, 'binary');

  // // forever
  // result = await easywechat.qrcode.forever(1);
  // console.log('forever', result);
  // qrcode = await easywechat.qrcode.url(result.ticket);
  // // 直接输出到浏览器
  // res.type('image/png');
  // res.send(new Buffer(qrcode, 'binary'));
  // // 写入文件
  // // fs.writeFileSync('./temporary.jpg', qrcode, 'binary');
});

app.get('/menu', async function (req, res) {
  let buttons = [
    {
      type: 'click',
      name: '今日新闻',
      key: 'TODAY_NEWS'
    },
    {
      name: '新闻网站',
      sub_button: [
        {
          type: 'view',
          name: '新华网',
          url: 'http://www.xinhuanet.com/'
        },
        {
          type: 'view',
          name: '中国新闻网',
          url: 'http://www.chinanews.com/'
        }
      ]
    }
  ];
  let result = await easywechat.menu.add(buttons);
  console.log('add-menu', result);

  console.log('all-menu', await easywechat.menu.all());
  console.log('current-menu', await easywechat.menu.current());

  // // 销毁菜单
  // console.log('destory-menu', await easywechat.menu.destory());

  ctx.body = '菜单创建成功';
});

app.listen(serverConfig.serverPort, function () {
  console.log('Server running at http://127.0.0.1:' + serverConfig.serverPort + '/');
});
