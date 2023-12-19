/* eslint-disable no-bitwise */
/* eslint-disable no-underscore-dangle */
import * as fs from 'fs-extra';
import * as path from 'path';
import { LocaleReplacer } from '../src';
import * as Asset from 'assert';

const distDir = 'testDist';
const testDir = path.join(process.cwd(), 'test');
const dist = path.join(process.cwd(), distDir);

fs.removeSync(dist);
fs.ensureDirSync(dist);

LocaleReplacer.replace({
  projectDir: dist,
  i18nDir: '',
  fileReplaceDist: dist,
  filter: () => true,
  filesOrDirsToReplace: [path.join(testDir, 'test.tsx')],
  locales: ['en-us', 'zh-cn'],
  localeToSearch: 'zh-cn',
  importPath: './',
});

const expectedDir = 'testExpected';
const expected = path.join(process.cwd(), expectedDir);

const equal = (dir: string = expected) => {
  fs.readdirSync(dir).forEach((fileOrDirName) => {
    const fileOrDirLocate = path.join(dir, fileOrDirName);
    if (fs.lstatSync(fileOrDirLocate).isDirectory()) {
      return equal(fileOrDirLocate);
    }
    Asset.equal(
      fs.readFileSync(fileOrDirLocate, 'utf-8'),
      fs.readFileSync(fileOrDirLocate.replace(expectedDir, distDir), 'utf-8')
    );
  });
};
equal();
