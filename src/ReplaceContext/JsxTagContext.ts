import { JsxChildContext } from './JsxChildContext';
import { ReplaceContext } from './ReplaceContext';
import { JsxExpressionContext } from './JsxExpressionContext';

export class JsxTagContext extends ReplaceContext {
  public jsxWrap = false;

  public static setParentJsxExpressionIncludeJsxFlag(context: ReplaceContext) {
    let jsxExpressionParent: ReplaceContext | null = context;
    while (
      jsxExpressionParent !== null &&
      !(jsxExpressionParent instanceof JsxExpressionContext)
    ) {
      jsxExpressionParent = jsxExpressionParent.parent || null;
    }

    if (jsxExpressionParent instanceof JsxExpressionContext) {
      jsxExpressionParent.includeJsx = true;
    }
  }

  protected override generatingStrFromChildThenSet(): void {
    if (this.jsxWrap) {
      const newChildren: ReplaceContext[] = [];
      let block: ReplaceContext[] = [];
      const createJsxList = (end: number, nextStart: number) => {
        if (start >= end) {
          return;
        }
        const jsxContextList = new JsxChildContext(
          this.replacer,
          start,
          end,
          block
        );

        jsxContextList.generateStrFromChildThenSet();
        if (jsxContextList.replacedText) {
          newChildren.push(jsxContextList);
        }
        start = nextStart;
        block = [];
      };
      let start = this.children[0].end;
      newChildren.push(this.children[0]);
      for (let i = 1; i < this.children.length - 1; i++) {
        const c = this.children[i];
        if (
          c instanceof JsxTagContext ||
          (c instanceof JsxExpressionContext && c.includeJsx)
        ) {
          createJsxList(c.start, c.end);
          newChildren.push(c);
          continue;
        }

        block.push(c);
      }

      createJsxList(this.children[this.children.length - 1].start, -1);
      newChildren.push(this.children[this.children.length - 1]);
      this.children = newChildren;
    }

    this.replacedText = this.joinChildren(0, 0);
  }
}
