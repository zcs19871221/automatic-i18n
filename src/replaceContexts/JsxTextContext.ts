import { ReplaceContext } from './ReplaceContext';

export class JsxTextContext extends ReplaceContext {
  protected override joinChildrenMessage(): void {
    this.content = this.i18nReplacer.i18nFormatter.format(this, {
      defaultMessage: this.node?.getText()!,
      originStr: this.node?.getText()!,
    });
  }
}
