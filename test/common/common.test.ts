import { run as commonRun, expectDirEqualDistDirAt } from '../helper';
import * as path from 'path';

it('should extract successful', async () => {
  await commonRun(__dirname);
  expectDirEqualDistDirAt(path.basename(__dirname));
});
