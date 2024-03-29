import { ReplaceContext } from './ReplaceContext';
import { TemplateExpressionContext } from './TemplateExpressionContext';

export class TemplateStringContext extends ReplaceContext {
  protected override generatingStrFromChildThenSet() {
    const { keyMapValue, str } = this.joinChildrenAsParameter(
      '`'.length,
      '`'.length
    );
    if (!this.replacer.includesTargetLocale(str)) {
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
    const intlId = this.replacer.getOrCreateIntlId(str);
    this.replacedText = this.replacer.createIntlExpressionFromIntlId(
      intlId,
      keyMapValue
    );
  }
}
