jest.mock('prettier', () => ({
  ...jest.requireActual('prettier'),
  resolveConfig: () => ({
    singleQuote: true,
    tabWidth: 2,
    parser: 'typescript',
  }),
}));

import path from 'path';
import { cli } from '../../src/cli';

import fs from 'fs-extra';
import { expectDirEqualDistDirAt } from '../helper';

it('test cli1', async () => {
  const target = path.join(__dirname, './dist');
  fs.removeSync(target);

  fs.copySync(path.join(__dirname, 'src'), target);

  jest.replaceProperty(process, 'argv', [
    ...process.argv.slice(0, 2),
    '-t',
    target,
    '-d',
    path.join(target, 'myI18n'),
    '-f',
    'global',
    '-e',
    'b.tsx',
    'c.tsx',
  ]);

  await cli();

  expectDirEqualDistDirAt('cli');
});
