import { ImportDeclaration, Node } from 'typescript';
import { FileContext } from './FileContext';
import { ReplaceContext } from './ReplaceContext';

export interface Opt {
  node: Node;
  parent?: ReplaceContext;
  fileContext: FileContext;
}

export class AddImportNameContext extends ReplaceContext {
  constructor(
    fileContext: FileContext,
    private readonly names: Set<string>,
    node: ImportDeclaration
  ) {
    super({
      start: node.getStart(),
      end: node.getEnd(),
      node,
      fileContext,
    });
  }
  protected override generatingMessageFromChildrenThenSet(): void {
    const wholeText = this.node?.getText() ?? '';
    const importStr = (this.node as ImportDeclaration)?.importClause?.getText();
    const requiredNames: string[] = [];
    for (const name of this.names) {
      if (importStr?.includes(name)) {
        continue;
      }
      requiredNames.push(name);
    }

    if (requiredNames.length === 0) {
      this.needReplace = false;
    } else {
      this.needReplace = true;
      this.replacedText =
        wholeText.slice(0, -1) + requiredNames.join(',') + wholeText.slice(-1);
    }
  }
}
