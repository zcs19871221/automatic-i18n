import { ReplaceContext } from './ReplaceContext';

export class TemplateExpressionContext extends ReplaceContext {
  protected override generatingStrFromChildThenSet() {
    this.replacedText = this.joinChildren(
      TemplateExpressionContext.startSymbol.length,
      TemplateExpressionContext.endSymbol.length
    );
  }

  public static readonly startSymbol: string = '${';
  public static readonly endSymbol: string = '}';
}
