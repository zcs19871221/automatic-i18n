import { locales as zhCn } from './zh-cn';
/* othersLocalesImport */
const defaultLocale = 'zh-cn';

const availableLocales = [defaultLocale /* othersLocalesName */] as const;

type AvailabeLocales = (typeof availableLocales)[number];

type Locales = typeof zhCn;

const localesMap = {
  'zh-cn': zhCn,
  /* othersLocalesNameMapping */
} as const;

class I18n {
  private currentLocale: AvailabeLocales = defaultLocale;

  public get locales(): Locales {
    return localesMap[this.currentLocale];
  }

  public changeLocales(locale: AvailabeLocales) {
    if (locale === this.currentLocale) {
      return;
    }
    if (availableLocales.includes(locale)) {
      this.currentLocale = locale;
    }
  }
}

export const i18 = new I18n();
