// page/component/details/details.js
const app = getApp();
Page({
  data:{
    goods: {
      id: 1,
      image: '/image/goods1.png',
      title: '新鲜梨花带雨',
      price: 0.01,
      stock: '有货',
      detail: '这里是梨花带雨详情。fdfffffffvrsgacaeggreahergrgreyhebarfffffffffffffffffffffffafa范围啊嘎嘎扔个人工',
      parameter: '125g/个',
      service: '不支持退货'
    },
    num: 1,
    totalNum: 0,
    hasCarts: false,
    curIndex: 0,
    show: false,
    scaleCart: false
  },
  onLoad(){
    
  },

  addCount() {
    let num = this.data.num;
    num++;
    this.setData({
      num : num
    })
  },

  addToCart() {
    var user = wx.getStorageSync('user');
    if (user.islogin){
      const self = this;
      const num = this.data.num;
      let total = this.data.totalNum;

      self.setData({
        show: true
      })
      setTimeout(function () {
        self.setData({
          show: false,
          scaleCart: true
        })
        setTimeout(function () {
          self.setData({
            scaleCart: false,
            hasCarts: true,
            totalNum: num + total
          })
        }, 200)
      }, 300)
    }else{
      wx.navigateTo({
        url: '/page/component/login/login?product_id='+1+'&source=1',
      })
    }
    

  },

  bindTap(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    this.setData({
      curIndex: index
    })
  }
 
})