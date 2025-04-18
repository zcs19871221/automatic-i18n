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
        text: 'property name of object should be english, add configuration comments:  /* auto-i18n-ignore-next */ or /* auto-i18n-ignore-start */ or /* auto-i18n-ignore-end */ to ignore this warning',
        start: node.getStart(),
        end: node.getEnd(),
        info,
      });
    }

    const context: ReplaceContext[] = [];
    const intlIdMaybe = node.parent?.getChildAt(2)?.getText()?.slice(1, -1);
    // add missing defaultMessage e if the flag is on and has mapped message
    if (
      node.getText() === 'id' &&
      i18nReplacer.opt.addMissingDefaultMessage &&
      node.parent?.parent?.parent?.getText()?.includes('.formatMessage') &&
      !node.parent?.parent?.parent?.getText()?.includes('defaultMessage:') &&
      i18nReplacer.idMapDefaultMessage[intlIdMaybe] !== undefined
    ) {
      const codeBlock = node.parent.parent;
      const positionToInsert = codeBlock.getEnd() - 1;
      const defaultMessageToAppend = new ReplaceContext({
        start: positionToInsert,
        end: positionToInsert,
        info,
      });
      let newText = i18nReplacer.i18nFormatter.createDefaultMessageStr(
        i18nReplacer.i18nFormatter.escapeDefaultMessage(
          i18nReplacer.idMapDefaultMessage[intlIdMaybe]
        )
      );
      if (!codeBlock.getChildAt(1).getText().endsWith(',')) {
        newText = ',' + newText;
      }
      if (codeBlock.getChildAt(2).getFullText().match(/\s*\n/) === null) {
        newText = '\n' + newText;
      }

      defaultMessageToAppend.newText = newText;
      context.push(defaultMessageToAppend);
    }

    // replace the message key with the English abbreviation If there is an English translation, match key like `.formatMessage({id: key00001 `
    if (
      node.getText() === 'id' &&
      node.parent?.getChildren()[2]?.getText()?.includes('key') &&
      node.parent
        ?.getChildren()[2]
        ?.getText()
        ?.match(/(['"])((?:key\d+)|(?:key1[^'"]+__))['"]/) &&
      node.parent?.parent?.parent?.getText()?.includes('.formatMessage')
    ) {
      const keyNode = node.parent.getChildren()[2];
      const matched = keyNode
        .getText()
        .match(/(['"])((?:key\d+)|(?:key1[^'"]+__))['"]/)!;
      const newKey = i18nReplacer.getOldKeyMapNewKey()[matched[2]];
      if (!newKey) {
        return context;
      }
      const replaceKeyToMeaningKey = new ReplaceContext({
        start: keyNode.getStart(),
        end: keyNode.getEnd(),
        info,
      });
      replaceKeyToMeaningKey.newText =
        matched[1] + i18nReplacer.getOldKeyMapNewKey()[matched[2]] + matched[1];
      context.push(replaceKeyToMeaningKey);
    }

    return context;
  }
}
