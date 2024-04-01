const camel = (naming: string) => {
  const splitIndex = naming.indexOf('-');
  if (splitIndex > -1) {
    return (
      naming.slice(0, splitIndex) +
      naming[splitIndex + 1].toUpperCase() +
      naming.slice(splitIndex + 2)
    );
  }
  return naming;
};

export const renderEntryFile = (
  localeFiles: string[],
  defaultLocale: string
) => {
  return `
import { createIntl, createIntlCache, IntlCache, IntlShape } from 'react-intl';
${localeFiles
  .map((localeFile, index) => {
    const variableName = camel(localeFile);
    const isDefault = localeFile === defaultLocale;
    return `import { locales as ${variableName}${
      isDefault ? ', LocalKey' : ''
    } } from './${localeFile}'`;
  })
  .join('\n')}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace FormatjsIntl {
    interface Message {
      ids: LocalKey;
    }
  }
}

const messages = {
  ${localeFiles
    .map((l) => {
      return `'${l}': ${camel(l)}`;
    })
    .join(',\n')}
};


const availableLocales = [${localeFiles
    .map((l) => `'${l}'`)
    .join(',')}] as const;

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
      throw new Error(\`不是有效的语言: \${locale}\`);
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
const i18 = new I18n(window.hi_system.lang);

window.i18 = i18;
export { i18, LocalKey };
`;
};
