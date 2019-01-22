'use strict';
const fs = require('fs');
const path = require('path');
var mkdirs = require('mkdirs');
var wkhtmltoimage  = require('wkhtmltoimage');
module.exports = app => {
    class Htmltopdf extends app.Service  {

      /**
       * html页面生成PDF文件
       * @param uri 必填 要生成pdf的uri,例如：/admin/user/userinfo?id=xxx
       * @param file_dir 选填 文件存放路径，例如: jianli/20181008  根目录为upload,默认为upload下cv/年月日文件夹下
       * @param file_name 文件名称，默认为随机数字,例如:123456
       */
        * htmltopdf(uri,file_dir,file_name){

            if(!uri){
                return null;
            }

            if(!file_dir){
                file_dir = "cv/"+new Date().Format("yyyyMMdd");
            }

            if(!file_name){
                file_name = new Date().getTime() + String(Math.ceil(Math.random()*1000));
                file_name = file_name.substring(4,file_name.length) + ".pdf";
            }else{
                file_name = file_name+".pdf";
            }

          if (!fs.existsSync(path.join(this.app.config.uploadDir, file_dir))) {
              mkdirs(path.join(this.app.config.uploadDir, file_dir))
          }
          var url = this.app.config.path + uri;
          var topath = path.join(this.app.config.uploadDir, `${file_dir}/${file_name}`);

          if(fs.existsSync(topath)){
              //如果该文件存在，删除原有的
              fs.unlinkSync(topath)
          }

          var wkhtmltopdf  = require('wkhtmltopdf');
          wkhtmltopdf(url, { pageSize: "A4",debug:true}).pipe(fs.createWriteStream(topath));

          return  `/public/upload/${file_dir}/${file_name}`;
        }

        /**
         * html页面生成PDF文件
         * @param uri 必填 要生成pdf的uri,例如：/admin/user/userinfo?id=xxx
         * @param file_dir 选填 文件存放路径，例如: jianli/20181008  根目录为upload,默认为upload下cv/年月日文件夹下
         * @param file_name 文件名称，默认为随机数字,例如:123456
         * 例子   let url = "/admin/business/createpdf?id="+uuid
                  let pdfpath = yield this.ctx.service.htmltopdf.businesstopdf(url,null,uuid);
         */
        * businesstopdf(uri,file_dir,file_name){

            if(!uri){
                return null;
            }

            if(!file_dir){
                file_dir = "business/"+new Date().Format("yyyyMMdd");
            }

            if(!file_name){
                file_name = new Date().getTime() + String(Math.ceil(Math.random()*1000));
                file_name = file_name.substring(4,file_name.length) + ".pdf";
            }else{
                file_name = file_name+".pdf";
            }

            if (!fs.existsSync(path.join(this.app.config.uploadDir, file_dir))) {
                mkdirs(path.join(this.app.config.uploadDir, file_dir))
            }
            var url = this.app.config.path + uri;
            var topath = path.join(this.app.config.uploadDir, `${file_dir}/${file_name}`);

            if(fs.existsSync(topath)){
                //如果该文件存在，删除原有的
                fs.unlinkSync(topath)
            }

            var wkhtmltopdf  = require('wkhtmltopdf');
            wkhtmltopdf(url, { pageSize: "A4",debug:true}).pipe(fs.createWriteStream(topath));

            return  `/public/upload/${file_dir}/${file_name}`;
        }

        /**
         * html页面生成PDF文件
         * @param uri 必填 要生成pdf的uri,例如：/admin/user/userinfo?id=xxx
         * @param file_dir 选填 文件存放路径，例如: jianli/20181008  根目录为upload,默认为upload下cv/年月日文件夹下
         * @param file_name 文件名称，默认为随机数字,例如:123456
         * 例子   let url = "/admin/business/createpdf?id="+uuid
         let pdfpath = yield this.ctx.service.htmltopdf.businesstopdf(url,null,uuid);
         */
        * billtopdf(uri,file_dir,file_name){

            if(!uri){
                return null;
            }

            if(!file_dir){
                file_dir = "bill/"+new Date().Format("yyyyMM");
            }

            if(!file_name){
                file_name = new Date().getTime() + String(Math.ceil(Math.random()*1000));
                file_name = file_name.substring(4,file_name.length) + ".pdf";
            }else{
                file_name = file_name+".pdf";
            }

            if (!fs.existsSync(path.join(this.app.config.uploadDir, file_dir))) {
                mkdirs(path.join(this.app.config.uploadDir, file_dir))
            }
            var url = this.app.config.path + uri;
            var topath = path.join(this.app.config.uploadDir, `${file_dir}/${file_name}`);

            if(fs.existsSync(topath)){
                //如果该文件存在，删除原有的
                fs.unlinkSync(topath)
            }

            var wkhtmltopdf  = require('wkhtmltopdf');
            wkhtmltopdf(url, { pageSize: "A4",debug:true}).pipe(fs.createWriteStream(topath));

            return  `/public/upload/${file_dir}/${file_name}`;
        }


        /**
         * html页面生成PDF文件
         * @param uri 必填 要生成pdf的uri,例如：/admin/eleapply/createpdf?id=xxx
         * @param file_dir 选填 文件存放路径，例如: eleapply/201810  根目录为upload,默认为upload下eleapply/年月文件夹下
         * @param file_name 文件名称，默认为随机数字,例如:123456
         * 例子   let url = "/admin/eleapply/createpdf?id="+uuid
         let pdfpath = yield this.ctx.service.htmltopdf.eleapplytopdf(url,null,uuid);
         */
        * eleapplytopdf(uri,file_dir,file_name){

            if(!uri){
                return null;
            }

            if(!file_dir){
                file_dir = "eleapply/"+new Date().Format("yyyyMM");
            }

            if(!file_name){
                file_name = new Date().getTime() + String(Math.ceil(Math.random()*1000));
                file_name = file_name.substring(4,file_name.length) + ".pdf";
            }else{
                file_name = file_name+".pdf";
            }

            if (!fs.existsSync(path.join(this.app.config.uploadDir, file_dir))) {
                mkdirs(path.join(this.app.config.uploadDir, file_dir))
            }
            var url = this.app.config.path + uri;
            var topath = path.join(this.app.config.uploadDir, `${file_dir}/${file_name}`);

            if(fs.existsSync(topath)){
                //如果该文件存在，删除原有的
                fs.unlinkSync(topath)
            }

            var wkhtmltopdf  = require('wkhtmltopdf');
            wkhtmltopdf(url, { pageSize: "A4",debug:true}).pipe(fs.createWriteStream(topath));

            return  `/public/upload/${file_dir}/${file_name}`;
        }


  }
  return Htmltopdf;
};