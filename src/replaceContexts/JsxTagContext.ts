import { JsxChildContext } from './JsxChildContext';
import { ReplaceContext } from './ReplaceContext';
import { JsxExpressionContext } from './JsxExpressionContext';
import { JsxTextContext } from './JsxTextContext';

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

  protected override joinChildrenMessage(): void {
    const newChildren: ReplaceContext[] = [...this.children];
    for (let i = 0; i < this.children.length; ) {
      const c = this.children[i];
      if (!(c instanceof JsxTextContext)) {
        i++;
        continue;
      }

      const siblingNodes = c.getNode()?.parent.getChildren();
      const indexInNodes = siblingNodes?.indexOf(c.getNode()!) ?? -1;
      if (!siblingNodes || indexInNodes == -1) {
        continue;
      }
      let prevCount = 1;
      const blocks: ReplaceContext[] = [];
      while (
        i - prevCount >= 0 &&
        siblingNodes[indexInNodes - prevCount] ===
          this.children[i - prevCount].getNode() &&
        this.children[i - prevCount] instanceof JsxExpressionContext
      ) {
        blocks.unshift(this.children[i - prevCount]);
        prevCount++;
      }
      let afterCount = 1;
      while (
        i + afterCount < this.children.length &&
        siblingNodes[indexInNodes + afterCount] ===
          this.children[i + afterCount].getNode() &&
        this.children[i + afterCount] instanceof JsxExpressionContext
      ) {
        blocks.push(this.children[i + afterCount]);
        afterCount++;
      }
      i += afterCount;
      if (blocks.length === 0) {
        continue;
      }
      const mergedContext = new JsxChildContext(
        this.fileContext,
        blocks[0].start,
        blocks[blocks.length - 1].end,
        blocks
      );
      mergedContext.generateMessage();

      blocks.forEach((block) => {
        newChildren.splice(newChildren.indexOf(block), 1);
      });
      newChildren.splice(newChildren.indexOf(c), 1, mergedContext);
    }

    this.children = newChildren;
    this.content = this.joinChildren(0, 0);
  }
}
