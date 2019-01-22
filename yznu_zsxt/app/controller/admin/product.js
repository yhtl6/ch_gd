'use strict';

module.exports = app => {
    class ProductController extends app.Controller {
        /** 
         * 进入农产品新增页面
         * @param
         * page  页数
         * pageSize  页大小
         * search  搜索内容
         * type  产品类型
        */
        *toadd(){
            yield this.ctx.render('admin/product_toadd.ejs',{
                page:this.ctx.query.page,
                pageSize:this.ctx.query.pageSize,
                search:this.ctx.query.search,
                stype:this.ctx.query.stype
            });
        }

        //新增农产品
        *add(){
            let user = yield this.ctx.session.m_user_info;
            let param = this.ctx.request.body;
            let data = yield this.app.mysql.query(`select * from t_m_product where name='${param.name}' and deleted='0'`);
            if(data.length>0){
                this.ctx.body = {errno:'1001',msg:'农产品已经存在'};            
            }else{
                let obj = {
                    id:this.ctx.helper.uuid(),
                    name:param.name,
                    pic_url:param.pic_url,
                    stype:param.stype,
                    sdesc:param.sdesc,
                    deleted:'0',
                    create_by:user.id,
                    create_date:new Date()
                }
                const result = yield this.app.mysql.insert("t_m_product",obj);
                const insertSuccess = result.affectedRows === 1;
                if(insertSuccess){
                    this.ctx.body={
                        errno : '100',
                        msg:'新增成功'
                    }
                }else{
                    this.ctx.body={
                        errno : '1002',
                        msg:'新增失败'
                    }
                }
            }
        }

        //进入农产品列表页
        *tolist(){
            yield this.ctx.render('admin/product_tolist.ejs',{
                page:this.ctx.query.page,
                pageSize:this.ctx.query.pageSize,
                search:this.ctx.query.search,
                stype:this.ctx.query.stype
            }); 
        }

        //获取列表数据
        *datalist(){
            let data_offset = this.ctx.query.offset=='' ? 0:this.ctx.query.offset;
            let data_limit = this.ctx.query.limit=='' ? 10 :this.ctx.query.limit;
            let search = this.ctx.query.search;
            let stype = this.ctx.query.stype;
            let sql_search = search == null ? '%%' : `and name LIKE '%${search}%'`;
            let sql_stype = stype =='' ? '':`and stype='${stype}'`;
            let sql_data = `select id,name,stype,pic_url,DATE_FORMAT(COALESCE(update_date,create_date),'%Y-%m-%d') as create_date from t_m_product where deleted='0' ${sql_search} ${sql_stype} 
            order by create_date desc limit ${data_offset},${data_limit}`;
            let sql_count = `select count(*) as total from t_m_product where deleted='0' ${sql_search} ${sql_stype}`;
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

        //逻辑删除农产品
        *todel(){
            let id = this.ctx.query.id;
            let user = yield this.ctx.session.m_user_info;
            let obj = {
                id:id,
                deleted:'1',
                update_date:new Date(),
                update_by:user.id
            }
            const result = yield this.app.mysql.update("t_m_product",obj);
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
            let data = yield this.app.mysql.query(`select * from t_m_product where id='${id}'`);
            yield this.ctx.render('admin/product_toedit.ejs',{
                data:data[0],
                page:this.ctx.query.page,
                pageSize:this.ctx.query.pageSize,
                search:this.ctx.query.search,
                stype:this.ctx.query.stype
            });
        }

        //修改数据
        *update(){
            let user = yield this.ctx.session.m_user_info;
            let param = this.ctx.request.body;
            let data = yield this.app.mysql.query(`select * from t_m_product where name='${param.name}' and deleted='0' and id!='${param.id}'`);
            if(data.length>0){
                this.ctx.body = {errno:'1001',msg:'农产品名已经存在'}
            }else{
                let obj = {
                    id:param.id,
                    name:param.name,
                    pic_url:param.pic_url,
                    stype:param.stype,
                    sdesc:param.sdesc,
                    update_by:user.id,
                    update_date:new Date()
                }
                const result = yield this.app.mysql.update("t_m_product",obj);
                const updateSuccess = result.affectedRows === 1;
                if(updateSuccess){
                    this.ctx.body={
                        errno : '100',
                        msg:'修改成功'
                    }
                }else{
                    this.ctx.body={
                        errno : '1002',
                        msg:'修改失败'
                    }
                }
            }
        }

        //查看详情
        *todetail(){
            let id = this.ctx.query.id;
            let data = yield this.app.mysql.query(`select a.id,a.name,a.stype,a.pic_url,a.sdesc,DATE_FORMAT(COALESCE(a.update_date,a.create_date),'%Y-%m-%d') as create_date from t_m_product as a where a.id='${id}'`);
            yield this.ctx.render('admin/product_todetail.ejs',{data:data[0]});
        }

    }
    return ProductController;
};



