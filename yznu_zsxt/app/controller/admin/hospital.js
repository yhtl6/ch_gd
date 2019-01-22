'use strict';

module.exports = app => {
    class HospitalController extends app.Controller {
        /*
         进入医院增加页面
         （保存上个页面的查询数据）
         search 搜索框内容
         */
        *toadd(){
            yield this.ctx.render('admin/hospital_toadd.ejs',{
                page:this.ctx.query.page,
                pageSize:this.ctx.query.pageSize,
                search:this.ctx.query.search
            });
        }
        /*
           增加新的医院
           user 获取当前登录用户
         */
        *addhospital(){
            let user = yield this.ctx.session.m_user_info;
            let data = this.ctx.request.body;
            let hospital = {
                id:this.ctx.helper.uuid(),
                hospital_code:data.hospital_code,
                hospital_name:data.hospital_name,
                create_date:new Date(),
                create_by:user.id
            }
            const  result = yield this.app.mysql.insert('t_hospital',hospital);
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

        /*
        进入医院列表页面
         */
        *tolist(){
            yield this.ctx.render('admin/hospital_tolist.ejs',{
                page:this.ctx.query.page,
                pageSize:this.ctx.query.pageSize,
                search:this.ctx.query.search
            });
        }

        /*
        查询医院列表数据
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
            let sql_andSearch = search == null ? '%%' : 'AND (hospital_name LIKE "%' + search + '%")';
            let data_result = yield app.mysql.query(`SELECT id,hospital_code,hospital_name,DATE_FORMAT(create_date,"%Y-%m-%d %H:%i") as create_date FROM t_hospital 
            WHERE deleted = '0' ${sql_andSearch}
             ORDER BY create_date DESC LIMIT ${data_offset},${data_limit}  `);
            let data_count = yield app.mysql.query(`SELECT COUNT(*) AS total FROM t_hospital WHERE deleted = '0' ${sql_andSearch} `);
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
        进入编辑页面
        id  医院id
         */
        *toedit(){
            let id = this.ctx.query.id;
            let data = yield app.mysql.query(`select * from t_hospital where id= '${id}' and deleted='0' `);
            yield this.ctx.render('admin/hospital_toedit.ejs',{
                data:data[0],
                page:this.ctx.query.page,
                pageSize:this.ctx.query.pageSize,
                search:this.ctx.query.search
            });
        }

        /*
        更新医院信息
         */
        *update(){
            let user = yield this.ctx.session.m_user_info;
            let data = this.ctx.request.body;
            let hospital = {
                id:data.id,
                hospital_code:data.hospital_code,
                hospital_name:data.hospital_name,
                deleted:'0',
                update_date:new Date(),
                update_by:user.id
            }
            const  result = yield this.app.mysql.update('t_hospital',hospital);
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

        /*
        删除(逻辑删除)
        id  医院id
        user  当前登录用户
         */
        *todel(){
            let id = this.ctx.query.id;
            let user = yield this.ctx.session.m_user_info;
            let hospital = {
                id:id,
                deleted:'1',
                update_date:new Date(),
                update_by:user.id
            }
            const result = yield this.app.mysql.update('t_hospital',hospital);
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












    }
    return HospitalController;
};



