'use strict';

module.exports = app => {
  class HomeController extends app.Controller {
    
    * toindex() {
      this.app.locals.c = 'cccc';
      yield this.ctx.render('admin/home_toindex.ejs', {

          data: {b:'bbbb'},  
      });
    }


    * toindexv1() {
      yield this.ctx.render('admin/home_toindexv1.ejs', {
          data: {},
        });
    }




  }

  
  return HomeController;
};