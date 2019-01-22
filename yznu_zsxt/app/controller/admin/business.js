'use strict';
const fs = require('fs');
const path = require('path');
var zipper = require('zip-local');
var mkdirs = require('mkdirs');

module.exports = app => {
  class BusinessController extends app.Controller {

      /**
       * 跳转业务申请列表
       * page 当前页
       * pageSize 页大小
       * search 搜索内容
       * search_date 搜索时间
       * search_type 业务类型
       */
      * tolist(){

        yield this.ctx.render('admin/business_tolist.ejs',{
          page:this.ctx.query.page,
          pageSize:this.ctx.query.pageSize,
          supply_ent_name:this.ctx.query.supply_ent_name,
          user_name:this.ctx.query.user_name,
          user_code:this.ctx.query.user_code,
          user_address:this.ctx.query.user_address,
          email:this.ctx.query.email,
          create_by:this.ctx.query.create_by,
          search_date:this.ctx.query.search_date,
          search_type:this.ctx.query.search_type
        });
      }

      /**
       * 业务申请数据获取
       * offset 偏移量
       * limit  限制
       * search 搜搜内容
       * search_date 搜索日期
       * search_type 搜索类型
       */
      * datalist(){
          let offset = this.ctx.query.offset;
          let limit = this.ctx.query.limit;
          let search_date = this.ctx.query.search_date;
          let search_type = this.ctx.query.search_type;
          let supply_ent_name = this.ctx.query.supply_ent_name,
          user_name = this.ctx.query.user_name,
          user_code = this.ctx.query.user_code,
          user_address = this.ctx.query.user_address,
          email = this.ctx.query.email,
          create_by = this.ctx.query.create_by;

          let search_date_sql = search_date == '' ? '' : ` and (DATE_FORMAT(a.create_date,'%Y-%m-%d') = '${search_date}') `;
          let search_type_sql = search_type == '' ? '' : ` and a.bussiness_type = '${search_type}' `;
          let c1_sql = supply_ent_name == '' ? '' : ` and a.supply_ent_name like '%${supply_ent_name}%' `;
          let c2_sql = user_name == '' ? '' : ` and a.user_name like '%${user_name}%' `;
          let c3_sql = user_code == '' ? '' : ` and a.user_code like '%${user_code}%' `;
          let c4_sql = user_address == '' ? '' : ` and a.use_address like '%${user_address}%' `;
          let c5_sql = email == '' ? '' : ` and a.email like '%${email}%' `;
          let c6_sql = create_by == '' ? '' : ` and b.name like '%${create_by}%' `;

          let sql = `
            SELECT 
            a.id,
            a.supply_ent_name,
            a.user_name,
            a.user_code,
            a.use_address as user_address,
            a.bussiness_type,
            a.email,
            b.name as apply_name,
            DATE_FORMAT(a.create_date,'%Y-%m-%d %H:%i') as create_date
            FROM t_business_apply a
            LEFT JOIN t_ent_user b on b.id = a.create_by
            WHERE a.deleted = '0' and b.deleted = '0' ${search_date_sql} ${search_type_sql} ${c1_sql} ${c2_sql} ${c3_sql} ${c4_sql} ${c5_sql} ${c6_sql}
            ORDER BY a.create_date DESC
            LIMIT ${offset},${limit}
          `;

          let count_sql = `
            SELECT 
            count(*) as total
            FROM t_business_apply a
            LEFT JOIN t_ent_user b on b.id = a.create_by
            WHERE a.deleted = '0' and b.deleted = '0' ${search_date_sql} ${search_type_sql} ${c1_sql} ${c2_sql} ${c3_sql} ${c4_sql} ${c5_sql} ${c6_sql}
          `;

          let data = yield app.mysql.query(sql);
          let count = yield app.mysql.query(count_sql);

          yield this.ctx.body = {
              rows:data,
              total:count[0].total,
              code : 200
          }
      }

      /**
       * 删除
       * business 删除的业务
       */
      * del(){
        let business = this.ctx.request.body;
        let user = yield this.ctx.session.m_user_info;

        const conn = yield app.mysql.beginTransaction(); // 初始化事务
        try {
            business.deleted = '1';
            business.update_date = new Date();
            business.update_by = user.id;
            yield conn.update("t_business_apply",business);
            yield conn.commit();
            this.ctx.body ={
                code : 200,
                msg : '删除成功！'
            }
        }catch (err) {
            yield conn.rollback(); // 一定记得捕获异常后回滚事务！！
            this.ctx.body ={
                code : 2001,
                msg : '删除失败！'
            };
            throw err;
        }
      }

      /**
       * 导出单个业务申请
       * id 业务申请id
       */
      * expone(){
          let id = this.ctx.query.id;
          let business = yield app.mysql.get("t_business_apply",{id : id});
          if(business != null){
              if(business.pdf_path){
                  var file_path = this.app.config.fileDir + business.pdf_path;
                  console.info(file_path);
                  const filePath = path.resolve(file_path);
                  this.ctx.attachment(business.supply_ent_name + '+' + business.user_name + '+' + business.user_code + ".pdf");
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
       * 导出业务申请
       * id 业务申请id
       */
      * exp(){
          let search_date = this.ctx.query.search_date;
          let search_type = this.ctx.query.search_type;
          let supply_ent_name = this.ctx.query.supply_ent_name,
              user_name = this.ctx.query.user_name,
              user_code = this.ctx.query.user_code,
              user_address = this.ctx.query.user_address,
              email = this.ctx.query.email,
              create_by = this.ctx.query.create_by;

          let search_date_sql = search_date == '' ? '' : ` and (DATE_FORMAT(a.create_date,'%Y-%m-%d') = '${search_date}') `;
          let search_type_sql = search_type == '' ? '' : ` and a.bussiness_type = '${search_type}' `;
          let c1_sql = supply_ent_name == '' ? '' : ` and a.supply_ent_name like '%${supply_ent_name}%' `;
          let c2_sql = user_name == '' ? '' : ` and a.user_name like '%${user_name}%' `;
          let c3_sql = user_code == '' ? '' : ` and a.user_code like '%${user_code}%' `;
          let c4_sql = user_address == '' ? '' : ` and a.use_address like '%${user_address}%' `;
          let c5_sql = email == '' ? '' : ` and a.email like '%${email}%' `;
          let c6_sql = create_by == '' ? '' : ` and b.name like '%${create_by}%' `;

          let sql = `
            SELECT 
            a.id,
            a.supply_ent_name,
            a.user_name,
            a.user_code,
            a.pdf_path
            FROM t_business_apply a
            LEFT JOIN t_ent_user b on b.id = a.create_by
            WHERE a.deleted = '0' and b.deleted = '0' ${search_date_sql} ${search_type_sql} ${c1_sql} ${c2_sql} ${c3_sql} ${c4_sql} ${c5_sql} ${c6_sql}
            ORDER BY a.create_date DESC
          `;
          let data = yield app.mysql.query(sql);

          if(data){
              for(let i=0;i<data.length;i++){
                  let pdf = data[i];
                  if(pdf.pdf_path){
                      //复制文件到压缩的路径下
                      //读取源文件
                      let file_name = pdf.supply_ent_name + '+' + pdf.user_name + '+' + pdf.user_code;
                      if (fs.existsSync(path.join(this.app.config.fileDir + pdf.pdf_path))) {
                          var readStream = fs.readFileSync(path.join(this.app.config.fileDir + pdf.pdf_path));
                          //在目标路径生成副本，并以数据库中的名字命名，不然名字是一串数字,同名会直接覆盖
                          fs.writeFileSync(this.app.config.uploadDir + "business_cache/"+file_name + ".pdf", readStream);
                      }
                  }
              }
          }else{
              this.ctx.body={code:2001,msg:"没有可下载的业务申请"}
              return false;
          }

          //同步方法：生成zip包，将uploadDir/zip下的文件打包到uploadDir/pack,名字是时间戳，需要定时任务删除这些文件
          let time = new Date().getTime().toString();
          zipper.sync.zip(this.app.config.uploadDir + "business_cache/").compress().save(this.app.config.uploadDir+"business_pack/"+time+".zip");
          //清空uploadDir/zip下的文件
          let dir = this.app.config.uploadDir + "business_cache";
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
          this.ctx.attachment("业务申请.zip");
          this.ctx.set('Content-Type', 'application/octet-stream');
          this.ctx.body = fs.createReadStream(this.app.config.uploadDir+"business_pack/"+time+".zip");
      }

      /**
       * 生成PDF的页面
       */
      *createpdf(){
          let id = this.ctx.query.id;

          let sql = `
            SELECT
            a.supply_ent_name,
            a.user_name,
            a.user_code,
            a.use_address,
            a.bussiness_type as business_type
            FROM
            t_business_apply a
            where a.id = '${id}'
          `;
          let data = yield app.mysql.query(sql);

          let search_types = [
              {
                  name:'',
                  value:'全部'
              },
              {
                  name:'1',
                  value:'高压增容'
              },
              {
                  name:'2',
                  value:'减容'
              },
              {
                  name:'3',
                  value:'减容恢复'
              },
              {
                  name:'4',
                  value:'暂停'
              },
              {
                  name:'5',
                  value:'暂停恢复'
              },
              {
                  name:'6',
                  value:'暂换'
              },
              {
                  name:'7',
                  value:'暂换恢复'
              },
              {
                  name:'8',
                  value:'改压'
              },
              {
                  name:'9',
                  value:'改类'
              },
              {
                  name:'10',
                  value:'迁址'
              },
              {
                  name:'11',
                  value:'移表'
              },
              {
                  name:'12',
                  value:'暂拆'
              },
              {
                  name:'13',
                  value:'复装'
              },
              {
                  name:'14',
                  value:'更名'
              },
              {
                  name:'15',
                  value:'过户'
              },
              {
                  name:'16',
                  value:'分户'
              },
              {
                  name:'17',
                  value:'并户'
              },
              {
                  name:'18',
                  value:'销户'
              },
          ];

          yield this.ctx.render('admin/business_pdf.ejs',{
              supply_ent_name:data[0].supply_ent_name,
              user_name:data[0].user_name,
              user_code:data[0].user_code,
              use_address:data[0].use_address,
              business_type:search_types[data[0].business_type].value
          })
      }

      /**
       * 测试生成pdf
       * 可用作后续手动生成pdf接口
       * @returns {IterableIterator<IterableIterator<string>>}
       */
      * create(){
          let url = "/admin/business/createpdf?id=1";
          let pdfpath = yield this.ctx.service.htmltopdf.businesstopdf(url,null,'1');
          console.info(pdfpath);
      }


  }

  return BusinessController;
};



