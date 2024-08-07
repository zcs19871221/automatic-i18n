import { SyntaxKind } from 'typescript';
import { Opt, TsNodeHandler, HandledOpt } from './TsNodeHandler';
import { ReplaceContext } from '../ReplaceContext';

export class JsxTextHandler implements TsNodeHandler {
  match({ node, info: { i18nReplacer } }: Opt): boolean {
    return (
      node.kind === SyntaxKind.JsxText &&
      i18nReplacer.includesTargetLocale(node.getText())
    );
  }

  handle({
    node,
    parentContext,
    info,
    info: { i18nReplacer },
  }: HandledOpt): ReplaceContext {
    const jsxText = new ReplaceContext({
      start: node.getStart(),
      end: node.getEnd(),
      info,
    });
    jsxText.newText = i18nReplacer.i18nFormatter.renderJsxText({
      node,
      defaultMessage: node.getText(),
      originStr: node.getText(),
      info,
      context: jsxText,
    });
    return jsxText;
  }
}
