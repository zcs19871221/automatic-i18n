import * as path from 'path';
import { runAndExpect } from '../helper';

it('should extract mixed successful', async () => {
  await runAndExpect({ dirName: path.basename(__dirname) });
});
