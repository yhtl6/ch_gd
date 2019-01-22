'use strict';

module.exports = app => {
    class electricController extends app.Controller {
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
        电量申请列表
         */
        *getlist() {
            let limit = this.ctx.query.pageSize;
            let offset = (parseInt(this.ctx.query.page) - 1) * limit;

            let search = this.ctx.query.search;
            let date = this.ctx.query.date;

            if (date != null && date != '' && date != undefined) {
                date = date.substring(0, 4) + '' + date.substring(5, date.length);
            }

            let sql_search = search == '' ? '' : ` AND (u.name like '%${search}%')`;
            let sql_date = date == '' ? '' : ` AND (ea.apply_date like '%${date}%')`;

            let token = this.ctx.query.token;
            let userid = yield this.app.redis.get(token);
            let user = yield app.mysql.queryOne(`SELECT ent_id FROM  t_ent_user WHERE id='${userid}'`);

            let data = yield this.app.mysql.query(`SELECT ea.*,DATE_FORMAT(ea.update_date,'%Y-%m-%d %H:%i:%s') as update_date,u.name AS user_name FROM t_ele_apply AS ea LEFT JOIN  t_ent_user AS u ON u.id=ea.create_by WHERE ea.deleted='0' and ea.ent_id='${user.ent_id}'${sql_search}${sql_date} order by ea.apply_date*1 desc limit ${offset},${limit}`);
            let count = yield this.app.mysql.query(`SELECT count(*) as total FROM t_ele_apply AS ea LEFT JOIN  t_ent_user AS u ON u.id=ea.update_by WHERE ea.deleted='0'`);
            for (var i = 0; i < data.length; i++) {
                if (data[i].user_name == null || data[i].user_name == '' || data[i].user_name == undefined) {
                    data[i].user_name = '未知'
                }
                if (data[i].update_date == null || data[i].update_date == '' || data[i].update_date == undefined) {
                    data[i].update_date = '未知'
                }
                data[i].year = data[i].apply_date.substring(0, 4);
                data[i].month = data[i].apply_date.substring(4, data[i].apply_date.length);
            }
            yield this.ctx.body = {
                code: 200,
                data: data,

                total: count[0].total
            }
        }
        /*
                电量申请检查
                 */
        *getcheck() {
            //电量申报的申报日期
            let apply_time = '';
            let time = new Date();
            let year = time.getFullYear();
            let month = time.getMonth() + 2;
            if (month < 10) {
                apply_time = year + '0' + month;
            } else { apply_time = year + '' + month; }


            let token = this.ctx.query.token;
            let userid = yield this.app.redis.get(token);
            let user = yield app.mysql.queryOne(`SELECT ent_id FROM  t_ent_user WHERE id='${userid}'`);

            let end = yield app.mysql.queryOne(`SELECT COUNT(*) as num FROM t_ele_apply WHERE ent_id='${user.ent_id}' AND apply_date='${apply_time}'`);

            let data = false;

            if (end.num > 0) {
                data = true;
            }
            //获取电量申报的截止时间
            let apply_time2 = '';
            let month2 = time.getMonth() + 1;
            if (month2 < 10) {
                apply_time2 = year + '0' + month2;
            } else { apply_time2 = year + '' + month2; }


            let end3 = yield app.mysql.queryOne(`SELECT DATE_FORMAT(end_date,'%Y-%m-%d') AS end_date FROM t_applydate_set WHERE apply_date='${apply_time2}'`);

            let end4 = end3.end_date.substring(8, end3.end_date.length) * 1;
            this.ctx.body = {
                code: "200",
                msg: "SUCCESS",
                data: data,
                end: end4

            }
        }
        *add() {
            let params = this.ctx.request.body;
            let electric_id = params.electric_id;
            let token = this.ctx.query.token;
            let userid = yield this.app.redis.get(token);
            const conn = yield app.mysql.beginTransaction(); // 初始化事务
            let user = yield app.mysql.queryOne(`SELECT ent_id FROM  t_ent_user WHERE id='${userid}'`);
            try {
                if (electric_id != '' && electric_id != null && electric_id != undefined) {
                    let update_data = {
                        id: electric_id,
                        year_apply: params.year_apply,
                        month_apply: params.month_apply,
                        update_by: userid,
                        update_date: new Date(),
                        deleted: 0
                    }
                    const result = yield conn.update("t_ele_apply", update_data);
                    yield conn.commit();
                    this.ctx.body = {
                        code: "2002",
                        msg: "SUCCESS",
                    }
                } else {
                    let insert_data = {
                        id: this.ctx.helper.uuid(),
                        ent_id: user.ent_id,
                        apply_date: params.apply_date,
                        year_apply: params.year_apply,
                        month_apply: params.month_apply,
                        create_by: userid,
                        create_date: new Date(),
                        update_by: userid,
                        update_date: new Date(),
                        deleted: 0
                    }
                    const result = yield conn.insert("t_ele_apply", insert_data);
                    yield conn.commit();
                    this.ctx.body = {
                        code: "200",
                        msg: "SUCCESS",
                    }
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
    }
    return electricController;
};



