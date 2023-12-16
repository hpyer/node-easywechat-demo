'use strict';

module.exports = async function (ctx, next) {
  console.log(ctx.path, ctx.method);

  const EasyWechat = require('node-easywechat');
  const OPConfig = require('./config/OpenPlatform');

  const app = new EasyWechat.Factory.OpenPlatform(OPConfig);

  if (ctx.path == '/wxopen/server') {
    let request = new EasyWechat.Http.Request(ctx.req);
    app.rebind('request', request);

    app.server.push(async function (message) {
      console.log(ctx.path, message);
    });

    let response = await app.server.serve();
    ctx.body = response.getContent().toString();
  }

  else if (ctx.path === '/wxopen/auth') {
    let url = await app.getPreAuthorizationUrl('http://node-easywechat.hpyer.cn/wxopen/auth/callback')
    ctx.body = `<a href="${url}">发起授权</a>`;
  }
  else if (ctx.path === '/wxopen/auth/callback') {
    let auth_code = ctx.query.auth_code;

    let res = await app.handleAuthorize(auth_code);
    console.log('handleAuthorize', res);

    ctx.body = '授权成功';
  }

  else if (ctx.path.startsWith('/wxopen/authorizer/')) {
    let authorizer_id = ctx.path.replace('/wxopen/authorizer/', '');

    const refreshToken = OPConfig.authorizerRefreshToken;
    const oaApp = app.officialAccount(authorizer_id, refreshToken);

    let request = new EasyWechat.Http.Request(ctx.req);
    oaApp.rebind('request', request);

    oaApp.server.push(async function (message) {
      console.log(ctx.path, message);
    });

    let response = await oaApp.server.serve();
    ctx.body = response.getContent().toString();
  }

}
