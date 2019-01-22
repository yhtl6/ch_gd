'use strict';

module.exports = app => {
    class yewuController extends app.Controller {
        /*
        电量申请详情
         */
        *getdetail() {
            let electric_id = this.ctx.query.electric_id;
            let data = yield this.app.mysql.queryOne(`SELECT ea.*,DATE_FORMAT(ea.update_date,'%Y-%m-%d') AS update_date,mu.name AS user_name,e.name AS ent_name FROM t_ele_apply AS ea LEFT JOIN t_ent AS e ON ea.ent_id=e.id LEFT JOIN t_ent_user AS mu ON mu.id=ea.update_by WHERE ea.id='${electric_id}'`);
            data.year = data.apply_date.substring(0, 4);
            data.month = data.apply_date.substring(4, data.apply_date.length);
            data.total = data.year_apply * 1 + data.month_apply * 1;
            data.update_date = data.update_date.substring(0, 4) + '年' + data.update_date.substring(5, 7) + '月' + data.update_date.substring(8, data.update_date.length) + '日';

            //获取电量申报的截止时间
            let apply_time = '';
            let time = new Date();
            let year = time.getFullYear();
            let month = time.getMonth() + 1;
            if (month < 10) {
                apply_time = year + '0' + month;
            } else { apply_time = year + '' + month; }


            let end = yield app.mysql.queryOne(`SELECT DATE_FORMAT(end_date,'%Y-%m-%d') AS end_date FROM t_applydate_set WHERE apply_date='${apply_time}'`);
            let end2 = end.end_date.substring(8, end.end_date.length) * 1;


            this.ctx.body = {
                code: "200",
                msg: "SUCCESS",
                data: data,
                end: end2
            }
        }

        /*
        业务申请列表
         */
        *getlist() {
            let limit = this.ctx.query.pageSize;
            let offset = (parseInt(this.ctx.query.page) - 1) * limit;

            let select_type = this.ctx.query.select_type;
            let select_date = this.ctx.query.date;

            let sql_search = select_type == '' ? '' : ` AND (ba.bussiness_type='${select_type}')`;
            console.log()
            let sql_date = select_date == '' ? '' : ` AND (ba.update_date like '%${select_date}%')`;
            console.log(sql_date)
            let token = this.ctx.query.token;
            let userid = yield this.app.redis.get(token);
            let user = yield app.mysql.queryOne(`SELECT ent_id FROM t_ent_user WHERE id='${userid}'`);

            let data = yield this.app.mysql.query(`SELECT ba.id,ba.bussiness_type,u.name AS u_name,DATE_FORMAT(ba.update_date,'%Y-%m-%d %H:%i:%s') AS update_date FROM t_business_apply AS ba LEFT JOIN t_ent_user AS u ON ba.update_by=u.id WHERE ba.deleted='0'${sql_search}${sql_date} order by ba.create_date desc limit ${offset},${limit}`);
            let count = yield this.app.mysql.query(`SELECT count(*) as total FROM t_business_apply AS ba LEFT JOIN t_ent_user AS u ON ba.update_by=u.id WHERE ba.deleted='0'${sql_search}${sql_date}`);
            for (var i = 0; i < data.length; i++) {
                if (data[i].user_name == null || data[i].user_name == '' || data[i].user_name == undefined) {
                    data[i].user_name = '未知'
                }
                if (data[i].update_date == null || data[i].update_date == '' || data[i].update_date == undefined) {
                    data[i].update_date = '未知'
                }
                if (data[i].bussiness_type == '1') {
                    data[i].bussiness_type = '高压增容'
                } else if (data[i].bussiness_type == '2') {
                    data[i].bussiness_type = '减容'
                } else if (data[i].bussiness_type == '3') {
                    data[i].bussiness_type = '减容恢复'
                } else if (data[i].bussiness_type == '4') {
                    data[i].bussiness_type = '暂停'
                } else if (data[i].bussiness_type == '5') {
                    data[i].bussiness_type = '暂停恢复'
                } else if (data[i].bussiness_type == '6') {
                    data[i].bussiness_type = '暂换'
                } else if (data[i].bussiness_type == '7') {
                    data[i].bussiness_type = '暂换恢复'
                } else if (data[i].bussiness_type == '8') {
                    data[i].bussiness_type = '改压'
                } else if (data[i].bussiness_type == '9') {
                    data[i].bussiness_type = '改类'
                } else if (data[i].bussiness_type == '10') {
                    data[i].bussiness_type = '迁址'
                } else if (data[i].bussiness_type == '11') {
                    data[i].bussiness_type = '移表'
                } else if (data[i].bussiness_type == '12') {
                    data[i].bussiness_type = '暂拆'
                } else if (data[i].bussiness_type == '13') {
                    data[i].bussiness_type = '复装'
                } else if (data[i].bussiness_type == '14') {
                    data[i].bussiness_type = '更名'
                } else if (data[i].bussiness_type == '15') {
                    data[i].bussiness_type = '过户'
                } else if (data[i].bussiness_type == '16') {
                    data[i].bussiness_type = '分户'
                } else if (data[i].bussiness_type == '17') {
                    data[i].bussiness_type = '并户'
                } else {
                    data[i].bussiness_type = '销户'
                }

            }
            yield this.ctx.body = {
                code: 200,
                data: data,
                total: count[0].total
            }
        }

        *add() {
            console.log("params")
            let params = this.ctx.request.body;
            console.log(params)
            let token = this.ctx.query.token;
            let userid = yield this.app.redis.get(token);
            const conn = yield app.mysql.beginTransaction(); // 初始化事务

            try {
                let insert_data = {
                    id: this.ctx.helper.uuid(),
                    ent_id: '',
                    sell_ent_name: params.sell_ent_name,
                    supply_ent_name: params.supply_ent_name,
                    user_name: params.user_name,
                    user_code: params.user_code,
                    use_address: params.use_address,
                    bussiness_type: params.type,
                    email: params.email,
                    create_by: userid,
                    create_date: new Date(),
                    update_by: userid,
                    update_date: new Date(),
                    deleted: 0
                }
               
                const result = yield conn.insert("t_business_apply", insert_data);
                let url = "/admin/business/createpdf?id=" + insert_data.id
                let pdfpath = yield this.ctx.service.htmltopdf.businesstopdf(url, null,insert_data.id);
                let update_data = {
                    id: insert_data.id,
                    pdf_path:pdfpath
                }
                yield conn.update("t_business_apply",update_data);
                yield conn.commit();
                this.ctx.body = {
                    code: "200",
                    msg: "SUCCESS",
                }
            } catch (err) {
                yield conn.rollback(); // 一定记得捕获异常后回滚事务！！
                this.ctx.body = {
                    code: 2001,
                    msg: '新增失败！'
                };
                throw err;
            }
        }
        /*
        业务申请详情
         */
        *getdetail() {
            let yewu_id = this.ctx.query.yewu_id;
            let data = yield this.app.mysql.queryOne(`SELECT ba.*,DATE_FORMAT(ba.create_date,'%Y-%m-%d') AS create_date,u.name AS u_name FROM t_business_apply  AS ba LEFT JOIN t_ent_user AS u ON u.id=ba.create_by WHERE ba.id='${yewu_id}'`);
            data.create_date = data.create_date.substring(0, 4) + '年' + data.create_date.substring(5, 7) + '月' + data.create_date.substring(8, data.create_date.length) + '日';
            if (data.bussiness_type == '1') {
                data.bussiness_type = '高压增容'
            } else if (data.bussiness_type == '2') {
                data.bussiness_type = '减容'
            } else if (data.bussiness_type == '3') {
                data.bussiness_type = '减容恢复'
            } else if (data.bussiness_type == '4') {
                data.bussiness_type = '暂停'
            } else if (data.bussiness_type == '5') {
                data.bussiness_type = '暂停恢复'
            } else if (data.bussiness_type == '6') {
                data.bussiness_type = '暂换'
            } else if (data.bussiness_type == '7') {
                data.bussiness_type = '暂换恢复'
            } else if (data.bussiness_type == '8') {
                data.bussiness_type = '改压'
            } else if (data.bussiness_type == '9') {
                data.bussiness_type = '改类'
            } else if (data.bussiness_type == '10') {
                data.bussiness_type = '迁址'
            } else if (data.bussiness_type == '11') {
                data.bussiness_type = '移表'
            } else if (data.bussiness_type == '12') {
                data.bussiness_type = '暂拆'
            } else if (data.bussiness_type == '13') {
                data[i].bussiness_type = '复装'
            } else if (data.bussiness_type == '14') {
                data[i].bussiness_type = '更名'
            } else if (data.bussiness_type == '15') {
                data.bussiness_type = '过户'
            } else if (data.bussiness_type == '16') {
                data.bussiness_type = '分户'
            } else if (data.bussiness_type == '17') {
                data.bussiness_type = '并户'
            } else {
                data.bussiness_type = '销户'
            }
            this.ctx.body = {
                code: "200",
                msg: "SUCCESS",
                data: data,
            }
        }

    }
    return yewuController;
};



