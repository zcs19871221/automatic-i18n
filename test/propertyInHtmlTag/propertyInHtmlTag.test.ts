import path from 'path';
import { cli } from '../../src/cli';

import fs from 'fs-extra';
import { expectDirEqualDistDirAt } from '../helper';

it('test propertyInHtmlTag', async () => {
  const target = path.join(__dirname, './dist');
  fs.removeSync(target);

  fs.copySync(path.join(__dirname, 'src'), target);

  jest.replaceProperty(process, 'argv', [
    ...process.argv.slice(0, 2),
    '-t',
    target,
    '-d',
    path.join(target, 'i18n'),
    '-t',
    target,
    '-f',
    'hook',
  ]);

  await cli();

  expectDirEqualDistDirAt('propertyInHtmlTag');
});
