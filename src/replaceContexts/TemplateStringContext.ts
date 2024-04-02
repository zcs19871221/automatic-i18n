import { ReplaceContext } from './ReplaceContext';
import { TemplateExpressionContext } from './TemplateExpressionContext';

export class TemplateStringContext extends ReplaceContext {
  protected override generatingStrFromChildThenSet() {
    const { keyMapValue, str } = this.joinChildrenAsParameter(
      '`'.length,
      '`'.length
    );
    if (!this.i18nReplacer.includesTargetLocale(str)) {
      this.replacedText = this.joinChildren(
        0,
        0,
        (str: string) =>
          TemplateExpressionContext.startSymbol +
          str +
          TemplateExpressionContext.endSymbol
      );
      return;
    }
    this.needReplace = true;
    const intlId = this.i18nReplacer.getOrCreateIntlId(str);
    this.replacedText = this.i18nReplacer.formatter.format(this, {
      intlId,
      params: keyMapValue,
      defaultMessage: str,
    });
  }
}
