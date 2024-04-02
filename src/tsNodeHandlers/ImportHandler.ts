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
    fileContext.addRequiredImports;
    fileContext.addImportNode(importNode);
  }
}
