import { ReplaceContext } from './ReplaceContext';
import { TemplateExpressionContext } from './TemplateExpressionContext';

export class TemplateStringContext extends ReplaceContext {
  protected override generatingStrFromChildThenSet() {
    const { keyMapValue, str } = this.joinChildrenAsParameter(
      '`'.length,
      '`'.length
    );
    if (!this.fileContext.bundleReplacer.includesTargetLocale(str)) {
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
    const intlId = this.fileContext.bundleReplacer.getOrCreateIntlId(str);
    this.replacedText =
      this.fileContext.bundleReplacer.createIntlExpressionFromIntlId(
        intlId,
        keyMapValue
      );
  }
}
