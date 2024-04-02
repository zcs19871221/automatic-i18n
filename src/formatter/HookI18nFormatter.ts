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

export default class HookI18nFormatter extends I18nFormatter {
  entryFile(localeFiles: string[], defaultLocale: string): string {
    throw new Error('Method not implemented.');
  }
  renderJsxChildContext(
    context: JsxChildContext,
    opt: FormatOptions
  ): FormatReturnType {
    throw new Error('Method not implemented.');
  }
  renderTemplateStringContext(
    context: TemplateStringContext,
    opt: FormatOptions
  ): FormatReturnType {
    throw new Error('Method not implemented.');
  }
  renderStringLiteralContext(
    context: StringLiteralContext,
    opt: FormatOptions
  ): FormatReturnType {
    throw new Error('Method not implemented.');
  }
}
