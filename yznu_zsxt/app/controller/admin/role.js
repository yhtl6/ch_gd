'use strict';

module.exports = app => {
    class RoleController extends app.Controller {


        * datalist() {

            let data_offset = this.ctx.query.offset;
            let data_limit = this.ctx.query.limit;

            const data_count = yield app.mysql.query("select count(*) as total from t_m_role b where b.deleted = '0'")
            const data_result = yield app.mysql.query("select * from t_m_role  where deleted = '0' limit ?,? ",
                [parseInt(data_offset), parseInt(data_limit)]);
            var return_data = {
                total: data_count[0].total,
                rows: data_result
            }
            this.ctx.body = return_data;

        }
        * tolist() {
            yield this.ctx.render('admin/role_tolist.ejs', {
                page:this.ctx.query.page,
                pageSize:this.ctx.query.pageSize
            });
        }
        * toadd() {
            yield this.ctx.render('admin/role_toadd.ejs', {
                data: {},
            });
        }
        * dataadd() {

            let code = this.ctx.request.body.code
            let description = this.ctx.request.body.description


            let menus =this.ctx.query.menus
            let menu = menus.split(",");



            const role_exist = yield app.mysql.queryOne("select * from t_m_role where description = ?", [description]);
            let result;

            let saveobj = {
                id: this.ctx.helper.uuid(),
                code: code,
                description: description,
                deleted: 0,


            }
            if (role_exist == null) {
                result = yield this.app.mysql.insert('t_m_role', saveobj);
                let sql="insert into t_m_role_menu (id, role_id , menu_id ) values ";
                let value;
                for(let i=0;i<menu.length;i++){
                     value="('"+this.ctx.helper.uuid()+"','"+saveobj.id+"','"+menu[i]+"')";
                    if(i+1!=menu.length){
                        value=value+",";
                    }
                    sql=sql+value;
                }
                console.log(sql);
                yield this.app.mysql.query(sql);
            }

            if (role_exist != null) {
                this.ctx.body = {errno: 2, msg: '角色重复'}
            }
            else if (result.affectedRows === 1) {

                this.ctx.body = {errno: 0}

            } else {

                this.ctx.body = {errno: 1}
            }

        }
        * toedit() {
            let id=this.ctx.query.id;

            let data= yield this.app.mysql.get('t_m_role',{id:this.ctx.query.id});
            let sql="SELECT t_m_role_menu.menu_id FROM t_m_role_menu WHERE role_id ='"+id+"'";
            let menus=yield this.app.mysql.query(sql);


            yield this.ctx.render('admin/role_toedit.ejs',{
                data:data,
                page:this.ctx.query.page,
                search:this.ctx.query.search,
                pageSize:this.ctx.query.pageSize
            });
        }
        * show() {
            let data=yield this.app.mysql.get("t_m_role",{id:this.ctx.query.id});
            yield this.ctx.render('admin/role_toshow.ejs',{
                data:data,
                page:this.ctx.query.page,
                search:this.ctx.query.search,
                pageSize:this.ctx.query.pageSize
            });
        }

        /**
         * 编辑角色
         */
        * uprole(){
            let id=this.ctx.request.body.id;
            let code=this.ctx.request.body.code;
            let description=this.ctx.request.body.description;
            let menus = this.ctx.request.body.select;
            let userinfo = this.ctx.session.m_user_info;
            if(userinfo != undefined && userinfo != null && userinfo != ""){
                if(code == "super" && userinfo.user_name != 'superadmin'){
                    this.ctx.body = {errno: 1,errmsg:"编码不能为super"}
                }else{
                    //检查编码是否重复
                    let istemp = yield this.app.mysql.queryOne("select * from t_m_role where id!=? and code=? and deleted=0",[id,code]);
                    if(istemp != undefined && istemp != null && istemp.id != id){
                        //编码重复
                        this.ctx.body = {errno: 1,errmsg:"编码不能重复"}
                    }else{
                        let saveobj = {
                            id: id,
                            code: code,
                            description: description,
                            update_date:new Date(),
                            update_by:userinfo.id
                        }
                        //开启事物
                        const conn = yield app.mysql.beginTransaction();
                        try {
                            //修改角色信息
                            yield conn.update("t_m_role",saveobj);
                            //删除原有角色菜单关联信息
                            yield conn.delete("t_m_role_menu",{"role_id":id});
                            if(menus != undefined && menus != null &&  menus !="" && menus.length>0){
                                //插入角色菜单关联表
                                for(var i=0;i<menus.length;i++){
                                    let menuobj = {
                                        id:this.ctx.helper.uuid(),
                                        menu_id:menus[i],
                                        role_id:id
                                    }
                                    yield conn.insert("t_m_role_menu",menuobj);
                                }
                            }
                            yield conn.commit();
                            this.ctx.body = {errno: 0}
                        } catch (err) {
                            console.log(err);
                            // error, rollback
                            yield conn.rollback(); // rollback call won't throw err
                            this.ctx.body = {errno: 1,errmsg:"保存失败"}
                        }

                    }
                }
            }else{
                this.ctx.body = {errno: 1,errmsg:"保存失败,登录信息过期!"}
            }

        }
        * delrole(){
            let id=this.ctx.query.id;
            let sql_delete_menu="delete from t_m_role_menu where role_id="+"'"+id+"'";
            if(id!=null){
                let row={
                    id:id,
                    deleted:'1',
                }
                let data=yield this.app.mysql.update("t_m_role",row);
                if(data.affectedRows==1){
                    yield this.app.mysql.query(sql_delete_menu);
                    this.ctx.body = {errno:0};
                }else{
                    this.ctx.body = {errno:1,msg:"删除失败"};
                }
            }else{
                this.ctx.body = {errno:1,msg:"缺省参数"};
            }
        }

        /**
         * 获取所有角色
         */
        * getRole(){
            let data=yield this.app.mysql.select("t_m_role",{deleted:'0'});
            this.ctx.body=data;
        }

        /**
         * 获取角色拥有的菜单
         */
        * getrolemenus() {
            let id=this.ctx.query.id;
            // console.log("id====:"+id);
            let data= yield this.app.mysql.query("select * from t_m_role_menu where role_id=?",[id]);
            let menus=[];
            if(data != undefined && data != null && data !="" ){
                for(var i=0;i<data.length;i++){
                    menus.push(data[i].menu_id);
                }
            }
            this.ctx.body = {menus: menus}
        }


    }
    return RoleController;
};



