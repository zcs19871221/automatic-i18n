import { SyntaxKind } from 'typescript';
import { HandlerOption, TsNodeHandler } from './TsNodeHandler';
import { ReplaceContext } from '../ReplaceContext';

export class IdentifierHandler implements TsNodeHandler {
  match(opt: HandlerOption): boolean {
    return opt.node.kind === SyntaxKind.Identifier;
  }

  handle({
    node,
    info,
    info: { i18nReplacer },
  }: HandlerOption): ReplaceContext[] {
    // add warning message if user use non-English text as object property name
    if (
      i18nReplacer.opt.localeToReplace !== 'en-us' &&
      i18nReplacer.includesTargetLocale(node.getText()) &&
      !i18nReplacer.ignore(node)
    ) {
      i18nReplacer.addWarning({
        text: 'property name of object should be english',
        start: node.getStart(),
        end: node.getEnd(),
        info,
      });
    }

    // replace the message key with the English abbreviation If there is an English translation, match key like `.formatMessage({id: key00001 `
    if (
      node.getText() === 'id' &&
      node.parent?.getChildren()?.[2]?.getText().includes('key') &&
      node.parent?.parent?.parent?.getText().includes('.formatMessage')
    ) {
      const keyNode = node.parent.getChildren()[2];
      const matched = keyNode?.getText().match(/(['"])(key\d+)['"]/);
      if (!matched) {
        return [];
      }
      const newKey = i18nReplacer.getOldKeyMapNewKey()[matched[2]];
      if (!newKey) {
        return [];
      }
      const replaceKeyToMeaningKey = new ReplaceContext({
        start: keyNode.getStart(),
        end: keyNode.getEnd(),
        info,
      });
      replaceKeyToMeaningKey.newText =
        matched[1] + i18nReplacer.getOldKeyMapNewKey()[matched[2]] + matched[1];
      return [replaceKeyToMeaningKey];
    }

    return [];
  }
}
