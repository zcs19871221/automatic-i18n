import ts, { SyntaxKind } from 'typescript';
import { FileReplacer } from './FileReplacer';
import { Context } from './context';

export class StringLiteralContext extends Context {
  private removeTextVariableSymobl(text: string) {
    return text.replace(/^['"`]/, '').replace(/['"`]$/, '');
  }

  public static handle(
    node: ts.StringLiteral,
    parent: Context,
    fileReplacer: FileReplacer
  ) {
    if (!fileReplacer.includesTargetLocale(node.getText())) {
      return;
    }
    const stringLiteral = new StringLiteralContext(
      fileReplacer,
      node.getStart(),
      node.getEnd(),
      parent
    );
    stringLiteral.needReplace = true;
    stringLiteral.generateStrFromChildThenSet(node);
  }

  protected override generatingStrFromChildThenSet(node: ts.Node): void {
    let newText = this.replacer.generateNewText({
      localeTextOrPattern: this.removeTextVariableSymobl(node.getText()),
    });
    if (node.parent.kind === SyntaxKind.JsxAttribute) {
      newText = '{' + newText + '}';
    }
    this.newStr = newText;
  }
}

class JsxContextList extends Context {
  protected override generatingStrFromChildThenSet() {
    const { str, keyMapValue } = this.concatBlock(0, 0);

    if (!this.replacer.includesTargetLocale(str)) {
      this.newStr = this.concat(0, 0);
      return;
    }

    this.needReplace = true;
    const newStr = str.replace(
      /(^[\s\n]+)|([\s\n]+$)/g,
      (_match, start, end) => {
        if (start) {
          this.start += _match.length;
        } else {
          this.end -= _match.length;
        }
        return '';
      }
    );

    const textKey =
      this.replacer.bundleReplacer.getOrSetLocaleTextKeyIfAbsence(newStr);
    this.newStr = '{' + FileReplacer.localeMapToken(textKey, keyMapValue) + '}';
  }
}

export class RootContext extends Context {
  protected override generatingStrFromChildThenSet(
    node?: ts.Node | undefined
  ): void {
    this.childs = this.childs.filter((c) => c.needReplace);

    this.newStr = this.concatVariable(0, 0);
  }
}

export class Jsx extends Context {
  public jsxWrap = false;
  public static override handle(
    node: ts.Node,
    context: Context,
    fileReplacer: FileReplacer
  ) {
    let jsxExpressionParent: Context | null = context;
    while (
      jsxExpressionParent !== null &&
      !(jsxExpressionParent instanceof JsxExpression)
    ) {
      jsxExpressionParent = jsxExpressionParent.parent || null;
    }

    if (jsxExpressionParent instanceof JsxExpression) {
      jsxExpressionParent.includeJsx = true;
    }

    const jsx = new Jsx(fileReplacer, node.getStart(), node.getEnd(), context);

    if (
      node.kind === SyntaxKind.JsxElement ||
      node.kind === SyntaxKind.JsxFragment
    ) {
      jsx.jsxWrap = true;
    }

    ts.forEachChild(node, (n) =>
      fileReplacer.traverseAstAndExtractLocales(n, jsx)
    );

    jsx.generateStrFromChildThenSet();
  }

  protected override generatingStrFromChildThenSet(): void {
    if (this.jsxWrap) {
      const newChilds: Context[] = [];
      let block: Context[] = [];
      const createJsxList = (end: number, nextStart: number) => {
        if (start >= end) {
          return;
        }
        const jsxContextList = new JsxContextList(this.replacer, start, end);
        jsxContextList.childs.push(...block);
        jsxContextList.generateStrFromChildThenSet();
        if (jsxContextList.newStr) {
          newChilds.push(jsxContextList);
        }
        start = nextStart;
        block = [];
      };
      let start = this.childs[0].end;
      newChilds.push(this.childs[0]);
      for (let i = 1; i < this.childs.length - 1; i++) {
        const c = this.childs[i];
        if (c instanceof Jsx || (c instanceof JsxExpression && c.includeJsx)) {
          createJsxList(c.start, c.end);
          newChilds.push(c);
          continue;
        }

        block.push(c);
      }

      createJsxList(this.childs[this.childs.length - 1].start, -1);
      newChilds.push(this.childs[this.childs.length - 1]);
      this.childs = newChilds;
    }

    this.newStr = this.concatVariable(0, 0);
  }
}

export class JsxExpression extends Context {
  public static override handle(
    node: ts.JsxExpression,
    parent: Context,
    fileReplacer: FileReplacer
  ) {
    const jsxExpression = new JsxExpression(
      fileReplacer,
      node.getStart(),
      node.getEnd(),
      parent
    );
    ts.forEachChild(node, (n) =>
      fileReplacer.traverseAstAndExtractLocales(n, jsxExpression)
    );

    jsxExpression.generateStrFromChildThenSet(node);
  }

  protected override generatingStrFromChildThenSet(node: ts.Expression) {
    this.newStr = this.concatVariable(0, 0);
  }

  public includeJsx = false;
}

export class Template extends Context {
  public static override handle(
    node: ts.TemplateExpression,
    parent: Context,
    replacer: FileReplacer
  ) {
    const template = new Template(
      replacer,
      node.getStart(),
      node.getEnd(),
      parent
    );
    ts.forEachChild(node, (n) =>
      replacer.traverseAstAndExtractLocales(n, template)
    );
    template.generateStrFromChildThenSet();
  }

  protected override generatingStrFromChildThenSet() {
    const { keyMapValue, str } = this.concatBlock('`'.length, '`'.length);
    if (!this.replacer.includesTargetLocale(str)) {
      this.newStr = this.concat(0, 0, (str: string) => '${' + str + '}');
      return;
    }
    this.needReplace = true;
    const textKey =
      this.replacer.bundleReplacer.getOrSetLocaleTextKeyIfAbsence(str);
    this.newStr = FileReplacer.localeMapToken(textKey, keyMapValue);
  }
}

export class TemplateExpression extends Context {
  protected override generatingStrFromChildThenSet() {
    this.newStr = this.concatVariable('${'.length, '}'.length);
  }

  public static handle(
    node: ts.TemplateSpan,
    parent: Context,
    replacer: FileReplacer
  ) {
    const first = node.getChildren()[0];
    const startSymbol = '${';
    const endSymbol = '}';
    const templateExpression = new TemplateExpression(
      replacer,
      replacer.file.lastIndexOf(startSymbol, node.getStart()),
      replacer.file.indexOf(endSymbol, first.getEnd()) + endSymbol.length,
      parent
    );
    ts.forEachChild(node, (n) =>
      replacer.traverseAstAndExtractLocales(n, templateExpression)
    );
    templateExpression.generateStrFromChildThenSet();
  }
}
