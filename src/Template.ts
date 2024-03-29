import { Context } from './Context';

export class Template extends Context {
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
          TemplateExpression.startSymbol + str + TemplateExpression.endSymbol
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

export class TemplateExpression extends Context {
  protected override generatingStrFromChildThenSet() {
    this.replacedText = this.joinChildren(
      TemplateExpression.startSymbol.length,
      TemplateExpression.endSymbol.length
    );
  }

  public static readonly startSymbol: string = '${';
  public static readonly endSymbol: string = '}';
}
