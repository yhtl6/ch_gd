'use strict';

module.exports = app => {
    class ReturnRecordController extends app.Controller {

        /*
        进入回访记录列表页面
         */
        *tolist(){
            let hospital_list = yield app.mysql.query(`SELECT id,hospital_name FROM t_hospital WHERE deleted = '0' `);
            yield this.ctx.render('admin/returnrecord_tolist.ejs',{
                page:this.ctx.query.page,
                pageSize:this.ctx.query.pageSize,
                search:this.ctx.query.search,
                hospital_id:this.ctx.query.hospital_id,
                begin_time:this.ctx.query.begin_time,
                end_time:this.ctx.query.end_time,
                hospital_list:hospital_list
            });
        }

        /*
        查询回访记录表数据
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
            let begin_time = this.ctx.query.begin_time;
            let end_time = this.ctx.query.end_time;
            let sql_andSearch = search == null ? '%%' : `AND (tmu.user_name LIKE '%${search}%' or tmu.user_number like '%${search}%' or twr.child_name like '%${search}%' or twr.phone like '%${search}%' or twr.claim_code like '%${search}%')`;
            let sql_andHospital = hospital_id == '' ? '': `and (twr.hospital_id='${hospital_id}')`;
            let sql_beginTime = begin_time == '' ? '' : `and (DATE_FORMAT(trr.create_date,'%Y-%m-%d') >= '${begin_time}')`;
            let sql_endTime = end_time == '' ? '' : `and (DATE_FORMAT(trr.create_date,'%Y-%m-%d') <= '${end_time}')`;


            let data_result = yield app.mysql.query(`SELECT trr.id,tmu.user_name,concat('ID.',tmu.user_number) as user_number,twr.child_name,twr.hospital_name,twr.sickbed_number,twr.phone,DATE_FORMAT(trr.create_date,"%Y.%m.%d %H:%i:%s") as create_date FROM t_return_record AS trr 
            LEFT JOIN t_warm_record AS twr ON trr.user_id=twr.user_id 
            LEFT JOIN t_hospital AS th ON th.id=twr.hospital_id 
            LEFT JOIN t_m_user AS tmu ON trr.user_id=tmu.id  
            WHERE trr.deleted='0' ${sql_andSearch} ${sql_andHospital} ${sql_beginTime} ${sql_endTime} 
            ORDER BY trr.create_date DESC LIMIT ${data_offset},${data_limit}   `);
            let data_count = yield app.mysql.query(`SELECT COUNT(*) AS total FROM t_return_record AS trr 
            LEFT JOIN t_warm_record AS twr ON trr.user_id=twr.user_id 
            LEFT JOIN t_hospital AS th ON th.id=twr.hospital_id 
            LEFT JOIN t_m_user AS tmu ON trr.user_id=tmu.id  
            WHERE trr.deleted='0' ${sql_andSearch} ${sql_andHospital} ${sql_beginTime} ${sql_endTime}`);
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
            进入回访记录详情页面
         */
        *todetail(){
            let id = this.ctx.query.id;
            let data_result = yield app.mysql.query(`SELECT trr.id,tmu.user_name,concat('ID.',tmu.user_number) as user_number,twr.child_name,if(twr.child_sex=1,'男','女') as child_sex,twr.hospital_name,
            DATE_FORMAT(twr.child_birth,"%Y-%m-%d") as child_birth,twr.sickbed_number,twr.phone,DATE_FORMAT(trr.create_date,"%Y.%m.%d %H:%i:%s") as create_date,
            concat(ta.name,'-',taa.name) as address,trr.receive_time,trr.is_practical,trr.style,trr.is_quality_satisfy,trr.is_deploy_satisfy,trr.suggest
            FROM t_return_record AS trr 
            LEFT JOIN t_warm_record AS twr ON trr.user_id=twr.user_id 
            LEFT JOIN t_hospital AS th ON th.id=twr.hospital_id 
            LEFT JOIN t_m_user AS tmu ON trr.user_id=tmu.id
            LEFT JOIN t_area as ta on ta.id=twr.province 
            LEFT JOIN t_area as taa on taa.id=twr.city  
            WHERE trr.id='${id}'`);
            data_result = data_result[0];
            yield this.ctx.render('admin/returnrecord_todetail.ejs',{
                data:data_result,
                page:this.ctx.query.page,
                pageSize:this.ctx.query.pageSize,
                search:this.ctx.query.search,
                hospital_id:this.ctx.query.hospital_id,
                begin_time:this.ctx.query.begin_time,
                end_time:this.ctx.query.end_time
            });
        }

        /*
            进入pdf页面
         */
        *topdf(){
            let id = this.ctx.query.id;
            let data_result = yield app.mysql.query(`SELECT trr.id,tmu.user_name,concat('ID.',tmu.user_number) as user_number,twr.child_name,if(twr.child_sex=1,'男','女') as child_sex,twr.hospital_name,
            DATE_FORMAT(twr.child_birth,"%Y-%m-%d") as child_birth,twr.sickbed_number,twr.phone,DATE_FORMAT(trr.create_date,"%Y.%m.%d %H:%i:%s") as create_date,
            concat(ta.name,'-',taa.name) as address,trr.receive_time,trr.is_practical,trr.style,trr.is_quality_satisfy,trr.is_deploy_satisfy,trr.suggest,trr.pdf_uri
            FROM t_return_record AS trr 
            LEFT JOIN t_warm_record AS twr ON trr.user_id=twr.user_id 
            LEFT JOIN t_hospital AS th ON th.id=twr.hospital_id 
            LEFT JOIN t_m_user AS tmu ON trr.user_id=tmu.id
            LEFT JOIN t_area as ta on ta.id=twr.province 
            LEFT JOIN t_area as taa on taa.id=twr.city  
            WHERE trr.id='${id}'`);
            data_result = data_result[0];
            yield this.ctx.render('admin/returnrecord_topdf.ejs',{
                data:data_result,
                page:this.ctx.query.page,
                pageSize:this.ctx.query.pageSize,
                search:this.ctx.query.search,
                hospital_id:this.ctx.query.hospital_id,
                begin_time:this.ctx.query.begin_time,
                end_time:this.ctx.query.end_time
            });
        }


    }
    return ReturnRecordController;
};



