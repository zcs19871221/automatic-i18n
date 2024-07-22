import {
  FunctionDeclaration,
  Node,
  SyntaxKind,
  VariableDeclaration,
} from 'typescript';
import { ReplaceContext } from './ReplaceContext';
import { FileContext } from './FileContext';

export class HookInsertFunctionContext extends ReplaceContext {
  constructor(node: Node, fileContext: FileContext) {
    super({
      start: node.getStart() + 1,
      end: node.getStart() + 1,
      fileContext,
    });
  }

  public static getComponent(node: Node) {
    let blockNode: Node | null = null;
    const componentNameReg = /^[A-Z]/;
    while (node) {
      if (
        node.kind === SyntaxKind.Block &&
        node.parent?.kind === SyntaxKind.FunctionDeclaration &&
        (node.parent as FunctionDeclaration).name?.escapedText?.match(
          componentNameReg
        )
      ) {
        blockNode = node;
        break;
      }
      if (
        (node.kind === SyntaxKind.Block ||
          node.kind === SyntaxKind.ParenthesizedExpression) &&
        node.parent?.kind === SyntaxKind.ArrowFunction &&
        node.parent.parent?.kind === SyntaxKind.VariableDeclaration &&
        (node.parent.parent as VariableDeclaration).name
          .getText()
          .match(componentNameReg)
      ) {
        blockNode = node;
        break;
      }
      node = node.parent;
    }
    return blockNode;
  }

  protected override joinChildrenMessage(): void {
    this.content = '\nconst intl = useIntl()\n';
    this.needReplace = true;
  }
}
