'use strict';

module.exports = app => {
  class MeterController extends app.Controller {

      /**
       * 跳转人工抄表列表页
       * page 页数
       * pageSize 页大小
       * start_date 开始时间
       * end_date   结束时间
       * @returns {IterableIterator<*>}
       */
      * tolist () {

          yield this.ctx.render('admin/meter_tolist.ejs',{
              page:this.ctx.query.page,
              pageSize:this.ctx.query.pageSize,
              search:this.ctx.query.search,
              start_date:this.ctx.query.start_date,
              end_date:this.ctx.query.end_date
          });
      }

      /**
       * 人工抄表数据
       * offset 偏移量
       * limit 页大小
       * start_date 开始时间
       * end_date   结束时间
       */
      * datalist(){
        let offset = this.ctx.query.offset;
        let limit = this.ctx.query.limit;
        let search = this.ctx.query.search;
        let start_date = this.ctx.query.start_date;
        let end_date = this.ctx.query.end_date;

        let search_sql = search == '' ? '' : ` AND ( b.name like '%${search}%' OR a.ent_number like '%${search}%' OR c.name like '%${search}%' ) `;
        let start_date_sql = start_date == '' ? '' : ` and (DATE_FORMAT(a.create_date,'%Y-%m-%d') >= '${start_date}') `;
        let end_date_sql = end_date == '' ? '' : ` and (DATE_FORMAT(a.create_date,'%Y-%m-%d') <= '${end_date}') `;

        let sql = `
        select
        a.id as meter_id,
        a.ent_number as comp_num,
        a.ele_num as ele_num,
        DATE_FORMAT(a.create_date,'%Y-%m-%d %H:%i:%s') as create_date,
        DATE_FORMAT(a.meter_date,'%Y-%m-%d %H:%i') as meter_date,
        b.name as comp_name,
        c.name as user_name
        from t_manual_meter a
        LEFT JOIN t_ent b on b.id = a.ent_id
        LEFT JOIN t_ent_user c on c.id = a.create_by
        where a.deleted = '0' ${search_sql} ${start_date_sql} ${end_date_sql}
        ORDER BY a.create_date desc
        LIMIT ${offset},${limit}
        `;

        let count_sql = `
        select
        count(*) as total
        from t_manual_meter a
        LEFT JOIN t_ent b on b.id = a.ent_id
        LEFT JOIN t_ent_user c on c.id = a.create_by
        where a.deleted = '0' ${search_sql} ${start_date_sql} ${end_date_sql}
        `;

        let data = yield app.mysql.query(sql);
        let count = yield app.mysql.query(count_sql);

        this.ctx.body = {
          code : 200,
          rows : data,
          total : count[0].total
        }
      }

      /**
       * 删除抄表数据
       * meter_id 抄表id
       */
      * del(){
        let meter = this.ctx.request.body;
        let user = yield this.ctx.session.m_user_info;

        const conn = yield app.mysql.beginTransaction(); // 初始化事务
        try {
            meter.deleted = '1';
            meter.update_date = new Date();
            meter.update_by = user.id;
            yield conn.update("t_manual_meter",meter);
            yield conn.commit();
            this.ctx.body ={
                errno : 200,
                msg : '删除成功！'
            }
        }catch (err) {
            yield conn.rollback(); // 一定记得捕获异常后回滚事务！！
            this.ctx.body ={
                errno : 2001,
                msg : '删除失败！'
            };
            throw err;
        }
      }

      /**
       * 导出excel
       */
      * exp(){
          let search = this.ctx.query.search;
          let start_date = this.ctx.query.start_date;
          let end_date = this.ctx.query.end_date;

          let search_sql = search == '' ? '' : ` AND ( b.name like '%${search}%' OR a.ent_number like '%${search}%' OR c.name like '%${search}%' ) `;
          let start_date_sql = start_date == '' ? '' : ` and (DATE_FORMAT(a.create_date,'%Y-%m-%d') >= '${start_date}') `;
          let end_date_sql = end_date == '' ? '' : ` and (DATE_FORMAT(a.create_date,'%Y-%m-%d') <= '${end_date}') `;

          let sql = `
            select
            b.name as comp_name,
            a.ent_number as comp_num,
            a.ele_num as ele_num,
            c.name as user_name,
            DATE_FORMAT(a.meter_date,'%Y-%m-%d %H:%i') as meter_date,
            DATE_FORMAT(a.create_date,'%Y-%m-%d %H:%i:%s') as create_date
            from t_manual_meter a
            LEFT JOIN t_ent b on b.id = a.ent_id
            LEFT JOIN t_ent_user c on c.id = a.create_by
            where a.deleted = '0' ${search_sql} ${start_date_sql} ${end_date_sql}
            ORDER BY a.create_date desc
            `;

          let data = yield app.mysql.query(sql);

          //Excel主要方法： npm install -save excel-export
          if(data){
              var node_excel = require("excel-export");
              var conf = {};
              //公司名称 企业户号  电量（千瓦时）  抄表人  抄表日期
              conf.cols = [
                  {caption: "公司名称", type: "string"},
                  {caption: "企业户号", type: "string"},
                  {caption: "电量（千瓦时）", type: "string"},
                  {caption: "抄表人", type: "string"},
                  {caption: "抄表日期", type: "string"},
                  {caption: "登记时间", type: "string"}
              ];
              conf.rows = [];
              data.forEach(function (res_data) {
                  var one_rows_res = [];//数据行
                  for (var _res in res_data) {//_res 列名
                      var tempresdata = res_data[_res];//数据列
                      tempresdata = tempresdata + "";
                      // console.log("tempresdata: " + tempresdata);
                      one_rows_res.push(tempresdata);
                  }
                  conf.rows.push(one_rows_res);
              })

              var result = node_excel.execute(conf);
              this.ctx.res.setHeader('Content-Type', 'application/vnd.openxmlformats;charset=utf-8');
              this.ctx.res.setHeader("Content-Disposition", "attachment; filename=" + encodeURIComponent("个人抄表数据记录") + ".xlsx");
              let result2 = new Buffer(result, 'binary');
              this.ctx.body = result2;
              return;
          }else{
              this.ctx.body = {
                  code : 2001,
                  msg : '导出无数据！'
              }
              return;
          }

      }


  }
  
  return MeterController;
};



