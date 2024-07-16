import { Node } from 'typescript';
import { SyntaxKind } from 'typescript';
import { TsNodeHandler } from './TsNodeHandler';
import {
  FileContext,
  ReplaceContext,
  OldKeyReplaceContext,
} from '../replaceContexts';

export class IdentifierHandler implements TsNodeHandler {
  match(node: Node): boolean {
    return node.kind === SyntaxKind.Identifier;
  }

  handle(
    node: Node,
    fileContext: FileContext,
    parent?: ReplaceContext | undefined
  ): void {
    if (
      fileContext.i18nReplacer.opt.localeToReplace !== 'en-us' &&
      fileContext.i18nReplacer.includesTargetLocale(node.getText()) &&
      !fileContext.i18nReplacer.ignore(node)
    ) {
      fileContext.i18nReplacer.addWarning({
        text: 'property name of object should be english',
        start: node.getStart(),
        end: node.getEnd(),
        fileContext,
      });
    }

    OldKeyReplaceContext.resolve(node as any, fileContext, parent);
  }
}
