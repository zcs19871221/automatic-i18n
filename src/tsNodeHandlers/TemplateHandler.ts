import { FileReplacer } from '../FileReplacer';
import { TsNodeHandler } from './TsNodeHandler';
import { ReplaceContext } from '../ReplaceContext/ReplaceContext';
import { Node, SyntaxKind } from 'typescript';
import { TemplateStringContext } from '../ReplaceContext/TemplateStringContext';

export class TemplateExpressionHandler implements TsNodeHandler {
  match(node: Node): boolean {
    return node.kind === SyntaxKind.TemplateExpression;
  }

  handle(node: Node, replacer: FileReplacer, parent: ReplaceContext): void {
    const template = new TemplateStringContext({
      node,
      replacer,
      start: node.getStart(),
      end: node.getEnd(),
      parent,
    });
    template.generateNewText();
  }
}
