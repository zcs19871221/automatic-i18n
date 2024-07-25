import * as path from 'path';
import * as fs from 'fs-extra';
import { runAndExpect } from '../helper';
import { DefaultI18nFormatter } from '../../src/formatter';

it('hook edge case', async () => {
  await runAndExpect({
    dirName: path.basename(__dirname),
    opt: {
      I18nFormatterClass: DefaultI18nFormatter,
    },
    afterHook(testDir, distDir) {
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
