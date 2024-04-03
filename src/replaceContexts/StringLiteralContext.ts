import { SyntaxKind } from 'typescript';
import { ReplaceContext } from './ReplaceContext';

export class StringLiteralContext extends ReplaceContext {
  private removeTextVariableSymbol(text: string) {
    return text.replace(/^['"`]/, '').replace(/['"`]$/, '');
  }

  protected override generatingStrFromChildThenSet(): void {
    const originStr = this.removeTextVariableSymbol(this.node!.getText());
    const intlId = this.i18nReplacer.getOrCreateIntlId(originStr);

    let newText = this.i18nReplacer.i18nFormatter.format(this, {
      intlId,
      defaultMessage: originStr,
    });

    if (this.node!.parent.kind === SyntaxKind.JsxAttribute) {
      newText = '{' + newText + '}';
    }

    this.replacedText = newText;
  }
}
