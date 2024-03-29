import { ReplaceContext } from './ReplaceContext';

export class TemplateExpression extends ReplaceContext {
  protected override generatingStrFromChildThenSet() {
    this.replacedText = this.joinChildren(
      TemplateExpression.startSymbol.length,
      TemplateExpression.endSymbol.length
    );
  }

  public static readonly startSymbol: string = '${';
  public static readonly endSymbol: string = '}';
}
