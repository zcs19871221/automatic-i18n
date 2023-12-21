const defaultLocales = {
  key0001: '7月1日',
  key0002: '7月5日',
  key0003: '7月6日',
  key0004: '7月8日',
};

export type Locales = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key in keyof typeof defaultLocales]: any;
};

export const locales: Locales = defaultLocales;