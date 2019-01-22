'use strict';
const fs = require('fs');
const path = require('path');
const sendToWormhole = require('stream-wormhole');
const images = require("images");
var mkdirs = require('mkdirs');
var wkhtmltopdf  = require('wkhtmltopdf');
var zipper = require('zip-local');

module.exports = app => {
    class EleApplyController extends app.Controller {
        /*
        进入用户列表页面
        apply_date  申报月份
        search  搜索框内容
         */
        *tolist(){
            yield this.ctx.render('admin/eleapply_tolist.ejs',{
                page:this.ctx.query.page,
                pageSize:this.ctx.query.pageSize,
                search:this.ctx.query.search,
                apply_date:this.ctx.query.apply_date
            });
        }

        /*
        查询前台用户列表数据
        search  搜索框内容
        data_offset 第一条数据的标记
        data_limit  每一页显示的条数
        data_result 查询结果
        data_count 符合条件的数据总数
        apply_date  申报月份
         */
        *datalist(){
            let data_offset = this.ctx.query.offset;
            let data_limit = this.ctx.query.limit;
            let search = this.ctx.query.search;
            let apply_date = this.ctx.query.apply_date;
            let sql_andSearch = search == null ? '%%' : ` and (te.name LIKE '%${search}%' or teu.name like '%${search}%')`;
            let sql_andApplyDate = apply_date =='' ? '' : `and (tea.apply_date = '${apply_date}')`;
            let data_result = yield app.mysql.query(`SELECT tea.id,tea.apply_date,tea.year_apply,tea.month_apply,SUM(tea.year_apply+tea.month_apply) AS all_apply,te.name AS ent_name,DATE_FORMAT(tea.create_date,"%Y.%m.%d") as create_date,teu.name AS user_name 
            FROM t_ele_apply AS tea 
            LEFT JOIN t_ent AS te ON tea.ent_id=te.id 
            LEFT JOIN t_ent_user AS teu ON teu.id=tea.create_by 
            WHERE tea.deleted='0' ${sql_andSearch} ${sql_andApplyDate}  GROUP BY tea.id 
             ORDER BY tea.create_date DESC LIMIT ${data_offset},${data_limit}  `);
            let data_count = yield app.mysql.query(`SELECT COUNT(*) AS total FROM t_ele_apply AS tea 
            LEFT JOIN t_ent AS te ON tea.ent_id=te.id 
            LEFT JOIN t_ent_user AS teu ON teu.id=tea.create_by 
            WHERE tea.deleted='0' ${sql_andSearch} ${sql_andApplyDate} `);
            if(data_result){
                this.ctx.body ={
                    total : data_count[0].total,
                    rows : data_result,
                    erron : '0'
                };
            }else{
                this.ctx.body = {
                    erron:'1',
                    msg:'未知错误'
                };
            }
        }

        /**
         * 逻辑删除
         */
        *todel(){
            let id = this.ctx.query.id;
            let user = yield this.ctx.session.m_user_info;
            let eleapply = {
                id:id,
                deleted:'1',
                update_date:new Date(),
                update_by:user.id
            }
            const result = yield this.app.mysql.update('t_ele_apply',eleapply);
            const updateSuccess = result.affectedRows === 1;
            if(updateSuccess){
                this.ctx.body={
                    errno : '0'
                }
            }else{
                this.ctx.body={
                    errno : '1'
                }
            }
        }

        *toedit(){
            let id = this.ctx.query.id;
            let data = yield app.mysql.query(`select * from t_ele_apply where id= '${id}' and deleted='0' `);
            yield this.ctx.render('admin/eleapply_toedit.ejs',{
                data:data[0],
                page:this.ctx.query.page,
                pageSize:this.ctx.query.pageSize,
                search:this.ctx.query.search,
                apply_date:this.ctx.query.apply_date
            });
        }

        *update(){
            let user = yield this.ctx.session.m_user_info;
            let data = this.ctx.request.body;
            let eleapply = {
                id:data.id,
                year_apply:data.year_apply,
                month_apply:data.month_apply,
                update_date:new Date(),
                update_by:user.id
            }
            const result = yield this.app.mysql.update('t_ele_apply',eleapply);
            const updateSuccess = result.affectedRows === 1;
            if(updateSuccess){
                this.ctx.body={
                    errno : '0'
                }
            }else{
                this.ctx.body={
                    errno : '1'
                }
            }
        }

        //生成pdf页面
        *createpdf(){
            let id = this.ctx.query.id;
            let data = yield this.app.mysql.queryOne(`SELECT tea.id,tea.apply_date,tea.year_apply,tea.month_apply,SUM(tea.year_apply+tea.month_apply) AS all_apply,
            te.name AS ent_name,DATE_FORMAT(tea.create_date,"%Y年%m月%d日") as create_date,teu.name AS user_name 
            FROM t_ele_apply AS tea 
            LEFT JOIN t_ent AS te ON tea.ent_id=te.id 
            LEFT JOIN t_ent_user AS teu ON teu.id=tea.create_by where tea.id='${id}' group by tea.id  `);
            data.apply_date = data.apply_date.substring(0,4)+"年"+data.apply_date.substring(4,6)+"月";
            yield this.ctx.render('admin/eleapply_pdf.ejs',{
                ent_name:data.ent_name,
                apply_date:data.apply_date,
                year_apply:data.year_apply,
                month_apply:data.month_apply,
                all_apply:data.all_apply,
                user_name:data.user_name,
                create_date:data.create_date
            })


        }

        /**
         * 导出单个电量申报
         */
        *expone(){
            let id = this.ctx.query.id;
            let data = yield this.app.mysql.queryOne(`SELECT tea.id,tea.apply_date,tea.year_apply,tea.month_apply,SUM(tea.year_apply+tea.month_apply) AS all_apply,
            te.name AS ent_name,DATE_FORMAT(tea.create_date,"%Y年%m月%d日") as create_date,teu.name AS user_name,tea.pdf_path 
            FROM t_ele_apply AS tea 
            LEFT JOIN t_ent AS te ON tea.ent_id=te.id 
            LEFT JOIN t_ent_user AS teu ON teu.id=tea.create_by where tea.id='${id}' group by tea.id  `);
            if(data!=null){
                if(data.pdf_path){
                    var file_path = this.app.config.fileDir + data.pdf_path;
                    console.info(file_path);
                    const filePath = path.resolve(file_path);
                    this.ctx.attachment(data.ent_name + '+' + data.user_name + ".pdf");
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
         * 批量导出电量申报
         */
        *expall(){
            let apply_date = this.ctx.query.apply_date;
            let search = this.ctx.query.search;
            let sql_andSearch = search == null ? '%%' : ` and (te.name LIKE '%${search}%' or teu.name like '%${search}%')`;
            let sql_andApplyDate = apply_date =='' ? '' : `and (tea.apply_date = '${apply_date}')`;
            let data_result = yield app.mysql.query(`SELECT tea.id,tea.apply_date,tea.year_apply,tea.month_apply,SUM(tea.year_apply+tea.month_apply) AS all_apply,
            te.name AS ent_name,DATE_FORMAT(tea.create_date,"%Y.%m.%d") as create_date,teu.name AS user_name,tea.pdf_path 
            FROM t_ele_apply AS tea 
            LEFT JOIN t_ent AS te ON tea.ent_id=te.id 
            LEFT JOIN t_ent_user AS teu ON teu.id=tea.create_by 
            WHERE tea.deleted='0' ${sql_andSearch} ${sql_andApplyDate}  GROUP BY tea.id 
             ORDER BY tea.create_date `);
            if(data_result){
                for(let i=0;i<data_result.length;i++){
                    let pdf = data_result[i];
                    if(pdf.pdf_path){
                        //复制文件到压缩的路径下
                        //读取源文件
                        let file_name = pdf.ent_name + '+' + pdf.user_name;
                        if (fs.existsSync(path.join(this.app.config.fileDir + pdf.pdf_path))) {
                            var readStream = fs.readFileSync(path.join(this.app.config.fileDir + pdf.pdf_path));
                            //在目标路径生成副本，并以数据库中的名字命名，不然名字是一串数字,同名会直接覆盖
                            fs.writeFileSync(this.app.config.uploadDir + "eleapply_cache/"+file_name + ".pdf", readStream);
                        }
                    }
                }
            }else{
                this.ctx.body={code:2001,msg:"没有可下载的电量申报"}
                return false;
            }

            //同步方法：生成zip包，将uploadDir/zip下的文件打包到uploadDir/pack,名字是时间戳，需要定时任务删除这些文件
            let time = new Date().Format("yyyyMM");
            zipper.sync.zip(this.app.config.uploadDir + "eleapply_cache/").compress().save(this.app.config.uploadDir+"eleapply_pack/"+time+".zip");
            //清空uploadDir/zip下的文件
            let dir = this.app.config.uploadDir + "eleapply_cache";
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
            this.ctx.attachment("电量申报.zip");
            this.ctx.set('Content-Type', 'application/octet-stream');
            this.ctx.body = fs.createReadStream(this.app.config.uploadDir+"eleapply_pack/"+time+".zip");

        }

        *create(){
            let url = "/admin/eleapply/createpdf?id=1";
            let pdfpath = yield this.ctx.service.htmltopdf.eleapplytopdf(url,null,'1');
            console.info(pdfpath);
        }

        //导出excel
        *expExcel(){
            let apply_date = this.ctx.query.apply_date;
            let search = this.ctx.query.search;
            let sql_andSearch = search == null ? '%%' : ` and (te.name LIKE '%${search}%' or teu.name like '%${search}%')`;
            let sql_andApplyDate = apply_date =='' ? '' : `and (tea.apply_date = '${apply_date}')`;
            let data_result = yield app.mysql.query(`SELECT te.name AS ent_name,tea.apply_date,tea.year_apply,tea.month_apply,SUM(tea.year_apply+tea.month_apply) AS all_apply,
            DATE_FORMAT(tea.create_date,"%Y.%m.%d") as create_date,teu.name AS user_name 
            FROM t_ele_apply AS tea 
            LEFT JOIN t_ent AS te ON tea.ent_id=te.id 
            LEFT JOIN t_ent_user AS teu ON teu.id=tea.create_by 
            WHERE tea.deleted='0' ${sql_andSearch} ${sql_andApplyDate}  GROUP BY tea.id 
             ORDER BY tea.create_date `);
            if(data_result && data_result.length>0){

                //Excel主要方法： npm install -save excel-export
                var node_excel = require("excel-export");
                var conf = {};
                conf.cols = [
                    {caption:"申报企业",type:"string"},
                    {caption:"申报月份",type:"string"},
                    {caption:"年度交易合约总量",type:"string"},
                    {caption:"月度交易合约总量",type:"string"},
                    {caption:"购买电量总数",type:"string"},
                    {caption:"申报时间",type:"string"},
                    {caption:"签署人",type:"string"}
                ];
                conf.rows = [];
                data_result.forEach(function(res_data){
                    var one_rows_res = [];
                    for(var _res in res_data ) {
                        var tempresdata = res_data[_res];
                        tempresdata = tempresdata+"";
                        // console.log("tempresdata: " + tempresdata);
                        one_rows_res.push(tempresdata);
                    }
                    conf.rows.push(one_rows_res);
                })

                var result = node_excel.execute(conf);
                this.ctx.res.setHeader('Content-Type', 'application/vnd.openxmlformats');
                this.ctx.res.setHeader("Content-Disposition", "attachment; filename=" +encodeURIComponent("电量申报记录列表")+".xlsx");
                let result2 = new Buffer(result,'binary');
                this.ctx.body=result2;

            }else{
                this.ctx.body = {
                    erron:'1',
                    msg:'错误'
                };
            }
        }



    }
    return EleApplyController;
};



