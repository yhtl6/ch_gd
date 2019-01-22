'use strict';
const lodash = require('lodash');
module.exports = app => {
    class CommonController extends app.Controller {
        //登录
        *login(){
            let param = this.ctx.request.body;
            let data = yield this.app.mysql.query(`select * from t_m_user where user_name='${param.account}' and user_type='0' and deleted='0' and status='0'`);
            //判断用户是否存在
            if(data.length>0){
                let password = this.ctx.helper.md5(param.password);
                if(lodash.eq(data[0].password,password)){
                    let to = this.ctx.helper.md5(this.ctx.helper.uuid()+new Date().getTime());
                    let token = 'token_'+ to;
                    yield app.redis.set(token,data[0].id,'PX',30 * 24 * 60 * 60 * 1000);
                    data[0].token = token;
                    this.ctx.body = {
                        errno:'100',
                        data:data[0]
                    }      
                }else{
                    this.ctx.body = {
                        errno:'1002',
                        msg:'密码错误'
                    }
                }
            }else{
                this.ctx.body = {
                    errno:'1001',
                    msg:'账号不存在'
                }
            }
        }

        //注册
        *register(){
            let param = this.ctx.request.body;
            let data = yield this.app.mysql.query(`select * from t_m_user where user_name='${param.account}' and user_type='0' and status='0' and deleted='0'`);
            if(data.length>0){
                this.ctx.body = {errno:'1001',msg:'账号已存在'}
            }else{
                let obj = {
                    id:this.ctx.helper.uuid(),
                    user_name:param.account,
                    password:this.ctx.helper.md5(param.password),
                    user_type:'0',
                    status:'0',
                    deleted:'0'
                }
                const result = yield this.app.mysql.insert("t_m_user",obj);
                const insertSuccess = result.affectedRows === 1;
                if(insertSuccess){
                    this.ctx.body={
                        errno : '100',
                        msg:'注册成功'
                    }
                }else{
                    this.ctx.body={
                        errno : '1002',
                        msg:'失败'
                    }
                }
            }
        }




    }

    return CommonController;
};



