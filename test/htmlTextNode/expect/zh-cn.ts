/*
 * This file will be changed by automatic program.
 * You can only change variable's property and value.
 */
export const locales = {
  key0001: '一开始12342142',
  key0002: '中间',
  key0003: '{v1}末班{v1}车',
  key0004: '哈哈',
  key0005: '你好呀',
} as const;

export type LocalKey = keyof typeof locales;
export type Locales = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key in LocalKey]: any;
};
