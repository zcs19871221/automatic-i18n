import path from 'path';
import resolveMergeConflict from '../../src/resolveMergeConflict';

import fs from 'fs-extra';
import { expectDirEqualDistDirAt } from '../helper';

it('test resolveMergeConflict', async () => {
  const target = path.join(__dirname, './dist');

  const src = path.join(__dirname, 'src');
  if (fs.existsSync(target)) {
    fs.removeSync(target);
  }
  fs.mkdirSync(target);
  await resolveMergeConflict(src, target);

  expectDirEqualDistDirAt('resolveMergeConflict');
});
