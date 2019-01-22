'use strict';

module.exports = app => {
    class WarmRecordController extends app.Controller {

        /*
        进入暖心包领取记录列表页面
         */
        *tolist(){
            let hospital_list = yield app.mysql.query(`SELECT id,hospital_name FROM t_hospital WHERE deleted = '0' `);
            let province_list = yield this.app.mysql.query(`select id,name from t_area where parent_id='0'`);
            yield this.ctx.render('admin/warmrecord_tolist.ejs',{
                page:this.ctx.query.page,
                pageSize:this.ctx.query.pageSize,
                search:this.ctx.query.search,
                hospital_id:this.ctx.query.hospital_id,
                province:this.ctx.query.province,
                city:this.ctx.query.city,
                begin_time:this.ctx.query.begin_time,
                end_time:this.ctx.query.end_time,
                hospital_list:hospital_list,
                province_list:province_list
            });
        }

        /*
        查询暖心包领取记录表数据
        search  搜索框内容
        data_offset 第一条数据的标记
        data_limit  每一页显示的条数
        data_result 查询结果
        data_count 符合条件的数据总数
         */
        *datalist(){
            let data_offset = this.ctx.query.offset;
            let data_limit = this.ctx.query.limit;
            let search = this.ctx.query.search;
            let hospital_id = this.ctx.query.hospital_id;
            let province = this.ctx.query.province;
            let city = this.ctx.query.city;
            let begin_time = this.ctx.query.begin_time;
            let end_time = this.ctx.query.end_time;
            let sql_andSearch = search == null ? '%%' : `AND (tmu.user_name LIKE '%${search}%' or tmu.user_number like '%${search}%' or twr.child_name like '%${search}%' or twr.phone like '%${search}%' or twr.claim_code like '%${search}%')`;
            let sql_andHospital = hospital_id == '' ? '': `and (twr.hospital_id='${hospital_id}')`;
            let sql_andProvince = province == '' ? '': `and (twr.province='${province}')`;
            let sql_andCity = city == '' ? '' : `and (twr.city='${city}')`;
            let sql_beginTime = begin_time == '' ? '' : `and (DATE_FORMAT(twr.create_date,'%Y-%m-%d') >= '${begin_time}')`;
            let sql_endTime = end_time == '' ? '' : `and (DATE_FORMAT(twr.create_date,'%Y-%m-%d') <= '${end_time}')`;


            let data_result = yield app.mysql.query(`SELECT tmu.user_name,concat('ID.',tmu.user_number) as user_number, twr.child_name,IF(twr.child_sex=1,'男','女') AS child_sex,
            DATE_FORMAT(twr.child_birth,"%Y-%m-%d") as child_birth,twr.sickbed_number,twr.phone,concat(twr.hospital_code,twr.claim_code) as claim_code,DATE_FORMAT(twr.create_date,"%Y.%m.%d %H:%i:%s") as create_date,twr.hospital_name,concat(ta.name,'-',taa.name) as address
            FROM t_warm_record AS twr LEFT JOIN t_m_user AS tmu ON twr.user_id=tmu.id 
            LEFT JOIN t_hospital AS th ON twr.hospital_id=th.id 
            LEFT JOIN t_area AS ta ON twr.province=ta.id 
            LEFT JOIN t_area AS taa ON twr.city=taa.id 
            WHERE twr.deleted = '0' ${sql_andSearch} ${sql_andHospital} ${sql_andProvince} ${sql_andCity} ${sql_beginTime} ${sql_endTime}
             ORDER BY twr.create_date DESC LIMIT ${data_offset},${data_limit}   `);
            let data_count = yield app.mysql.query(`SELECT COUNT(*) AS total FROM t_warm_record AS twr LEFT JOIN t_m_user AS tmu ON twr.user_id=tmu.id 
            LEFT JOIN t_hospital AS th ON twr.hospital_id=th.id 
            LEFT JOIN t_area AS ta ON twr.province=ta.id 
            LEFT JOIN t_area AS taa ON twr.city=taa.id 
            WHERE twr.deleted = '0' ${sql_andSearch} ${sql_andHospital} ${sql_andProvince} ${sql_andCity} ${sql_beginTime} ${sql_endTime} `);
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

        /*
        获取城市
         */
        * getCity(){
            let parent_id = this.ctx.query.parent_id;
            if(parent_id){
                const citys = yield app.mysql.query("SELECT * FROM t_area WHERE parent_id= ? ",[parent_id]);
                this.ctx.body = {errno:0,data:citys}
            }else{
                this.ctx.body = {errno:1,msg:"找不到区域！"}
            }
        }

        /*
        导出领取暖心包记录列表
         */
        *expRecord(){
            let search = this.ctx.query.search;
            let hospital_id = this.ctx.query.hospital_id;
            let province = this.ctx.query.province;
            let city = this.ctx.query.city;
            let begin_time = this.ctx.query.begin_time;
            let end_time = this.ctx.query.end_time;
            let sql_andSearch = search == null ? '%%' : `AND (tmu.user_name LIKE '%${search}%' or tmu.user_number like '%${search}%' or twr.child_name like '%${search}%' or twr.phone like '%${search}%' or twr.claim_code like '%${search}%')`;
            let sql_andHospital = hospital_id == '' ? '': `and (twr.hospital_id='${hospital_id}')`;
            let sql_andProvince = province == '' ? '': `and (twr.province='${province}')`;
            let sql_andCity = city == '' ? '' : `and (twr.city='${city}')`;
            let sql_beginTime = begin_time == '' ? '' : `and (DATE_FORMAT(twr.create_date,'%Y-%m-%d') >= '${begin_time}')`;
            let sql_endTime = end_time == '' ? '' : `and (DATE_FORMAT(twr.create_date,'%Y-%m-%d') <= '${end_time}')`;
            let data_result = yield app.mysql.query(`SELECT tmu.user_name,concat('ID.',tmu.user_number) as user_number, twr.child_name,IF(twr.child_sex=1,'男','女') AS child_sex,
            DATE_FORMAT(twr.child_birth,"%Y-%m-%d") as child_birth,concat(ta.name,'-',taa.name) as address,twr.hospital_name,twr.sickbed_number,twr.phone,concat(twr.hospital_code,twr.claim_code) as claim_code,DATE_FORMAT(twr.create_date,"%Y.%m.%d %H:%i:%s") as create_date
            FROM t_warm_record AS twr LEFT JOIN t_m_user AS tmu ON twr.user_id=tmu.id 
            LEFT JOIN t_hospital AS th ON twr.hospital_id=th.id 
            LEFT JOIN t_area AS ta ON twr.province=ta.id 
            LEFT JOIN t_area AS taa ON twr.city=taa.id 
            WHERE twr.deleted = '0' ${sql_andSearch} ${sql_andHospital} ${sql_andProvince} ${sql_andCity} ${sql_beginTime} ${sql_endTime}
             ORDER BY twr.create_date DESC `);
            if(data_result && data_result.length>0){

                //Excel主要方法： npm install -save excel-export
                var node_excel = require("excel-export");
                var conf = {};
                conf.cols = [
                    {caption:"用户名",type:"string"},
                    {caption:"ID",type:"string"},
                    {caption:"孩子姓名",type:"string"},
                    {caption:"孩子性别",type:"string"},
                    {caption:"孩子生日",type:"string"},
                    {caption:"常住城市",type:"string"},
                    {caption:"所在医院",type:"string"},
                    {caption:"病床号",type:"string"},
                    {caption:"联系方式",type:"string"},
                    {caption:"领取码",type:"string"},
                    {caption:"领取时间",type:"string"}
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
                this.ctx.res.setHeader("Content-Disposition", "attachment; filename=" +encodeURIComponent("领取暖心包记录列表")+".xlsx");
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
    return WarmRecordController;
};



