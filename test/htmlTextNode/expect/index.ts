import { createIntl, createIntlCache, IntlCache, IntlShape } from 'react-intl';
import { locales as enUs } from './en-us';
import { locales as zhCn, LocalKey } from './zh-cn';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace FormatjsIntl {
    interface Message {
      ids: LocalKey;
    }
  }
}

const messages = {
  'en-us': enUs,
  'zh-cn': zhCn,
};

const availableLocales = ['en-us', 'zh-cn'] as const;

export type AvailabeLocales = (typeof availableLocales)[number];

export class I18n {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(locale: any) {
    if (window.hi_system.lang === this.currentLocale) {
      return;
    }
    if (availableLocales.includes(locale)) {
      this.currentLocale = locale;
      this.currentIntl = this.createLocaleIntl(locale);
    } else {
      throw new Error(`不是有效的语言: ${locale}`);
    }
  }

  public get locale() {
    return this.currentLocale;
  }

  public get intl(): IntlShape {
    return this.currentIntl;
  }

  public changeLocales(locale: AvailabeLocales) {
    if (locale === this.currentLocale) {
      return;
    }
    if (availableLocales.includes(locale)) {
      this.currentLocale = locale;
      this.currentIntl = this.createLocaleIntl(locale);
    }
  }

  private currentLocale: AvailabeLocales;

  private cache: IntlCache = createIntlCache();

  private currentIntl: IntlShape;

  private createLocaleIntl(local: AvailabeLocales): IntlShape {
    this.cache = createIntlCache();
    return createIntl(
      {
        locale: this.currentLocale,
        messages: messages[local],
      },
      this.cache
    );
  }
}
const i18 = new I18n(window.hi_system.lang);

window.i18 = i18;
export { i18, LocalKey };
