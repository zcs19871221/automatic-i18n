import { FileReplacer } from '../FileReplacer';
import { TsNodeHandler } from './TsNodeHandler';
import { ReplaceContext, TemplateExpressionContext } from '../replaceContexts';
import { Node, SyntaxKind } from 'typescript';
export class TemplateSpanHandler implements TsNodeHandler {
  match(node: Node): boolean {
    return node.kind === SyntaxKind.TemplateSpan;
  }

  handle(node: Node, replacer: FileReplacer, parent: ReplaceContext): void {
    const first = node.getChildren()[0];

    const start = replacer.file.lastIndexOf(
      TemplateExpressionContext.startSymbol,
      node.getStart()
    );
    const end =
      replacer.file.indexOf('}', first.getEnd()) +
      TemplateExpressionContext.endSymbol.length;
    const templateExpression = new TemplateExpressionContext({
      node,
      replacer,
      parent,
      start,
      end,
    });
    templateExpression.generateNewText();
  }
}
