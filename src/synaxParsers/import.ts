import { Node, SyntaxKind, ImportDeclaration } from 'typescript';
import { Parser } from './parser';
import { FileReplacer } from '../FileReplacer';

export class ImportParser implements Parser {
  constructor(private readonly replacer: FileReplacer) {}
  match(node: Node): boolean {
    return node.kind === SyntaxKind.ImportDeclaration;
  }

  parse(importNode: ImportDeclaration): void {
    if (
      importNode.moduleSpecifier.getText().includes(this.opt.importPath) &&
      importNode.importClause?.getText().includes(FileReplacer.exportName)
    ) {
      this.replacer.hasImportedI18nModules = true;
    }
  }
}
