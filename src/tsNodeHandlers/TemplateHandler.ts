import { FileContext } from '../replaceContexts';
import { TsNodeHandler } from './TsNodeHandler';
import { ReplaceContext, TemplateStringContext } from '../replaceContexts';
import { Node, SyntaxKind } from 'typescript';

export class TemplateExpressionHandler implements TsNodeHandler {
  match(node: Node): boolean {
    return node.kind === SyntaxKind.TemplateExpression;
  }

  handle(node: Node, fileContext: FileContext, parent: ReplaceContext): void {
    const template = new TemplateStringContext({
      node,
      fileContext,
      start: node.getStart(),
      end: node.getEnd(),
      parent,
    });
    template.generateMessage();
  }
}
