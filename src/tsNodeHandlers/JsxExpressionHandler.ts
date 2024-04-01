import { Node, SyntaxKind } from 'typescript';
import { FileContext } from '../replaceContexts';
import { TsNodeHandler } from './TsNodeHandler';
import { ReplaceContext, JsxExpressionContext } from '../replaceContexts';

export class JsxExpressionHandler implements TsNodeHandler {
  match(node: Node): boolean {
    return SyntaxKind.JsxExpression === node.kind;
  }

  handle(
    node: Node,
    fileContext: FileContext,
    parent?: ReplaceContext | undefined
  ): void {
    const jsxExpression = new JsxExpressionContext({
      node,
      fileContext,
      parent,
      start: node.getStart(),
      end: node.getEnd(),
    });
    jsxExpression.generateNewText();
  }
}
