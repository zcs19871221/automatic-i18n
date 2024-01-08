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

class JsxVirutalBlock extends Context {
  protected override generatingStrFromChildThenSet() {
    const { str, keyMapValue } = this.concatBlock(0, 0);

    if (!this.replacer.includesTargetLocale(str)) {
      this.newStr = this.concat(0, 0, (str) => {
        if (str.startsWith('{') && str.endsWith('}')) {
          return str;
        }
        return '{' + str + '}';
      });
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
  public static override handle(
    node: any,
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
    const openingElement: any = node.openingElement || node.openingFragment;
    const closingElement: any = node.closingElement || node.closingFragment;
    fileReplacer.traverseAstAndExtractLocales(openingElement, context);
    const jsx = new Jsx({
      fileReplacer,
      openingStart: openingElement.getStart(),
      openingEnd: openingElement.getEnd(),
      closingEnd: closingElement.getEnd(),
      closingStart: closingElement.getStart(),
      parent: context,
    });

    node.children
      .filter((e: any) => e !== openingElement && e !== closingElement)
      .forEach((n: any) => {
        fileReplacer.traverseAstAndExtractLocales(n, jsx);
      });

    jsx.generateStrFromChildThenSet();
  }

  protected override generatingStrFromChildThenSet(): void {
    const newChilds: Context[] = [];
    let start = this.start;
    let block: Context[] = [];
    const addJsxVirtualBlock = (end: number, nextStart: number) => {
      if (start >= end) {
        return;
      }
      const virtualBlock = new JsxVirutalBlock(this.replacer, start, end, this);
      virtualBlock.childs.push(...block);
      virtualBlock.generateStrFromChildThenSet();
      if (virtualBlock.newStr) {
        newChilds.push(virtualBlock);
      }
      start = nextStart;
      block = [];
    };
    this.childs.forEach((c) => {
      if (c instanceof Jsx) {
        addJsxVirtualBlock(c.openingStart, c.closingEnd);
        newChilds.push(c);
        return;
      }

      if (c instanceof JsxExpression && c.includeJsx) {
        addJsxVirtualBlock(c.start, c.end);
        if (c.newStr) {
          c.newStr = '{' + c.newStr + '}';
          newChilds.push(c);
        }
        return;
      }

      block.push(c);
    });
    addJsxVirtualBlock(this.end, -1);
    this.childs = newChilds;

    this.newStr = this.concatVariable(0, 0);
  }

  constructor(opt: {
    openingStart: number;
    openingEnd: number;
    closingStart: number;
    closingEnd: number;
    fileReplacer: FileReplacer;
    parent: Context;
  }) {
    super(opt.fileReplacer, opt.openingEnd, opt.closingStart, opt.parent);
    this.openingStart = opt.openingStart;
    this.closingEnd = opt.closingEnd;
  }

  private openingStart: number;
  private closingEnd: number;
}

export class JsxExpression extends Context {
  public static override handle(
    node: ts.JsxExpression,
    parent: Context,
    fileReplacer: FileReplacer
  ) {
    if (node.parent.kind === SyntaxKind.JsxAttribute) {
      parent = fileReplacer.rootContext;
    }
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
    this.newStr = this.concatVariable('{'.length, '}'.length);
    if (node.parent.kind === SyntaxKind.JsxAttribute) {
      this.newStr = '{' + this.newStr + '}';
    }
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
