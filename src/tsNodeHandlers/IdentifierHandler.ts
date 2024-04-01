import { Node } from 'typescript';
import { SyntaxKind } from 'typescript';
import { TsNodeHandler } from './TsNodeHandler';
import { FileContext } from '../replaceContexts';

export class IdentifierHandler implements TsNodeHandler {
  match(node: Node): boolean {
    return node.kind === SyntaxKind.Identifier;
  }

  handle(node: Node, fileContext: FileContext): void {
    if (
      fileContext.bundleReplacer.opt.localeToReplace !== 'en-us' &&
      fileContext.bundleReplacer.includesTargetLocale(node.getText()) &&
      !fileContext.bundleReplacer.ignore(node)
    ) {
      fileContext.bundleReplacer.addWarningInfo({
        text: 'property name of object should be english',
        start: node.getStart(),
        end: node.getEnd(),
        fileContext,
      });
    }
  }
}
