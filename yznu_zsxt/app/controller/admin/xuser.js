'use strict';

module.exports = app => {
    class XUserController extends app.Controller {
        /*
        进入用户列表页面
        is_active  是否禁用 1可用 0禁用
        search  搜索框内容
         */
        *tolist(){
            yield this.ctx.render('admin/xuser_tolist.ejs',{
                page:this.ctx.query.page,
                pageSize:this.ctx.query.pageSize,
                search:this.ctx.query.search,
                is_active:this.ctx.query.is_active
            });
        }

        /*
        查询前台用户列表数据
        search  搜索框内容
        data_offset 第一条数据的标记
        data_limit  每一页显示的条数
        data_result 查询结果
        data_count 符合条件的数据总数
        is_active  是否禁用 1可用 0禁用
         */
        *datalist(){
            let data_offset = this.ctx.query.offset;
            let data_limit = this.ctx.query.limit;
            let search = this.ctx.query.search;
            let is_active = this.ctx.query.is_active;
            let sql_andSearch = search == null ? '%%' : `AND (te.name LIKE '%${search}%' or te.numbers like '%${search}%' or teu.mobile like '%${search}%' or teu.name like '%${search}%' or teu.ids like '%${search}%')`;
            let sql_andActive = is_active =='' ? '' : `and (teu.is_active = '${is_active}')`;
            let data_result = yield app.mysql.query(`SELECT teu.id,te.name AS ent_name,te.numbers,teu.name AS username,teu.ids,teu.mobile,teu.is_active,teu.open_id 
            FROM t_ent_user AS teu LEFT JOIN t_ent AS te ON teu.ent_id=te.id 
            WHERE teu.status='1' ${sql_andSearch} ${sql_andActive} 
             ORDER BY teu.create_date DESC LIMIT ${data_offset},${data_limit}  `);
            let data_count = yield app.mysql.query(`SELECT COUNT(*) AS total FROM t_ent_user AS teu LEFT JOIN t_ent AS te ON teu.ent_id=te.id 
            WHERE teu.status='1' ${sql_andSearch} ${sql_andActive} `);
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
        禁启用 用户
         */
        *changeactive(){
            let user = yield this.ctx.session.m_user_info;
            let id = this.ctx.query.id;
            let is_active = this.ctx.query.is_active;
            let xuser = {
                id:id,
                is_active:is_active,
                update_date:new Date(),
            }
            const result = yield this.app.mysql.update('t_ent_user',xuser);
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

        /**
         * 重置密码
         */
        *resetpsd(){
            let user = yield this.ctx.session.m_user_info;
            let id = this.ctx.query.id;
            let xuser = {
                id:id,
                password:this.ctx.helper.md5('123456'),
                update_date:new Date(),
            }
            const result = yield this.app.mysql.update('t_ent_user',xuser);
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

        /**
         * 逻辑删除用户
         */
        *del(){
            let user = yield this.ctx.session.m_user_info;
            let id = this.ctx.query.id;
            let xuser = {
                id:id,
                deleted:'1',
                update_date:new Date(),
            }
            const result = yield this.app.mysql.update('t_ent_user',xuser);
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

        /**
         * 进入新增用户页面
         */
        *toadd(){
            let ents = yield this.app.mysql.query(`select * from t_ent`);
            yield this.ctx.render('admin/xuser_toadd.ejs',{
                page:this.ctx.query.page,
                pageSize:this.ctx.query.pageSize,
                search:this.ctx.query.search,
                is_active:this.ctx.query.is_active,
                ents:ents
            });
        }

        /**
         * 新增用户
         */
        *addxuser(){
            let user = yield this.ctx.session.m_user_info;
            let data = this.ctx.request.body;
            let ent_id = data.ent_name;//企业id
           // let ent = yield this.app.mysql.queryOne(`select id from t_ent where name='${ent_name}'`);
            let nuser = {
                id:this.ctx.helper.uuid(),
                name:data.username,
                ids:data.ids,
                mobile:data.mobile,
                ent_id:ent_id,
                password:this.ctx.helper.md5(data.password),
                create_date:new Date(),
                deleted:'0',
                status:'1',
                is_active:'1'
            }
            const  result = yield this.app.mysql.insert("t_ent_user",nuser);
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

        /**
         * 验证身份证号是否存在
         */
        *checkids(){
            let ids = this.ctx.query.ids;
            console.log(ids);
            let xuser = yield this.app.mysql.query(`select * from t_ent_user where ids='${ids}'`);
            if(xuser.length>0){
                this.ctx.body={
                    errno : '0'
                }
            }else{
                this.ctx.body={
                    errno : '2'
                }
            }
        }

        /**
         * 验证手机号是否存在
         */
        *checkmobile(){
            let mobile = this.ctx.query.mobile;
            let xuser = yield this.app.mysql.query(`select * from t_ent_user where mobile='${mobile}' and deleted='0'`);
            if(xuser.length>0){
                this.ctx.body={
                    errno : '0'
                }
            }else{
                this.ctx.body={
                    errno : '2'
                }
            }
        }

        /**
         * 验证企业
         */
        *checkent(){
            let ent_id = this.ctx.query.ent_name;
            let numbers = this.ctx.query.numbers;
            let flag=false;
            let ent = yield this.app.mysql.query(`select * from t_ent where id='${ent_id}'`);
            if(ent.length>0){
                let nums=[];
                nums = ent[0].numbers.split(";");
                console.log(nums);
                for(var i=0;i<nums.length;i++){
                    if(numbers==nums[i]){
                        flag=true;
                        console.log("ggggg===");
                        this.ctx.body={
                            errno : '0'
                        }
                    }
                }
                if(flag==false){
                    this.ctx.body={
                        errno : '2'
                    }
                }

            }else{
                this.ctx.body={
                    errno : '2'
                }
            }
        }

        //进入用户审核列表页
        *tochecklist(){
            yield this.ctx.render('admin/xuser_tochecklist.ejs',{
                page:this.ctx.query.page,
                pageSize:this.ctx.query.pageSize,
                search:this.ctx.query.search,
                status:this.ctx.query.status
            });
        }
        //获取用户审核列表数据
        *checklist(){
            let data_offset = this.ctx.query.offset;
            let data_limit = this.ctx.query.limit;
            let search = this.ctx.query.search;
            let status = this.ctx.query.status;
            let sql_andSearch = search == null ? '%%' : ` (te.name LIKE '%${search}%' or te.numbers like '%${search}%' or teu.mobile like '%${search}%' or teu.name like '%${search}%' or teu.ids like '%${search}%')`;
            let sql_andStatus = status =='' ? '' : `and (teu.status = '${status}')`;
            let data_result = yield app.mysql.query(`SELECT teu.id,te.name AS ent_name,te.numbers,teu.name AS username,teu.ids,teu.mobile,teu.is_active,teu.status 
            FROM t_ent_user AS teu LEFT JOIN t_ent AS te ON teu.ent_id=te.id 
            WHERE  ${sql_andSearch} ${sql_andStatus} 
             ORDER BY teu.create_date DESC LIMIT ${data_offset},${data_limit}  `);
            let data_count = yield app.mysql.query(`SELECT COUNT(*) AS total FROM t_ent_user AS teu LEFT JOIN t_ent AS te ON teu.ent_id=te.id 
            WHERE ${sql_andSearch} ${sql_andStatus} `);
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
        //修改审核状态
        *changestatus(){
            let user = yield this.ctx.session.m_user_info;
            let id = this.ctx.query.id;
            let status = this.ctx.query.status;
            let data = yield this.app.mysql.get('t_ent_user',{id:id});
            let accesstoken = yield this.ctx.service.access.getAccessToken();
            if(status == '1'){
                let xuser = {
                    id:id,
                    status:status,
                    update_date:new Date(),
                }
                const result = yield this.app.mysql.update('t_ent_user',xuser);
                const updateSuccess = result.affectedRows === 1;
                if(updateSuccess){
                    this.ctx.service.weapp.sendMessagetoUser('1',data.open_id,data.name,data.mobile,accesstoken);

                    this.ctx.body={
                        errno : '0'
                    }
                }else{
                    this.ctx.body={
                        errno : '1'
                    }
                }
            }else if(status == '2'){
                this.ctx.service.weapp.sendMessagetoUser('2',data.open_id,data.name,data.mobile,accesstoken);
                const result = yield this.app.mysql.delete("t_ent_user", {
                    id: id
                });
                this.ctx.body={
                    errno : '0'
                }
            }
        }

        /**
         * 获取企业员工列表
         */
        *getlist(){
            let ent_id = this.ctx.query.ent_id;
            let data_offset = this.ctx.query.offset;
            let data_limit = this.ctx.query.limit;
            let search = this.ctx.query.search;
            let sql_andSearch = search == null ? '%%' : `AND (te.name LIKE '%${search}%' or te.numbers like '%${search}%' or teu.mobile like '%${search}%' or teu.name like '%${search}%' or teu.ids like '%${search}%')`;
            let data_result = yield app.mysql.query(`SELECT teu.id,te.name AS ent_name,te.numbers,teu.name AS username,teu.ids,teu.mobile,teu.is_active 
            FROM t_ent_user AS teu LEFT JOIN t_ent AS te ON teu.ent_id=te.id 
            WHERE teu.ent_id='${ent_id}' ${sql_andSearch}  
             ORDER BY teu.create_date DESC LIMIT ${data_offset},${data_limit}  `);
            let data_count = yield app.mysql.query(`SELECT COUNT(*) AS total FROM t_ent_user AS teu LEFT JOIN t_ent AS te ON teu.ent_id=te.id 
            WHERE teu.ent_id='${ent_id}' ${sql_andSearch}  `);
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
        //跳转到小程序访问用户管理页面
        *tominilist(){
            yield this.ctx.render('admin/xuser_tominilist.ejs',{
                page:this.ctx.query.page,
                pageSize:this.ctx.query.pageSize,
                search:this.ctx.query.search

            });
        }
        //获取小程序访问用户数据
        *minilist(){
            let data_offset = this.ctx.query.offset;
            let data_limit = this.ctx.query.limit;
            let search = this.ctx.query.search;
            let sql_andSearch = search == null ? '%%' : `AND (name LIKE '%${search}%' or open_id like '%${search}%')`;
            let data_result = yield this.app.mysql.query(`select name,open_id from t_mini_user where open_id!='(NULL)' and open_id!=''  ${sql_andSearch}`);
            let data_count = yield this.app.mysql.query(`select count(*) as total from t_mini_user where open_id!='(NULL)' and open_id!='' ${sql_andSearch}`);
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


    }
    return XUserController;
};



