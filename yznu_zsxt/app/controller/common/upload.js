'use strict';

const fs = require('fs');
const path = require('path');
const sendToWormhole = require('stream-wormhole');
const images = require("images");
var mkdirs = require('mkdirs');
var wkhtmltopdf  = require('wkhtmltopdf');
var zipper = require('zip-local');



function saveStream(stream, filepath, dir) {
  return new Promise((resolve, reject) => {
    if (filepath.indexOf('/read-error-') > 0) {
      stream.once('readable', () => {
        const buf = stream.read(51200);
        //console.log('read %d bytes', buf.length);
        setTimeout(() => {
          reject(new Error('mock read error'));
        }, 1000);
      });
    } else {

      if (!fs.existsSync(dir)) {
        mkdirs(dir)
      }

      const ws = fs.createWriteStream(filepath);
      stream.pipe(ws);
      ws.on('error', reject);
      ws.on('finish', resolve);
    }
  });


}

module.exports = app => {
  class UploadController extends app.Controller {

    * img() {
      const stream = yield this.ctx.getFileStream();

      let file_dir = new Date().Format("yyyyMMdd");
      let file_name = new Date().getTime() + stream.filename.substring(stream.filename.lastIndexOf("."), stream.filename.length);
      let filepath = path.join(this.app.config.uploadDir, `${file_dir}/video/${file_name}`);

      // if (stream.fields.title === 'mock-error') {
      //   filepath = path.join(this.app.config.baseDir, `logs/not-exists/dir/${stream.filename}`);
      // } else if (stream.fields.title === 'mock-read-error') {
      //   filepath = path.join(this.app.config.baseDir, `logs/read-error-${stream.filename}`);
      // }

      this.logger.warn('Saving %s to %s', file_name, filepath);
      try {
        yield saveStream(stream, filepath, path.join(this.app.config.uploadDir, `${file_dir}/video`));

      } catch (err) {
        yield sendToWormhole(stream);
        throw err;
      }


      this.ctx.body = {
        success: true,
        msg: "error message",
        file_path: `/public/upload/${file_dir}/video/${file_name}`
      }

    }


    * zipimg() {
      var ziptype = 'eggimg0';
      if(this.ctx.query.type!=null&&this.ctx.query.type=='480'){
        ziptype = 'eggimg480'
      }
      console.log(ziptype);
      const stream = yield this.ctx.getFileStream();

      console.log("saving img");
      console.log(stream);
      let file_dir = new Date().Format("yyyyMMdd");
      let file_name = new Date().getTime() + stream.filename.substring(stream.filename.lastIndexOf("."), stream.filename.length);
      let filepath = path.join(this.app.config.uploadDir, `${file_dir}/eggimg0/${file_name}`);
      let file480path = path.join(this.app.config.uploadDir, `${file_dir}/eggimg480/${file_name}`);


      this.logger.warn('Saving 0: %s to %s', file_name, filepath);
      this.logger.warn('Saving 480: %s to %s', file_name, file480path);
      try {
        yield saveStream(stream, filepath, path.join(this.app.config.uploadDir, `${file_dir}/eggimg0`));
        if (!fs.existsSync(path.join(this.app.config.uploadDir, `${file_dir}/eggimg480`))) {
          fs.mkdirSync(path.join(this.app.config.uploadDir, `${file_dir}/eggimg480`))
        }

        images(filepath) //Load image from file
        //加载图像文件
            .size(480) //Geometric scaling the image to 400 pixels width
            //等比缩放图像到400像素宽
            //.draw(images("logo.png")) //Drawn logo at coordinates (10,10) , 10, 10
            //在(10,10)处绘制Logo
            .save(file480path, { //Save the image to a file,whih quality 50
              quality: 100 //保存图片到文件,图片质量为50
            });

      } catch (err) {
        yield sendToWormhole(stream);
        throw err;
      }

      this.ctx.body = {
        success: true,
        msg: "error message",
        file_path: `/public/upload/${file_dir}/${ziptype}/${file_name}`
      }

    }

      /**
       * 下载单个回访记录
       */
      *downloadPDF(){
          let id = this.ctx.query.id;
        /*  let url = "/admin/returnrecord/topdf?id="+id;
          let pdfpath = yield this.ctx.service.htmltopdf.htmltopdf(url,null,id);
*/
          let data_result = yield app.mysql.query(`SELECT tmu.user_name,concat('ID.',tmu.user_number) as user_number,twr.child_name,if(twr.child_sex=1,'男','女') as child_sex,twr.hospital_name,
            DATE_FORMAT(twr.child_birth,"%Y-%m-%d") as child_birth,twr.sickbed_number,twr.phone,DATE_FORMAT(trr.create_date,"%Y.%m.%d %H:%m:%s") as create_date,
            concat(ta.name,'-',taa.name) as address,trr.receive_time,trr.is_practical,trr.style,trr.is_quality_satisfy,trr.is_deploy_satisfy,trr.suggest,trr.pdf_uri
            FROM t_return_record AS trr 
            LEFT JOIN t_warm_record AS twr ON trr.user_id=twr.user_id 
            LEFT JOIN t_hospital AS th ON th.id=twr.hospital_id 
            LEFT JOIN t_m_user AS tmu ON trr.user_id=tmu.id
            LEFT JOIN t_area as ta on ta.id=twr.province 
            LEFT JOIN t_area as taa on taa.id=twr.city  
            WHERE trr.id='${id}'`);
          data_result = data_result[0];
          console.log(data_result);
          if(data_result != null){
                  var file_path = this.app.config.fileDir+data_result.pdf_uri;
                  const filePath = path.resolve(file_path);
              console.log(filePath);
                  this.ctx.attachment( data_result.user_name+"回访记录.pdf");
                  this.ctx.set('Content-Type', 'application/octet-stream');
                  this.ctx.body = fs.createReadStream(filePath);

          }else{
              this.ctx.body = {errno:1,msg:"用户不存在"}
          }
      }

      /**
       * 批量下载回访记录
       * search 选填 搜索框查询条件
       * hospital_id 选填 医院查询条件
       * begin_time 选填 开始时间查询条件
       * end_time 选填 结束时间查询条件
       * @returns {boolean}
       */
      *downloadpdfzip(){
          let time = new Date().getTime().toString();
          let jllist = null;
          let search = this.ctx.query.search;
          let hospital_id = this.ctx.query.hospital_id;
          let begin_time = this.ctx.query.begin_time;
          let end_time = this.ctx.query.end_time;
          let sql_andSearch = search == null ? '%%' : `AND (tmu.user_name LIKE '%${search}%' or tmu.user_number like '%${search}%' or twr.child_name like '%${search}%' or twr.phone like '%${search}%' or twr.claim_code like '%${search}%')`;
          let sql_andHospital = hospital_id == '' ? '': `and (twr.hospital_id='${hospital_id}')`;
          let sql_beginTime = begin_time == '' ? '' : `and (DATE_FORMAT(trr.create_date,'%Y-%m-%d') >= '${begin_time}')`;
          let sql_endTime = end_time == '' ? '' : `and (DATE_FORMAT(trr.create_date,'%Y-%m-%d') <= '${end_time}')`;

          jllist = yield this.app.mysql.query(`SELECT trr.id,tmu.user_name,concat('ID.',tmu.user_number) as user_number,twr.child_name,if(twr.child_sex=1,'男','女') as child_sex,twr.hospital_name,
            DATE_FORMAT(twr.child_birth,"%Y-%m-%d") as child_birth,twr.sickbed_number,twr.phone,DATE_FORMAT(trr.create_date,"%Y.%m.%d %H:%i:%s") as create_date,
            concat(ta.name,'-',taa.name) as address,trr.receive_time,trr.is_practical,trr.style,trr.is_quality_satisfy,trr.is_deploy_satisfy,trr.suggest,trr.pdf_uri
            FROM t_return_record AS trr 
            LEFT JOIN t_warm_record AS twr ON trr.user_id=twr.user_id 
            LEFT JOIN t_hospital AS th ON th.id=twr.hospital_id 
            LEFT JOIN t_m_user AS tmu ON trr.user_id=tmu.id
            LEFT JOIN t_area as ta on ta.id=twr.province 
            LEFT JOIN t_area as taa on taa.id=twr.city  
            WHERE trr.deleted='0' ${sql_andSearch} ${sql_andHospital} ${sql_beginTime} ${sql_endTime} 
            ORDER BY trr.create_date DESC`);

          if(jllist){
              console.log(jllist);
              for(let i=0;i<jllist.length;i++){
                  let jl = jllist[i];
                  //let url = "/admin/returnrecord/topdf?id="+jl.id;
                 //let pdfpath = yield this.ctx.service.htmltopdf.htmltopdf(url,null,jl.id);
                    //console.log(pdfpath);
                      //复制文件到压缩的路径下
                      //读取源文件
                      let file_name = jl.id+"_"+jl.user_name;
                      //console.log(this.app.config.fileDir+pdfpath);
                      if (fs.existsSync(path.join(this.app.config.fileDir+jl.pdf_uri))) {
                          var readStream = fs.readFileSync(path.join(this.app.config.fileDir+jl.pdf_uri));
                          //在目标路径生成副本，并以数据库中的名字命名，不然名字是一串数字,同名会直接覆盖
                          fs.writeFileSync(this.app.config.uploadDir + "zip/"+file_name + ".pdf", readStream);
                      }
              }
          }else{
              this.ctx.body={errno:1,msg:"没有可下载的回访记录"}
              return false;
          }

          //同步方法：生成zip包，将uploadDir/zip下的文件打包到uploadDir/pack,名字是时间戳，需要定时任务删除这些文件
          zipper.sync.zip(this.app.config.uploadDir + "zip/").compress().save(this.app.config.uploadDir+"pack/"+time+".zip");
          //清空uploadDir/zip下的文件
          let dir = this.app.config.uploadDir + "zip";
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
          this.ctx.attachment("回访记录.zip");
          this.ctx.set('Content-Type', 'application/octet-stream');
          this.ctx.body = fs.createReadStream(this.app.config.uploadDir+"pack/"+time+".zip");
      }

      /**
       * 企业excel导入
       */
      * ent_excel(){
          const stream = yield this.ctx.getFileStream();
          console.info('11111111')
          let err_row = [];//出错的行号

          let flag = true;//导入成功失败标志
          let file_dir = new Date().Format("yyyyMMdd");
          let file_name = new Date().getTime() + stream.filename.substring(stream.filename.lastIndexOf("."), stream.filename.length);
          let filepath = path.join(this.app.config.uploadDir, `ent_excel/${file_dir}/${file_name}`);
          this.logger.warn('Saving ent_excel: %s to %s', file_name, filepath);

          try {
              yield saveStream(stream, filepath, path.join(this.app.config.uploadDir, `ent_excel/${file_dir}`));

              if (!fs.existsSync(path.join(this.app.config.uploadDir, `ent_excel/${file_dir}`))) {
                  fs.mkdirSync(path.join(this.app.config.uploadDir, `ent_excel/${file_dir}`))
              }

              //解析xlsx文件
              var xlsx = require("node-xlsx");
              var list = xlsx.parse(filepath);
              let data = list[0].data;
              const conn = yield app.mysql.beginTransaction();
              for (let i = 1; i < data.length; i++) {
                  try {
                      let ent = {};
                      let row = data[i];
                      //-- 企业名称  企业户号 --
                      let name = row[0];
                      let has_ent = yield app.mysql.query(`select id from t_ent where name='${name}'`);
                      if (has_ent.length != 0) {
                          flag = false;
                          err_row.push(i);
                          continue;
                      }
                      let numbers = row[1];

                      let user = this.ctx.session.m_user_info;

                      ent.name = name;
                      ent.numbers = numbers;
                      ent.id = this.ctx.helper.uuid();
                      ent.create_date = new Date();
                      ent.status = '1';
                      ent.create_by = user.id;
                      console.info(ent);

                      yield conn.insert('t_ent', ent);
                      yield conn.commit();
                  } catch (err) {
                      yield conn.rollback();
                      this.ctx.body = {
                          code : 2001,
                          msg : '导入Excel文件失败！',
                          file_path: `/public/upload/ent_excel/${file_dir}/${file_name}`
                      }
                      throw err;
                  }
              }

          } catch (err) {
              this.ctx.body = {
                  code : 2001,
                  msg : '导入Excel文件失败！',
                  file_path: `/public/upload/ent_excel/${file_dir}/${file_name}`
              }
              yield sendToWormhole(stream);
              throw err;
          }
          if(flag){
              this.ctx.body = {
                  code : 200,
                  msg : '所有数据导入成功！',
                  file_path: `/public/upload/ent_excel/${file_dir}/${file_name}`
              }
          }else{
              this.ctx.body = {
                  code : 2005,
                  msg : '部分数据导入成功！',
                  file_path: `/public/upload/ent_excel/${file_dir}/${file_name}`,
                  data : err_row
              }
          }
      }

  }


  return UploadController;
};