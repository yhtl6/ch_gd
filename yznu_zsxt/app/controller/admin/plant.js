'use strict';
module.exports = app=>{
    class PlantController extends app.Controller{

        /**
         * 进入产品培育信息列表
         * 产品页参数：
         * pre_page  页码
         * pre_pageSize  页大小
         * pre_search  搜索内容
         * pre_type  产品类别
         *
         */
        *tolist(){
            let pre_data = {
                pre_page:this.ctx.query.pre_page,
                pre_pageSize:this.ctx.query.pre_pageSize,
                pre_search:this.ctx.query.pre_search,
                pre_type:this.ctx.query.pre_type
            };
            let product_id=this.ctx.query.product_id;
            let data = yield this.app.mysql.get("t_m_product",{id:product_id});
            yield this.ctx.render('admin/plant_tolist.ejs',{
                page:this.ctx.query.page,
                pageSize:this.ctx.query.pageSize,
                status:this.ctx.query.status,
                product_id:product_id,
                product_name:data.name,
                pre_data:pre_data
            });
        }
        //获取产品培育信息数据
        *datalist(){
            let data_offset = this.ctx.query.offset=='' ? 0:this.ctx.query.offset;
            let data_limit = this.ctx.query.limit=='' ? 10 :this.ctx.query.limit;
            let status = this.ctx.query.status;
            let product_id = this.ctx.query.product_id;
            let sql_status = status==''?'':`and a.status='${status}'`;
            let sql_data = `SELECT a.*,b.name AS supplier FROM t_m_plant AS a 
            LEFT JOIN t_m_supplier AS b ON a.supplier_id=b.id
            WHERE a.deleted='0' AND b.deleted='0' AND a.product_id='${product_id}' ${sql_status}
            order by a.create_date desc limit ${data_offset},${data_limit}`;

            let sql_count = `select count(*) as total from t_m_plant as a
            LEFT JOIN t_m_supplier AS b ON a.supplier_id=b.id
            WHERE a.deleted='0' AND b.deleted='0' AND a.product_id='${product_id}' ${sql_status}`;
            let data_result = yield this.app.mysql.query(sql_data);
            let data_count = yield this.app.mysql.query(sql_count);
            this.ctx.body = {
                errno:100,
                rows:data_result,
                total:data_count[0].total
            }
        }
        //跳转到培育信息新增页面
        *toadd(){
            yield this.ctx.render('admin/plant_toadd.ejs',{
                page:this.ctx.query.page,
                pageSize:this.ctx.query.pageSize,
                status:this.ctx.query.status,
                product_id:this.ctx.query.product_id,
                pre_data:this.ctx.query.pre_data,
            });
        }
        //新增产品培育信息
        *add(){
            let param = this.ctx.request.body;
            let user = this.ctx.session.m_user_info;
            let phase = new Date().Format("yyyyMMdd").toString();
            let data = yield this.app.mysql.query(`select * from t_m_plant where deleted='0' and product_id='${param.product_id}' and supplier_id='${param.supplier_id}' and status='${param.status}' and phase='${phase}'`);
            if(data.length>0){
                this.ctx.body = {errno:'1001',msg:'该批次产品已经存在该生长状态数据'}
            }else{
                let obj = {
                    id:this.ctx.helper.uuid(),
                    product_id:param.product_id,
                    supplier_id:param.supplier_id,
                    phase:phase,
                    status:param.status,
                    soil_condition:param.soil_condition,
                    illumination:param.illumination,
                    temperature:param.temperature,
                    humidity:param.humidity,
                    survival_rate:param.survival_rate,
                    breeding_quantity:param.breeding_quantity,
                    yield:param.yield,
                    pesticide_use:param.pesticide_use.replace(/\n|\r\n/g,"<br>"),
                    deleted:'0',
                    create_date:new Date(),
                    create_by:user.id
                }
                if(param.status==1 || param.status==2){
                    obj.breeding_quantity=null;
                    obj.yield=null;
                }else if(param.status==0){
                    obj.yield=null;
                }else if(param.status==3){
                    obj.breeding_quantity=null;
                }
                const result = yield this.app.mysql.insert("t_m_plant",obj);
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
        //删除培育信息
        *todel(){
            let id = this.ctx.query.id;
            let user = this.ctx.session.m_user_info;
            let obj = {
                id:id,
                deleted:'1',
                update_date:new Date(),
                update_by:user.id
            }
            const result = yield this.app.mysql.update("t_m_plant",obj);
            const updateSuccess = result.affectedRows === 1;
            if(updateSuccess){
                this.ctx.body={
                    errno : '100',
                    msg:'删除成功'
                }
            }else{
                this.ctx.body={
                    errno : '1002',
                    msg:'删除失败'
                }
            }
        }
        //培育信息详情
        *todetail(){
            let id = this.ctx.query.id;
            let sql_data = `SELECT a.*,b.name AS product_name,c.name AS supplier FROM t_m_plant AS a 
            LEFT JOIN t_m_product AS b ON a.product_id=b.id
            LEFT JOIN t_m_supplier AS c ON a.supplier_id=c.id
            WHERE a.deleted='0' AND a.id='${id}'`;
            let data = yield this.app.mysql.query(sql_data);
            yield this.ctx.render('admin/plant_todetail.ejs',{
                data:data[0]
            });
        }
        //跳转到编辑页面
        *toedit(){
            let id = this.ctx.query.id;
            let data = yield this.app.mysql.query(`select * from t_m_plant where id='${id}'`);
            var reg=new RegExp("<br>","g");
            var str = data[0].pesticide_use;
            if(str==null || str==''){

            }else{
                data[0].pesticide_use = str.replace(reg,"\n");
            }
            yield this.ctx.render('admin/plant_toedit.ejs',{
                data:data[0],
                page:this.ctx.query.page,
                pageSize:this.ctx.query.pageSize,
                status:this.ctx.query.status,
                pre_data:this.ctx.query.pre_data,
                product_id:this.ctx.query.product_id
            });
        }
        //修改培育信息
        *update(){
            let param = this.ctx.request.body;
            let sql_data = `select * from t_m_plant where deleted='0' and product_id='${param.product_id}' and supplier_id='${param.supplier_id}' 
            and status='${param.status}' and phase='${param.phase}' and id!='${param.id}'`;
            let data = yield this.app.mysql.query(sql_data);
            if(data.length>0){
                this.ctx.body = {
                    errno:'1001',
                    msg:'该批次产品已经存在该生长状态数据'
                }
            }else{
                let user = this.ctx.session.m_user_info;
                let obj = {
                    id:param.id,
                    supplier_id:param.supplier_id,
                    status:param.status,
                    soil_condition:param.soil_condition,
                    illumination:param.illumination,
                    temperature:param.temperature,
                    humidity:param.humidity,
                    survival_rate:param.survival_rate,
                    breeding_quantity:param.breeding_quantity,
                    yield:param.yield,
                    pesticide_use:param.pesticide_use.replace(/\n|\r\n/g,"<br>"),
                    update_date:new Date(),
                    update_by:user.id
                }
                if(param.status==1 || param.status==2){
                    obj.breeding_quantity=null;
                    obj.yield=null;
                }else if(param.status==0){
                    obj.yield=null;
                }else if(param.status==3){
                    obj.breeding_quantity=null;
                }
                const result = yield this.app.mysql.update("t_m_plant",obj);
                const updateSuccess = result.affectedRows===1;
                if(updateSuccess){
                    this.ctx.body = {
                        errno:'100',
                        msg:'修改成功'
                    }
                }else{
                    this.ctx.body = {
                        errno:'1002',
                        msg:'修改失败'
                    }
                }
            }

        }
    }
    return PlantController;
};