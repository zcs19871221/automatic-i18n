import { Node, SyntaxKind } from 'typescript';
import { FileContext } from '../replaceContexts';
import { TsNodeHandler } from './TsNodeHandler';
import { ReplaceContext } from '../replaceContexts';
import { JsxTextContext } from '../replaceContexts/JsxTextContext';

export class JsxTextHandler implements TsNodeHandler {
  match(node: Node, context: FileContext): boolean {
    return (
      node.kind === SyntaxKind.JsxText &&
      context.i18nReplacer.includesTargetLocale(node.getText())
    );
  }

  handle(
    node: Node,
    fileContext: FileContext,
    parent?: ReplaceContext | undefined
  ): void {
    const jsx = new JsxTextContext({
      node,
      fileContext,
      parent,
      start: node.getStart(),
      end: node.getEnd(),
    });
    jsx.generateMessage();
  }
}
