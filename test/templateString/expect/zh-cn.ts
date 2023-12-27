/*
 * This file will be changed by automatic program.
 * You can only change variable's property and value.
 */
export const locales = {
  key0001: '里面{v1}',
  key0002: 'fsffdsfd{v1}你好呀{v2}哈哈{v3}ffff{v4}{v5}',
} as const;

export type LocalKey = keyof typeof locales;
export type Locales = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key in LocalKey]: any;
};
