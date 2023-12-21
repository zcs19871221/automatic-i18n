import * as fs from 'fs-extra';
import * as path from 'path';
import { LocaleReplacer } from '../src';
import { ScriptTarget } from 'typescript';

const testBaseDir = path.join(process.cwd(), 'test');
const expectName = 'expect';
const distName = 'dist';

export const doEqual = (dir: string) => {
  fs.readdirSync(dir).forEach((fileOrDirName) => {
    const fileOrDirLocate = path.join(dir, fileOrDirName);
    if (fs.lstatSync(fileOrDirLocate).isDirectory()) {
      return expectDirEqualDistDirAt(fileOrDirLocate);
    }
    expect(fs.readFileSync(fileOrDirLocate, 'utf-8')).toEqual(
      fs.readFileSync(fileOrDirLocate.replace(expectName, distName), 'utf-8')
    );
  });
};

export const expectDirEqualDistDirAt = (dir: string) => {
  const testDir = path.join(testBaseDir, dir);

  const expectDir = path.join(testDir, expectName);

  doEqual(expectDir);
};

export const run = (dirName: string) => {
  dirName = path.basename(dirName);
  const testDir = path.join(testBaseDir, dirName);
  const distDir = path.join(testDir, distName);
  const template = path.join(testDir, 'template.tsx');
  fs.removeSync(distDir);
  fs.ensureDirSync(distDir);

  LocaleReplacer.replace({
    projectDir: distDir,
    i18nDir: '',
    fileReplaceDist: distDir,
    filter: () => true,
    filesOrDirsToReplace: [template],
    locales: ['en-us', 'zh-cn'],
    localeToSearch: 'zh-cn',
    importPath: './',
    defaultLocale: 'zh-cn',
    tsTarget: ScriptTarget.ESNext,
  });
};
