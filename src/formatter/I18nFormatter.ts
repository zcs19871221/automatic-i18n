import { Node } from 'typescript';
import { Info, ReplaceContext } from '../ReplaceContext';
import { LocaleTypes } from '../types';

export interface FormatOptions {
  params?: Record<string, string>;
  defaultMessage: string;
  originStr: string;
  info: Info;
  node: Node;
  context: ReplaceContext;
}

export interface FormatReturnType {
  newText: string;
  dependencies?: {
    moduleName: string;
    names: string[];
  };
}
export abstract class I18nFormatter {
  public entryFile(
    localeFiles: LocaleTypes[],
    defaultLocale: LocaleTypes
  ): string {
    return (
      `/*
          * This file is automatic generated by automatic-i18n.
          * All changes will be cleared 
          * after rerun automatic-i18n program. 
          * Or you can implement an I18nFormatter class and use that class as the I18nFormatterClass parameter for api invoke.
        */` + this.doEntryFile(localeFiles, defaultLocale)
    );
  }

  protected abstract doEntryFile(
    localeFiles: LocaleTypes[],
    defaultLocale: LocaleTypes
  ): string;

  private intlSeq: number = 1;

  private getOrCreateIntlId(message: string) {
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

  public renderJsxText(opt: FormatOptions): string {
    return this.render(opt, 'doRenderStringLike');
  }

  public renderTemplateString(opt: FormatOptions) {
    return this.render(opt, 'doRenderTemplateString');
  }

  public renderStringLike(opt: FormatOptions) {
    return this.render(opt, 'doRenderStringLike');
  }

  protected abstract doRenderJsxText(
    opt: FormatOptions,
    intlId: string
  ): FormatReturnType | null;
  protected abstract doRenderTemplateString(
    opt: FormatOptions,
    intlId: string
  ): FormatReturnType | null;
  protected abstract doRenderStringLike(
    opt: FormatOptions,
    intlId: string
  ): FormatReturnType | null;

  private render(
    opt: FormatOptions,
    method: 'doRenderJsxText' | 'doRenderTemplateString' | 'doRenderStringLike'
  ): string {
    const [intlId, message] = this.getOrCreateIntlId(opt.defaultMessage);
    const result: FormatReturnType | null = this[method](opt, intlId);

    if (result === null) {
      return opt.originStr;
    }
    if (!this.messageMapIntlId[message]) {
      this.messageMapIntlId[message] = intlId;
      this.newIntlMapMessages[intlId] = message;
    }

    const { newText, dependencies } = result;
    if (dependencies) {
      const { moduleName, names } = dependencies;
      opt.info.requiredImports[moduleName] ??= {
        moduleName,
        names: new Set(),
      };
      names.forEach((name) => {
        opt.info.requiredImports[moduleName].names.add(name);
      });
    }
    return newText;
  }

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
    return `export type AvailableLocales = ${this.unionType(locales)};

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
          * This file is automatic generated by automatic-i18n.
          * You can only change variable's property and value.
          * Others will be clear after rerun automatic-i18n program.
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
