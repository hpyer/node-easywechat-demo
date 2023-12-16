'use strict';

module.exports = async function (ctx, next) {
  console.log(ctx.path, ctx.method);

  const { OpenPlatform, ServerRequest, FormData } = require('node-easywechat');
  const OPConfig = require('./config/OpenPlatform');

  const app = new OpenPlatform(OPConfig);

  const client = app.getClient();
  client.setLogger((type, options, useTime, response) => {
    if (type === 'after') {
      console.log(type, response.config, useTime, response.data);
    }
    else {
      console.log(type, options, options.data instanceof FormData);
    }
  });

  if (ctx.path == '/wxopen/server') {
    let request = await ServerRequest.createFromIncomingMessage(ctx.req);
    app.setRequest(request);

    const server = app.getServer();

    server.with(async function (message) {
      console.log(ctx.path, message);
    });

    let response = await server.serve();
    ctx.type = response.getHeader('content-type');
    ctx.body = response.getBody();
  }

  else if (ctx.path === '/wxopen/auth') {
    let url = await app.createPreAuthorizationUrl('http://node-easywechat.hpyer.cn/wxopen/auth/callback')
    ctx.body = `<a href="${url}">发起授权</a>`;
  }
  else if (ctx.path === '/wxopen/auth/callback') {
    let auth_code = ctx.query.auth_code;

    let res = await app.getAuthorization(auth_code);
    console.log('/wxopen/auth/callback', res);

    ctx.body = '授权成功';
  }

  else if (ctx.path.startsWith('/wxopen/authorizer/')) {
    let authorizer_id = ctx.path.replace('/wxopen/authorizer/', '');

    const refreshToken = OPConfig.authorizerRefreshToken;
    const oaApp = await app.getOfficialAccountWithRefreshToken(authorizer_id, refreshToken);

    let request = await ServerRequest.createFromIncomingMessage(ctx.req);
    oaApp.setRequest(request);

    const server = oaApp.getServer();
    server.with(async function (message) {
      console.log(ctx.path, message);
    });

    let response = await server.serve();
    ctx.type = response.getHeader('content-type');
    ctx.body = response.getBody();
  }

}
