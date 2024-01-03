import * as path from 'path';
import { runAndExpect } from '../helper';

it('should extract template string successful', async () => {
  runAndExpect(path.basename(__dirname));
});
