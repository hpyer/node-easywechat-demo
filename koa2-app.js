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
            case 'CLICK':
              // 菜单点击
              let res = 'success';
              if (message.EventKey == 'TODAY_NEWS') {
                res = '您点击了【今日新闻】菜单';
              }
              return res;
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
    // 直接输出到浏览器
    ctx.type = 'image/png';
    ctx.body = new Buffer(qrcode, 'binary');
    // 写入文件
    // fs.writeFileSync('./temporary.jpg', qrcode, 'binary');

    // // forever
    // result = await easywechat.qrcode.forever(1);
    // console.log('forever', result);
    // qrcode = await easywechat.qrcode.url(result.ticket);
    // // 直接输出到浏览器
    // ctx.type = 'image/png';
    // ctx.body = new Buffer(qrcode, 'binary');
    // // 写入文件
    // // fs.writeFileSync('./forever.jpg', qrcode, 'binary');
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

  else if (ctx.path == '/pay') {
    let order = {
      trade_type   : 'JSAPI', // JSAPI，NATIVE，APP...
      body         : '测试支付',
      detail       : '测试支付明细',
      out_trade_no : 'NODE_EASYWECHAT_1234567890',  // 商家的订单号
      total_fee    : 1, // 单位：分
      spbill_create_ip    : '111.222.111.222',
      notify_url   : 'http://example.com/pay/notify', // 需要完整的地址。支付结果通知网址，如果不设置则会使用配置里的默认地址
      openid       : 'oj4-ZwX5jyygQmPU1pF-jWUznNNE' // trade_type=JSAPI，此参数必传，用户在商户appid下的唯一标识
    };

    // 统一下单
    let res = await easywechat.payment.prepare(order);
    if (res.return_code != 'SUCCESS' || res.result_code != 'SUCCESS') {
      console.log('pay', res);
      ctx.body = '支付失败';
      return false;
    }
    let prepare_id = res.prepay_id;

    // WeixinJSBridge
    let config_jsbridge = easywechat.payment.configForPayment(prepare_id);
    // JSSDK，如果使用这种方式，jssdk.config的api列表里需要增加一个chooseWXPay
    let config_jssdk = easywechat.payment.configForJSSDKPayment(prepare_id);

    ctx.body = JSON.stringify({
      jsbridge: config_jsbridge,
      jssdk: config_jssdk
    });
  }

  else if (ctx.path == '/pay/notify') {
    let handler = function (notice, is_success) {
      // 签名验证已经在回调之前处理了，这里直接写业务逻辑即可
      // notice 是微信通知的所有参数，is_success表示result_code是否为SUCCESS
      console.log('notify', notice, is_success);

      // 返回 false 表示处理失败，微信会再次发送通知
      return true;
    };

    await easywechat.payment.handleNotify(handler);
  }

  else if (ctx.path == '/payment') {
    let handler = function (notice, is_success) {
      // 签名验证已经在回调之前处理了，这里直接写业务逻辑即可
      // notice 是微信通知的所有参数，is_success表示result_code是否为SUCCESS
      console.log('notify', notice, is_success);

      // 返回 false 表示处理失败，微信会再次发送通知
      return true;
    };

    await easywechat.payment.handleNotify(handler);
  }

  else {
    easywechat.jssdk.setUrl(serverConfig.serverUrl + ctx.req.url);
    let jssdkConfig = await easywechat.jssdk.config(['onMenuShareTimeline', 'onMenuShareAppMessage', 'chooseWXPay'], true);
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

      // --------- 支付(前端处理) begin ---------

      // 请求 /pay 接口
      // var res = null;

      // // WeixinJSBridge 方式
      // WeixinJSBridge.invoke(
      //   'getBrandWCPayRequest',
      //   {
      //     'appId': res.appId,     //公众号名称，由商户传入
      //     'timeStamp': res.timeStamp,         //时间戳，自1970年以来的秒数
      //     'nonceStr': res.nonceStr, //随机串
      //     'package': res.package,
      //     'signType': res.signType,         //微信签名方式
      //     'paySign': res.paySign //微信签名
      //   },
      //   function (res) {}
      // );

      // // JSSDK 方式
      // wx.chooseWXPay({
      //   'timestamp': res.timestamp, // 支付签名时间戳，注意微信jssdk中的所有使用timestamp字段均为小写。但最新版的支付后台生成签名使用的timeStamp字段名需大写其中的S字符
      //   'nonceStr': res.nonceStr, // 支付签名随机串，不长于 32 位
      //   'package': res.package, // 统一支付接口返回的prepay_id参数值，提交格式如：prepay_id=\*\*\*）
      //   'signType': res.signType, // 签名方式，默认为'SHA1'，使用新版支付需传入'MD5'
      //   'paySign': res.paySign, // 支付签名
      //   'success': function (res) {},
      //   'fail': function (res) {}
      // });

      // --------- 支付(前端处理) end ---------
      </script>
    </body>
    </html>
    `;
    ctx.body = html;
  }
});

app.listen(serverConfig.serverPort);

console.log('Server running at http://127.0.0.1:' + serverConfig.serverPort + '/');
