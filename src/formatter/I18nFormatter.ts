import {
  JsxChildContext,
  StringLiteralContext,
  TemplateStringContext,
} from '../replaceContexts';
import { LocaleTypes } from '../types';

export interface FormatOptions {
  params?: Record<string, string>;
  defaultMessage: string;
  originStr: string;
}

export interface FormatReturnType {
  newText: string;
  dependencies?: {
    moduleName: string;
    names: string[];
  };
}
export abstract class I18nFormatter {
  public abstract entryFile(
    localeFiles: LocaleTypes[],
    defaultLocale: LocaleTypes
  ): string;

  private intlSeq: number = 1;

  public getOrCreateIntlId(message: string) {
    message = message.replace(/(\r)?\n/g, '\\n');
    let intlId = '';
    if (this.messageMapIntlId[message] !== undefined) {
      intlId = this.messageMapIntlId[message];
    } else {
      do {
        intlId = `key${String(this.intlSeq++).padStart(4, '0')}`;
      } while (Object.values(this.messageMapIntlId).includes(intlId));
    }

    return [intlId, message];
  }

  public format(
    context: JsxChildContext | StringLiteralContext | TemplateStringContext,
    opt: FormatOptions
  ) {
    const [intlId, message] = this.getOrCreateIntlId(opt.defaultMessage);
    opt.defaultMessage = message;
    const handleResult = (result: null | FormatReturnType) => {
      if (result === null) {
        return opt.originStr;
      }
      if (!this.messageMapIntlId[message]) {
        this.messageMapIntlId[message] = intlId;
        this.newIntlMapMessages[intlId] = message;
      }

      const { newText, dependencies } = result;
      if (dependencies) {
        context.fileContext.addRequiredImports(
          dependencies.moduleName,
          dependencies.names
        );
      }
      return newText;
    };
    if (context instanceof JsxChildContext) {
      const result = this.renderJsxChildContext(context, opt, intlId);
      return handleResult(result);
    }
    if (context instanceof TemplateStringContext) {
      const result = this.renderTemplateStringContext(context, opt, intlId);
      return handleResult(result);
    }

    const result = this.renderStringLiteralContext(context, opt, intlId);
    return handleResult(result);
  }

  abstract renderJsxChildContext(
    context: JsxChildContext,
    opt: FormatOptions,
    intlId: string
  ): FormatReturnType | null;
  abstract renderTemplateStringContext(
    context: TemplateStringContext,
    opt: FormatOptions,
    intlId: string
  ): FormatReturnType | null;
  abstract renderStringLiteralContext(
    context: StringLiteralContext,
    opt: FormatOptions,
    intlId: string
  ): FormatReturnType | null;

  protected camelLocale(naming: string) {
    const splitIndex = naming.indexOf('-');
    return (
      naming.slice(0, splitIndex) +
      naming[splitIndex + 1].toUpperCase() +
      naming.slice(splitIndex + 2)
    );
  }

  protected paramsString(param?: Record<string, string>) {
    let paramsString = '';
    if (param && Object.keys(param).length > 0) {
      paramsString +=
        Object.entries<string>(param).reduce((text: string, [key, value]) => {
          if (key === value) {
            return text + key + ',';
          } else {
            return text + `${key}: ${value === '' ? "''" : value}` + ',';
          }
        }, '{') + '}';
    }
    return paramsString;
  }

  protected intlApiExpression(
    intlId: string,
    defaultMessage: string,
    apiName: string,
    params?: Record<string, string>
  ) {
    const paramString = this.paramsString(params);

    return `
    ${apiName}.formatMessage({
            id: '${intlId}',
            defaultMessage: ${this.wrapStringWithQuote(defaultMessage)}
          }${paramString ? ',' + paramString : ''})`;
  }

  private unionType(types: string[]) {
    return types.length > 0
      ? types.map((type) => `'${type}'`).join('|')
      : 'any';
  }

  public generateTypeFile(locales: LocaleTypes[], keys: string[]) {
    return `export type AvailableLocale = ${this.unionType(locales)};

            export type LocalKey = ${this.unionType(keys)};
          `;
  }

  private newIntlMapMessages: Record<string, string> = {};

  public getNewIntlMapMessages() {
    return this.newIntlMapMessages;
  }

  public static isAutomaticGeneratedKey(key: string) {
    return /key\d+/.test(key);
  }
  public static sortKeys(keyMapValue: Record<string, string>) {
    return Object.keys(keyMapValue).sort();
  }

  private wrapStringWithQuote(text: string) {
    return `'${text.replace(/(?<!\\)'/g, '\\' + "'")}'`;
  }
  public generateMessageFile(keyMapValue: Record<string, string>) {
    const ids = I18nFormatter.sortKeys(keyMapValue);
    return `
        /*
          * This file will be changed by automatic program.
          * You can only change variable's property and value.
        */
        import { LocalKey } from './types';

        const locale: Record<LocalKey, string> = {
          ${ids
            .map((key) => {
              return `${key}: ${this.wrapStringWithQuote(keyMapValue[key])}`;
            })
            .join(',\n')}
        };

        export default locale;
      `;
  }

  private messageMapIntlId: Record<string, string> = {};

  public setMessageMapIntlId(messageMapIntlId: Record<string, string>) {
    this.messageMapIntlId = messageMapIntlId;
  }
}
