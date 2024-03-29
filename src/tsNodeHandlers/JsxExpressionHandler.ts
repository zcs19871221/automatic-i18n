import { Node, SyntaxKind } from 'typescript';
import { FileReplacer } from '../FileReplacer';
import { TsNodeHandler } from './TsNodeHandler';
import { ReplaceContext, JsxExpressionContext } from '../replaceContexts';

export class JsxExpressionHandler implements TsNodeHandler {
  match(node: Node): boolean {
    return SyntaxKind.JsxExpression === node.kind;
  }

  handle(
    node: Node,
    replacer: FileReplacer,
    parent?: ReplaceContext | undefined
  ): void {
    const jsxExpression = new JsxExpressionContext({
      node,
      replacer,
      parent,
      start: node.getStart(),
      end: node.getEnd(),
    });
    jsxExpression.generateNewText();
  }
}
