import {
  JsxChildContext,
  ReplaceContext,
  StringLiteralContext,
  TemplateStringContext,
} from '../replaceContexts';
import { localeTypes } from '../types';

export interface FormatOptions {
  params?: Record<string, string>;
  defaultMessage: string;
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
    localeFiles: localeTypes[],
    defaultLocale: localeTypes
  ): string;

  private intlSeq: number = 1;

  public getOrCreateIntlId(message: string) {
    message = message.replace(/\n/g, '\\n');
    let intlId = '';
    if (this.messageMapIntlId[message]) {
      intlId = this.messageMapIntlId[message];
    } else {
      do {
        intlId = `key${String(this.intlSeq++).padStart(4, '0')}`;
      } while (Object.values(this.messageMapIntlId).includes(intlId));
      this.messageMapIntlId[message] = intlId;
      this.newIntlMapMessages[intlId] = message;
    }

    return intlId;
  }

  public format(context: ReplaceContext, opt: FormatOptions) {
    const intlId = this.getOrCreateIntlId(opt.defaultMessage);
    if (context instanceof JsxChildContext) {
      const { newText, dependencies } = this.renderJsxChildContext(
        context,
        opt,
        intlId
      );
      if (dependencies) {
        context.fileContext.addRequiredImports(
          dependencies.moduleName,
          dependencies.names
        );
      }
      return newText;
    }
    if (context instanceof TemplateStringContext) {
      const { newText, dependencies } = this.renderTemplateStringContext(
        context,
        opt,
        intlId
      );
      if (dependencies) {
        context.fileContext.addRequiredImports(
          dependencies.moduleName,
          dependencies.names
        );
      }
      return newText;
    }

    if (context instanceof StringLiteralContext) {
      const { newText, dependencies } = this.renderStringLiteralContext(
        context,
        opt,
        intlId
      );
      if (dependencies) {
        context.fileContext.addRequiredImports(
          dependencies.moduleName,
          dependencies.names
        );
      }
      return newText;
    }

    throw new Error(
      'can not handle context type ' + (context as any)?.constructor?.name
    );
  }

  abstract renderJsxChildContext(
    context: JsxChildContext,
    opt: FormatOptions,
    intlId: string
  ): FormatReturnType;
  abstract renderTemplateStringContext(
    context: TemplateStringContext,
    opt: FormatOptions,
    intlId: string
  ): FormatReturnType;
  abstract renderStringLiteralContext(
    context: StringLiteralContext,
    opt: FormatOptions,
    intlId: string
  ): FormatReturnType;

  private unionType(types: string[]) {
    return types.map((type) => `'${type}'`).join('|');
  }

  public generateTypeFile(locales: localeTypes[], keys: string[]) {
    return `export type AvailableLocale = ${this.unionType(locales)};

            export interface LocaleContextValue {
              readonly locale: AvailableLocale;
              readonly setLocale: React.Dispatch<React.SetStateAction<AvailableLocale>>;
              readonly fetchingMessages: boolean;
            }

            export type LocalKey = ${this.unionType(keys)};
          `;
  }

  private newIntlMapMessages: Record<string, string> = {};

  public getNewIntlMapMessages() {
    return this.newIntlMapMessages;
  }

  public generateMessageFile(keyMapValue: Record<string, string>) {
    return `
        /*
          * This file will be changed by automatic program.
          * You can only change variable's property and value.
        */
        import { LocalKey } from './types.ts';

        const locale: Record<LocalKey, string> = {
          ${Object.keys(keyMapValue)
            .map((key) => {
              if (key.includes('-')) {
                key = `'"' + key + '"'`;
              }
              let quote = "'";
              if (keyMapValue[key].includes("'")) {
                quote = '"';
              }
              return `${key}: ${quote}${keyMapValue[key]}${quote}`;
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
  public getMessageMapIntlId() {
    return this.messageMapIntlId;
  }
}
