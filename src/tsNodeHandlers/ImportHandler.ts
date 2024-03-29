import { Node } from 'typescript';
import { ImportDeclaration, SyntaxKind } from 'typescript';
import { TsNodeHandler } from './TsNodeHandler';
import { FileReplacer } from '../FileReplacer';

export class ImportHandler implements TsNodeHandler {
  match(node: Node): boolean {
    return node.kind === SyntaxKind.ImportDeclaration;
  }

  handle(node: Node, replacer: FileReplacer): void {
    const importNode = node as ImportDeclaration;
    if (
      importNode.moduleSpecifier.getText().includes(replacer.opt.importPath) &&
      importNode.importClause
        ?.getText()
        .includes(replacer.bundleReplacer.exportName)
    ) {
      replacer.hasImportedI18nModules = true;
    }
  }
}
