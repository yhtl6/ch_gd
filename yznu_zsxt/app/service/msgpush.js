'use strict';



module.exports = app => {
  class msgpush extends app.Service  {

    jd_case_dept_push(accesstoken){
        console.info("进入了发送方法");
        var self = this;
        return new Promise(function(resolve,reject){
            self.app.mysql.query(`
           SELECT tmu.id,tmu.mobile,tmu.nick_name,tmu.mini_openid,DATEDIFF(NOW(),tmu.update_date)AS DAY 
           FROM t_m_user AS tmu WHERE tmu.is_write=0 AND tmu.is_receive=1 and DATEDIFF(NOW(),tmu.update_date)>5
           `).then(function(datas){
               if(datas.length>0){
                   for(var i= 0;i<datas.length;i++){
                       var mobile = datas[i].mobile;
                       var nick_name = datas[i].nick_name;
                       console.log(mobile+nick_name);
                       self.ctx.service.weapp.sendMessage(mobile,datas[i].nick_name);  //调用短信消息模板接口
                       self.ctx.service.weapp.acesstoken(datas[i].mini_openid,datas[i].nick_name,accesstoken);//调用微信消息模板接口

                   }
               }
                    resolve(datas);
                    });

            });
        }

      /**
       * 业务申请推送
       * push_param{push_type:'2',business_id:''}
       * push_type:2 发送微信模板消息
       * business_id 业务id -获取业务信息
       *  sql运行数 1
       */
      business_push(push_param){
          console.info('进入业务推送');
          var that = this;
          return new Promise(function(resolve,reject){
              let sql = `
                select * from t_m_user where status = '0' and delted = '0'
              `;
              that.app.mysql.query(sql).then(function (data) {
                  var template_id = 'c1LBZy5sLQmCSSTg3sIGwIGfhLYSWEYksvlO6XBgfgk';//
                  if(push_param.push_type==2||push_param.push_type==1){
                      if(data){
                          for (let i = 0; i < data.length; i++) {

                              //微信推送通知
                              let notice = {
                                  "first": {
                                      "value":"您有一个要会议已被取消",
                                      "color":"#173177"
                                  },
                                  "keyword1":{
                                      "value":'',
                                      "color":"#173177"
                                  },
                                  "keyword2": {
                                      "value":'',    //
                                      "color":"#173177"
                                  },
                                  "remark":{
                                      "value":"如需了解更多信息，请进入城市精细化管理平台查看详情。",
                                      "color":"#173177"
                                  }
                              }
                              let miniprogram = {
                                  "appid":that.app.config.weappSDK.appId
                              }
                              var wx_openid = data[i].open_id;
                              that.ctx.service.access.sendtemplate2(wx_openid,template_id,null,miniprogram,notice);//调用发送模板消息接口
                          }
                      }
                      resolve('业务推送完成')
                  }else{
                      reject('业务推送失败')
                  }
              })

          })
      }


        
    }

    return msgpush;
  
}  