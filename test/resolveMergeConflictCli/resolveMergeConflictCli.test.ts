import path from 'path';
import { cli } from '../../src/cli';

import fs from 'fs-extra';
import { expectDirEqualDistDirAt } from '../helper';

it('test resolveMergeConflictCli', async () => {
  const target = path.join(__dirname, './dist');
  fs.removeSync(target);

  fs.copySync(path.join(__dirname, 'src'), target);

  jest.replaceProperty(process, 'argv', [
    ...process.argv.slice(0, 2),
    'merge',
    path.join(__dirname, 'src'),
    path.join(__dirname, 'dist'),
  ]);

  await cli();

  expectDirEqualDistDirAt('resolveMergeConflictCli');
});
