import { SyntaxKind } from 'typescript';
import { ReplaceContext } from '../ReplaceContext';
import { TsNodeHandler, HandlerOption } from './TsNodeHandler';

export class FormateMessageIdHandler implements TsNodeHandler {
  match({ node, info: { i18nReplacer } }: HandlerOption): boolean {
    if (
      i18nReplacer.opt.meaningKey &&
      node.kind === SyntaxKind.StringLiteral &&
      node.parent?.kind === SyntaxKind.JsxAttribute &&
      node.parent?.getText()?.match(/id=["']key\d+/) !== null &&
      node.parent?.parent?.parent?.getText().startsWith('<FormattedMessage')
    ) {
      return true;
    }
    return false;
  }

  handle({
    node,
    info: { i18nReplacer },
    info,
  }: HandlerOption): ReplaceContext[] {
    const replaceKeyToMeaningKey = new ReplaceContext({
      start: node.getStart() + 1,
      end: node.getEnd() - 1,
      info,
    });
    const matched = node.getText().match(/(key\d+)/)!;

    replaceKeyToMeaningKey.newText =
      i18nReplacer.getOldKeyMapNewKey()[matched[1]];
    return [replaceKeyToMeaningKey];
  }
}
