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
      fileContext.i18nReplacer.opt.localeToReplace !== 'en-us' &&
      fileContext.i18nReplacer.includesTargetLocale(node.getText()) &&
      !fileContext.i18nReplacer.ignore(node)
    ) {
      fileContext.i18nReplacer.addWarningInfo({
        text: 'property name of object should be english',
        start: node.getStart(),
        end: node.getEnd(),
        fileContext,
      });
    }
  }
}
