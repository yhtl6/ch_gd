'use strict';

module.exports = appInfo => {
  const config = {};
  // should change to your own
  config.keys = appInfo.name + '_1499319143999_1830';
  config.view = {
    mapping: {
      '.ejs': 'ejs',
    },
  }

  config.mysql = {
    // 单数据库信息配置
    client: {
      // host
      host: '127.0.0.1',
      // 端口号
      port: '3306',
      // 用户名
      user: 'root',
      // 密码
      password: 'root',
      // 数据库名
      database: 'farm',
    },
    // 是否加载到 app 上，默认开启
    app: true,
    // 是否加载到 agent 上，默认关闭
    agent: false,
  }

  config.security = {
    xframe: {
      enable: false,
    },
    csrf: {
      // 判断是否需要 ignore 的方法，请求上下文 context 作为第一个参数
      ignore: ctx => true,
    },
  }

  config.multipart = {
      fileExtensions: [
          '.xls',
          '.xlsx',
          '.pdf'
      ],
    fileSize: '50mb',

  }

  config.redis = {
    client: {
      port: 6379, // Redis port
      host: '127.0.0.1', // Redis host
      password: 'zpds20152015',
      db: 0,
    },
  }

  config.sessionRedis = {
    name: 'fd_aksd', // specific instance `session` as the session store
  }

  config.logger = {
    dir: 'E:/xxxx/supermarket/yznu_zsxt/log',
    level: 'INFO',
    consoleLevel: 'DEBUG',
  };


  config.middleware = [ 'sessionFilter' ]



  config.uploadDir = 'E:/xxxx/supermarket/yznu_zsxt/app/public/upload/'
   config.fileDir = 'E:/xxxx/supermarket/yznu_zsxt/app';
  config.path = 'http://127.0.0.1:7016';

  // add your config here

  return config;
};
