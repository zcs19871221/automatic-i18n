import { Node, SyntaxKind } from 'typescript';
import { FileReplacer } from '../FileReplacer';
import { TsNodeHandler } from './TsNodeHandler';
import { Context } from '../Context';
import { Jsx } from '../Jsx';

export class JsxTagHandler implements TsNodeHandler {
  match(node: Node): boolean {
    return [
      SyntaxKind.JsxElement,
      SyntaxKind.JsxFragment,
      SyntaxKind.JsxOpeningElement,
      SyntaxKind.JsxOpeningFragment,
      SyntaxKind.JsxClosingElement,
      SyntaxKind.JsxClosingFragment,
      SyntaxKind.JsxSelfClosingElement,
    ].includes(node.kind);
  }

  handle(
    node: Node,
    replacer: FileReplacer,
    parent?: Context | undefined
  ): void {
    const jsx = new Jsx({
      node,
      replacer,
      parent,
      start: node.getStart(),
      end: node.getEnd(),
    });
    if (parent) {
      Jsx.setParentJsxExpressionIncludeJsxFlag(parent);
    }
    if ([SyntaxKind.JsxElement, SyntaxKind.JsxFragment].includes(node.kind)) {
      jsx.jsxWrap = true;
    }
    jsx.generateNewText();
  }
}
