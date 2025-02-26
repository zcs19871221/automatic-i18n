import { runAndExpect } from '../helper';
import * as path from 'path';

it('should collect marked codes', async () => {
  await runAndExpect({
    dirName: path.basename(__dirname),
    opt: {
      localeToReplace: 'en-us',
      localesToGenerate: ['en-us', 'zh-cn'],
      uniqIntlKey: true,
    },
  });
});
