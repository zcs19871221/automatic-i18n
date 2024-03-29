import { SyntaxKind } from 'typescript';
import { ReplaceContext } from './ReplaceContext';

export class StringLiteralContext extends ReplaceContext {
  private removeTextVariableSymbol(text: string) {
    return text.replace(/^['"`]/, '').replace(/['"`]$/, '');
  }

  protected override generatingStrFromChildThenSet(): void {
    const intl = this.replacer.getOrCreateIntlId(
      this.removeTextVariableSymbol(this.node!.getText())
    );

    let newText = this.replacer.createIntlExpressionFromIntlId(intl);

    if (this.node!.parent.kind === SyntaxKind.JsxAttribute) {
      newText = '{' + newText + '}';
    }

    this.replacedText = newText;
  }
}
