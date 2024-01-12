import { SyntaxKind } from 'typescript';
import { FileReplacer } from './FileReplacer';
import { Context, NodeHandler, Opt } from './context';

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
    const { str, keyMapValue } = this.joinChildsAsParamter(0, 0);

    if (!this.replacer.includesTargetLocale(str)) {
      this.newStr = this.joinChildsToString(0, 0);
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

// childs：[开始标签,jsxExpression|jsx, 结束标签]
export class Jsx extends NodeHandler {
  public static override of(opt: Opt) {
    const context = new Jsx({
      ...opt,
      start: opt.node.getStart(),
      end: opt.node.getEnd(),
    });
    if (opt.parent) {
      Jsx.setParentJsxExpressionIncludeJsxFlag(opt.parent);
    }
    if (
      [SyntaxKind.JsxElement, SyntaxKind.JsxFragment].includes(opt.node.kind)
    ) {
      context.jsxWrap = true;
    }
    return context;
  }

  private jsxWrap = false;

  private static setParentJsxExpressionIncludeJsxFlag(context: Context) {
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

    this.newStr = this.joinChildsToString(0, 0);
  }
}

export class JsxExpression extends NodeHandler {
  public static override of(opt: Opt) {
    return new JsxExpression({
      ...opt,
      start: opt.node.getStart(),
      end: opt.node.getEnd(),
    });
  }

  protected override generatingStrFromChildThenSet() {
    this.newStr = this.joinChildsToString(0, 0);
  }

  public includeJsx = false;
}
