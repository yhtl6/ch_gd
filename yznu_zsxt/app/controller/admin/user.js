'use strict';

module.exports = app => {
  class UserController extends app.Controller {

    * tologin() {
      yield this.ctx.render('admin/user_tologin.ejs', {
        data: {},
      });
    }

    * dologin() {

      let user_name = this.ctx.request.body.user_name
      let password = this.ctx.helper.md5(this.ctx.request.body.password);
      const user_info = yield app.mysql.queryOne(`
      SELECT t.id,t.m_role_id,r.code,t.user_name,t.nick_name FROM t_m_user AS t
      LEFT JOIN t_m_role AS r ON r.id=t.m_role_id
      WHERE t.deleted='0'  and t.user_type='1' AND r.deleted='0' AND t.user_name='${user_name}' AND t.password='${password}'
      `);
      
      if(user_info != null){
        if(user_info.status=='1'){
          this.ctx.body = { errno:1,msg:"该用户已被禁用，请联系管理员！" }
        }else{
          const menuList2=yield this.app.mysql.query(`
          select m.id,m.name,m.uri,m.parent_id
          from t_m_role_menu rm
          left join t_m_menu m on rm.menu_id=m.id
          where m.deleted='0' and rm.role_id='${user_info.m_role_id}' order by m.sort
          `);
          let menus = [];
          for(var i=0;i<menuList2.length;i++){
            let yiji = menuList2[i];
            if(yiji.parent_id=='0'){
              //查找出子菜单
                let hassubmenu = false;
                let submenus = [];
                for(var j = 0;j<menuList2.length;j++){
                  let erji = menuList2[j];
                  if(erji.parent_id == yiji.id){
                    hassubmenu = true;
                    submenus.push(erji);
                  }
                }
                yiji.hassubmenu = hassubmenu;
                yiji.submenus = submenus;
                menus.push(yiji);
            }
          }
          user_info.menus = menus;
            this.ctx.session.m_user_info =user_info;

          this.ctx.body = { errno:0 }
        }
      }else{

        this.ctx.body = { errno:1,msg:"用户名或密码错误" }

      }
      
    }

    * dologout() {

      this.ctx.session.m_user_info = null;
      
      this.ctx.body = { errno:0,msg:"用户注销成功" }
    }


    * tolist() {
      yield this.ctx.render('admin/user_tolist.ejs', {
        page:this.ctx.query.page,
        search:this.ctx.query.search,
        pageSize:this.ctx.query.pageSize
      });
    }

    * datalist() {
      
      let data_offset = this.ctx.query.offset
      let data_limit = this.ctx.query.limit
      let data_search = this.ctx.query.search==null?'%%': '%'+this.ctx.query.search+'%'

      const data_count = yield app.mysql.query("select count(*) as total from t_m_user a,t_m_role b where a.m_role_id = b.id and a.deleted = '0' and (a.user_name like ? or nick_name like ?)",[data_search,data_search]);
      const data_result = yield app.mysql.query("select a.id,a.user_name,a.nick_name,b.description from t_m_user a,t_m_role b where a.m_role_id = b.id and a.deleted = '0' and (a.user_name like ? or nick_name like ?) order by a.create_date desc limit ?,? ",
          [data_search,data_search,parseInt(data_offset), parseInt(data_limit)]);
      var return_data = {
        total: data_count[0].total,
        rows: data_result
      }


      this.ctx.body = return_data

    }

    * toadd() {
      yield this.ctx.render('admin/user_toadd.ejs', {
        data: {},
      });
    }

    * dataadd() {
      let user=yield this.ctx.session.m_user_info;
      let user_name = this.ctx.request.body.user_name;
      let nick_name = this.ctx.request.body.nick_name;
      let role = this.ctx.request.body.role;
      let password = this.ctx.helper.md5(this.ctx.request.body.password);
      let mobile = this.ctx.request.body.mobile;
      let data_time = new Date().Format("yyyy-MM-dd hh:mm:ss");

      const user_exist = yield app.mysql.queryOne("select * from t_m_user where deleted=0  and status=0 and user_name = ?",[user_name]);
      let result;

      let saveobj = {
        id: this.ctx.helper.uuid(),
        user_name: user_name,
        nick_name: nick_name,
        m_role_id: role,
        password: password,
        mobile: mobile,
        deleted:0,
        status:0,
        user_type:1,
        create_by:user.user_id,
        create_date:data_time,

      }
      if(user_exist == null){
        result = yield this.app.mysql.insert('t_m_user', saveobj);
      } 
      
      if(user_exist != null){
        this.ctx.body = {errno:2,msg:'账号重复'}
      }
      else if (result.affectedRows === 1) {
        
        this.ctx.body = {errno:0}
        
      } else {

        this.ctx.body = {errno:1}
      }


    }



    * toedit() {
      let data=yield this.app.mysql.get("t_m_user",{id:this.ctx.query.id});
      yield this.ctx.render('admin/user_toedit.ejs',{
        data:data,
        page:this.ctx.query.page,
        search:this.ctx.query.search,
        pageSize:this.ctx.query.pageSize
      });
    }

    /**
       * 编辑用户
     */
    * upuser(){
        let user_info=yield this.ctx.session.m_user_info;
        let user=this.ctx.request.body;
        if(user.password!=null&&user.password!=''){
          user.password=this.ctx.helper.md5(user.password);
        }else{
          delete user.password;
        }
        user.update_by=user_info.user_id;
        user.update_date=new Date().Format("yyyy-MM-dd hh:mm:ss");//更新时间
        let data=yield app.mysql.update("t_m_user",user);
        if(data.affectedRows==1){
          this.ctx.body={errno:0};
        }else{
          this.ctx.body={errno:1,msg:"编辑失败！"};
        }
    }

    /**
     * 删除用户
     */
    * deluser(){
      let user_info=yield this.ctx.session.m_user_info;
      let id=this.ctx.query.id;
      if(id!=null){
        let row={
          id:id,
          deleted:'1',
          update_by:user_info.user_id,
          update_date:new Date()//更新时间
          //更新人
        }
        let data=yield this.app.mysql.update("t_m_user",row);
        if(data.affectedRows==1){
          this.ctx.body = {errno:0};
        }else{
          this.ctx.body = {errno:1,msg:"删除失败"};
        }
      }else{
        this.ctx.body = {errno:1,msg:"缺省参数"};
      }
    }
  }


  return UserController;
};