'use strict';

module.exports = app => {
  class UserController extends app.Controller {
        /**
     * 获取我的基本信息
     */
    *getdetail(){
        let token = this.ctx.query.token;
        let userid =yield this.app.redis.get(token);
      
        let data_result = yield app.mysql.queryOne(`SELECT tu.id as id,tu.name AS user_name,tu.ids AS id_number,tu.mobile AS nick_ph,t.name AS qiye_name,t.numbers as ent_numbers FROM t_ent_user AS tu LEFT JOIN t_ent AS t ON tu.ent_id=t.id WHERE tu.deleted='0' AND t.status='1' AND tu.id='${userid}'`);  
        
        if(data_result){
            this.ctx.body ={
                data : data_result,
                code : '200',
                msg : 'SUCCESS',
            };
        }
    }


    /**
     * 更新我的基本信息
     */
    *update(){
        let update_data = this.ctx.request.body;
        const conn = yield app.mysql.beginTransaction(); // 初始化事务
        try {
           
            update_data.update_date =new Date();
            yield conn.update("t_ent_user",update_data);
            yield conn.commit();
            this.ctx.body = {
                code : '200',
                msg : '更新成功'
            };
        }catch (err){
            yield conn.rollback(); // 一定记得捕获异常后回滚事务！！
            this.ctx.body = {
                errno:'3001',
                msg:"更新失败"
            };
            throw err;
        }
    }



  }

  
  return UserController;
};