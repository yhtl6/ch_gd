'use strict';
const fs = require('fs');
const path = require('path');
var zipper = require('zip-local');
var mkdirs = require('mkdirs');

module.exports = app => {
  class BillController extends app.Controller {

      /**
       * 跳转账单列表
       */
      * tolist(){
        yield this.ctx.render('admin/bill_tolist.ejs',{
            page:this.ctx.query.page,
            pageSize:this.ctx.query.pageSize,
            search_date:this.ctx.query.search_date,
            search_status:this.ctx.query.search_status,
            search:this.ctx.query.search
        })
      }

      /**
       * 账单列表数据获取
       */
      * datalist(){
          let offset = this.ctx.query.offset;
          let limit = this.ctx.query.limit;
          let search = this.ctx.query.search;
          let search_date = this.ctx.query.search_date;
          let search_status = this.ctx.query.search_status;

          let search_sql = search == '' ? '' : ` and b.name like '%${search}%' `;
          let search_date_sql = search_date == '' ? '' : ` and a.bill_date = '${search_date}' `;
          let search_status_sql = search_status == '' ? '' : ` and a.status = '${search_status}' `;

          let sql = `
          SELECT
          a.id,
          a.bill_date,
          b.name as comp_name,
          DATE_FORMAT(a.create_date,'%Y-%m-%d') as create_date,
          a.status
          FROM
          t_bill a
          LEFT JOIN t_ent b on b.id = a.ent_id
          where a.deleted = '0' ${search_sql}${search_date_sql}${search_status_sql}
          ORDER BY a.status desc,a.create_date desc
          LIMIT ${offset},${limit}
          `;

          let count_sql = `
          SELECT
          count(*) total
          FROM
          t_bill a
          LEFT JOIN t_ent b on b.id = a.ent_id
          where a.deleted = '0' ${search_sql}${search_date_sql}${search_status_sql}
          `;

          let data = yield app.mysql.query(sql);
          let count = yield app.mysql.query(count_sql);

          yield this.ctx.body = {
            code : 200,
              rows : data,
              total : count[0].total
          }
      }

      /**
       * 删除
       * id 账单id
       */
      * del(){
          let bill = this.ctx.request.body;
          let user = yield this.ctx.session.m_user_info;

          const conn = yield app.mysql.beginTransaction(); // 初始化事务
          try {
              bill.deleted = '1';
              bill.update_date = new Date();
              bill.update_by = user.id;
              yield conn.update("t_bill",bill);
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
       * 查看
       * id 账单id
       */
      * todetail(){
        let id = this.ctx.query.id;

        if(id){
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
            yield this.ctx.render('admin/bill_todetail.ejs',{
                code : 200,
                data : data[0],
                page : this.ctx.query.page,
                pageSize : this.ctx.query.pageSize,
                search_status : this.ctx.query.search_status,
                search_date : this.ctx.query.search_date,
                search : this.ctx.query.search
            })
            return ;
        }
        yield this.ctx.body = {
            code : 2001,
            data : {},
            msg : '账单ID不正确，查询出错！',
            page : this.ctx.query.page,
            pageSize : this.ctx.query.pageSize,
            search_status : this.ctx.query.search_status,
            search_date : this.ctx.query.search_date,
            search : this.ctx.query.search
        }
        return;
      }

      /**
       * 撤回修改
       * id 账单id
       */
      * recall(){
          let bill = this.ctx.request.body;
          let user = yield this.ctx.session.m_user_info;

          const conn = yield app.mysql.beginTransaction(); // 初始化事务
          try {
              bill.status = '3';
              bill.update_date = new Date();
              bill.update_by = user.id;
              yield conn.update("t_bill",bill);
              yield conn.commit();
              this.ctx.body ={
                  errno : 200,
                  msg : '撤回成功！'
              }
          }catch (err) {
              yield conn.rollback(); // 一定记得捕获异常后回滚事务！！
              this.ctx.body ={
                  errno : 2001,
                  msg : '撤回失败！'
              };
              throw err;
          }
      }

      /**
       * 编辑
       * id 账单id
       */
      * toedit(){
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
          yield this.ctx.render('admin/bill_toedit.ejs',{
              page:this.ctx.query.page,
              pageSize:this.ctx.query.pageSize,
              search_date:this.ctx.query.search_date,
              search_status:this.ctx.query.search_status,
              search:this.ctx.query.search,
              data:data[0]
          });
      }

      /**
       * 编辑保存
       * body 账单信息
       */
      * update(){
          let bill = this.ctx.request.body;
          let user = yield this.ctx.session.m_user_info;
          bill.update_by = user.id;
          bill.update_date = new Date();
          bill.status = '3';
          // let url = "/admin/bill/createpdf?id="+bill.id;
          // let pdfpath = yield this.ctx.service.htmltopdf.billtopdf(url,null,bill.id);
          // bill.pdf_path = pdfpath;

          const conn = yield app.mysql.beginTransaction(); // 初始化事务
          try {
              yield conn.update('t_bill',bill);
              yield conn.commit();
              this.ctx.body ={
                  code : 200,
                  msg : '修改成功！'
              }
          }catch (err) {
              yield conn.rollback(); // 一定记得捕获异常后回滚事务！！
              this.ctx.body ={
                  code : 2001,
                  msg : '修改失败！'
              };
              throw err;
          }
      }

      /**
       * 跳转新增
       */
      * toadd(){
          yield this.ctx.render('admin/bill_toadd.ejs',{
              page:this.ctx.query.page,
              pageSize:this.ctx.query.pageSize,
              search_date:this.ctx.query.search_date,
              search_status:this.ctx.query.search_status,
              search:this.ctx.query.search,
              ent_id:this.ctx.query.ent_id
          });
      }

      /**
       * 新增
       * body 账单信息
       */
      * add(){
          let bill = this.ctx.request.body;
          let user = yield this.ctx.session.m_user_info;
          bill.id = this.ctx.helper.uuid();
          bill.status = '3';
          bill.create_by = user.id;
          bill.create_date = new Date();
          bill.update_by = user.id;
          bill.update_date = bill.create_date;

          const conn = yield app.mysql.beginTransaction(); // 初始化事务
          try {
              const result = yield conn.insert("t_bill",bill);
              const insertSuccess = result.affectedRows === 1;
             /* if(insertSuccess){
                  let url = "/admin/bill/createpdf?id="+bill.id;
                  let pdfpath = yield this.ctx.service.htmltopdf.billtopdf(url,null,bill.id);
                  bill.pdf_path = pdfpath;
              }else{
                  let url = "/admin/bill/createpdf?id="+bill.id;
                  let pdfpath = yield this.ctx.service.htmltopdf.billtopdf(url,null,bill.id);
                  bill.pdf_path = pdfpath;
              }
              yield conn.update('t_bill',bill);*/

              yield conn.commit();
              this.ctx.body ={
                  code : 200,
                  msg : '新增成功！'
              }
          }catch (err) {
              yield conn.rollback(); // 一定记得捕获异常后回滚事务！！
              this.ctx.body ={
                  code : 2001,
                  msg : '新增失败！'
              };
              throw err;
          }
      }


      /**
       * 导出单条
       */
      * expone(){
          let id = this.ctx.query.id;
          let sql = `
            SELECT
              b.name as comp_name,
              a.pdf_path,
              a.bill_date
              FROM
              t_bill a
              LEFT JOIN t_ent b on b.id = a.ent_id
              where a.id = '${id}'
          `;
          let data = yield app.mysql.query(sql);
          let bill = data[0];
          if(bill != null){
              if(bill.pdf_path){
                  var file_path = this.app.config.fileDir + bill.pdf_path;
                  console.info(file_path);
                  const filePath = path.resolve(file_path);
                  this.ctx.attachment(bill.comp_name + '+' + bill.bill_date + ".pdf");
                  this.ctx.set('Content-Type', 'application/octet-stream');
                  this.ctx.body = fs.createReadStream(filePath);
              }else {
                  this.ctx.body = {code:2001,msg:"该条记录无PDF文件"}
              }
          }else{
              this.ctx.body = {code:2002,msg:"该条记录不存在"}
          }
      }

      /**
       * 导出多条
       */
      * exp(){
          let search_date = this.ctx.query.search_date;
          let search_status = this.ctx.query.search_status;
          let search = this.ctx.query.search;

          let search_date_sql = search_date == '' ? '' : ` and a.bill_date = '${search_date}' `;
          let search_status_sql = search_status == '' ? '' : ` and a.status = '${search_status}' `;
          let search_sql = search == '' ? '' : ` and b.name like '%${search}%' `;

          let sql = `
            SELECT
              a.id,
              a.bill_date,
              b.name as comp_name,
              a.pdf_path
              FROM
              t_bill a
              LEFT JOIN t_ent b on b.id = a.ent_id
              where a.deleted = '0' ${search_sql}${search_date_sql}${search_status_sql}
              ORDER BY a.status,a.update_date desc
          `;
          let data = yield app.mysql.query(sql);

          if(data){
              for(let i=0;i<data.length;i++){
                  let pdf = data[i];
                  if(pdf.pdf_path){
                      //复制文件到压缩的路径下
                      //读取源文件
                      let file_name = pdf.comp_name + '+' + pdf.bill_date;
                      if (fs.existsSync(path.join(this.app.config.fileDir + pdf.pdf_path))) {
                          var readStream = fs.readFileSync(path.join(this.app.config.fileDir + pdf.pdf_path));
                          //在目标路径生成副本，并以数据库中的名字命名，不然名字是一串数字,同名会直接覆盖
                          fs.writeFileSync(this.app.config.uploadDir + "bill_cache/"+file_name + ".pdf", readStream);
                      }
                  }
              }
          }else{
              this.ctx.body={code:2001,msg:"没有可下载的账单结算"}
              return false;
          }

          //同步方法：生成zip包，将uploadDir/zip下的文件打包到uploadDir/pack,名字是时间戳，需要定时任务删除这些文件
          let time = new Date().getTime().toString();
          zipper.sync.zip(this.app.config.uploadDir + "bill_cache/").compress().save(this.app.config.uploadDir+"bill_pack/"+time+".zip");
          //清空uploadDir/zip下的文件
          let dir = this.app.config.uploadDir + "bill_cache";
          var files = fs.readdirSync(dir);//读取文件夹
          files.forEach(function(file){
              var stats = fs.statSync(dir+'/'+file);
              if(stats.isDirectory()){
                  emptyDir(dir+'/'+file);
              }else{
                  fs.unlinkSync(dir+'/'+file);
                  //console.log("删除文件"+dir+'/'+file+"成功");
              }
          });
          //zip包生成流供下载
          this.ctx.attachment("账单结算.zip");
          this.ctx.set('Content-Type', 'application/octet-stream');
          this.ctx.body = fs.createReadStream(this.app.config.uploadDir+"bill_pack/"+time+".zip");
      }

      /**
       * 创建pdf
       */
      * createpdf(){
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
          if(data){
              data[0].bill_date = data[0].bill_date.substring(0,4)+"年"+data[0].bill_date.substring(4,6)+"月";
          }

          yield this.ctx.render('admin/bill_pdf.ejs',{
              data:data[0],
              code : 200
          })
      }

      /**
       * 获取所有企业
       */
      * getcomps(){
          let sql = `
            SELECT
            id,name
            FROM
            t_ent
            where status = '1'
          `;

          let data = yield app.mysql.query(sql);
          yield this.ctx.body = {
              code : 200,
              data : data
          }
      }

      /**
       * 获取账单内容
       */
      *getcontent(){
          let id = this.ctx.query.id;
          let data = yield this.app.mysql.get("t_bill", {id: id});
          this.ctx.body = {errno: 0, data: data};
      }

      /**
       * 发送单条账单
       */
      *send(){
          let bill = this.ctx.request.body;
          let user = yield this.ctx.session.m_user_info;

          const conn = yield app.mysql.beginTransaction(); // 初始化事务
          try {
              bill.status = '1';//发送后，状态改为待确认
              bill.update_date = new Date();
              bill.update_by = user.id;
              yield conn.update("t_bill",bill);
              yield conn.commit();
              this.ctx.body ={
                  errno : 200,
                  msg : '发送成功！'
              }
          }catch (err) {
              yield conn.rollback(); // 一定记得捕获异常后回滚事务！！
              this.ctx.body ={
                  errno : 2001,
                  msg : '发送失败！'
              };
              throw err;
          }
      }

      /**
       * 发送全部待发送的账单
       */
      *sendAll(){
          let user = yield this.ctx.session.m_user_info;
          const result = yield this.app.mysql.query('update t_bill as tb set tb.status=?,update_date=?,update_by=? where tb.status=?',[1,new Date(),user.id,3]);
          if(result.affectedRows>0){
              this.ctx.body ={
                  errno : 200,
                  msg : '发送成功！'
              }
          }else{
              this.ctx.body ={
                  errno : 2001,
                  msg : '发送失败！'
              };
          }

      }


  }

  
  return BillController;
};



