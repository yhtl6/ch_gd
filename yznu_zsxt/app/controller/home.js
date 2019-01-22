'use strict';

module.exports = app => {
  class HomeController extends app.Controller {
    * index() {
      var aaa = '111'
      var bbb = `cscsc
      cscscsc ${aaa}
      cscsc`
      console.info(bbb)
      console.info(this.ctx.helper.md5('11111111'));
      console.info(this.ctx.helper.md5('12345678'));
      this.ctx.body = 'hi, egg';
      this.ctx.logger.info("111")
    }

    * ejs() {

        const post = yield app.mysql.get('t_test', { id: 1 });
        console.info(post);
        yield this.ctx.render('ejs.ejs', {
          data: post,
        });
    }


  }

  
  return HomeController;
};



