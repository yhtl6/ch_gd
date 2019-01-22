'use strict';

module.exports = app => {
  class Access extends app.Service  {
       *getAccessToken(){
          let acessdata =  yield app.redis.get("miniaccesstoken");
          console.log(acessdata);
          if (acessdata == undefined) {
              const result =  yield app.
              curl('https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=wx83d07827bb76373a&secret=424efbebc9c7ea47ee3f6d541b0ee5af',
                  {
                      dataType: 'json',
                  })
              if(result.status == 200){
                  //expires_in
                  acessdata =  this.app.redis.set("miniaccesstoken", result.data.access_token, 'PX', 6200 * 1000);
              }

          }

          return acessdata

      }

      /**
       * 发送模板消息
       */
      sendtemplate2(touser,template_id,url,miniprogram,data){
          console.info("send");
          if(touser == undefined || touser == null || touser == ""){
              return false;
          }else{
              if(template_id == undefined || template_id == null || template_id == ""){
                  template_id = this.app.config.wechat.template_id;
              }

              if(miniprogram == "yes"){
                  miniprogram = {
                      "appid":this.app.config.weappSDK.appId,
                      "pagepath":"/pages/login/login"
                  }
              }
              var co = require('co');
              co(function *() {
                  //通过yield得到数据，数据是个json数组
                  let result =  yield app.wechat.api.sendTemplate(touser,template_id,url,miniprogram,null,data);

                  if(result.errcode == "0"){
                      return true;
                  }else{
                      console.log(result)
                      return false;
                  }
              });
          }
      }


  }
  return Access;
};