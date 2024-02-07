export const renderLocaleFile = (
  locale: string,
  keyMapValue: Record<string, string>,
  defaultLocale: string
) => {
  const isDefault = defaultLocale === locale;
  return `
/*
  * This file will be changed by automatic program.
  * You can only change variable's property and value.
 */
${!isDefault ? `import { Locales } from './${defaultLocale}'` : ''};

export const locales${!isDefault ? ':Locales' : ''} = {
  ${Object.keys(keyMapValue)
    .map((key) => {
      if (key.includes('-')) {
        key = `'"' + key + '"'`;
      }
      let quote = "'";
      if (keyMapValue[key].includes("'")) {
        quote = '"';
      }
      return `${key}: ${quote}${keyMapValue[key]}${quote}`;
    })
    .join(',\n')}
}${isDefault ? ' as const' : ''};

${
  isDefault
    ? `export type LocalKey = keyof typeof locales;
export type Locales = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key in LocalKey]: any;
};
`
    : ''
};
`;
};
