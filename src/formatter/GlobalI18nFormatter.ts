import {
  JsxChildContext,
  StringLiteralContext,
  TemplateStringContext,
} from '../replaceContexts';
import {
  I18nFormatter,
  FormatOptions,
  FormatReturnType,
} from './I18nFormatter';

export default class GlobalI18nFormatter extends I18nFormatter {
  private className: string = 'I18n';
  private exportName: string = 'i18';
  private property: string = 'intl';

  constructor(aliasModuleName: string = 'I18') {
    super();
    this.commonDependencies = {
      moduleName: aliasModuleName,
      names: [this.exportName],
    };
  }

  private commonDependencies: { moduleName: string; names: string[] };
  renderJsxChildContext(
    context: JsxChildContext,
    { intlId, params }: FormatOptions
  ): FormatReturnType {
    const newText =
      '{' + this.createIntlExpressionFromIntlId(intlId, params) + '}';
    return {
      newText,
      dependencies: this.commonDependencies,
    };
  }

  renderTemplateStringContext(
    context: TemplateStringContext,
    opt: FormatOptions
  ): FormatReturnType {
    const newText = this.createIntlExpressionFromIntlId(opt.intlId, opt.params);
    return {
      newText,
      dependencies: this.commonDependencies,
    };
  }
  renderStringLiteralContext(
    context: StringLiteralContext,
    opt: FormatOptions
  ): FormatReturnType {
    const newText = this.createIntlExpressionFromIntlId(opt.intlId, opt.params);
    return {
      newText,
      dependencies: this.commonDependencies,
    };
  }

  private camel(naming: string) {
    const splitIndex = naming.indexOf('-');
    if (splitIndex > -1) {
      return (
        naming.slice(0, splitIndex) +
        naming[splitIndex + 1].toUpperCase() +
        naming.slice(splitIndex + 2)
      );
    }
    return naming;
  }

  entryFile(localeFiles: string[], defaultLocale: string) {
    return `
      import { createIntl, createIntlCache, IntlCache, IntlShape } from 'react-intl';
      import type { LocalKey } from './types';
      ${localeFiles
        .map((localeFile) => {
          const variableName = this.camel(localeFile);
          return `import ${variableName} from './${localeFile}'`;
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
            return `'${l}': ${this.camel(l)}`;
          })
          .join(',\n')}
      };


      const availableLocales = [${localeFiles
        .map((l) => `'${l}'`)
        .join(',')}] as const;

      export type AvailableLocales = (typeof availableLocales)[number];

      export class ${this.className} {
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
      const ${this.exportName} = new ${this.className}(window.hi_system.lang);

      window.${this.exportName} = ${this.exportName};
      export { ${this.exportName}, LocalKey };
      `;
  }

  private createIntlExpressionFromIntlId(
    intlId: string,
    param?: Record<string, string>
  ) {
    let paramsString = '';
    if (param && Object.keys(param).length > 0) {
      paramsString += ',';
      paramsString +=
        Object.entries<string>(param).reduce((text: string, [key, value]) => {
          if (key === value) {
            return text + key + ',';
          } else {
            return text + `${key}: ${value === '' ? "''" : value}` + ',';
          }
        }, '{') + '}';
    }
    return `${this.exportName}.${this.property}.formatMessage({id: '${intlId}'}${paramsString})`;
  }
}
