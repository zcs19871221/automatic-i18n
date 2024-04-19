import * as path from 'path';
import * as fs from 'fs-extra';
import { runAndExpect } from '../helper';
import { HookI18nFormatter } from '../../src/formatter';

it('hook edge case', async () => {
  runAndExpect(
    path.basename(__dirname),
    {
      I18nFormatter: HookI18nFormatter,
    },
    (testDir, distDir) => {
      fs.copyFileSync(
        path.join(testDir, 'zh-cn.ts'),
        path.join(distDir, 'zh-cn.ts')
      );
      fs.copyFileSync(
        path.join(testDir, 'types.ts'),
        path.join(distDir, 'types.ts')
      );
    }
  );
});
