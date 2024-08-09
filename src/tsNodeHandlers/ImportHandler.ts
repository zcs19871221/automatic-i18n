import { ImportDeclaration, SyntaxKind } from 'typescript';
import { HandlerOption, TsNodeHandler } from './TsNodeHandler';
import { ReplaceContext } from '../ReplaceContext';

export class ImportHandler implements TsNodeHandler {
  match({ node }: HandlerOption): boolean {
    return node.kind === SyntaxKind.ImportDeclaration;
  }

  handle({ node, info }: HandlerOption): ReplaceContext[] {
    const importNode = node as ImportDeclaration;
    info.imports.add(importNode);
    return [];
  }
}
