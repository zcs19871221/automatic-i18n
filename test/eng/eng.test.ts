import * as path from 'path';
import { runAndExpect } from '../helper';
it('extract english successfully', async () => {
  await runAndExpect({
    dirName: path.basename(__dirname),
    opt: {
      global: false,
      localesToGenerate: ['zh-cn'],
      localeToReplace: 'en-us',
    },
  });
});
