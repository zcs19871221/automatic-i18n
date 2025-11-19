import * as fs from 'fs-extra';
import I18nReplacer, {
  defaultDistLocaleDir,
  getScriptTarget,
  I18nFormatter,
  resolvePrettierConfig,
  TYPE_FILE_NAME,
} from '..';
import path from 'path';
import resolveGitConflicts from './resolveConflicts';
import { createSourceFile } from 'typescript';

export default async function resolveMergeConflict(
  distDir: string = defaultDistLocaleDir(),
  outputDir = distDir
) {
  distDir = path.resolve(distDir);

  if (!fs.existsSync(distDir) || !fs.statSync(distDir).isDirectory()) {
    throw new Error('distLocaleDir should be directory. ' + distDir);
  }

  const distPrettierOptions = await resolvePrettierConfig(
    path.join(distDir, 'index.ts')
  );
  fs.readdirSync(distDir).forEach((fileOrDirName) => {
    const filePath = path.join(distDir, fileOrDirName);
    if (
      fs.lstatSync(filePath).isDirectory() ||
      !fileOrDirName.endsWith('.ts')
    ) {
      return;
    }
    const originFile = fs.readFileSync(filePath, 'utf-8');
    const { changed, output: merged } = resolveGitConflicts(originFile);
    if (!changed) {
      return;
    }
    const source = createSourceFile(
      filePath,
      merged,
      getScriptTarget(filePath),
      true
    );
    if (fileOrDirName === TYPE_FILE_NAME) {
      I18nReplacer.formatAndWrite(
        path.join(outputDir, fileOrDirName),
        merged,
        distPrettierOptions
      );
      return;
    }
    const [intlIdMapMessage, keys] =
      I18nReplacer.intlIdMapMessageFromAstNodeRecursively(source);
    I18nReplacer.formatAndWrite(
      path.join(outputDir, fileOrDirName),
      I18nFormatter.generateMessageFile(intlIdMapMessage, keys),
      distPrettierOptions
    );
  });
}
