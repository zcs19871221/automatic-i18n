import * as path from 'path';
import * as fs from 'fs-extra';
import { runAndExpect } from '../helper';

it('test merge', async () => {
  await runAndExpect({
    dirName: path.basename(__dirname),
    opt: {
      global: false,
    },
    beforeRun(testDir, distDir) {
      fs.copyFileSync(
        path.join(testDir, 'zh-cn.ts'),
        path.join(distDir, 'zh-cn.ts')
      );
      fs.copyFileSync(
        path.join(testDir, 'types.ts'),
        path.join(distDir, 'types.ts')
      );
    },
  });
});
