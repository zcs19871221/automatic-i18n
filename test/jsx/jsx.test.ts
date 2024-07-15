import * as path from 'path';
import { runAndExpect } from '../helper';

it('should extract jsx  successful', async () => {
  await runAndExpect({ dirName: path.basename(__dirname) });
});
