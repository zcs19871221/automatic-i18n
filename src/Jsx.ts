import { Node, SyntaxKind } from 'typescript';
import { FileReplacer, NodeHandler } from './FileReplacer';
import { Context } from './Context';

export class JsxHandler implements NodeHandler {
  match(node: Node): boolean {
    return [
      SyntaxKind.JsxElement,
      SyntaxKind.JsxFragment,
      SyntaxKind.JsxOpeningElement,
      SyntaxKind.JsxOpeningFragment,
      SyntaxKind.JsxClosingElement,
      SyntaxKind.JsxClosingFragment,
      SyntaxKind.JsxSelfClosingElement,
    ].includes(node.kind);
  }

  handle(
    node: Node,
    replacer: FileReplacer,
    parent?: Context | undefined
  ): void {
    const jsx = new Jsx({
      node,
      replacer,
      parent,
      start: node.getStart(),
      end: node.getEnd(),
    });
    if (parent) {
      Jsx.setParentJsxExpressionIncludeJsxFlag(parent);
    }
    if ([SyntaxKind.JsxElement, SyntaxKind.JsxFragment].includes(node.kind)) {
      jsx.jsxWrap = true;
    }
    jsx.doHandle();
  }
}

export class JsxExpressionHandler implements NodeHandler {
  match(node: Node): boolean {
    return SyntaxKind.JsxExpression === node.kind;
  }

  handle(
    node: Node,
    replacer: FileReplacer,
    parent?: Context | undefined
  ): void {
    const jsxExpression = new JsxExpression({
      node,
      replacer,
      parent,
      start: node.getStart(),
      end: node.getEnd(),
    });
    jsxExpression.doHandle();
  }
}

class JsxTagAndExpressionList extends Context {
  constructor(
    replacer: FileReplacer,
    start: number,
    end: number,
    childs: Context[]
  ) {
    super({ replacer, start, end });
    this.childs = childs;
  }

  protected override generatingStrFromChildThenSet() {
    const { str, keyMapValue } = this.joinChildsAsParamter(0, 0, (str) => {
      if (str.startsWith('{') && str.endsWith('}')) {
        return str.slice(1, str.length - 1);
      }
      return str;
    });

    if (!this.replacer.includesTargetLocale(str)) {
      this.str = this.joinChildsToString(0, 0);
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

    const intlId = this.replacer.getOrCreateIntlId(newStr);
    this.str =
      '{' +
      this.replacer.createIntlExpressionFromIntlId(intlId, keyMapValue) +
      '}';
  }
}

// childs：[开始标签,jsxExpression|jsx, 结束标签]
export class Jsx extends Context {
  public jsxWrap = false;

  public static setParentJsxExpressionIncludeJsxFlag(context: Context) {
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
  }

  protected override generatingStrFromChildThenSet(): void {
    if (this.jsxWrap) {
      const newChilds: Context[] = [];
      let block: Context[] = [];
      const createJsxList = (end: number, nextStart: number) => {
        if (start >= end) {
          return;
        }
        const jsxContextList = new JsxTagAndExpressionList(
          this.replacer,
          start,
          end,
          block
        );

        jsxContextList.generateStrFromChildThenSet();
        if (jsxContextList.str) {
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

    this.str = this.joinChildsToString(0, 0);
  }
}

export class JsxExpression extends Context {
  protected override generatingStrFromChildThenSet() {
    this.str = this.joinChildsToString(0, 0);
  }

  public includeJsx = false;
}
