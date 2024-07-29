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
    private readonly importInfo: { moduleName: string; names: Set<string> }
  ) {
    const tsUncheckCommentMatched = fileContext.file.match(
      /(\n|^)\/\/\s*@ts-nocheck[^\n]*\n/
    );
    let firstNonRelativeImport = 0;
    if (importInfo.moduleName.startsWith('.')) {
      firstNonRelativeImport =
        [...fileContext.getImportNode()]
          .reverse()
          .find((i) => !i.importClause?.getText()?.startsWith('.'))?.end ?? 0;
    }

    const tsNocheckIndex = tsUncheckCommentMatched
      ? (tsUncheckCommentMatched.index ?? 0) + tsUncheckCommentMatched[0].length
      : 0;

    const insertIndex = Math.max(tsNocheckIndex, 0, firstNonRelativeImport);

    super({
      start: insertIndex,
      end: insertIndex,
      fileContext,
    });
  }

  protected joinChildrenMessage(): void {
    let newText = `import { ${[...this.importInfo.names].join(', ')} } from '${
      this.importInfo.moduleName
    }'\n`;

    this.needReplace = true;
    this.content = newText;
  }
}
