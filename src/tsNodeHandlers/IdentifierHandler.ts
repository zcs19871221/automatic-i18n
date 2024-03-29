import { Node } from 'typescript';
import { SyntaxKind } from 'typescript';
import { TsNodeHandler } from './TsNodeHandler';
import { FileReplacer } from '../FileReplacer';

export class IdentifierHandler implements TsNodeHandler {
  match(node: Node): boolean {
    return node.kind === SyntaxKind.Identifier;
  }

  handle(node: Node, replacer: FileReplacer): void {
    if (
      replacer.opt.localeToReplace !== 'en-us' &&
      replacer.includesTargetLocale(node.getText()) &&
      !replacer.ignore(node)
    ) {
      replacer.addWarningInfo({
        text: 'property name of object should be english',
        start: node.getStart(),
        end: node.getEnd(),
      });
    }
  }
}
