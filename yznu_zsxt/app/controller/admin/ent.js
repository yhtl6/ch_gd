'use strict';

module.exports = app => {
    class EntController extends app.Controller {
        *tolist(){
            yield this.ctx.render('admin/ent_tolist.ejs',{
                page:this.ctx.query.page,
                pageSize:this.ctx.query.pageSize,
                search:this.ctx.query.search,
                status:this.ctx.query.status
            });
        }

        *datalist(){
            let data_offset = this.ctx.query.offset;
            let data_limit = this.ctx.query.limit;
            let search = this.ctx.query.search;
            let status = this.ctx.query.status;
            let sql_andSearch = search == null ? '%%' : ` (te.name LIKE '%${search}%' or te.numbers like '%${search}%')`;
            let sql_andStatus = status =='' ? '' : `and (te.status = '${status}')`;
            let data_result = yield app.mysql.query(`SELECT te.id,te.name AS ent_name,te.numbers,te.status,count(teu.id) as num FROM t_ent as te left join t_ent_user as teu on te.id=teu.ent_id  
            WHERE  ${sql_andSearch} ${sql_andStatus} group by te.id
             ORDER BY te.create_date DESC LIMIT ${data_offset},${data_limit}  `);
            let data_count = yield app.mysql.query(`SELECT COUNT(*) AS total FROM t_ent as te 
            WHERE ${sql_andSearch} ${sql_andStatus}`);
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

        *changestatus(){
            let user = yield this.ctx.session.m_user_info;
            let id = this.ctx.query.id;
            let status = this.ctx.query.status;
            let ent = {
                id:id,
                status:status,
                update_date:new Date(),
                update_by:user.id
            }
            const result = yield this.app.mysql.update('t_ent',ent);
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
            let data = yield app.mysql.query(`select * from t_ent where id= '${id}' `);
            yield this.ctx.render('admin/ent_toedit.ejs',{
                data:data[0],
                page:this.ctx.query.page,
                pageSize:this.ctx.query.pageSize,
                search:this.ctx.query.search,
                status:this.ctx.query.status
            });
        }

        *update(){
            let user = yield this.ctx.session.m_user_info;
            let data = this.ctx.request.body;
            let ent = {
                id:data.id,
                name:data.ent_name,
                numbers:data.numbers,
                update_date:new Date(),
                update_by:user.id
            }
            const  result = yield this.app.mysql.update('t_ent',ent);
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

        *checkent(){
            let ent_name = this.ctx.query.ent_name;
            console.log(ent_name);
            let ent = yield this.app.mysql.query(`select * from t_ent where name='${ent_name}'`);
            if(ent.length>0){
                this.ctx.body={
                    errno : 0
                }
            }else{
                this.ctx.body={
                    errno : 1
                }
            }
        }

        *toadd(){
            yield this.ctx.render('admin/ent_toadd.ejs',{
                page:this.ctx.query.page,
                pageSize:this.ctx.query.pageSize,
                search:this.ctx.query.search,
                status:this.ctx.query.status
            });
        }

        *add(){
            let user = yield this.ctx.session.m_user_info;
            let data = this.ctx.request.body;
            let ent = {
                id:this.ctx.helper.uuid(),
                name:data.ent_name,
                numbers:data.numbers,
                status:1,
                create_date:new Date(),
                create_by:user.id
            }
            const  result = yield this.app.mysql.insert('t_ent',ent);
            const insertSuccess = result.affectedRows === 1;
            if(insertSuccess){
                this.ctx.body={
                    errno : '0'
                }
            }else{
                this.ctx.body={
                    errno : '1'
                }
            }
        }

        *tomanage(){
            let ent_id = this.ctx.query.id;
            console.log("====="+ent_id);
            let ent = yield this.app.mysql.queryOne(`select * from t_ent where id='${ent_id}'`);
            yield this.ctx.render('admin/muser_tolist.ejs',{
                page:this.ctx.query.page,
                pageSize:this.ctx.query.pageSize,
                search:this.ctx.query.search,
                status:this.ctx.query.status,
                ent_id:ent_id,
                name:ent.name
            });
        }












    }
    return EntController;
};



