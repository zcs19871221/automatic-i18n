import { FileReplacer, NodeHandler } from './FileReplacer';
import { Context } from './Context';
import { Node, SyntaxKind } from 'typescript';

export class TemplateHandler implements NodeHandler {
  match(node: Node): boolean {
    return node.kind === SyntaxKind.TemplateExpression;
  }

  handle(node: Node, replacer: FileReplacer, parent: Context): void {
    const template = new Template({
      node,
      replacer,
      start: node.getStart(),
      end: node.getEnd(),
      parent,
    });
    template.generateStr();
  }
}

export class TemplateExpressionHandler implements NodeHandler {
  match(node: Node): boolean {
    return node.kind === SyntaxKind.TemplateSpan;
  }

  handle(node: Node, replacer: FileReplacer, parent: Context): void {
    const first = node.getChildren()[0];

    const start = replacer.file.lastIndexOf(
      TemplateExpression.startSymbol,
      node.getStart()
    );
    const end =
      replacer.file.indexOf('}', first.getEnd()) +
      TemplateExpression.endSymbol.length;
    const templateExpression = new TemplateExpression({
      node,
      replacer,
      parent,
      start,
      end,
    });
    templateExpression.generateStr();
  }
}
export class Template extends Context {
  protected override generatingStrFromChildThenSet() {
    const { keyMapValue, str } = this.joinChildrenAsParameter(
      '`'.length,
      '`'.length
    );
    if (!this.replacer.includesTargetLocale(str)) {
      this.str = this.joinChildren(
        0,
        0,
        (str: string) =>
          TemplateExpression.startSymbol + str + TemplateExpression.endSymbol
      );
      return;
    }
    this.needReplace = true;
    const intlId = this.replacer.getOrCreateIntlId(str);
    this.str = this.replacer.createIntlExpressionFromIntlId(
      intlId,
      keyMapValue
    );
  }
}

export class TemplateExpression extends Context {
  protected override generatingStrFromChildThenSet() {
    this.str = this.joinChildren(
      TemplateExpression.startSymbol.length,
      TemplateExpression.endSymbol.length
    );
  }

  public static readonly startSymbol: string = '${';
  public static readonly endSymbol: string = '}';
}
