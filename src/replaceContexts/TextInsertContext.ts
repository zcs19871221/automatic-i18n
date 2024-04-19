import { ReplaceContext } from './ReplaceContext';
import { FileContext } from './FileContext';

export class TextInsertContext extends ReplaceContext {
  constructor(
    start: number,
    end: number,
    fileContext: FileContext,
    private readonly newText: string
  ) {
    super({
      start,
      end,
      fileContext,
    });
  }

  public static addContext(
    start: number,
    end: number,
    fileContext: FileContext,
    newText: string
  ) {
    const context = new TextInsertContext(start, end, fileContext, newText);
    context.generateMessage();
    fileContext.addChildren(context);
  }

  protected override joinChildrenMessage(): void {
    this.content = this.newText;
    this.needReplace = true;
  }
}
