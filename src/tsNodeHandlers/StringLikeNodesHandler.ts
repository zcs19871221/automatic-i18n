import {
  BinaryExpression,
  Node,
  PropertyAccessExpression,
  SyntaxKind,
  isTypeNode,
} from 'typescript';
import { ReplaceContext } from '../ReplaceContext';
import { Opt, TsNodeHandler, HandledOpt } from './TsNodeHandler';

export class StringLikeNodesHandler implements TsNodeHandler {
  match({ node, info, info: { i18nReplacer } }: Opt): boolean {
    if (
      ![SyntaxKind.StringLiteral, SyntaxKind.FirstTemplateToken].includes(
        node.kind
      )
    ) {
      return false;
    }

    if (!i18nReplacer.includesTargetLocale(node.getText())) {
      return false;
    }
    if (node.parent?.kind === SyntaxKind.ImportDeclaration) {
      return false;
    }

    if (isTypeNode(node) || isTypeNode(node.parent)) {
      return false;
    }

    if (node.kind === SyntaxKind.StringLiteral) {
      if (i18nReplacer.ignore(node)) {
        return false;
      }

      if (
        this.stringLiteralIsInEqualBlock(node) ||
        this.stringLiteralIsChildOfIncludeBlock(node)
      ) {
        i18nReplacer.addWarning({
          text:
            'do not use locale literal to do [===] or [includes], maybe an error! use /* ' +
            i18nReplacer.getIgnoreComment() +
            ' */ before text to ignore warning or refactor code!',
          start: node.getStart(),
          end: node.getEnd(),
          info,
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

    if (node.parent?.getText()?.match(/^id=/)) {
      return false;
    }
    return true;
  }

  handle({
    node,
    info: { i18nReplacer },
    parentContext,
    info,
  }: HandledOpt): ReplaceContext {
    const stringLiteral = new ReplaceContext({
      start: node.getStart(),
      end: node.getEnd(),
      info,
    });

    const originStr = this.removeTextVariableSymbol(node.getText());

    let newText = i18nReplacer.i18nFormatter.renderStringLike({
      defaultMessage: originStr,
      originStr: node!.getText(),
      context: stringLiteral,
      info,
      node,
    });

    if (node.parent.kind === SyntaxKind.JsxAttribute) {
      newText = '{' + newText + '}';
    }

    stringLiteral.newText = newText;
    return stringLiteral;
  }

  private removeTextVariableSymbol(text: string) {
    return text.replace(/^['"`]/, '').replace(/['"`]$/, '');
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
