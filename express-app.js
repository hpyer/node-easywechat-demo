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
  let jssdkConfig = await easywechat.jssdk.config([
    'onMenuShareTimeline',
    'onMenuShareAppMessage',
    'chooseImage',
    'uploadImage',
    'downloadImage',
    'chooseWXPay'
  ], true);

  let html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>微信公众号测试</title>
    <script src="//res.wx.qq.com/open/js/jweixin-1.2.0.js"></script>
    <script src="//apps.bdimg.com/libs/zepto/1.1.4/zepto.min.js"></script>
  </head>
  <body>
    <h3>请在微信中打开体验各功能</h3>
    <ul>
      <li><a href="/wxlogin">微信授权登录</a></li>
      <li><a href="/notice">发送模板消息</a></li>
      <li><a href="/server?signature=9a39e983e5743d01e23507ad58ca3e90dbb9ebab&echostr=15947793626788132863&timestamp=1505801645&nonce=2830267549">服务器</a></li>
      <li><a href="/qrcode">生成二维码</a></li>
      <li><a href="/menu">自定义菜单</a></li>
      <li><a href="javascript:;" onclick="uploadimage()">上传图片</a></li>
      <li><a href="javascript:;" onclick="downloadimage()">下载图片</a></li>
      <li><a href="/sendArticles">推送文章</a></li>
    </ul>
    <div>
      <div id="previewImage" style="float: left;"></div>
      <div id="uploadImage"></div>
    </div>
    <div>
      <div id="downloadImage"></div>
    </div>
    <script>
    var wxConfig = ${jssdkConfig};
    wx.config(wxConfig);

    function uploadimage () {
      wx.chooseImage({
        count: 1, // 默认9
        sizeType: ['compressed'], // 可以指定是原图(original)还是压缩图(compressed)，默认二者都有
        sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
        success: function (res) {
          var localIds = res.localIds; // 返回选定照片的本地ID列表，localId可以作为img标签的src属性显示图片
          document.querySelector('#previewImage').innerHTML = '<img style="width: 150px;" src="' + localIds[0] + '" /><br>预览的照片';

          wx.uploadImage({
            localId: localIds[0].toString(), // 需要上传的图片的本地ID，由chooseImage接口获得
            isShowProgressTips: 1, // 默认为1，显示进度提示
            success: function (res) {
              //res.serverId 返回图片的服务器端ID
              document.querySelector('#uploadImage').innerHTML = '<img style="width: 150px;" src="/uploadImage?serverId=' + res.serverId + '" /><br>上传后照片';
            }
          });
        }
      })
    }

    function downloadimage () {
      $.getJSON('/downloadImage', function (res) {
        if (!res.media_id) {
          alert('无效服务端ID');
          return;
        }
        alert('服务端ID：' + res.media_id);
        wx.downloadImage({
          serverId: res.media_id, // 需要下载的图片的服务器端ID，由uploadImage接口获得
          isShowProgressTips: 1, // 默认为1，显示进度提示
          success: function (res) {
            var localId = res.localId; // 返回图片下载后的本地ID
            document.querySelector('#downloadImage').innerHTML = '<img style="width: 150px;" src="' + localId + '" /><br>下载的照片';
          }
        });
      });
    }

    wx.ready(function () {
      wx.onMenuShareTimeline({
        title: '测试分享到朋友圈',
        link: wxConfig.url,
        imgUrl: 'http://www.oasishealth.cn/upload/news/image/20170117/20170117162341_79205.jpg',
        success: () => {},
        cancel: () => {}
      });

      wx.onMenuShareAppMessage({
        title: '测试分享给好友',
        desc: '测试分享给好友详细描述',
        link: wxConfig.url,
        imgUrl: 'http://www.oasishealth.cn/upload/news/image/20170117/20170117162341_79205.jpg',
        success: function () {},
        cancel: function () {}
      });

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
    });
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
  res.type('image/jpg');
  res.send(new Buffer(qrcode, 'binary'));
  // 写入文件
  // fs.writeFileSync('./temporary.jpg', qrcode, 'binary');

  // // forever
  // result = await easywechat.qrcode.forever(1);
  // console.log('forever', result);
  // qrcode = await easywechat.qrcode.url(result.ticket);
  // // 直接输出到浏览器
  // res.type('image/jpg');
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

  res.send('菜单创建成功');
});

app.get('/uploadImage', async function (req, res) {

  if (!ctx.request.query.serverId) {
    res.send('请提交serverId');
    return false;
  }

  let result = await easywechat.material_temporary.getStream(ctx.request.query.serverId);
  if (!result) {
    res.send('无效serverId');
    return false;
  }

  await easywechat.material_temporary.download(ctx.request.query.serverId, __dirname + '/');

  res.type('image/jpg');
  res.send(new Buffer(result, 'binary'));
});

app.get('/downloadImage', async function (req, res) {

  let file = __dirname + '/test.jpg';
  let result = await easywechat.material_temporary.uploadImage(file);
  if (!result) {
    res.send('上传微信服务器失败');
    return false;
  }

  res.type('text/json');
  res.send(result);
});

app.get('/sendArticles', async function (req, res) {
  let file = __dirname + '/thumb.jpg';
  let result;
  result = await easywechat.material.uploadThumb(file);
  if (!result) {
    res.send('上传缩略图失败');
    return false;
  }
  let thumb_media_id = result.media_id;

  file = __dirname + '/test.jpg';
  result = await easywechat.material.uploadArticleImage(file);
  if (!result) {
    res.send('上传文章图片失败');
    return false;
  }
  let media_url = result.url;

  let articles = [];
  articles.push({
    title: '测试推文标题1',
    thumb_media_id: thumb_media_id,
    author: '测试推文作者1',
    digest: '测试推文描述1',
    show_cover_pic: 1,
    content: '<p>测试推文内容1</p><p><img src="' + media_url + '" /></p>',
    content_source_url: 'http://www.baidu.com',
  });
  articles.push({
    title: '测试推文标题2',
    thumb_media_id: thumb_media_id,
    author: '测试推文作者2',
    digest: '测试推文描述2',
    show_cover_pic: 1,
    content: '<p>测试推文内容2</p><p><img src="' + media_url + '" /></p>',
    content_source_url: 'http://www.baidu.com',
  });

  result = await easywechat.material.uploadArticle(articles);
  if (!result) {
    res.send('推文发送失败');
    return false;
  }

  res.send('推文发送成功：' + result.media_id);
});

app.get('/pay', async function (req, res) {
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
    res.send('支付失败');
    return false;
  }
  let prepare_id = res.prepay_id;

  // WeixinJSBridge
  let config_jsbridge = easywechat.payment.configForPayment(prepare_id);
  // JSSDK，如果使用这种方式，jssdk.config的api列表里需要增加一个chooseWXPay
  let config_jssdk = easywechat.payment.configForJSSDKPayment(prepare_id);

  res.send(JSON.stringify({
    jsbridge: config_jsbridge,
    jssdk: config_jssdk
  }));
});

app.get('/pay/notify', async function (req, res) {
  easywechat.setAppServerExpress(req, res);

  let handler = function (notice, is_success) {
    // 签名验证已经在回调之前处理了，这里直接写业务逻辑即可
    // notice 是微信通知的所有参数，is_success表示result_code是否为SUCCESS
    console.log('notify', notice, is_success);

    // 返回 false 表示处理失败，微信会再次发送通知
    return true;
  };

  await easywechat.payment.handleNotify(handler);
});

app.listen(serverConfig.serverPort, function () {
  console.log('Server running at http://127.0.0.1:' + serverConfig.serverPort + '/');
});
