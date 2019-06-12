import wepy from 'wepy'
import lf from 'lf'
import { onEvent, EVENT, TYPES } from '../js/event'

export default class CommonMixin extends wepy.mixin {
  data = {
    isPx: false
  }
  methods = {}

  onLoad () {
    this.isPx = lf.util.isPx(this)
  }

  onShow () {
    onEvent(EVENT.SHOP, e => {
      switch (e.type) {
        case TYPES.SHOP_RED_DOT_CHANGES:
          wepy.$instance.showShopRedDot()
          break
      }
    })
  }
}
