'use strict';

module.exports = app => {
  class BillController extends app.Controller {

      /**
       * 账单列表
       */
      * getlist(){
        let token = this.ctx.query.token;
        let user_id = yield app.redis.get(token);
        let page = this.ctx.query.page;
        let pageSize = this.ctx.query.pageSize;
        let offset = (parseInt(page)-1)*pageSize;
        let bill_date = this.ctx.query.bill_date;
        let status = this.ctx.query.status;

        let search_date_sql = bill_date == '' ? '' : ` and a.bill_date = '${bill_date}' `;
        let search_status_sql = status == '' ? '' : ` and a.status = '${status}' `;

          let sql = `
          SELECT
          a.id,
          a.bill_date,
          b.name as comp_name,
          DATE_FORMAT(a.create_date,'%Y-%m-%d %H:%i:%s') as create_date,
          a.status
          FROM
          t_bill a
          LEFT JOIN t_ent b on b.id = a.ent_id
          LEFT JOIN t_ent_user c on c.ent_id = b.id
          where a.deleted = '0' and a.status!='3' and c.id = '${user_id}'
           ${search_date_sql}${search_status_sql}
          ORDER BY field(a.status,1,2,0),a.create_date desc
          LIMIT ${offset},${pageSize}
          `;

          let count_sql = `
          SELECT
          count(*) total
          FROM
          t_bill a
          LEFT JOIN t_ent b on b.id = a.ent_id
          LEFT JOIN t_ent_user c on c.ent_id = b.id
          where a.deleted = '0' and a.status!='3' and c.id = '${user_id}' ${search_date_sql}${search_status_sql}
          `;

          let data = yield app.mysql.query(sql);
          let count = yield app.mysql.query(count_sql);
          yield this.ctx.body = {
            code : 200,
              data : data,
              count : count[0].total
          }

      }

      /**
       * 账单详情
       */
      * getdetail(){
        let id = this.ctx.query.id;

        let sql = `
          SELECT
          a.*,
          DATE_FORMAT(a.create_date,'%Y.%m.%d') as push_date,
          DATE_FORMAT(a.confirm_date,'%Y.%m.%d') as comfirm_date,
          b.name as comp_name,
          c.name as comfir_name
          FROM
          t_bill a
          LEFT JOIN t_ent b on b.id = a.ent_id
          LEFT JOIN t_ent_user c on c.id = a.confirm_by
          WHERE a.id = '${id}'
        `;

        let data = yield app.mysql.query(sql);

        yield this.ctx.body = {
          code : 200,
          data : data[0]
        }

      }

      /**
       * 账单相关操作，同意、拒绝
       */
      * update(){
        let token = this.ctx.query.token;
        let user_id = yield app.redis.get(token);

        let bill = this.ctx.request.body;

          const conn = yield app.mysql.beginTransaction(); // 初始化事务
          try {
              bill.confirm_date = new Date();
              bill.confirm_by = user_id;
              yield conn.update("t_bill",bill);
              yield conn.commit();
              this.ctx.body ={
                  code : 200,
                  msg : '操作成功！'
              }
          }catch (err) {
              yield conn.rollback(); // 一定记得捕获异常后回滚事务！！
              this.ctx.body ={
                  code : 2001,
                  msg : '操作成功！'
              };
              throw err;
          }
      }



  }
  
  return BillController;
};



