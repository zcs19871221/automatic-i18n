import ts, {
  BinaryExpression,
  Node,
  PropertyAccessExpression,
  SyntaxKind,
} from 'typescript';
import { ReplaceContext } from '../ReplaceContext/ReplaceContext';
import { FileReplacer } from '../FileReplacer';
import { TsNodeHandler } from './TsNodeHandler';
import { StringLiteralContext } from '../ReplaceContext/StringLiteralContext';

export class StringLikeNodesHandler implements TsNodeHandler {
  match(node: Node, replacer: FileReplacer): boolean {
    if (
      ![SyntaxKind.StringLiteral, SyntaxKind.FirstTemplateToken].includes(
        node.kind
      )
    ) {
      return false;
    }
    if (!replacer.includesTargetLocale(node.getText())) {
      return false;
    }
    if (node.parent?.kind === ts.SyntaxKind.ImportDeclaration) {
      return false;
    }
    if (node.kind === SyntaxKind.StringLiteral) {
      if (replacer.ignore(node)) {
        return false;
      }

      if (
        this.stringLiteralIsInEqualBlock(node) ||
        this.stringLiteralIsChildOfIncludeBlock(node)
      ) {
        replacer.addWarningInfo({
          text:
            'do not use locale literal to do [===] or [includes], maybe an error! use /* ' +
            FileReplacer.ignoreWarningKey +
            ' */ before text to ignore warning or refactor code!',
          start: node.getStart(),
          end: node.getEnd(),
        });
        return false;
      }
    }

    return true;
  }

  handle(node: Node, replacer: FileReplacer, parent: ReplaceContext) {
    const stringLiteral = new StringLiteralContext({
      node,
      start: node.getStart(),
      end: node.getEnd(),
      replacer,
      parent,
    });
    stringLiteral.needReplace = true;
    stringLiteral.generateNewText();
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
