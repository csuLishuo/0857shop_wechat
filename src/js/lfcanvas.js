import wepy from 'wepy'


export default {
  canvas: null,
  context: null,
  offscreenCanvas: null,
  offscreenContext: null,

  bgImage: null,
  targetImage: null,
  width: 524,
  height: 774,
  init: function () {

    this.context = wx.createCanvasContext('canvas', this)
    // this.context = this.canvas.getContext('2d');
    // this.offscreenCanvas = document.createElement('canvas');
    // this.offscreenContext = this.offscreenCanvas.getContext('2d');

    // this.offscreenCanvas.width = this.canvas.width;
    // this.offscreenCanvas.height = this.canvas.height;
  },
  cutout: function (swidth, sheight, tx, ty, tw, th) {
    var sratio = swidth / sheight
    var tradio = tw / th
    if (sratio <= tradio) {
      var sx = 0
      var sy = (sheight - swidth / tradio) / 2
      var sw = swidth
      var sh = swidth / tradio
    } else {
      sx = (swidth - sheight / tradio) / 2
      sy = 0
      sw = sheight / tradio
      sh = sheight
    }
    return {
      sx: sx,
      sy: sy,
      sw: sw,
      sh: sh,
      tx: tx,
      ty: ty,
      tw: tw,
      th: th
    }
  },
  draw: function (bgImage, qr, name, price) {
    const textWidth = 300
    let text = []//存放切割后的内容
    const textareaWidth = Math.ceil(textWidth / 26)
    while (name.length > 0) {
      text.push(name.substr(0, textareaWidth))
      name = name.substr(textareaWidth, name.length)
    }
    if (text.length > 2) {
      text = text.slice(0,2)
      text[1] = text[1] + '...'
    }
    return new Promise((resolve, reject) => {
      this.context.clearRect(0, 0, this.width , this.height )
      this.context.setFillStyle('#ffffff')
      this.context.fillRect(0, 0, this.width , this.height )
      var all = Promise.all([this.getImage(bgImage), this.getImage(qr)])
      all.then(results => {
        const bgR = results[0]
        const qrR = results[1]
        let x, y, w, h
        if(+bgR.width > +bgR.height) {
            w = 524
            h = (bgR.height * w)/bgR.width
            x = 0
            y = (474-h)/2
        } else if (+bgR.width <= +bgR.height) {
            h = 474
            w = (h * bgR.width) / bgR.height
            y = 0
            x = (524-w)/2
        }
        this.context.save()
        this.context.drawImage(bgR.path, x, y, w, h)
        this.context.restore()

        this.context.save()
        this.context.setStrokeStyle('#e5e5e5')
        this.context.beginPath()
        this.context.moveTo(0, 475.5 )
        this.context.lineTo(524 , 475.5 )
        this.context.stroke()
        this.context.beginPath()
        this.context.moveTo(0, 607.5 )
        this.context.lineTo(524 , 607.5 )
        this.context.stroke()
        this.context.restore()

        for (let i = 0; i< text.length; i++) {
          const h = i * 32
          this.context.save()
          this.context.translate(22, 520)
          this.context.setFontSize(26)
          // this.context.setTextAlign('center')
          this.context.setFillStyle('#333333')
          this.context.fillText(text[i], 0, h)
          this.context.restore()
        }

        this.context.save()
        this.context.translate(494, 520)
        this.context.setFontSize(36)
        this.context.setTextAlign('right')
        this.context.setFillStyle('#cf0210')
        this.context.fillText(price, 0, 0)
        this.context.restore()

        this.context.save()
        // this.context.font = `italic bold 36px cursive`
        this.context.setFontSize(36)
        const metrics = this.context.measureText(price)

        // this.context.save()
        this.context.translate(524 - metrics.width - 35, 520)
        this.context.setFontSize(24)
        this.context.setTextAlign('right')
        this.context.setFillStyle('#cf0210')
        this.context.fillText('￥', 0, 0)
        this.context.restore()

        this.context.save()
        this.context.translate(25 , 611 ) // 178
        this.context.drawImage(qrR.path, 0, 0, 159 , 159 , 0, 0)
        this.context.restore()

        this.context.save()
        this.context.translate(347 , 684 )
        this.context.setFontSize(24 )
        this.context.setTextAlign('center')
        this.context.setFillStyle('#333333')
        this.context.fillText('请长按识别小程序二维码', 0, 0)
        this.context.restore()

        this.context.save()
        this.context.translate(347 , 719 )
        this.context.setFontSize(24 )
        this.context.setTextAlign('center')
        this.context.setFillStyle('rgba(102,102,102,0.5)')
        this.context.fillText('立即抢购', 0, 0)
        this.context.restore()

        this.context.draw(true, () => {
          wx.canvasToTempFilePath({
            x: 0,
            y: 0,
            destWidth: this.width ,
            destHeight: this.height ,
            canvasId: 'canvas',
            success: function (res) {
              resolve(res.tempFilePath)
            },
            fail: function (e) {
              console.error(e)
              reject(e)
            }
          })
        })
      }).catch(e => {
        wepy.showToast({
          title: '图片资源加载失败',
          icon: 'none'
        })
        reject(e)
      })
    })
  },
  getImage: function (image, cb) {
    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: image,
        success: function (res) {
          resolve(res)
        },
        fail: function (e) {
          reject(e)
        }
      })
    })
  }
}
