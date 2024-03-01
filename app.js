'use strict';

const path = require('path');
const fs = require('fs');

const Koa = require('koa');

const serverConfig = require('./config/server');
const openplatform = require('./openplatform');

const koa = new Koa();

koa.keys = serverConfig.keysKoa;

koa.use(async (ctx, next) => {
  if (ctx.path === '/favicon.ico') return;

  if (ctx.path.startsWith('/wxopen')) {
    return openplatform(ctx, next);
  }

  const { OfficialAccount, ServerRequest, Message, FormData } = require('node-easywechat');
  const OfficialAccountConfig = require('./config/OfficialAccount');

  const app = new OfficialAccount(OfficialAccountConfig);

  let request = await ServerRequest.createFromIncomingMessage(ctx.req);
  app.setRequest(request);

  const client = app.getClient();
  client.setLogger((type, options, useTime, response) => {
    if (type === 'after') {
      console.log(type, response.config, useTime, response.data);
    }
    else {
      console.log(type, options, options.data instanceof FormData);
    }
  });

  if (ctx.path == '/wxlogin') {
    let url = app.getOAuth().redirect('http://node-easywechat.hpyer.cn/wxlogin/callback');
    console.log('/wxlogin', url);
    ctx.redirect(url);
  }

  else if (ctx.path == '/wxlogin/callback') {
    let code = ctx.query.code;
    let user = await app.getOAuth().userFromCode(code);
    console.log('/wxlogin/callback', user);
    ctx.body = `<meta name="viewport" content="width=device-width, initial-scale=1.0">
    <img src="${user.avatar}" style="display: block; border: 0; border-radius: 50%; width: 100px; height: 100px;"><br>Hello ${user.name}`;
  }

  else if (ctx.path == '/notice') {
    let openid = 'ob_c2xAxZ2MiZctN7YomJoIu9nGk';
    let templateid = 'QHbfPjXo9eeYxHcsab4lFenoj9abyQsndJQPr6e7WBI';
    let data = {
      welcome: {
        value: '欢迎～'
      },
      user: {
        value: '张三',
        color: '#0000ff'
      },
      time: {
        value: '2020-01-22 12:25:54',
        color: '#ff0000'
      },
      remark: '感谢～'
    };
    let result = (await client.post('cgi-bin/message/template/send', {
      data: {
        touser: openid,
        template_id: templateid,
        data
      }
    })).toObject();
    console.log('/notice', result);
    ctx.body = '<meta name="viewport" content="width=device-width, initial-scale=1.0">发送成功';
  }

  else if (ctx.path == '/server') {
    let server = app.getServer();
    server.with(async function (message) {
      console.log(ctx.path, message);
      switch (message.MsgType) {
        case 'text':
          // 关键字自动回复
          if (message.Content == '图文') {
            let articles = [
              {
                title: '测试新闻11',
                description: '测试新闻描述11',
                url: 'https://www.baidu.com',
                image: 'http://img5.imgtn.bdimg.com/it/u=161888459,1712714238&fm=27&gp=0.jpg',
              },
              {
                title: '测试新闻22',
                description: '测试新闻描述22',
                url: 'https://www.baidu.com',
                image: 'http://img5.imgtn.bdimg.com/it/u=161888459,1712714238&fm=27&gp=0.jpg',
              },
              {
                title: '测试新闻33',
                description: '测试新闻描述33',
                url: 'https://www.baidu.com',
                image: 'http://img5.imgtn.bdimg.com/it/u=161888459,1712714238&fm=27&gp=0.jpg',
              },
            ];
            let news = new Message({
              MsgType: 'news',
              ArticleCount: articles.length,
              articles,
            });
            return news;
          }
          else {
            return `您说：${message.Content})`;
          }
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
          }
          break;
        default:
      }

      // 返回空或者 'success'，表示程序不做任何响应
      return;
    });

    let response = await app.server.serve();
    // console.log('response', response);

    ctx.type = response.getHeader('content-type');
    ctx.body = response.getBody();
  }

  else if (ctx.path == '/qrcode') {
    // temporary
    let seconds = 300;
    let result = (await client.post('cgi-bin/qrcode/create', {
      data: {
        action_name: 'QR_SCENE',
        action_info: {
          scene: {
            scene_id: 1,
          },
        },
        expire_seconds: seconds,
      }
    })).toObject();
    console.log('temporary', result);

    // // forever
    // result = (await client.post('cgi-bin/qrcode/create', {
    //   data: {
    //     action_name: 'QR_LIMIT_SCENE',
    //     action_info: {
    //       scene: {
    //         scene_id: 1,
    //       },
    //     },
    //   }
    // })).toObject();
    // console.log('forever', result);

    let qrcode = `https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=${result.ticket}`;
    console.log('qrcode', qrcode);

    ctx.body = `<meta name="viewport" content="width=device-width, initial-scale=1.0"><a href="${qrcode}" target="_blank">查看二维码</a>`;
  }

  else if (ctx.path == '/menu') {
    let button = [
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
    let result = (await client.post('cgi-bin/menu/create', {
      data: {
        button,
      },
    })).toObject();
    console.log('create-menu', result);

    // console.log('current-menu', await client.get('cgi-bin/get_current_selfmenu_info'));

    // // 销毁菜单
    // console.log('destory-menu', await client.get('cgi-bin/menu/delete'));

    ctx.body = '<meta name="viewport" content="width=device-width, initial-scale=1.0">菜单创建成功';
  }

  else if (ctx.path == '/uploadImage') {

    if (!ctx.request.query.serverId) {
      ctx.body = '<meta name="viewport" content="width=device-width, initial-scale=1.0">请提交serverId';
      return false;
    }

    // 根据media_id获取图片
    let response = await client.get('cgi-bin/media/get', {
      responseType: 'arraybuffer',
      params: {
        media_id: ctx.request.query.serverId,
      },
    });
    if (!response.is('image')) {
      console.log('/uploadImage', response.getContent());
      ctx.body = '无效serverId';
      return false;
    }

    // 保持图片到文件
    response.saveAs(path.join(__dirname, '/uploadImage.jpg'));

    ctx.type = 'image/jpeg';
    ctx.body = response.getContent();
  }

  else if (ctx.path == '/downloadImage') {
    let file = path.join(__dirname, '/test.jpg');
    let form = new FormData;
    form.append('media', fs.createReadStream(file))
    let result = (await client.post('cgi-bin/media/upload', {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      data: form,
      params: {
        type: 'image',
      }
    })).toObject();
    console.log('/downloadImage', result);
    if (!result) {
      ctx.body = '<meta name="viewport" content="width=device-width, initial-scale=1.0">上传微信服务器失败';
      return false;
    }

    ctx.type = 'text/json';
    ctx.body = result;
  }

  else if (ctx.path == '/sendArticles') {
    let file = path.join(__dirname, '/thumb.jpg');
    let form, result;
    form = new FormData;
    form.append('media', fs.createReadStream(file));
    result = (await client.post('cgi-bin/material/add_material', {
      data: form,
      params: {
        type: 'thumb',
      }
    })).toObject();
    if (!result) {
      ctx.body = '<meta name="viewport" content="width=device-width, initial-scale=1.0">上传缩略图失败';
      return false;
    }
    let thumb_media_id = result.media_id;

    // 上传永久图片
    file = path.join(__dirname, '/test.jpg');
    result = (await client.withFile(file, 'media').post('cgi-bin/media/uploadimg')).toObject();
    if (result.errcode) {
      ctx.body = '<meta name="viewport" content="width=device-width, initial-scale=1.0">上传文章图片失败';
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

    // 添加到草稿箱
    result = (await client.post('cgi-bin/draft/add', {
      data: {
        articles,
      },
    })).toObject();
    if (result.errcode) {
      ctx.body = '<meta name="viewport" content="width=device-width, initial-scale=1.0">推文创建失败';
      return false;
    }

    ctx.body = '<meta name="viewport" content="width=device-width, initial-scale=1.0">推文创建成功，midia_id: ' + result.media_id;
  }

  else {
    let jssdkConfig = await app.getUtils().buildJsSdkConfig(serverConfig.serverUrl + ctx.req.url, [
      'updateAppMessageShareData',
      'updateTimelineShareData',
      'chooseImage',
      'uploadImage',
      'downloadImage',
      'chooseWXPay'
    ]);
    jssdkConfig = JSON.stringify(jssdkConfig);

    let html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="X-UA-Compatible" content="ie=edge">
      <title>微信公众号测试</title>
      <script src="//res.wx.qq.com/open/js/jweixin-1.6.0.js"></script>
      <script src="//apps.bdimg.com/libs/zepto/1.1.4/zepto.min.js"></script>
      <script src="//cdn.jsdelivr.net/npm/vconsole@latest/dist/vconsole.min.js"></script>
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
        wx.updateTimelineShareData({
          title: '测试分享到朋友圈',
          link: wxConfig.url,
          imgUrl: 'http://www.oasishealth.cn/upload/news/image/20170117/20170117162341_79205.jpg',
          success: function () {},
          cancel: function () {}
        });

        wx.updateAppMessageShareData({
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

      var vConsole = new VConsole();
      </script>
    </body>
    </html>
    `;
    ctx.body = html;
  }
});

koa.listen(serverConfig.serverPort);

console.log('Server running at http://127.0.0.1:' + serverConfig.serverPort + '/');
