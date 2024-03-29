import { FileReplacer } from '../FileReplacer';
import { TsNodeHandler } from './TsNodeHandler';
import { Context } from '../Context';
import { Node, SyntaxKind } from 'typescript';
import { Template } from '../Template';

export class TemplateExpressionHandler implements TsNodeHandler {
  match(node: Node): boolean {
    return node.kind === SyntaxKind.TemplateExpression;
  }

  handle(node: Node, replacer: FileReplacer, parent: Context): void {
    const template = new Template({
      node,
      replacer,
      start: node.getStart(),
      end: node.getEnd(),
      parent,
    });
    template.generateNewText();
  }
}
