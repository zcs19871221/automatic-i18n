import { SyntaxKind, forEachChild } from 'typescript';
import { Opt, TsNodeHandler, HandledOpt, handleNode } from './TsNodeHandler';
import { ReplaceContext } from '../ReplaceContext';

export class JsxExpressionHandler implements TsNodeHandler {
  match({ node }: Opt): boolean {
    return SyntaxKind.JsxExpression === node.kind;
  }

  handle({
    node,
    info,
    tsNodeHandlers,
    parentContext,
  }: HandledOpt): ReplaceContext {
    const jsxExpression = new ReplaceContext({
      start: node.getStart(),
      end: node.getEnd(),
      info,
    });
    forEachChild(node, (child) => {
      const newContext = handleNode({
        node: child,
        parentContext: jsxExpression,
        info,
        tsNodeHandlers,
      });
      if (newContext !== parentContext) {
        parentContext.children.push(newContext);
      }
    });

    jsxExpression.newText = jsxExpression.joinChildren();
    return jsxExpression;
  }
}
