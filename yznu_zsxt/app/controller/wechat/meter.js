'use strict';

module.exports = app => {
    class MeterController extends app.Controller {
        /**
         * 获取 公司 信息
         */
        *getcomp() {
            let token = this.ctx.query.token;
            let userid = yield this.app.redis.get(token);
            if (token) {
                let comp = yield this.app.mysql.queryOne(`SELECT * FROM t_ent_user teu left join t_ent te on te.id=teu.ent_id WHERE teu.id='${userid}' and teu.deleted='0' and teu.status='1' and teu.is_active='1'`);
                if (comp) {

                    if (comp.is_active == 0) {
                        this.ctx.body = {
                            code: "2001",
                            msg: "企业被禁用"
                        }
                        return false;
                    }
                    if (comp.deleted == 1) {
                        this.ctx.body = {
                            code: "2002",
                            msg: "企业被删除"
                        }
                        return false;
                    }

                    this.ctx.body = {
                        code: "200",
                        msg: "成功",
                        comp: comp
                    }
                    return false;
                } else {
                    this.ctx.body = {
                        code: "2002",
                        msg: "企业不存在"
                    }
                    return false;
                }
            }
            this.ctx.body = {
                code: "2003",
                msg: "身份错误"
            }
        }

        /**
         * 获取 人工抄表列表数据
         */
        *getlist() {
            let limit = this.ctx.query.pageSize;
            let offset = (parseInt(this.ctx.query.page) - 1) * limit;
            let comp_num = this.ctx.query.comp_num;
            let create_date = this.ctx.query.create_date;
            let ent_id = this.ctx.query.ent_id;
            let sql_search = comp_num == '' ? '' : ` AND (tmm.ent_number='${comp_num}')`;
            let sql_date = create_date == '' ? '' : ` AND (tmm.meter_date like '%${create_date}%')`;
            let data = yield this.app.mysql.query(`SELECT tmm.*,DATE_FORMAT(tmm.meter_date,'%Y-%m-%d %H:%i:%s') AS meter_date,teu.name as update_by_name FROM t_manual_meter AS tmm left join t_ent_user teu on teu.id = tmm.update_by WHERE tmm.deleted='0'${sql_search}${sql_date} AND (tmm.ent_id='${ent_id}') order by tmm.meter_date desc limit ${offset},${limit}`);
            let count = yield this.app.mysql.queryOne(`SELECT count(*) as total FROM t_manual_meter AS tmm WHERE tmm.deleted='0'${sql_search}${sql_date} AND (tmm.ent_id='${ent_id}')`);
            if (data) {
                yield this.ctx.body = {
                    code: 200,
                    data: data,
                    count: count.total
                }
            } else {
                yield this.ctx.body = {
                    code: 2001,
                    msg: '获取失败'
                }
            }
        }

        /**
         * 获取 人工抄表列表数据
         */
        *getdetail() {
            let meter_id = this.ctx.query.meter_id;
            let meter_data = yield this.app.mysql.queryOne(`SELECT tmm.*,DATE_FORMAT(tmm.meter_date,'%Y年%m月%d日') AS meter_date,teu.name as update_by_name,tet.name as comp_name FROM t_manual_meter AS tmm left join t_ent_user teu on teu.id = tmm.update_by left join t_ent tet on tet.id = tmm.ent_id WHERE tmm.deleted='0' AND tmm.id='${meter_id}'`);
            if (meter_data) {
                yield this.ctx.body = {
                    code: 200,
                    data: meter_data,
                    msg: '成功'
                }
            } else {
                yield this.ctx.body = {
                    code: 2001,
                    msg: '不存在或已删除'
                }
            }

        }

        /**
         * 添加人工抄表
         */
        *add() {
            let body_data = this.ctx.request.body;
            let token = this.ctx.query.token;
            let meter_number = body_data.meter_number;
            let meter_ele_num = body_data.meter_ele_num;
            let ent_id = body_data.ent_id;

            console.log(token);
            const conn = yield app.mysql.beginTransaction(); // 初始化事务
            try {
                let userid = yield this.app.redis.get(token);
                for (var i = 0; i < meter_number.length; i++) {
                    let meter_data = {
                        id: this.ctx.helper.uuid(),
                        ent_id: ent_id,
                        ent_number: meter_number[i],
                        meter_date: new Date(),
                        create_date: new Date(),
                        update_date: new Date(),
                        create_by: userid,
                        update_by: userid,
                        deleted: 0,
                        ele_num: meter_ele_num[i] == undefined ? 0 : meter_ele_num[i] == null ? 0 : meter_ele_num[i] == '' ? 0 : meter_ele_num[i] == NaN ? 0 : meter_ele_num[i]
                    }
                    yield conn.insert("t_manual_meter", meter_data);
                }
                yield conn.commit();
                this.ctx.body = {
                    code: '200',
                    msg: '提交成功'
                };

            } catch (err) {
                yield conn.rollback(); // 一定记得捕获异常后回滚事务！！
                this.ctx.body = {
                    errno: '2001',
                    msg: "提交失败"
                };
                throw err;
            }





        }


    }

    return MeterController;
};