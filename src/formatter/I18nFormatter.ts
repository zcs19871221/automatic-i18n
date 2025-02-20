import {
  Block,
  FunctionDeclaration,
  Node,
  ParenthesizedExpression,
  SyntaxKind,
  VariableDeclaration,
} from 'typescript';
import crypto from 'crypto';
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

  private shortMd5(input: string) {
    // Create an MD5 hash of the input string
    const hash = crypto
      .createHash('shake256', { outputLength: 4 })
      .update(input)
      .digest('hex');

    // Remove padding characters and return the short MD5 string
    return hash;
  }

  private getOrCreateIntlId(opt: FormatOptions) {
    const { defaultMessage: message } = opt;

    let intlId = '';
    if (this.messageMapIntlId[message] !== undefined) {
      intlId = this.messageMapIntlId[message];
    } else {
      if (opt.info.i18nReplacer.opt.uniqIntlKey) {
        intlId = `key1${this.shortMd5(message)}__`;
      } else {
        do {
          intlId = `key${String(this.intlSeq++).padStart(4, '0')}`;
        } while (Object.values(this.messageMapIntlId).includes(intlId));
      }
    }

    return [intlId, message];
  }

  public renderJsxText(opt: FormatOptions): string {
    return this.render(opt, 'doRenderJsxText');
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
  ): FormatReturnType;
  protected abstract doRenderTemplateString(
    opt: FormatOptions,
    intlId: string
  ): FormatReturnType;
  protected abstract doRenderStringLike(
    opt: FormatOptions,
    intlId: string
  ): FormatReturnType;

  public static getIfInFunctionBody(node: Node): {
    functionName: string;
    functionBody: Block | ParenthesizedExpression;
  } | null {
    const functionExpression = (n: Node) => {
      return (
        n.kind === SyntaxKind.FunctionExpression &&
        n.parent?.kind === SyntaxKind.VariableDeclaration
      );
    };

    const functionDeclaration = (n: Node) => {
      return n.kind === SyntaxKind.FunctionDeclaration;
    };

    const arrowFunction = (n: Node) => {
      return (
        n.kind === SyntaxKind.ArrowFunction &&
        n.parent?.kind === SyntaxKind.VariableDeclaration
      );
    };

    while (node) {
      if (node.kind === SyntaxKind.Parameter) {
        return null;
      }
      if (
        node.parent &&
        (functionExpression(node.parent) || arrowFunction(node.parent))
      ) {
        return {
          functionName:
            (node.parent.parent as VariableDeclaration).name.getText() ?? '',
          functionBody: node as Block | ParenthesizedExpression,
        };
      }
      if (
        node.kind === SyntaxKind.Block &&
        node.parent &&
        functionDeclaration(node.parent)
      ) {
        return {
          functionName:
            (node.parent as FunctionDeclaration).name?.getText() ?? '',
          functionBody: node as Block,
        };
      }
      node = node.parent;
    }
    return null;
  }

  private render(
    opt: FormatOptions,
    method: 'doRenderJsxText' | 'doRenderTemplateString' | 'doRenderStringLike'
  ): string {
    opt.defaultMessage = opt.defaultMessage.replace(
      /(?:\r)?\n/g,
      (m, index) => {
        if (opt.defaultMessage[index - 1] === '\\') {
          return m;
        }
        return '\\' + m;
      }
    );
    const [intlId, message] = this.getOrCreateIntlId(opt);

    if (!opt.info.i18nReplacer.opt.global) {
      const parentFunctionInfo = I18nFormatter.getIfInFunctionBody(opt.node);
      // can not use react-intl hook in non-React component so skip
      if (parentFunctionInfo == null) {
        opt.info.i18nReplacer.addWarning({
          text: `unable to replace ${opt.originStr} in non component context, put it in React component or use GlobalFormatter `,
          start: opt.context.start,
          end: opt.context.end,
          info: opt.info,
        });

        return opt.originStr;
      }
    }

    const result: FormatReturnType = this[method](opt, intlId);

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

  public static sortKeys(
    keyMapValue: Record<string, string>,
    newIntlKeys: Record<string, string>
  ): string[] {
    return Object.keys(keyMapValue).sort((a, b) => {
      if (newIntlKeys[a] && !newIntlKeys[b]) {
        return -1;
      }
      if (!newIntlKeys[a] && newIntlKeys[b]) {
        return 1;
      }
      return a.localeCompare(b);
    });
  }

  private wrapStringWithQuote(text: string) {
    return `'${text.replace(/(?<!\\)'/g, '\\' + "'")}'`;
  }
  public generateMessageFile(
    keyMapValue: Record<string, string>,
    newIntlMap: Record<string, string>
  ) {
    const ids = I18nFormatter.sortKeys(keyMapValue, newIntlMap);
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
              const quote = key.includes("'") ? '"' : "'";
              return `${quote}${key}${quote}: ${this.wrapStringWithQuote(
                keyMapValue[key]
              )}`;
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
