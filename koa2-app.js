'use strict';

const Koa = require('koa');
const KoaSession = require('koa-session');
const KoaStatic = require('koa-static');

const EasyWechat = require('node-easywechat');

const serverConfig = require('./config/server');
const easywechatConfig = require('./config/easywechat');

const fs = require('fs');

const app = new Koa();

app.keys = serverConfig.keysKoa;

app.use(KoaSession(serverConfig.sessionKoa, app));
app.use(KoaStatic('./static/'));

app.use(async (ctx, next) => {
  if (ctx.path === '/favicon.ico') return;

  let easywechat = new EasyWechat(easywechatConfig);

  easywechat.setAppServerKoa2(ctx);

  if (ctx.path == '/wxlogin') {
    if (!ctx.session.wxuser) {
      let url = easywechat.oauth.redirect();
      ctx.redirect(url);
    }
    else {
      let user = ctx.session.wxuser;
      ctx.body = 'Hello ' + user.name;
    }
  }

  else if (ctx.path == '/wxlogin/callback') {
    let code = ctx.query.code;
    let user = await easywechat.oauth.user(code);
    ctx.session.wxuser = user;
    ctx.redirect('/wxlogin');
  }

  else if (ctx.path == '/notice') {
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
    ctx.body = '发送成功';
  }

  else if (ctx.path == '/server') {
    let handler = function (message) {
      console.log('received', message);

      switch (message.MsgType) {
        case 'text':
          // 关键字自动回复
          return new EasyWechat.Message.Text({
            content: '您说：' + message.Content
          });
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
  }

  else if (ctx.path == '/qrcode') {
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
    ctx.body = `
    <div><img width="200" height="200" src="/temporary.jpg" /><br>临时二维码（${seconds/60}分钟）</div>
    <div><img width="200" height="200" src="/forever.jpg" /><br>永久二维码</div>`;
  }

  else if (ctx.path == '/menu') {
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
  }

  else {
    easywechat.jssdk.setUrl(serverConfig.serverUrl + ctx.req.url);
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
    ctx.body = html;
  }
});

app.listen(serverConfig.serverPort);

console.log('Server running at http://127.0.0.1:' + serverConfig.serverPort + '/');
