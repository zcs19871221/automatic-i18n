import { Identifier } from 'typescript';
import { ReplaceContext } from './ReplaceContext';

export class OldKeyReplaceContext extends ReplaceContext {
  constructor(props: any) {
    super(props);
  }
  protected override joinChildrenMessage(): void {
    this.needReplace = true;
  }

  public static resolve(
    node: Identifier,
    fileContext: any,
    parent?: ReplaceContext
  ) {
    if (
      node.getText() === 'id' &&
      node.parent?.getChildren()?.[2]?.getText()?.includes('key') &&
      node?.parent?.parent?.parent?.getText()?.includes('.formatMessage')
    ) {
      const keyNode = node.parent.getChildren()[2];
      const matched = keyNode?.getText().match(/(['"])(key\d+)['"]/);
      if (!matched) {
        return;
      }
      const newKey = fileContext.i18nReplacer.getOldKeyMapNewKey()[matched[2]];
      if (!newKey) {
        return;
      }
      const replacer = new OldKeyReplaceContext({
        node: keyNode,
        start: keyNode.getStart(),
        end: keyNode.getEnd(),
        fileContext,
        parent,
      });
      replacer.content =
        matched[1] +
        fileContext.i18nReplacer.getOldKeyMapNewKey()[matched[2]] +
        matched[1];
      replacer.generateMessage();
    }
  }
}
