'use strict';

module.exports = app => {
    class Weapp extends app.Service {
        *getopenid(code){
            let https = require('https');
            let iconv = require("iconv-lite");
            let url = "https://api.weixin.qq.com/sns/jscode2session?appid="+this.app.config.weappSDK.appId+"&secret="+this.app.config.weappSDK.appSecret+"&js_code="+code+"&grant_type=authorization_code";
            return new Promise(function(resolve, reject) {
                https.get(url,(res)=>{
                    res.setEncoding('utf8');
                    let rawData = '';
                    res.on('data', (chunk) => rawData += chunk);

                    res.on('end', () => {
                        resolve(rawData);
                    });
                });
            });
        }

        //发送微信消息给当月未申报企业的员工
        sendNoticetoUser(openid,name,accesstoken){
            console.log("发送微信消息给当月未申报企业的员工");
            app.curl('https://api.weixin.qq.com/cgi-bin/message/wxopen/template/uniform_send?access_token='+accesstoken,
                {
                    method: 'POST',
                    dataType: 'json',
                    contentType: 'json',
                    data: {
                        touser:openid,
                        mp_template_msg:{
                            appid:"wx760f6e1e24776b22",
                            template_id:"UpPxbCK6BDBsux0LIosvRmJOsYlRG-FKSiVNiDPLX9M",
                            url:"http://weixin.qq.com/download",
                            miniprogram:{
                                appid:"wxf63873032867c454",//小程序appid
                                pagepath:"pages/login/login"//跳转页面
                            },
                            data:{
                                first:{
                                    value:"爱康售电服务厅",
                                    color:"#173177"
                                },
                                keyword1:{
                                    value:"",
                                    color:"#173177"
                                },
                                keyword2:{
                                    value:"",
                                    color:"#173177"
                                },
                                keyword3:{
                                    value:"",
                                    color:"#173177"
                                },

                                remark:{
                                    value:"亲爱的"+name+"，",
                                    color:"#173177"
                                }
                            }
                        }

                    }

                }).then(function(res){
                console.info("===uniform_send")
                console.info(JSON.stringify(res))
            })
        }

        //发送微信消息给用户，告知审核状态
        sendMessagetoUser(status,openid,name,mobile,accesstoken){
            console.log("发送微信消息给用户，告知审核状态");
            let data;
            if(status == '1'){
                data = {
                    first:{
                        value:"您好，您的账号注册成功：",
                        color:"#173177"
                    },
                    keyword1:{
                        value:name,
                        color:"#173177"
                    },
                    keyword2:{
                        value:mobile,
                        color:"#173177"
                    },
                    keyword3:{
                        value:new Date().Format('yyyy.MM.dd'),
                        color:"#173177"
                    },

                    remark:{
                        value:"您现在可以使用手机号码和密码登录小程序！",
                        color:"#173177"
                    }
                }
            }else if(status == '2'){
                data = {
                    first:{
                        value:"您好，您的账号注册失败：",
                        color:"#173177"
                    },
                    keyword1:{
                        value:name,
                        color:"#173177"
                    },
                    keyword2:{
                        value:mobile,
                        color:"#173177"
                    },
                    keyword3:{
                        value:new Date().Format('yyyy.MM.dd'),
                        color:"#173177"
                    },

                    remark:{
                        value:"您可以重新提交资料进行审核注册！",
                        color:"#173177"
                    }
                }
            }
            // console.info(data)
            app.curl('https://api.weixin.qq.com/cgi-bin/message/wxopen/template/uniform_send?access_token='+accesstoken,
                {
                    method: 'POST',
                    dataType: 'json',
                    contentType: 'json',
                    data: {
                        touser:openid,
                        mp_template_msg:{
                            appid:"wx086a04941b35e517",
                            template_id:"3kJ8CzChgZKOr8ra23jpciJUqGMVp3eGcttFWjvJENs",
                            url:"http://weixin.qq.com/download",
                            miniprogram:{
                                appid:"wx83d07827bb76373a",//小程序appid
                                pagepath:"pages/login/login"//跳转页面
                            },
                            data:data
                        }

                    }

                }).then(function(res){
                console.info("===uniform_send")
                console.info(JSON.stringify(res))
            })
        }
    }
    return Weapp;
};