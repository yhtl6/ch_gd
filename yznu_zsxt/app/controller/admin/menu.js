'use strict';

module.exports = app => {
    class MenuController extends app.Controller {

        /**
         * 进入菜单管理列表页
         */
        * tomenulist(){
            let pid = this.ctx.query.pid;
            let showback = true;
            if(pid == undefined || pid == null){
                pid = "";
                showback = false;
            }
            yield this.ctx.render('admin/menu_datalist.ejs',{
                pid:pid,
                showback:showback
            });
        }
        /**
         * 进入菜单新增页
         */
        * toadd(){
            let pid = this.ctx.query.pid;
            if(pid == undefined || pid == null || pid == ""){
                pid = "0";
            }
            yield this.ctx.render('admin/menu_toadd.ejs',{pid:pid});
        }
        /**
         * 获取菜单列表数据
         */
        * datalist() {
            let pid = this.ctx.query.pid;
            let data_result =[];
            if(pid == undefined || pid == null || pid == ""){
                data_result = yield app.mysql.query("SELECT m.id,m.name,m.uri,m.parent_id,pm.name AS pname FROM t_m_menu m LEFT JOIN t_m_menu pm ON m.parent_id=pm.id WHERE m.deleted='0' and m.parent_id='0' order by m.sort");
            }else{
                data_result = yield app.mysql.query("SELECT m.id,m.name,m.uri,m.parent_id,pm.name AS pname FROM t_m_menu m LEFT JOIN t_m_menu pm ON m.parent_id=pm.id WHERE m.deleted='0' and m.parent_id=? order by m.sort",[pid]);
            }

            this.ctx.body ={rows:data_result} ;

        }

        /**
         * 组织菜单
         */
        * menusort(){
            //获取一级菜单
            const yijimenu = yield app.mysql.query("SELECT * FROM t_m_menu WHERE parent_id='0' AND deleted='0' order by sort");
            let user=yield this.ctx.session.m_user_info;
            //不是开发人员的管理账号不显示菜单管理
            let wheresql = "";
            if(user.nick_name != "开发系统管理人员"){
                wheresql = " AND  name != '菜单管理'";
            }
            //获取二级菜单
            const erjimenu = yield app.mysql.query("SELECT * FROM t_m_menu WHERE parent_id!='0' AND deleted='0' "+wheresql+" order by sort");
            let menus = [];
            for(var i=0;i<yijimenu.length;i++){
                let yiji = yijimenu[i];
                menus.push(yiji);
                for(var j=0;j<erjimenu.length;j++){
                    let erji = erjimenu[j];
                    if(yiji.id == erji.parent_id){
                        menus.push(erji);
                    }
                }
            }
            this.ctx.body ={menus:menus} ;
        }



        /**
         * 获取一级菜单数据
         */
        * getparentmenus(){
            const data_result = yield app.mysql.query("SELECT * FROM t_m_menu WHERE parent_id='0' AND deleted='0' order by sort");
            this.ctx.body =data_result ;
        }

        /**
         * 保存菜单
         */
        * addmenu(){
            let name = this.ctx.request.body.name;
            let uri = this.ctx.request.body.uri;
            let pid = this.ctx.request.body.pid;
            let sort = this.ctx.request.body.sort;
            console.log("fff=="+uri);
            let saveobj = {
                id: this.ctx.helper.uuid(),
                name: name,
                uri: uri,
                parent_id:pid,
                sort:sort,
                deleted:'0'
            }

            let result = yield this.app.mysql.insert('t_m_menu', saveobj);
            if(result.affectedRows === 1){
                this.ctx.body = {errno:0} ;
            }else{
                this.ctx.body = {errno:1,msg:"保存失败"} ;
            }


        }
        /**
         * 进入编辑页面
         */
        * toedit(){
            let id=this.ctx.query.id;
            let pid=this.ctx.query.pid;
            if(pid == undefined || pid == null || pid == ""){
                pid = "0"
            }
            let result = yield this.app.mysql.get('t_m_menu', {id:id});

            yield this.ctx.render('admin/menu_toedit.ejs',{
                data:result,
                pid : pid
            });
        }
        /**
         * 保存编辑
         */
        * edit(){
            let id=this.ctx.request.body.id;
            let name=this.ctx.request.body.name;
            let uri=this.ctx.request.body.uri;
            let pid=this.ctx.request.body.pid;
            let sort=this.ctx.request.body.sort;

            const  saveobj = {
                id:id,
                name: name,
                uri: uri,
                parent_id:pid,
                sort:sort
            }
            const  result = yield this.app.mysql.update('t_m_menu',saveobj);
            if(result.affectedRows === 1){
                this.ctx.body = {errno:0} ;
            }else{
                this.ctx.body = {errno:1,msg:"保存失败"} ;
            }
        }

        /**
         * 逻辑删除菜单
         */
        * delmenu(){
            let id=this.ctx.request.body.id;
            let result = yield app.mysql.query("update t_m_menu set deleted='1' where id=? or parent_id=?",[id,id]);
            if(result.affectedRows >= 1){
                this.ctx.body = {errno:0}
            }else{
                this.ctx.body = {errno:1,msg:"删除失败"} ;
            }
        }



    }


    return MenuController;
};