const defaultLocales = {
  key0001: '默认名称',
  key0002: '男',
  key0003: '北京大学',
  key0004: '你好',
  key0005: '哈哈',
  key0006: '为什么',
  key0007: '好的',
  key0008: '不好',
  key0009: '真是男的',
  key0010: '北京',
  key0011: '大学',
  key0012: '真不错',
  key0013: '套娃',
  key0014: '套娃3',
  key0015: '租户不存在',
  key0016: '请重新登录，或联系系统管理员创建至少一个租户',
  key0017: '知道了',
  key0018: '和\`',
  key0019: ' sfdsfds你好dsffds你好',
  key0020: '别名',
  key0021: '别名2',
  key0022: '意义咋样',
  key0023: '请输入',
  key0024: '中纯文本',
  key0025: '然后分割',
  key0026: '空节点',
};

export type Locales = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key in keyof typeof defaultLocales]: any;
};

export const locales: Locales = defaultLocales;