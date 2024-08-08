import { SyntaxKind } from 'typescript';
import { TsNodeHandler } from '.';
import { HandlerOption, handleChildren } from './TsNodeHandler';
import { ReplaceContext } from '../ReplaceContext';

export class SourceFileHandler implements TsNodeHandler {
  match({ node }: HandlerOption): boolean {
    return node.kind === SyntaxKind.SourceFile;
  }

  handle(opt: HandlerOption): ReplaceContext | void {
    const {
      node,
      info,
      info: { requiredImports, imports },
      parentContext,
      tsNodeHandlers,
    } = opt;
    parentContext.children = handleChildren({
      node,
      parentContext,
      info,
      tsNodeHandlers,
    });

    Object.values(requiredImports).forEach(({ moduleName, names }) => {
      const existingImport = [...imports].find((importNode) =>
        importNode.moduleSpecifier.getText().includes(moduleName)
      );
      if (!existingImport) {
        // @TODO 获取第一个非注释的位置
        const firstNotCommentIndex = 0;
        let firstNonRelativeImport = 0;
        if (moduleName.startsWith('.')) {
          firstNonRelativeImport =
            [...imports]
              .reverse()
              .find((i) => !i.importClause?.getText()?.startsWith('.'))?.end ??
            0;
        }

        const insertIndex = Math.max(
          firstNotCommentIndex,
          0,
          firstNonRelativeImport
        );
        const insertImport = new ReplaceContext({
          start: insertIndex,
          end: insertIndex,
          info,
          newText: `import { ${[...names].join(', ')} } from '${moduleName}'\n`,
        });
        parentContext.children.push(insertImport);
        return;
      }
      if (!existingImport?.importClause) {
        return;
      }

      if (existingImport.importClause.namedBindings) {
        const requiredNames: string[] = [];
        const start = existingImport.importClause?.namedBindings.getStart() + 1;
        const importStr = existingImport.importClause?.namedBindings.getText();
        for (const name of names) {
          if (importStr?.includes(name)) {
            continue;
          }
          requiredNames.push(name);
        }
        if (requiredNames.length > 0) {
          parentContext.children.push(
            new ReplaceContext({
              info,
              start,
              end: start,
              newText: requiredNames.join(',') + ',',
            })
          );
        }
      } else {
        parentContext.children.push(
          new ReplaceContext({
            info,
            start: existingImport.importClause?.getEnd() + 1,
            end: existingImport.importClause?.getEnd() + 1,
            newText: `, {${[...names].join(',')}}`,
          })
        );
      }
    });

    parentContext.sortAndCheckChildren();
    parentContext.newText = parentContext.joinChildren();
  }
}
