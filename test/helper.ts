import * as fs from 'fs-extra';
import * as path from 'path';
import { LocaleReplacer } from '../src';

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

  return LocaleReplacer.replace({
    projectDir: distDir,
    i18nDirName: '',
    fileReplaceDist: distDir,
    fileFilter: () => true,
    filesOrDirsToReplace: [template],
    localesToGenerate: ['en-us', 'zh-cn'],
    localeToReplace: 'zh-cn',
    importPath: './',
  });
};
