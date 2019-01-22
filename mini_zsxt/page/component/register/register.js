// 注册
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    server: app.globalData.serverhostname,
    params: app.globalData.params,
    account:'',
    password: '',
    repassword: '',
    is_confirm: false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },
  changeaccount:function(e){
    var input = e.detail.value;
    this.setData({
      account: input
    })
  },

  /**
   * 新登录密码
   */
  changepassword: function (event) {
    var inputpassword = event.detail.value;
    this.setData({
      password: inputpassword
    })
  },
  /**
   * 重复一次密码变化
   */
  changerepassword: function (event) {
    var inputpassword = event.detail.value;

    this.setData({
      repassword: inputpassword
    })
  },
  /**
   * 立即注册
   */
  confirm: function () {
    var that = this;
    var account = this.data.account;
    var password = this.data.password;
    var repassword = this.data.repassword;
    if(account==''||account==null){
      wx.showToast({
        title: '请输入账号',
        image: '../../../image/jinggao.png',
        duration: 3000
      })
      return false;
    }
    if(account.length>14 || account.length<4){
      wx.showToast({
        title: '账号格式不对',
        image: '../../../image/jinggao.png',
        duration: 3000
      })
      return false;
    }
    if (password.length > 16) {
      wx.showToast({
        title: '密码格式不对',
        image: '../../../image/jinggao.png',
        duration: 3000
      })
      return false;
    }
    if (password.length < 6) {
      wx.showToast({
        title: '密码格式不对',
        image: '../../../image/jinggao.png',
        duration: 3000
      })
      return false;
    }
    if (repassword.length > 16) {
      wx.showToast({
        title: '密码格式不对',
        image: '../../../image/jinggao.png',
        duration: 3000
      })
      return false;
    }
    if (repassword.length < 6) {
      wx.showToast({
        title: '密码格式不对',
        image: '../../../image/jinggao.png',
        duration: 3000
      })
      return false;
    }
    if (repassword != password) {
      wx.showToast({
        title: '两次密码不一致，请重新输入',
        image: '../../../image/jinggao.png',
        duration: 3000
      })
      return false;
    }
    this.setData({
      is_confirm: true
    });
    wx.showLoading({
      title: '提交中...',
      mask: true
    })
    wx.request({
      url: app.globalData.serverurl + "/common/register" + app.globalData.params,
      method: 'POST',
      data: {
        password: password,
        account:account,
      },
      success: function (data) {
        wx.hideLoading();
        if (data.data.errno == 100) {
          wx.showToast({
            title: '注册成功!',
            icon: 'success',
            duration: 2000
          });
          setTimeout(function () {
            wx.navigateBack({
              delta: 1
            })
          }, 2000);
        } else {
          that.setData({
            is_confirm: false
          });
          wx.showToast({
            title: data.data.msg,
            image: '../../../image/jinggao.png',
            duration: 3000
          })
        }
      },
      fail: function (res) {
        wx.hideLoading();
        that.setData({
          is_confirm: false
        });
        wx.showToast({
          title: '网络错误',
          image: '../../../image/jinggao.png',
          duration: 3000
        })
      }
    })
  },
  /**
   * 立即登录
   */
  to_remeber: function () {
    wx.navigateBack({
      delta: 1
    })
  }
})