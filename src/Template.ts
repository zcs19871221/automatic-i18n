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
    template.doHandle();
  }
}

export class TemplateExpressionHandler implements NodeHandler {
  match(node: Node): boolean {
    return node.kind === SyntaxKind.TemplateSpan;
  }

  handle(node: Node, replacer: FileReplacer, parent: Context): void {
    const first = node.getChildren()[0];

    const start = replacer.rootContext.str.lastIndexOf(
      TemplateExpression.startSymbol,
      node.getStart()
    );
    const end =
      replacer.rootContext.str.indexOf('}', first.getEnd()) +
      TemplateExpression.endSymbol.length;

    const templateExpression = new TemplateExpression({
      node,
      replacer,
      parent,
      start,
      end,
    });
    templateExpression.doHandle();
  }
}
export class Template extends Context {
  protected override generatingStrFromChildThenSet() {
    const { keyMapValue, str } = this.joinChildsAsParamter(
      '`'.length,
      '`'.length
    );
    if (!this.replacer.includesTargetLocale(str)) {
      this.str = this.joinChildsToString(
        0,
        0,
        (str: string) =>
          TemplateExpression.startSymbol + str + TemplateExpression.endSymbol
      );
      return;
    }
    this.needReplace = true;
    this.str = this.replacer.createIntlExpressionFromIntlId(str, keyMapValue);
  }
}

export class TemplateExpression extends Context {
  protected override generatingStrFromChildThenSet() {
    this.str = this.joinChildsToString(
      TemplateExpression.startSymbol.length,
      TemplateExpression.endSymbol.length
    );
  }

  public static readonly startSymbol: string = '${';
  public static readonly endSymbol: string = '}';
}
