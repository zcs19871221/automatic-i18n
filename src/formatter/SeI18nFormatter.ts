import {
  I18nFormatter,
  FormatOptions,
  FormatReturnType,
} from './I18nFormatter';

export default class SeI18nFormatter extends I18nFormatter {
  protected override doRenderJsxText(
    options: FormatOptions,
    intlId: string
  ): FormatReturnType {
    const globalRendered = this.renderGlobal(options, intlId);
    globalRendered.newText = '{' + globalRendered?.newText + '}';
    return globalRendered;
  }

  protected override doRenderTemplateString(
    opt: FormatOptions,
    intlId: string
  ): FormatReturnType {
    return this.doRender(opt, intlId);
  }

  private renderGlobal(
    { params, defaultMessage }: FormatOptions,
    intlId: string
  ): FormatReturnType {
    const newText = this.intlApiExpression(
      intlId,
      defaultMessage,
      `i18.intl`,
      params
    );
    return {
      newText: newText,
      dependencies: {
        moduleName: 'I18',
        names: ['i18'],
      },
    };
  }

  private doRender(opt: FormatOptions, intlId: string) {
    return this.renderGlobal(opt, intlId);
  }

  protected override doRenderStringLike(
    opt: FormatOptions,
    intlId: string
  ): FormatReturnType {
    return this.doRender(opt, intlId);
  }

  protected override doEntryFile(): string {
    return `
/* eslint-disable */
import { createIntl, createIntlCache, IntlCache, IntlShape } from 'react-intl';
import type { LocalKey } from './types';
import zhCn from './zh-cn';
import enUs from './en-us';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace FormatjsIntl {
    interface Message {
      ids: LocalKey;
    }
  }
}

const messages = {
  'zh-cn': zhCn,
  'en-us': enUs,
};

const availableLocales = ['zh-cn', 'en-us'] as const;

export type AvailableLocales = (typeof availableLocales)[number];

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
      this.currentLocale = 'zh-cn';
      this.currentIntl = this.createLocaleIntl('zh-cn');
      // throw new Error(\`不是有效的语言: \${locale}\`);
      console.log(\`不是有效的语言: \${locale}\`);
    }
  }

  public get locale() {
    return this.currentLocale;
  }

  public get intl(): IntlShape {
    return this.currentIntl;
  }

  public changeLocales(locale: AvailableLocales) {
    if (locale === this.currentLocale) {
      return;
    }
    if (availableLocales.includes(locale)) {
      this.currentLocale = locale;
      this.currentIntl = this.createLocaleIntl(locale);
    }
  }

  private currentLocale: AvailableLocales;

  private cache: IntlCache = createIntlCache();

  private currentIntl: IntlShape;

  private createLocaleIntl(local: AvailableLocales): IntlShape {
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
const i18: {
  intl: IntlShape;
  locale: AvailableLocales;
} = new I18n(window.hi_system.lang);

window.i18 = i18;
export { i18, LocalKey };
`;
  }
}
