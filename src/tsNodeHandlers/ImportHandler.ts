import { Node } from 'typescript';
import { ImportDeclaration, SyntaxKind } from 'typescript';
import { TsNodeHandler } from './TsNodeHandler';
import { FileContext } from '../replaceContexts';

export class ImportHandler implements TsNodeHandler {
  match(node: Node): boolean {
    return node.kind === SyntaxKind.ImportDeclaration;
  }

  handle(node: Node, fileContext: FileContext): void {
    const importNode = node as ImportDeclaration;
    if (
      importNode.moduleSpecifier
        .getText()
        .includes(fileContext.bundleReplacer.opt.importPath) &&
      importNode.importClause
        ?.getText()
        .includes(fileContext.bundleReplacer.exportName)
    ) {
      fileContext.hasImportedI18nModules = true;
    }
  }
}
