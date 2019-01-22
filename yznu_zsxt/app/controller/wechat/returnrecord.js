'use strict';

module.exports = app => {
    class ReturnRecordController extends app.Controller {

        *find(){
            let user = this.ctx.session.web_user_info;
            let data = yield this.app.mysql.query(`select * from t_warm_record where user_id='${user.id}'`);
            console.log(data);
            if(data!=null && data!=''){
                this.ctx.body = {
                    code: "200",
                    msg: "SUCCESS",
                }
            }else{
                this.ctx.body = {
                    code: "300",
                    msg: "FAILER",
                }
            }
        }
        /*
        新增回访问卷记录
        answer  前5道题答案
        suggest  建议
         */
        *add(){
            let answer = this.ctx.query.answer;
            let suggest = this.ctx.query.suggest;
            let info=[];
            answer.slice(2,answer.length-1);
            info = answer.split(',');
            let uuid = this.ctx.helper.uuid();
            let url = "/admin/returnrecord/topdf?id="+uuid;
            let pdfpath = yield this.ctx.service.htmltopdf.htmltopdf(url,null,uuid);
            let record = {
                id:uuid,
                user_id:this.ctx.session.web_user_info.id,
                receive_time:info[0].substring(2,info[0].length-1),
                is_practical:info[1].substring(1,info[1].length-1),
                style:info[2].substring(1,info[2].length-1),
                is_quality_satisfy:info[3].substring(1,info[3].length-1),
                is_deploy_satisfy:info[4].substring(1,info[4].length-2),
                suggest:suggest,
                create_date:new Date(),
                create_by:this.ctx.session.web_user_info.id,
                pdf_uri:pdfpath,
                deleted:0
            }
            const result = yield this.app.mysql.insert('t_return_record',record);
            const updateSuccess = result.affectedRows === 1;
            if(updateSuccess){
                let newuser = {
                    id:this.ctx.session.web_user_info.id,
                    is_write:1
                }
                yield this.app.mysql.update("t_m_user",newuser);
                this.ctx.body = {
                    code: "200",
                    msg: "SUCCESS",
                    data:{
                        id:uuid
                    }
                }
            }else{
                this.ctx.body = {
                    code: "300",
                    msg: "FAILER",

                }
            }

        }
        /*
        回访问卷记录详情
         */
        *detail(){
            let id = this.ctx.query.id;
            console.log("id==="+id);
            let data = yield this.app.mysql.query(`select * from t_return_record where id='${id}' and deleted='0'`);
            this.ctx.body = {
                code: "200",
                msg: "SUCCESS",
                data:data[0]
            }
        }

        /*
        回访问卷记录列表
         */
        *getlist(){
            let limit = this.ctx.query.pageSize;
            let offset = (parseInt(this.ctx.query.page) - 1) * limit;
            let user = this.ctx.session.web_user_info;
            let data = yield this.app.mysql.query(`select id,DATE_FORMAT(create_date,"%Y.%m.%d %H:%i:%s") as create_date from t_return_record where user_id='${user.id}' and deleted='0' order by create_date desc limit ${offset},${limit}`);
            let count = yield this.app.mysql.query(`select count(*) as total from t_return_record where user_id='${user.id}' and deleted='0'`);

            yield this.ctx.body = {
                code : 200,
                data : data,
                total : count[0].total
            }
        }

    }
    return ReturnRecordController;
};



