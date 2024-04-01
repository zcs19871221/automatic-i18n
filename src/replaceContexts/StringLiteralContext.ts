import { SyntaxKind } from 'typescript';
import { ReplaceContext } from './ReplaceContext';

export class StringLiteralContext extends ReplaceContext {
  private removeTextVariableSymbol(text: string) {
    return text.replace(/^['"`]/, '').replace(/['"`]$/, '');
  }

  protected override generatingStrFromChildThenSet(): void {
    const intl = this.fileContext.bundleReplacer.getOrCreateIntlId(
      this.removeTextVariableSymbol(this.node!.getText())
    );

    let newText =
      this.fileContext.bundleReplacer.createIntlExpressionFromIntlId(intl);

    if (this.node!.parent.kind === SyntaxKind.JsxAttribute) {
      newText = '{' + newText + '}';
    }

    this.replacedText = newText;
  }
}
