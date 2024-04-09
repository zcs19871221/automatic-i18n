import { FileContext } from '../replaceContexts';
import { TsNodeHandler } from './TsNodeHandler';
import { ReplaceContext, TemplateExpressionContext } from '../replaceContexts';
import { Node, SyntaxKind } from 'typescript';
export class TemplateSpanHandler implements TsNodeHandler {
  match(node: Node): boolean {
    return node.kind === SyntaxKind.TemplateSpan;
  }

  handle(node: Node, fileContext: FileContext, parent: ReplaceContext): void {
    const first = node.getChildren()[0];

    const start = fileContext.file.lastIndexOf(
      TemplateExpressionContext.startSymbol,
      node.getStart()
    );
    const end =
      fileContext.file.indexOf('}', first.getEnd()) +
      TemplateExpressionContext.endSymbol.length;
    const templateExpression = new TemplateExpressionContext({
      node,
      fileContext,
      parent,
      start,
      end,
    });
    templateExpression.generateMessage();
  }
}
