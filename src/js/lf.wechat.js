import { SERVER_BAS_URL, REQUESTDATA, debug, VERSION } from './define'
import wepy from 'wepy'
import 'wepy-async-function'

let lf = {}

lf.SERVER_BAS_URL = SERVER_BAS_URL

const level = {
  'OFF': 0,
  'ERROR': 2,
  'WARN': 3,
  'INFO': 4,
  'DEBUG': 5,
  'ALL': 9
}
let logLevel = 'ALL'
if (debug) {
  logLevel = debug
}
logLevel = level[logLevel]
lf.log = {
  /**
   * 信息分组开始
   * @param {String} d
   */
  group: function (d) {
    logLevel && console.group(d)
  },
  /**
   * 信息分组结束
   */
  groupEnd: function () {
    logLevel && console.groupEnd()
  },
  /**
   * 查询对象
   * @param {String} d
   */
  dir: function (d) {
    logLevel && console.dir(d)
  },
  /**
   * 追踪函数的调用轨迹
   */
  trace: function () {
    logLevel && console.trace()
  },
  /**
   * @description 打印log日志
   * @param {String} d 打印内容
   * @param 可变参数 用于格式刷打印日志，比如：lf.log.log("%d年%d月%d日",2011,3,26); 结果是：2011年3月26日
   * 支持的占位符有：字符（%s）、整数（%d或%i）、浮点数（%f）和对象（%o）
   */
  log: function () {
    logLevel && console.log.apply(console, arguments)
  },
  /**
   * @description 打印debug日志
   * @param {String} d 打印内容
   */
  debug: function () {
    logLevel && (logLevel >= 5) && console.debug.apply(console, arguments)
  },
  /**
   * @description 打印info日志
   * @param {String} d 打印内容
   */
  info: function () {
    logLevel && (logLevel >= 4) && console.info.apply(console, arguments)
  },
  /**
   * @description 打印warn日志
   * @param {String} d 打印内容
   */
  warn: function () {
    logLevel && (logLevel >= 3) && console.warn.apply(console, arguments)
  },
  /**
   * @description 打印error日志
   * @param {String} d 打印内容
   */
  error: function () {
    logLevel && (logLevel >= 2) && console.error.apply(console, arguments)
  }
}

lf.storage = {
  set: function (key, data) {
    wx.setStorageSync(key, data)
  },
  get: function (key) {
    var data = wx.getStorageSync(key)
    return data
  },
  remove: function (key) {
    wx.removeStorageSync(key)
  },
  getAll: function () {
    return wx.getStorageInfoSync()
  },
  clear: function () {
    wx.clearStorage()
  }
}

lf.net = {
  apis: ['goods_list', 'goods_detail'],
  async ajax (options) {
    options.header = {
      'content-type': 'application/x-www-form-urlencoded'
    }
    let action = options.url
    if (options.url.indexOf('http') == -1 && SERVER_BAS_URL) {
      if (options.url.indexOf('/') != 0) {
        options.url = SERVER_BAS_URL + '/' + options.url
      } else {
        options.url = SERVER_BAS_URL + options.url
      }
    }
    lf.log.info('url[' + options.url + ']')
    lf.log.info('send[' + action + ']:' + JSON.stringify(options.data))

    let r = null
    try {
      r = await wepy.request(options)
      if (r.statusCode != 200) {
        r = {
          data: {
            code: 400,
            info: '请求出错'
          }
        }
      }
      lf.log.info('received[' + action + ']：' + JSON.stringify(r.data || {}))
    } catch (e) {
      lf.log.error('received[' + action + ']：', e)
      r = {
        data: {
          code: 400,
          info: e.errMsg
        }
      }
    }
    return r.data
  },
  async uploadFile (options) {
    let r = null
    try {
      r = await wepy.uploadFile(options)
      // lf.log.info('-------------')
      // lf.log.info('r:', r)
      if (r.statusCode != 200) {
        r = {
          data: {
            code: 400,
            info: '请求出错'
          }
        }
      }
      r.data = JSON.parse(r.data)
    } catch (e) {
      lf.log.error('received[' + options.url + ']：', e)
      r = {
        data: {
          code: 400,
          info: e.errMsg
        }
      }
    }
    return r.data
  },
  async get (url, data) {
    return await this.ajax({
      url,
      data
    })
  },
  filter (data) {
    var patt = /[\ud800-\udbff][\udc00-\udfff]/g // 检测utf16字符正则
    var str = JSON.stringify(data)
    str = str.replace(patt, function (char) {
      return ''
    })
    return JSON.parse(str)
  },
  async post (url, data = {}) {
    if (!data.mid) {
      data.mid = lf.storage.get('mid')
    }
    if (!data.auth_sign) {
      data.auth_sign = lf.storage.get('auth_sign')
    }
    // for (let i = 0; i < this.apis.length; i++) {
    //   if (url.indexOf(this.apis[i]) > -1) {
    //     if (!data.order_id && lf.user.getOder()) {
    //       data.order_id = lf.user.getOder().id
    //     }
    //     break
    //   }
    // }
    const method = 'POST'
    data = this.filter(data)
    var tempData = {
      appkey: REQUESTDATA.appkey,
      params: JSON.stringify(data),
      api_version: VERSION
    }
    this.sign(tempData)
    let options = {
      url: url,
      data: tempData,
      method: method
    }
    return await this.ajax(options)
  },
  async upload (url, file, data) {
    let action = url
    if (url.indexOf('http') == -1 && SERVER_BAS_URL) {
      if (url.indexOf('/') != 0) {
        url = SERVER_BAS_URL + '/' + url
      } else {
        url = SERVER_BAS_URL + url
      }
    }
    var tempData = {
      appkey: REQUESTDATA.appkey,
      params: JSON.stringify(data),
      api_version: VERSION
    }
    this.sign(tempData)
    lf.log.info('upload[' + action + ']:' + JSON.stringify(tempData))
    let options = {
      url: url,
      header: {
        // 'Content-Type': 'multipart/form-data'
      },
      filePath: file.filePath,
      name: file.fileName,
      formData: tempData
    }
    options.success = function (res) {
      let data = JSON.parse(res.data || {})
      lf.log.info('received[' + action + ']:' + JSON.stringify(res.data))
      resolve(data)
    }
    options.fail = function (res) {
      reject(res)
    }
    return await this.uploadFile(options)
  },
  sign (data) {
    var str = ''
    // 第一步排序
    var objKeys = Object.keys(data)
    objKeys = objKeys.sort()
    // 连接
    for (var i in objKeys) {
      str += objKeys[i] + '=' + data[objKeys[i]]
    }
    str += REQUESTDATA.appsecret
    var sign = lf.hex_md5(str)
    data.sign = sign
  }
}

lf.util = {
  isString (obj) {
    return Object.prototype.toString.call(obj) === '[object String]'
  },
  formatNumber (n) {
    n = n.toString()
    return n[1] ? n : '0' + n
  },
  urlEncode (param, key, encode) {
    if (param == null) return ''
    var paramStr = ''
    var t = typeof (param)
    if (t == 'string' || t == 'number' || t == 'boolean') {
      paramStr += '&' + key + '=' + ((encode == null || encode) ? encodeURIComponent(param) : param)
    } else {
      for (var i in param) {
        var k = key == null ? i : key + (param instanceof Array ? '[' + i + ']' : '.' + i)
        paramStr += this.urlEncode(param[i], k, encode)
      }
    }
    return paramStr
  },
  formatTime (date) {
    var year = date.getFullYear()
    var month = date.getMonth() + 1
    var day = date.getDate()

    var hour = date.getHours()
    var minute = date.getMinutes()
    var second = date.getSeconds()

    return [year, month, day].map(this.formatNumber).join('-') + ' ' + [hour, minute, second].map(this.formatNumber).join(':')
  },
  isPx (a) {
    return a.$parent.globalData.isIpx
  },
  addNum (num1, num2) {
    var sq1, sq2, m
    try {
      sq1 = num1.toString().split('.')[1].length
    } catch (e) {
      sq1 = 0
    }
    try {
      sq2 = num2.toString().split('.')[1].length
    } catch (e) {
      sq2 = 0
    }
    m = Math.pow(10, Math.max(sq1, sq2))
    return (this.multNum(num1, m) + this.multNum(num2, m)) / m
  },
  multNum (arg1, arg2) {
    var m = 0,
      s1 = arg1.toString(),
      s2 = arg2.toString()
    try {
      m += s1.split('.')[1].length
    } catch (e) {
    }
    try {
      m += s2.split('.')[1].length
    } catch (e) {
    }
    return Number(s1.replace('.', '')) * Number(s2.replace('.', '')) / Math.pow(10, m)
  },
  deepCopy (source) {
    var result={}
    for (var key in source) {
      result[key] = typeof source[key]=== 'object' ? this.deepCopy(source[key]): source[key]
    }
    return result
  },
  createUUID () {
    var s = []
    var hexDigits = '0123456789abcdef'
    for (var i = 0; i < 36; i++) {
      s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1)
    }
    s[14] = '4'  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1)  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = '-'

    var uuid = s.join('')
    return uuid.replace(/-/g, '')
  }
}
const DEFAULT_SHOP_KEY = 'DEFAULT_SHOP_INFO'
lf.user = {
  USER_KEY: 'USER_INFO',
  ROLE_KEY: 'ROLE_INFO',
  ORDER_KEY: 'ORDER_INFO',
  CHOOSE_KEY: 'CHOOSE_KEY',
  SHOP_KEY: 'SHOP_INFO',
  PMID_KEY: 'PMID_INFO',
  NEW_KEY: 'NEW_FLAG',
  STORE_KEY: 'STORE_KEY',
  init () {
    const choose = lf.storage.get(this.CHOOSE_KEY)
    const order = lf.storage.get(this.ORDER_KEY) || []
    if (!choose || choose === DEFAULT_SHOP_KEY) {
      lf.storage.set(this.CHOOSE_KEY, DEFAULT_SHOP_KEY)
      const orderList = this.getOrder()
      let goodList = lf.storage.get(this.SHOP_KEY)
      if (goodList) {
        goodList = JSON.parse(goodList)
      } else {
        goodList = []
      }
      if (this.isLogin() && this.getRole() >= 50) {
        goodList = []
        lf.storage.remove(this.SHOP_KEY)
      }
      if (orderList.length === 0) {
        orderList.push({
          id: DEFAULT_SHOP_KEY,
          name: '',
          data: goodList
        })
        lf.storage.set(this.ORDER_KEY, JSON.stringify(orderList))
      }
    }
  },
  isLogin () {
    if (lf.storage.get('auth_sign')) {
      return true
    }
    return false
  },
  save (obj) {
    let role = 1 // 普通用户
    if (obj.vip_customer_id) {// VIP用户
      role = 5
    }
    if (obj.distributor_id) {// 分销商
      role = 20
    }
    if (obj.uid) {// 跟单员
      role = 30
    }
    if (obj.saler_id) {// 销售员
      role = 50
    }
    if (obj.dealer_id) {// 经销商
      role = 60
    }
    obj.role = role
    lf.storage.set('auth_sign', obj.auth_sign)
    lf.storage.set('mid', obj.mid)
    lf.storage.set(this.USER_KEY, JSON.stringify(obj))
  },
  get () {
    let user = lf.storage.get(this.USER_KEY)
    if (user) {
      user = JSON.parse(user)
    }
    return user
  },
  getRole () {
    const user = this.get()
    let role = user ? user.role : 1
    return Number(role)
  },
  clear () {
    lf.storage.remove(this.USER_KEY)
    lf.storage.remove('auth_sign')
    lf.storage.remove('mid')
  },
  saveParent (id) {
    lf.storage.set(this.PMID_KEY, id)
  },
  getParent (id) {
    return lf.storage.get(this.PMID_KEY)
  },
  clearParent () {
    lf.storage.remove(this.PMID_KEY)
  },
  getOrderChoose () {
    return lf.storage.get(this.CHOOSE_KEY)
  },
  addOrder (name) {
    if (!name) {
      lf.log.error('切换的订单ID为空')
      return false
    }
    const id = lf.util.createUUID().toString()
    let orderList = lf.storage.get(this.ORDER_KEY)
    if (orderList) {
      orderList = JSON.parse(orderList)
    } else {
      orderList = []
    }
    orderList.push({
      id: id,
      name: name,
      data: []
    })
    lf.storage.set(this.ORDER_KEY, JSON.stringify(orderList))
    return id
  },
  changeOrder (id) {
    if (!id) {
      lf.log.error('切换的订单ID为空')
      return false
    }
    if (id === this.getOrderChoose()) {
      lf.log.info('不需要切换')
      return
    }
    id = id.toString()
    const beforeChoose = lf.storage.get(this.CHOOSE_KEY)
    const beforeData = this.getGoodList()
    const orderList = this.getOrder()
    const beforeIndex = orderList.findIndex(v => {
      return v.id === beforeChoose
    })
    const afterIndex = orderList.findIndex(v => {
      return v.id === id
    })
    if (beforeIndex > -1) {
      console.log('beforeData:', beforeData)
      orderList[beforeIndex].data = beforeData
      lf.storage.set(this.ORDER_KEY, JSON.stringify(orderList))// 更新之前购物车数据
    }
    // 将切换目标的数据更新到购物车
    const goodList = orderList[afterIndex].data
    console.log(goodList)
    lf.storage.set(this.CHOOSE_KEY, id)
    lf.storage.set(this.SHOP_KEY, JSON.stringify(goodList))
    return true
  },
  getOrderTitle (id) {
    const orderList = this.getOrder()
    const index = orderList.findIndex(v => {
      return id.toString() === v.id
    })
    if (index === -1) {
      return ''
    }
    return orderList[index].name
  },
  getOrder () {
    let orderList = lf.storage.get(this.ORDER_KEY)
    if (orderList) {
      orderList = JSON.parse(orderList)
    } else {
      orderList = []
    }
    return orderList
  },
  delOrder (id) {
    id = id.toString()
    const orderList = this.getOrder()
    const index = orderList.findIndex(v => {
      return v.id === id
    })
    orderList.splice(index, 1)
    const choose = this.getOrderChoose()
    if (choose === id) {
      lf.storage.remove(this.SHOP_KEY)
      lf.storage.set(this.CHOOSE_KEY, DEFAULT_SHOP_KEY)
    }
    lf.storage.set(this.ORDER_KEY, JSON.stringify(orderList))
  },
  getGoodNum () {
    let r = 0
    const list = this.getGoodList()
    list.forEach(v => {
      r += Number(v.num)
    })
    return r
  },
  getGoodList () {
    let r = lf.storage.get(this.SHOP_KEY)
    if (r) {
      r = JSON.parse(r)
    } else {
      r = []
    }
    return r
  },
  getChooseGoodList () {
    let r = this.getGoodList()
    r = r.filter(v => {
      return v.checked
    })
    return r
  },
  setGoodList (goodList) {
    if (!goodList) {
      lf.log.error('不能添加空数据到购物车')
      return false
    }
    goodList = goodList || []
    lf.storage.set(this.SHOP_KEY, JSON.stringify(goodList))
    return true
  },
  addGood (good) {
    if (!good) {
      lf.log.error('不能添加空数据到购物车')
      return {
        isSuccess: false,
        msg: '没有数据'
      }
    }
    const choose = lf.storage.get(this.CHOOSE_KEY)
    if (choose === DEFAULT_SHOP_KEY && this.getRole() >= 50) {
      lf.log.error('需要先开单')
      return {
        isSuccess: false,
        msg: '请先开单'
      }
    }
    lf.storage.set(this.NEW_KEY, '1')
    const goodList = this.getGoodList()
    const index = goodList.findIndex(v => {
      return good.id === v.id
    })
    if (index <= -1) {
      good.goods_price_adjust = good.goods_price
      good.num = 1
      good.checked = true
      goodList.push(good)
    } else {
      if (goodList[index].num >= 99) {
        lf.log.error('单个商品最多99份')
        return {
          isSuccess: false,
          msg: '单个商品最多99份'
        }
      }
      let num = good.num ? +good.num : 1
      goodList[index].num += num
    }
    this.setGoodList(goodList)
    wepy.$instance.showShopRedDot()
    return {
      isSuccess: true
    }
  },
  shopIsNew () {
    const r = lf.storage.get(this.NEW_KEY)
    return r ? true : false
  },
  readShop () {
    lf.storage.clear(this.NEW_KEY)
  },
  clearShop () {
    const choose = lf.storage.get(this.CHOOSE_KEY)
    let goodList = this.getGoodList()
    let noChooseGoodList = goodList.filter(v => {
      return !v.checked
    })
    if (!noChooseGoodList) {
      noChooseGoodList = []
    }

    const orderList = this.getOrder()
    const index = orderList.findIndex(v => {
      return v.id === choose
    })
    if (orderList[index].id === DEFAULT_SHOP_KEY) {
      orderList[index].data = noChooseGoodList
    } else {
      if (noChooseGoodList.length > 0) {
        orderList[index].data = noChooseGoodList
      } else {
        orderList.splice(index, 1)
      }
    }
    lf.storage.set(this.SHOP_KEY, JSON.stringify(noChooseGoodList))
    // lf.storage.remove(this.CHOOSE_KEY)
    if (noChooseGoodList.length === 0) {
      lf.storage.set(this.CHOOSE_KEY, DEFAULT_SHOP_KEY)
    }
    lf.storage.set(this.ORDER_KEY, JSON.stringify(orderList))
  },
  setStore (store) {
    if (!store) {
      lf.log.warn('无门店数据')
      return
    }
    lf.storage.set(this.STORE_KEY, JSON.stringify(store))
  },
  getStore () {
    let r = ''
    r = lf.storage.get(this.STORE_KEY)
    if (r) {
      r = JSON.parse(r)
    }
    return r
  },
  clearStore () {
    lf.storage.remove(this.STORE_KEY)
  }
}
lf.user.init()
lf.toast = function (title = '操作成功', icon = 'none', duration = 1500) {
  wepy.showToast({
    title,
    icon,
    duration
  })
}

lf.showLoading = function (title = '提交中...') {
  wepy.showLoading({
    title
  })
}
lf.hideLoading = function () {
  wepy.hideLoading()
}
lf.getEl = function (ele, fn) {
  var query = wx.createSelectorQuery()
  console.log(ele)
  return query.select(ele).boundingClientRect(rect => {
    fn && fn(rect)
  }).exec()
}

lf.pxToRpx = function (num) {
  return ((750 * num) / wx.getSystemInfoSync().windowWidth)
}
lf.pay = function (fn) {
  wx.showActionSheet({
    itemList: ['微信支付'],
    success (res) {
      fn && fn(res.tapIndex)
    }
  })
}
lf.calcReceiving = function(time,status) {
  if (!time){
    return false
  }
  let fixationTime = 15 * 86400000// 15天
  let d = 86400000 // 1天
  let h = 3600000//1小时
  let m = 60000// 1分钟
  let s = 1000// 1秒钟
  let nowTime = new Date().getTime()
  let deliverTime = new Date(time).getTime()
  let delta_t = (deliverTime + fixationTime) - nowTime
  if (delta_t > fixationTime) {
    return {
      noData: true
    }
  } else {
    let day = parseInt(delta_t / d)
    let hour = parseInt((delta_t - day * d) / h)
    let minute = parseInt((delta_t - day * d - hour * h) / m)
    return {
      day,
      hour,
      minute
    }
  }
}
lf.getCode = async function () {
  let loginRes = await wepy.login()
  return loginRes.code
};
(function ($) {
  var rotateLeft = function (lValue, iShiftBits) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits))
  }
  var addUnsigned = function (lX, lY) {
    var lX4, lY4, lX8, lY8, lResult
    lX8 = (lX & 0x80000000)
    lY8 = (lY & 0x80000000)
    lX4 = (lX & 0x40000000)
    lY4 = (lY & 0x40000000)
    lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF)
    if (lX4 & lY4) return (lResult ^ 0x80000000 ^ lX8 ^ lY8)
    if (lX4 | lY4) {
      if (lResult & 0x40000000) return (lResult ^ 0xC0000000 ^ lX8 ^ lY8)
      else return (lResult ^ 0x40000000 ^ lX8 ^ lY8)
    } else {
      return (lResult ^ lX8 ^ lY8)
    }
  }

  var F = function (x, y, z) {
    return (x & y) | ((~x) & z)
  }

  var G = function (x, y, z) {
    return (x & z) | (y & (~z))
  }

  var H = function (x, y, z) {
    return (x ^ y ^ z)
  }

  var I = function (x, y, z) {
    return (y ^ (x | (~z)))
  }

  var FF = function (a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }

  var GG = function (a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }

  var HH = function (a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }

  var II = function (a, b, c, d, x, s, ac) {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }

  var convertToWordArray = function (string) {
    var lWordCount
    var lMessageLength = string.length
    var lNumberOfWordsTempOne = lMessageLength + 8
    var lNumberOfWordsTempTwo = (lNumberOfWordsTempOne - (lNumberOfWordsTempOne % 64)) / 64
    var lNumberOfWords = (lNumberOfWordsTempTwo + 1) * 16
    var lWordArray = Array(lNumberOfWords - 1)
    var lBytePosition = 0
    var lByteCount = 0
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4
      lBytePosition = (lByteCount % 4) * 8
      lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition))
      lByteCount++
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4
    lBytePosition = (lByteCount % 4) * 8
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition)
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29
    return lWordArray
  }

  var wordToHex = function (lValue) {
    var WordToHexValue = '',
      WordToHexValueTemp = '',
      lByte, lCount
    for (lCount = 0; lCount <= 3; lCount++) {
      lByte = (lValue >>> (lCount * 8)) & 255
      WordToHexValueTemp = '0' + lByte.toString(16)
      WordToHexValue = WordToHexValue + WordToHexValueTemp.substr(WordToHexValueTemp.length - 2, 2)
    }
    return WordToHexValue
  }

  var uTF8Encode = function (string) {
    string = string.replace(/\x0d\x0a/g, '\x0a')
    var output = ''
    for (var n = 0; n < string.length; n++) {
      var c = string.charCodeAt(n)
      if (c < 128) {
        output += String.fromCharCode(c)
      } else if ((c > 127) && (c < 2048)) {
        output += String.fromCharCode((c >> 6) | 192)
        output += String.fromCharCode((c & 63) | 128)
      } else {
        output += String.fromCharCode((c >> 12) | 224)
        output += String.fromCharCode(((c >> 6) & 63) | 128)
        output += String.fromCharCode((c & 63) | 128)
      }
    }
    return output
  }
  $.hex_md5 = function (string) {
    var x = Array()
    var k, AA, BB, CC, DD, a, b, c, d
    var S11 = 7,
      S12 = 12,
      S13 = 17,
      S14 = 22
    var S21 = 5,
      S22 = 9,
      S23 = 14,
      S24 = 20
    var S31 = 4,
      S32 = 11,
      S33 = 16,
      S34 = 23
    var S41 = 6,
      S42 = 10,
      S43 = 15,
      S44 = 21
    string = uTF8Encode(string)
    x = convertToWordArray(string)
    a = 0x67452301
    b = 0xEFCDAB89
    c = 0x98BADCFE
    d = 0x10325476
    for (k = 0; k < x.length; k += 16) {
      AA = a
      BB = b
      CC = c
      DD = d
      a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478)
      d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756)
      c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB)
      b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE)
      a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF)
      d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A)
      c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613)
      b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501)
      a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8)
      d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF)
      c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1)
      b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE)
      a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122)
      d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193)
      c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E)
      b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821)
      a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562)
      d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340)
      c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51)
      b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA)
      a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D)
      d = GG(d, a, b, c, x[k + 10], S22, 0x2441453)
      c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681)
      b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8)
      a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6)
      d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6)
      c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87)
      b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED)
      a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905)
      d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8)
      c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9)
      b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A)
      a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942)
      d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681)
      c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122)
      b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C)
      a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44)
      d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9)
      c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60)
      b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70)
      a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6)
      d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA)
      c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085)
      b = HH(b, c, d, a, x[k + 6], S34, 0x4881D05)
      a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039)
      d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5)
      c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8)
      b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665)
      a = II(a, b, c, d, x[k + 0], S41, 0xF4292244)
      d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97)
      c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7)
      b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039)
      a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3)
      d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92)
      c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D)
      b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1)
      a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F)
      d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0)
      c = II(c, d, a, b, x[k + 6], S43, 0xA3014314)
      b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1)
      a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82)
      d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235)
      c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB)
      b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391)
      a = addUnsigned(a, AA)
      b = addUnsigned(b, BB)
      c = addUnsigned(c, CC)
      d = addUnsigned(d, DD)
    }
    var tempValue = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)
    return tempValue.toLowerCase()

  }
})(lf);

/*
 * base64
 */
(function ($) {
  var base64EncodeChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  var base64DecodeChars = new Array(-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1)

  var utf16to8 = function (str) {
    var out, i, len, c
    out = ''
    len = str.length
    for (i = 0; i < len; i++) {
      c = str.charCodeAt(i)
      if ((c >= 0x0001) && (c <= 0x007F)) {
        out += str.charAt(i)
      } else {
        if (c > 0x07FF) {
          out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F))
          out += String.fromCharCode(0x80 | ((c >> 6) & 0x3F))
          out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F))
        } else {
          out += String.fromCharCode(0xC0 | ((c >> 6) & 0x1F))
          out += String.fromCharCode(0x80 | ((c >> 0) & 0x3F))
        }
      }
    }
    return out
  }
  var utf8to16 = function (str) {
    var out, i, len, c
    var char2, char3
    out = ''
    len = str.length
    i = 0
    while (i < len) {
      c = str.charCodeAt(i++)
      switch (c >> 4) {
        case 0:
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
        case 7:
          // 0xxxxxxx
          out += str.charAt(i - 1)
          break
        case 12:
        case 13:
          // 110x xxxx 10xx xxxx
          char2 = str.charCodeAt(i++)
          out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F))
          break
        case 14:
          // 1110 xxxx10xx xxxx10xx xxxx
          char2 = str.charCodeAt(i++)
          char3 = str.charCodeAt(i++)
          out += String.fromCharCode(((c & 0x0F) << 12) | ((char2 & 0x3F) << 6) | ((char3 & 0x3F) << 0))
          break
      }
    }
    return out
  }
  $.base64encode = function (str) {
    str = utf16to8(str)
    var out, i, len
    var c1, c2, c3
    len = str.length
    i = 0
    out = ''
    while (i < len) {
      c1 = str.charCodeAt(i++) & 0xff
      if (i == len) {
        out += base64EncodeChars.charAt(c1 >> 2)
        out += base64EncodeChars.charAt((c1 & 0x3) << 4)
        out += '=='
        break
      }
      c2 = str.charCodeAt(i++)
      if (i == len) {
        out += base64EncodeChars.charAt(c1 >> 2)
        out += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4))
        out += base64EncodeChars.charAt((c2 & 0xF) << 2)
        out += '='
        break
      }
      c3 = str.charCodeAt(i++)
      out += base64EncodeChars.charAt(c1 >> 2)
      out += base64EncodeChars.charAt(((c1 & 0x3) << 4) | ((c2 & 0xF0) >> 4))
      out += base64EncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6))
      out += base64EncodeChars.charAt(c3 & 0x3F)
    }
    return out
  }
  $.base64decode = function (str) {
    str = utf8to16(str)
    var c1, c2, c3, c4
    var i, len, out
    len = str.length
    i = 0
    out = ''
    while (i < len) {
      /* c1 */
      do {
        c1 = base64DecodeChars[str.charCodeAt(i++) & 0xff]
      }
      while (i < len && c1 == -1)
      if (c1 == -1)
        break
      /* c2 */
      do {
        c2 = base64DecodeChars[str.charCodeAt(i++) & 0xff]
      }
      while (i < len && c2 == -1)
      if (c2 == -1)
        break
      out += String.fromCharCode((c1 << 2) | ((c2 & 0x30) >> 4))
      /* c3 */
      do {
        c3 = str.charCodeAt(i++) & 0xff
        if (c3 == 61)
          return out
        c3 = base64DecodeChars[c3]
      }
      while (i < len && c3 == -1)
      if (c3 == -1)
        break
      out += String.fromCharCode(((c2 & 0XF) << 4) | ((c3 & 0x3C) >> 2))
      /* c4 */
      do {
        c4 = str.charCodeAt(i++) & 0xff
        if (c4 == 61)
          return out
        c4 = base64DecodeChars[c4]
      }
      while (i < len && c4 == -1)
      if (c4 == -1)
        break
      out += String.fromCharCode(((c3 & 0x03) << 6) | c4)
    }
    return out
  }
})(lf)

lf.mult = function (...values) {
  let m = 0
  for (let i = 0; i < values.length; i++) {
    try {
      m += values[i].toString().split('.')[1].length
    } catch (e) {
    }
  }
  let r = 1
  for (let i = 0; i < values.length; i++) {
    r = r * Number(values[i].toString().replace('.', ''))
  }
  r = r / Math.pow(10, m)
  return r
}

lf.add = function (...values) {
  let sqs = []
  for (let i = 0; i < values.length; i++) {
    try {
      sqs[i] = values[i].toString().split('.')[1].length
    } catch (e) {
      sqs[i] = 0
    }
  }
  const max = Math.pow(10, Math.max.apply(Math, sqs))
  let r = 0
  for (let i = 0; i < values.length; i++) {
    r += this.mult(values[i], max)
  }
  r = r / max
  return r
}

module.exports = lf
