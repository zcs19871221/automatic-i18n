import ts, {
  BinaryExpression,
  Node,
  PropertyAccessExpression,
  SyntaxKind,
} from 'typescript';
import { ReplaceContext, StringLiteralContext } from '../replaceContexts';
import { FileContext } from '../replaceContexts';
import { TsNodeHandler } from './TsNodeHandler';

export class StringLikeNodesHandler implements TsNodeHandler {
  match(node: Node, fileContext: FileContext): boolean {
    if (
      ![SyntaxKind.StringLiteral, SyntaxKind.FirstTemplateToken].includes(
        node.kind
      )
    ) {
      return false;
    }
    if (!fileContext.i18nReplacer.includesTargetLocale(node.getText())) {
      return false;
    }
    if (node.parent?.kind === ts.SyntaxKind.ImportDeclaration) {
      return false;
    }
    if (node.kind === SyntaxKind.StringLiteral) {
      if (fileContext.i18nReplacer.ignore(node)) {
        return false;
      }

      if (
        this.stringLiteralIsInEqualBlock(node) ||
        this.stringLiteralIsChildOfIncludeBlock(node)
      ) {
        fileContext.i18nReplacer.addWarning({
          text:
            'do not use locale literal to do [===] or [includes], maybe an error! use /* ' +
            fileContext.i18nReplacer.getIgnoreComment() +
            ' */ before text to ignore warning or refactor code!',
          start: node.getStart(),
          end: node.getEnd(),
          fileContext,
        });
        return false;
      }
    }

    if (
      node.parent?.kind === SyntaxKind.PropertyAssignment &&
      node.parent.getText().includes('defaultMessage: ' + node.getText()) &&
      node.parent?.parent?.parent?.getText()?.includes('formatMessage({')
    ) {
      return false;
    }
    if (
      node.parent?.kind === SyntaxKind.JsxAttribute &&
      node.parent.getText().includes('defaultMessage=' + node.getText()) &&
      node.parent?.parent?.parent?.getText()?.includes('<FormattedMessage')
    ) {
      return false;
    }

    return true;
  }

  handle(node: Node, fileContext: FileContext, parent: ReplaceContext) {
    const stringLiteral = new StringLiteralContext({
      node,
      start: node.getStart(),
      end: node.getEnd(),
      fileContext,
      parent,
    });
    stringLiteral.needReplace = true;
    stringLiteral.generateMessage();
  }

  private stringLiteralIsChildOfIncludeBlock(node: Node) {
    if (
      node.parent?.kind === SyntaxKind.ArrayLiteralExpression &&
      node.parent?.parent?.kind === SyntaxKind.PropertyAccessExpression
    ) {
      const name = (node.parent?.parent as PropertyAccessExpression)?.name;
      return name.getText() === 'includes';
    }
    return false;
  }

  private stringLiteralIsInEqualBlock(node: Node) {
    if (node.parent?.kind === SyntaxKind.BinaryExpression) {
      const expression = node.parent as BinaryExpression;

      return (
        expression.operatorToken.kind === SyntaxKind.EqualsEqualsToken ||
        expression.operatorToken.kind === SyntaxKind.EqualsEqualsEqualsToken
      );
    }
    return false;
  }
}
