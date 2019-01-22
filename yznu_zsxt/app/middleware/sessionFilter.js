//
module.exports = options => {
    return function* sessionFilter(next) {
        let currentUrl=this.request.url;//当前访问url
        if(currentUrl=="/"){
            this.response.redirect("/admin/user/tologin");
            return false;
        }
        let publicPages=['/admin/'];
        let wechatpublicPages=['/wechat/'];
        let publicStartPages=['/web/','/public/',"/admin/user/tologin",'/admin/user/dologin','/common/','/admin/returnrecord/topdf'];
        let isPublicPage=false;
        let otherpage = false;
        let publicOtherpages = ['/common/','/mini/','/public/','/wechat/common/'];
        for(var i in publicPages){
            if(currentUrl.indexOf(publicPages[i])==0){
                isPublicPage=true;
                //如果是后台页面，不进入其他页面的验证流程
                otherpage = false;
            }
        }
        for(var i in wechatpublicPages){
            if(currentUrl.indexOf(wechatpublicPages[i])==0){
                otherpage=true;
            }
        }

        for(var j in publicStartPages){
            if(currentUrl.indexOf(publicStartPages[j])==0){
                isPublicPage=false;

            }
        }

        for(var i in publicOtherpages){
            if(currentUrl.indexOf(publicOtherpages[i])==0){
                otherpage=false;
            }
        }

        if(isPublicPage){
            console.log("后台页面："+currentUrl);
            let m_user_info=this.session.m_user_info;
            if(m_user_info==null){  //session过期或未登录
                this.response.redirect("/admin/user/tologin");
                return false;
            }
        }

        if(otherpage){
            console.log("访问连接:"+currentUrl);
            var token = currentUrl.substring(currentUrl.indexOf("&token=") + 7, currentUrl.length);
            var user_id =  "";
            if(token){
                user_id =  yield this.app.redis.get(token);
            }

            if(user_id == null || user_id == undefined || user_id == ''){
                console.log("登录信息过期!")
                this.session.web_user_info = '';
                this.ctx.body = {
                    errno:1 ,
                    message: '登录已过期，请重新登录!'
                }
                return false;
            }else{
                let exit_user = yield this.app.mysql.queryOne(`select * from t_ent_user 
                             where id = '${user_id}' AND deleted = '0'`);
                yield this.app.redis.set(token,user_id,'PX',30 * 24 * 60 * 60 * 1000);
                this.session.web_user_info = exit_user;

            }


        }

        yield next;
    };
};

