'use strict';

module.exports = app => {
  class ConfigController extends app.Controller {

      /**
       * 跳转基础功能配置--客服电话
       */
      * toconfig(){
        let phone = yield this.app.redis.get('phone');
        yield this.ctx.render('admin/config.ejs',{
          code : 200,
            phone : phone
        })
      }

      /**
       * 更改基础功能配置--客服电话
       */
      * edit(){
        let success = yield this.app.redis.set('phone',this.ctx.query.phone);
        if(success == 'OK'){
            yield this.ctx.body = {
                code : 200
            }
        }else{
            yield this.ctx.body = {
                code : 2001
            }
        }

      }


  }


  return ConfigController;
};



