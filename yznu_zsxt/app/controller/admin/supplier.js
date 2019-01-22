'use strict';

module.exports = app => {
    class SupplierController extends app.Controller {
        /** 
         * 进入供货商新增页面
         * @param
         * page  页数
         * pageSize  页大小
         * search  搜索内容
        */
        *toadd(){
            yield this.ctx.render('admin/supplier_toadd.ejs',{
                page:this.ctx.query.page,
                pageSize:this.ctx.query.pageSize,
                search:this.ctx.query.search,
            });
        }

        //新增供货商
        *add(){
            let user = yield this.ctx.session.m_user_info;
            let param = this.ctx.request.body;
            let obj = {
                id:this.ctx.helper.uuid(),
                name:param.name,
                phone:param.phone,
                province:param.province,
                city:param.city,
                address:param.address,
                deleted:'0',
                create_by:user.id,
                create_date:new Date()
            }
            const result = yield this.app.mysql.insert("t_m_supplier",obj);
            const insertSuccess = result.affectedRows === 1;
            if(insertSuccess){
                this.ctx.body={
                    errno : '100',
                    msg:'新增成功'
                }
            }else{
                this.ctx.body={
                    errno : '1001',
                    msg:'新增失败'
                }
            }
            
        }
        //获取省市
        * getcity(){
            let parent_id = this.ctx.query.parent_id;
            let data;
            if(parent_id==null||parent_id==undefined){
              data = yield this.app.mysql.query(`SELECT * FROM t_area WHERE parent_id='0' ORDER BY sort ASC`);
            }else{
              data = yield this.app.mysql.query(`SELECT * FROM t_area WHERE parent_id='${parent_id}' ORDER BY sort ASC`);
            }
            this.ctx.body=data;
          }

        //进入供货商列表页
        *tolist(){
            yield this.ctx.render('admin/supplier_tolist.ejs',{
                page:this.ctx.query.page,
                pageSize:this.ctx.query.pageSize,
                search:this.ctx.query.search
            }); 
        }

        //获取列表数据
        *datalist(){
            let data_offset = this.ctx.query.offset=='' ? 0:this.ctx.query.offset;
            let data_limit = this.ctx.query.limit=='' ? 10 :this.ctx.query.limit;
            let search = this.ctx.query.search;
            let sql_search = search == null ? '%%' : `and a.name LIKE '%${search}%'`;
            let sql_data = `SELECT a.id,a.name,a.phone,CONCAT_WS('-',b.name,c.name,a.address) AS addr 
                FROM t_m_supplier AS a
                LEFT JOIN t_area AS b ON a.province=b.id
                LEFT JOIN t_area AS c ON a.city=c.id 
                WHERE a.deleted='0' ${sql_search} 
                order by create_date desc limit ${data_offset},${data_limit}`;
            let sql_count = `select count(*) as total FROM t_m_supplier AS a
                LEFT JOIN t_area AS b ON a.province=b.id
                LEFT JOIN t_area AS c ON a.city=c.id 
                WHERE a.deleted='0' ${sql_search} `;
            let data_result = yield this.app.mysql.query(sql_data);
            let data_count = yield this.app.mysql.query(sql_count);
            if(data_result){
                this.ctx.body ={
                    total : data_count[0].total,
                    rows : data_result,
                    errno : '100'
                };
            }else{
                this.ctx.body = {
                    erron:'1001',
                    msg:'未知错误'
                };
            }
        }

        //逻辑删除供货商
        *todel(){
            let id = this.ctx.query.id;
            let user = yield this.ctx.session.m_user_info;
            let obj = {
                id:id,
                deleted:'1',
                update_date:new Date(),
                update_by:user.id
            }
            const result = yield this.app.mysql.update("t_m_supplier",obj);
            const updateSuccess = result.affectedRows === 1;
            if(updateSuccess){
                this.ctx.body={
                    errno : '100',
                    msg:'删除成功'
                }
            }else{
                this.ctx.body={
                    errno : '1001',
                    msg:'删除失败'
                }
            }
        }

        //进入编辑页面
        *toedit(){
            let id = this.ctx.query.id;
            let data = yield this.app.mysql.query(`SELECT a.*,b.name as provincename,c.name as cityname
                FROM t_m_supplier AS a
                LEFT JOIN t_area AS b ON a.province=b.id
                LEFT JOIN t_area AS c ON a.city=c.id 
                WHERE a.deleted='0' and a.id='${id}'`);
            yield this.ctx.render('admin/supplier_toedit.ejs',{
                data:data[0],
                page:this.ctx.query.page,
                pageSize:this.ctx.query.pageSize,
                search:this.ctx.query.search,
            });
        }

        //修改数据
        *update(){
            let user = yield this.ctx.session.m_user_info;
            let param = this.ctx.request.body;
            let obj = {
                id:param.id,
                name:param.name,
                phone:param.phone,
                province:param.province,
                city:param.city,
                address:param.address,
                update_by:user.id,
                update_date:new Date()
            }
            const result = yield this.app.mysql.update("t_m_supplier",obj);
            const updateSuccess = result.affectedRows === 1;
            if(updateSuccess){
                this.ctx.body={
                    errno : '100',
                    msg:'修改成功'
                }
            }else{
                this.ctx.body={
                    errno : '1001',
                    msg:'修改失败'
                }
            }
        }

        //查看详情
        *todetail(){
            let id = this.ctx.query.id;
            let data = yield this.app.mysql.query(`select a.id,a.name,a.type,a.pic_url,a.desc,DATE_FORMAT(COALESCE(a.update_date,a.create_date),'%Y-%m-%d') as create_date from t_m_product as a where a.id='${id}'`);
            yield this.ctx.render('admin/product_todetail.ejs',{data:data[0]});
        }
        //获取所有供应商
        *getsuppliers(){
            let data = yield this.app.mysql.query(`select * from t_m_supplier where deleted='0'`);
            this.ctx.body = {
                errno:100,
                data:data
            }
        }

    }
    return SupplierController;
};



