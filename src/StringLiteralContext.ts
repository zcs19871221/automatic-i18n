import { SyntaxKind } from 'typescript';
import { Context } from './Context';

export class StringLiteralContext extends Context {
  private removeTextVariableSymobl(text: string) {
    return text.replace(/^['"`]/, '').replace(/['"`]$/, '');
  }

  protected override generatingStrFromChildThenSet(): void {
    let newText = this.replacer.createIntlExpressionFromStr({
      str: this.removeTextVariableSymobl(this.node!.getText()),
    });
    if (this.node!.parent.kind === SyntaxKind.JsxAttribute) {
      newText = '{' + newText + '}';
    }
    this.replacedText = newText;
  }
}
