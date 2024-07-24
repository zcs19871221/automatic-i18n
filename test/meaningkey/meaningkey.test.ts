import path from 'path';

import { cli } from '../../src/cli';

import fs from 'fs-extra';
import { expectDirEqualDistDirAt } from '../helper';

it('test meaningKey', async () => {
  process.cwd = jest.fn(() => path.join(__dirname, './dist'));

  const target = path.join(__dirname, './dist');
  fs.removeSync(target);

  fs.copySync(path.join(__dirname, 'src'), target);
  jest.replaceProperty(process, 'argv', [...process.argv.slice(0, 2), '-m']);
  await cli();

  expectDirEqualDistDirAt(__dirname);
});
