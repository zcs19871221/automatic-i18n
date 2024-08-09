import * as fs from 'fs-extra';
import * as path from 'path';
import I18nReplacer from '../src';

const testBaseDir = path.join(process.cwd(), 'test');
const expectName = 'expect';
const distName = 'dist';

export const doEqual = (dir: string) => {
  fs.readdirSync(dir).forEach((fileOrDirName) => {
    const fileOrDirLocate = path.join(dir, fileOrDirName);
    if (fs.lstatSync(fileOrDirLocate).isDirectory()) {
      return doEqual(fileOrDirLocate);
    }
    expect(
      fs.readFileSync(fileOrDirLocate.replace(expectName, distName), 'utf-8')
    ).toEqual(fs.readFileSync(fileOrDirLocate, 'utf-8'));
  });
};

export const expectDirEqualDistDirAt = (dir: string) => {
  const testDir = path.isAbsolute(dir) ? dir : path.join(testBaseDir, dir);

  const expectDir = path.join(testDir, expectName);

  doEqual(expectDir);
};

export const runAndExpect = async ({
  dirName,
  opt = {},
  afterHook = () => {},
  hideConsole = true,
}: {
  dirName: string;
  opt?: {};
  afterHook?: (testDir: string, distDir: string) => void;
  hideConsole?: boolean;
}) => {
  const originWarning = console.warn;
  console.log = () => {};
  if (hideConsole) {
    console.warn = () => {};
    console.log = () => {};
  }
  const testDir = path.join(testBaseDir, dirName);
  const distDir = path.join(testDir, distName);
  const template = path.join(testDir, 'template.tsx');
  fs.removeSync(distDir);
  fs.ensureDirSync(distDir);
  afterHook(testDir, distDir);
  await I18nReplacer.createI18nReplacer({
    distLocaleDir: distDir,
    outputToNewDir: distDir,
    targets: [template],
    localesToGenerate: ['en-us'],
    localeToReplace: 'zh-cn',
    global: true,
    ...opt,
  }).replace();
  expectDirEqualDistDirAt(dirName);
  console.warn = originWarning;
};
