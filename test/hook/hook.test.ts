import * as path from 'path';
import { runAndExpect } from '../helper';
import { HookI18nFormatter } from '../../src/formatter';
const originWarn = console.warn;

it('should use HookRender successful', async () => {
  let warnText = '';
  console.warn = (text) => {
    warnText += text;
  };

  runAndExpect({
    dirName: path.basename(__dirname),
    opt: {
      I18nFormatter: HookI18nFormatter,
    },
    hideConsole: false,
  });
  expect(warnText).toMatch(
    `unable to replace '张成思' in non component context, `
  );
  console.warn = originWarn;
});
