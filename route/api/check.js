const Promise = require("bluebird");
const jwt = require("jsonwebtoken");
const verify = Promise.promisify(jwt.verify);
const secret = 'cllSecret'

async function check(ctx, next) {
  let url = ctx.request.url;
  // 登录
  if (url == "/user/login") await next();
  else {
      // 规定token写在header 的 'autohrization' 
      let token = ctx.request.headers["authorization"];
    if (token && token.indexOf('Bearer') >= 0) {
        token = token.replace('Bearer ', '')
    } else {
      ctx.body = {
        status: 99,
        message:'无效token'
      };
      return
    }
    // 解码
    let payload = await verify(token,secret);
    let { time, timeout } = payload;
    let data = new Date().getTime();
      if (data - time <= timeout) {
          console.log(timeout, data - time);
        // 续签
        if (timeout - (data - time) < 5928772) {
          ctx.res.setHeader('Authorization', '123');
        }
        await next();
    } else {
        //过期
      ctx.code = 401;
      ctx.body = {
        status: 50014,
        code:401,
        message:'token 已过期'
      };
    }
  }
}

module.exports = check