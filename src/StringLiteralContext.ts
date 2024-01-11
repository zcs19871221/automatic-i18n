import { SyntaxKind } from 'typescript';
import { NodeHandler, Opt } from './context';

export class StringLiteralContext extends NodeHandler {
  private removeTextVariableSymobl(text: string) {
    return text.replace(/^['"`]/, '').replace(/['"`]$/, '');
  }

  public static override of(opt: Opt) {
    if (!opt.replacer.includesTargetLocale(opt.node.getText())) {
      return null;
    }
    const stringLiteral = new StringLiteralContext({
      ...opt,
      start: opt.node.getStart(),
      end: opt.node.getEnd(),
    });
    stringLiteral.needReplace = true;

    return stringLiteral;
  }

  protected override generatingStrFromChildThenSet(): void {
    let newText = this.replacer.generateNewText({
      localeTextOrPattern: this.removeTextVariableSymobl(this.node!.getText()),
    });
    if (this.node!.parent.kind === SyntaxKind.JsxAttribute) {
      newText = '{' + newText + '}';
    }
    this.newStr = newText;
  }
}
