import * as path from 'path';
import { runAndExpect } from '../helper';

it('hook edge case', async () => {
  await runAndExpect({
    dirName: path.basename(__dirname),
    opt: {
      global: false,
    },
  });
});
