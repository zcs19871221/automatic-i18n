import { SyntaxKind } from 'typescript';
import { TsNodeHandler } from '.';
import { HandlerOption, handleChildren } from './TsNodeHandler';
import { ReplaceContext } from '../ReplaceContext';

export class SourceFileHandler implements TsNodeHandler {
  match({ node }: HandlerOption): boolean {
    return node.kind === SyntaxKind.SourceFile;
  }

  handle(opt: HandlerOption): ReplaceContext[] {
    const {
      node,
      info,
      info: { requiredImports, imports, file },
      tsNodeHandlers,
    } = opt;
    const fileContext = new ReplaceContext({
      start: 0,
      end: file.length,
      info,
    });
    fileContext.children = handleChildren({
      node,
      info,
      tsNodeHandlers,
    });

    Object.values(requiredImports).forEach(({ moduleName, names }) => {
      const existingImport = [...imports].find((importNode) =>
        importNode.moduleSpecifier.getText().includes(moduleName)
      );
      if (!existingImport) {
        // @TODO 获取第一个非注释的位置
        let firstNotCommentIndex = opt.node.getStart();
        if (opt.info.file[firstNotCommentIndex - 2] === '\n') {
          firstNotCommentIndex -= 1;
        }
        if (firstNotCommentIndex > 0) {
          const tsIgnoreMatched = info.file
            .slice(0, firstNotCommentIndex)
            .match(/(^|\n).*?@ts-ignore/);
          if (tsIgnoreMatched) {
            firstNotCommentIndex = tsIgnoreMatched.index ?? 0;
          }
        }
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
        fileContext.children.push(insertImport);
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
          fileContext.children.push(
            new ReplaceContext({
              info,
              start,
              end: start,
              newText: requiredNames.join(',') + ',',
            })
          );
        }
      } else {
        fileContext.children.push(
          new ReplaceContext({
            info,
            start: existingImport.importClause?.getEnd() + 1,
            end: existingImport.importClause?.getEnd() + 1,
            newText: `, {${[...names].join(',')}}`,
          })
        );
      }
    });

    fileContext.children.push(...info.globalContext);
    if (fileContext.children.length > 0) {
      fileContext.newText = fileContext.joinChildren();
    }
    return [fileContext];
  }
}
