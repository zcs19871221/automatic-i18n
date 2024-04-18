import { Node } from 'typescript';
import { FileContext } from './FileContext';
import { ReplaceContext } from './ReplaceContext';

export interface Opt {
  node: Node;
  parent?: ReplaceContext;
  fileContext: FileContext;
}

export class NewImportContext extends ReplaceContext {
  constructor(
    fileContext: FileContext,
    private readonly imports: { moduleName: string; names: Set<string> }[]
  ) {
    const tsUncheckCommentMatched = fileContext.file.match(
      /(\n|^)\/\/\s*@ts-nocheck[^\n]*\n/
    );
    const insertIndex =
      tsUncheckCommentMatched === null
        ? 0
        : (tsUncheckCommentMatched.index ?? 0) +
          tsUncheckCommentMatched[0].length;
    super({
      start: insertIndex,
      end: insertIndex,
      fileContext,
    });
  }

  protected joinChildrenMessage(): void {
    let newText = '';
    this.imports.forEach(({ moduleName, names }) => {
      newText += `import { ${[...names].join(', ')} } from '${moduleName}'\n`;
    });
    this.needReplace = true;
    this.content = newText;
  }
}
