import {
  JsxChildContext,
  ReplaceContext,
  StringLiteralContext,
  TemplateStringContext,
} from '../replaceContexts';
import { localeTypes } from '../types';

export interface FormatOptions {
  intlId: string;
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

  public format(context: ReplaceContext, opt: FormatOptions) {
    if (context instanceof JsxChildContext) {
      const { newText, dependencies } = this.renderJsxChildContext(
        context,
        opt
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
        opt
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
        opt
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
    opt: FormatOptions
  ): FormatReturnType;
  abstract renderTemplateStringContext(
    context: TemplateStringContext,
    opt: FormatOptions
  ): FormatReturnType;
  abstract renderStringLiteralContext(
    context: StringLiteralContext,
    opt: FormatOptions
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

  public generateLocaleFiles(keyMapValue: Record<string, string>) {
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
}
