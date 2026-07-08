jest.mock('../../src/resolveMergeConflict', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import resolveMergeConflict from '../../src/resolveMergeConflict';
import { cli } from '../../src/cli';

it('test merge command default dirs', async () => {
  const mockedMerge = resolveMergeConflict as jest.MockedFunction<
    typeof resolveMergeConflict
  >;
  mockedMerge.mockResolvedValueOnce();

  const logSpy = jest.spyOn(console, 'log').mockImplementation();
  jest.replaceProperty(process, 'argv', [...process.argv.slice(0, 2), 'merge']);

  await cli();

  expect(mockedMerge).toHaveBeenCalledTimes(1);
  const [targetDir, outDir] = mockedMerge.mock.calls[0];
  expect(targetDir).toBe(outDir);
  expect(logSpy).toHaveBeenCalledWith(
    `[merge] resolved conflicts in: ${targetDir} -> written to: ${outDir}`
  );

  logSpy.mockRestore();
});
