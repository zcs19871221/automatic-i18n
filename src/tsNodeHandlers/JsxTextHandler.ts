import { SyntaxKind } from 'typescript';
import { HandlerOption, TsNodeHandler } from './TsNodeHandler';
import { ReplaceContext } from '../ReplaceContext';

export class JsxTextHandler implements TsNodeHandler {
  match({ node, info: { i18nReplacer } }: HandlerOption): boolean {
    return (
      node.kind === SyntaxKind.JsxText &&
      i18nReplacer.includesTargetLocale(node.getText())
    );
  }

  handle({
    node,
    info,
    info: { i18nReplacer, file },
  }: HandlerOption): ReplaceContext[] {
    let start = node.getStart();
    let end = node.getEnd();
    node
      .getText()
      .replace(/^[\s\n]+/, (match: string) => {
        // istanbul ignore next
        start += match.length;
        // istanbul ignore next
        return '';
      })
      .replace(/[\s\n]+$/, (match: string) => {
        end -= match.length;
        return '';
      });

    const jsxText = new ReplaceContext({
      start,
      end,
      info,
    });
    jsxText.newText = i18nReplacer.i18nFormatter.renderJsxText({
      node,
      defaultMessage: file.slice(start, end),
      originStr: node.getText(),
      info,
      context: jsxText,
    });
    return [jsxText];
  }
}
