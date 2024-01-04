import * as path from 'path';
import { runAndExpect } from '../helper';

it('should extract mixed successful', async () => {
  runAndExpect(path.basename(__dirname));
});
