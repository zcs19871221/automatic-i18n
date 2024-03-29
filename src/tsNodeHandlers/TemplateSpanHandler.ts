import { FileReplacer } from '../FileReplacer';
import { TsNodeHandler } from './TsNodeHandler';
import { ReplaceContext } from '../replaceContexts/ReplaceContext';
import { Node, SyntaxKind } from 'typescript';
import { TemplateExpression } from '../replaceContexts/TemplateExpressionContext';

export class TemplateSpanHandler implements TsNodeHandler {
  match(node: Node): boolean {
    return node.kind === SyntaxKind.TemplateSpan;
  }

  handle(node: Node, replacer: FileReplacer, parent: ReplaceContext): void {
    const first = node.getChildren()[0];

    const start = replacer.file.lastIndexOf(
      TemplateExpression.startSymbol,
      node.getStart()
    );
    const end =
      replacer.file.indexOf('}', first.getEnd()) +
      TemplateExpression.endSymbol.length;
    const templateExpression = new TemplateExpression({
      node,
      replacer,
      parent,
      start,
      end,
    });
    templateExpression.generateNewText();
  }
}
