import { SyntaxKind } from 'typescript';
import { ReplaceContext } from './ReplaceContext';

export class StringLiteralContext extends ReplaceContext {
  private removeTextVariableSymbol(text: string) {
    return text.replace(/^['"`]/, '').replace(/['"`]$/, '');
  }

  protected override generatingStrFromChildThenSet(): void {
    let newText = this.replacer.createIntlExpressionFromStr({
      str: this.removeTextVariableSymbol(this.node!.getText()),
    });
    if (this.node!.parent.kind === SyntaxKind.JsxAttribute) {
      newText = '{' + newText + '}';
    }
    this.replacedText = newText;
  }
}
