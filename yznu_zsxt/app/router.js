'use strict';

module.exports = app => {
  app.get('/', 'admin.user.tologin');
  app.get('/ejs', 'home.ejs');

  //action方法明不能用下划线_
  //admin  后台用户管理
  app.get('/admin/user/tologin', 'admin.user.tologin');
  app.post('/admin/user/dologin', 'admin.user.dologin');
  app.get('/admin/user/dologout', 'admin.user.dologout');
  app.get('/admin/user/tolist', 'admin.user.tolist');
  app.get('/admin/user/datalist', 'admin.user.datalist');
  app.get('/admin/user/toadd', 'admin.user.toadd');
  app.get('/admin/user/toedit', 'admin.user.toedit');
  app.get('/admin/user/deluser', 'admin.user.deluser');
  app.post('/admin/user/upuser', 'admin.user.upuser');
  app.post('/admin/user/dataadd', 'admin.user.dataadd');

  app.get('/admin/home/toindex', 'admin.home.toindex');
  app.get('/admin/home/toindexv1', 'admin.home.toindexv1');

  app.get('/admin/role/datalist', 'admin.role.datalist');

  //common
  app.post('/common/upload/img', 'common.upload.zipimg');
  app.post('/common/upload/ent_excel', 'common.upload.ent_excel');



  //角色管理
  app.get("/admin/role/datalist", 'admin.role.datalist');
  app.get('/admin/role/tolist', 'admin.role.tolist');
  app.get('/admin/role/toadd', 'admin.role.toadd');
  app.post('/admin/role/dataadd', 'admin.role.dataadd');
  app.get('/admin/role/toedit', 'admin.role.toedit');
  app.post('/admin/role/uprole', 'admin.role.uprole');
  app.get("/admin/role/delrole", "admin.role.delrole");
  app.get('/admin/role/toshow', 'admin.role.show');
  app.get("/admin/role/getRole", "admin.role.getRole");
  app.get("/admin/role/getrolemenus", "admin.role.getrolemenus");


  //menu
  app.get('/admin/menu/tomenulist', 'admin.menu.tomenulist');
  app.get('/admin/menu/datalist', 'admin.menu.datalist');
  app.get('/admin/menu/toadd', 'admin.menu.toadd');
  app.post('/admin/menu/getparentmenus', 'admin.menu.getparentmenus');
  app.post('/admin/menu/addmenu', 'admin.menu.addmenu');
  app.get('/admin/menu/toedit', 'admin.menu.toedit');
  app.post('/admin/menu/edit', 'admin.menu.edit');
  app.post('/admin/menu/delmenu', 'admin.menu.delmenu');
  app.get('/admin/menu/menusort', 'admin.menu.menusort');


  //基础功能配置
  app.get("/admin/config/toconfig", 'admin.config.toconfig');
  app.get("/admin/config/edit", 'admin.config.edit');



  /*************************************wechat手机端接口***********************************************/

  //common类
  app.post("/wechat/common/login",'wechat.common.login');
  app.post("/wechat/common/register",'wechat.common.register');

  

  //农产品管理
  app.get("/admin/product/toadd",'admin.product.toadd');
  app.post("/admin/product/add",'admin.product.add');
  app.get("/admin/product/tolist",'admin.product.tolist');
  app.get("/admin/product/datalist","admin.product.datalist");
  app.get("/admin/product/todel",'admin.product.todel');
  app.get("/admin/product/toedit",'admin.product.toedit');
  app.post("/admin/product/update",'admin.product.update');
  app.get("/admin/product/todetail",'admin.product.todetail');

  //供货商管理
  app.get("/admin/supplier/toadd",'admin.supplier.toadd');
  app.post("/admin/supplier/add",'admin.supplier.add');
  app.get("/admin/supplier/getcity",'admin.supplier.getcity');
  app.get("/admin/supplier/tolist",'admin.supplier.tolist');
  app.get("/admin/supplier/datalist",'admin.supplier.datalist');
  app.get("/admin/supplier/toedit",'admin.supplier.toedit');
  app.post("/admin/supplier/update",'admin.supplier.update');
  app.get("/admin/supplier/todel",'admin.supplier.todel');
  app.get("/admin/supplier/getsuppliers",'admin.supplier.getsuppliers');

  //农产品培育信息管理
  app.get("/admin/plant/tolist",'admin.plant.tolist');
  app.get("/admin/plant/datalist",'admin.plant.datalist');
  app.get("/admin/plant/toadd",'admin.plant.toadd');
  app.post("/admin/plant/add",'admin.plant.add');
  app.get("/admin/plant/todel",'admin.plant.todel');
  app.get("/admin/plant/todetail",'admin.plant.todetail');
  app.get("/admin/plant/toedit",'admin.plant.toedit');
  app.post("/admin/plant/update",'admin.plant.update');
};
