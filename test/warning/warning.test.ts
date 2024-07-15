import { runAndExpect } from '../helper';

it('should show warnings text correctly', async () => {
  let warnText = '';
  const originWarn = console.warn;
  console.warn = (text) => {
    warnText += text;
  };

  await runAndExpect({ dirName: 'warning', hideConsole: false });
  expect(warnText).toMatch(`['发']`);
  expect(warnText).toMatch(`['好']`);
  expect(warnText).toMatch(`['你']`);
  expect(warnText).toMatch(`['大']`);
  expect(warnText).not.toMatch(`[今天]']`);
  expect(warnText).not.toMatch(`[他]']`);
  expect(warnText).not.toMatch(`[忽略]']`);
  expect(warnText).toMatch(`[最近7天]`);
  expect(warnText).toMatch(`[最近30天]`);

  console.warn = originWarn;
});
