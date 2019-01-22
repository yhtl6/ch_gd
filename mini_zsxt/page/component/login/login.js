const app = getApp();

Page({
  data: {
    server: app.globalData.serverhostname,
    params: app.globalData.params,
    password: '',
    account: '',
    phone: '',
    is_validata: false,

    imageUrl: '',
    flag: '',
    vcode: '',
    is_vcode: false,
    is_login: false,
    is_page: false,
    path: '',

  },
  onLoad: function (options) {
    var product_id = options.product_id;
    var source = options.source;
    this.setData({
      product_id:product_id,
      source:source
    });
  },
  onUnload:function(){
    if(this.data.is_login==false && this.data.source==2){
      wx.reLaunch({
        url: '/page/component/index',
      })
    }
  },
  tabClick: function (e) {
    this.setData({
      sliderOffset: e.currentTarget.offsetLeft,
      activeIndex: e.currentTarget.id
    });
  },



  /**
   * 登录
   * 
   */
  to_login: function () {
    var that = this;
    var account = this.data.account;
    var password = this.data.password;
    if (account == '') {
      wx.showToast({
        title: '账号不能为空',
        image: '../../../style/img/jinggao.png',
        duration: 3000
      });
      return false
    }
    if (password == '') {
      wx.showToast({
        title: '密码不能为空',
        image: '../../../style/img/jinggao.png',
        duration: 3000
      });
      return false
    }
    wx.showLoading({
      title: '登录中...',
      mask: true
    })
    that.setData({
      is_login: true
    });
    wx.request({
      url: app.globalData.serverurl + "/common/login" + app.globalData.params,
      method: "POST",
      data: {
        account:account,
        password:password
      },
      success: function (data) {
        if (data.data.errno == 100) {
          wx.hideLoading();
          wx.showToast({
            title: '登陆成功',
            icon: 'success',
            duration: 3000
          });
          app.globalData.userInfo = {
            user_id: data.data.data.id,
            token: data.data.data.token,
            islogin: true,
          };
          wx.setStorage({
            key: "user",
            data: app.globalData.userInfo
          })
          var source = that.data.source;
          if(source==1){//商品详情页
            wx.navigateTo({
              url: '/page/component/details/details?product_id=' + that.data.product_id,
            })
          }else if(source==2){//购物车
            wx.navigateTo({
              url: '/page/component/cart/cart',
            })
          }else if(source==3){//我的
            wx.navigateTo({
              url: '/page/component/user/user',
            })
          }
        } else {
          that.setData({
            is_login: false
          });
          wx.showToast({
            title: data.data.msg,
            image: '../../../style/img/jinggao.png',
            duration: 3000
          });
        }
      }, fail: function (err) {
        that.setData({
          is_login: false
        });
        wx.showToast({
          title: "连接超时!",
          image: '../../../style/img/jinggao.png',
          duration: 3000
        })
      }
    })
  },
  /**
   * 账号变化
   */
  changeaccount: function (event) {
    var inputaccount = event.detail.value;
    this.setData({
      account: inputaccount
    })
  },
  /**
   * 密码变化
   */
  changepsd: function (event) {
    var inputpassword = event.detail.value;
    this.setData({
      password: inputpassword
    })
  },
  to_register:function(){
    wx.navigateTo({
      url: '/page/component/register/register',
    })
  }
});