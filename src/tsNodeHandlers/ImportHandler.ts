import { ImportDeclaration, SyntaxKind } from 'typescript';
import { Opt, TsNodeHandler } from './TsNodeHandler';
import { ReplaceContext } from '../ReplaceContext';

export class ImportHandler implements TsNodeHandler {
  match({ node }: Opt): boolean {
    return node.kind === SyntaxKind.ImportDeclaration;
  }

  handle({ node, info, parentContext }: Opt): ReplaceContext {
    const importNode = node as ImportDeclaration;
    info.imports.add(importNode);
    return parentContext;
  }
}
