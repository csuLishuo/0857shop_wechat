import lf from './lf.wechat'
export const onEvent = function (key, cb) {
  const r = lf.storage.get(key)
  lf.storage.remove(key)
  if (cb) {
    cb(r)
  }
}
export const fireEvent = function (key, data) {
  lf.storage.set(key, data)
}
export const EVENT = {
  ORDER: 'ORDER_CHANGE',
  SHOP: 'SHOP_RED_DOT'
}
export const TYPES = {
  ORDER_STATUS_CHANGES: 'ORDER_STATUS_CHANGES',
  ORDER_ALL_DELECT_CHANGES: 'ORDER_ALL_DELECT_CHANGES',
  ORDER_SURE_CHANGES: 'ORDER_SURE_CHANGES',
  ORDER_PASS_CHANGES: 'ORDER_PASS_CHANGES',
  ORDER_STORE_CHANGES: 'ORDER_STORE_CHANGES',
  SHOP_RED_DOT_CHANGES: 'SHOP_RED_DOT_CHANGES',
  FUNCTIONCHANGE: 'FUNCTIONCHANGE'
}
