import { Node, SyntaxKind } from 'typescript';
import { FileContext } from '../replaceContexts';
import { TsNodeHandler } from './TsNodeHandler';
import { ReplaceContext, JsxTagContext } from '../replaceContexts';

export class JsxTagHandler implements TsNodeHandler {
  match(node: Node): boolean {
    return [SyntaxKind.JsxElement, SyntaxKind.JsxFragment].includes(node.kind);
  }

  handle(
    node: Node,
    fileContext: FileContext,
    parent?: ReplaceContext | undefined
  ): void {
    const jsx = new JsxTagContext({
      node,
      fileContext,
      parent,
      start: node.getStart(),
      end: node.getEnd(),
    });
    jsx.generateMessage();
  }
}
