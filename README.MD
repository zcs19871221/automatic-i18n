# I18n-Replacer

## Introduction

I18n replacer is an internationalization tool that automatically replaces language text in the source code(typescript) and generates multi-language files through syntax analysis of ts source code(based on **typescript compiler**).

I hope that websites in different languages ​​can benefit more people in the world, hope world peace.

features:

- Write the code as if it were not an international project. Then run a one-line command to replace all locale text with i18n keys and generate a message file.
- The languages ​​to be replaced and the languages ​​to be generated can be configured.
- Automatically merge template strings(jsx text) with variables.
- Integrated with `react-intl` library. (you could write your own custom render class by implement `I18nFormatter` and pass your class as params.)
- Supports hook mode (changing language in real time) and global mode, and can use custom render classes to determine how to replace source code and generate language files.
- Test coverage 98%.

## Example

Your code Before:

    import React from 'react';

    function Component() {
        const en = 'English';
        const cn = 'Chinese';
        const locales = `${en} and ${cn}`;

        return (
            <div>
                Please choose your locale from: {en} {cn}
            </div>
        );
    }

Your code will be replaced with the below after run command:

    import { useIntl, FormattedMessage } from 'react-intl';
    import React from 'react';

    function Component() {
        const intl = useIntl();

        const en = intl.formatMessage({
            id: 'key0001',
            defaultMessage: 'English',
        });
        const cn = intl.formatMessage({
            id: 'key0002',
            defaultMessage: 'Chinese',
        });
        const locales = intl.formatMessage({
            id: 'key0003',
            defaultMessage: '{v1} and {v2}',
            values: { v1: en, v2: cn },
        });

        return (
            <div>
                <FormattedMessage
                    id="key0004"
                    defaultMessage="Please choose your locale from: {v1} {v2}"
                    values={{ v1: en, v2: cn }}
                />
            </div>
        );
    }

You will get some new files including some locale message files and a provider which you could import and put it in your root file.

    /*
    * This file will be changed by automatic program.
    * You can only change variable's property and value.
    */
    import { LocalKey } from './types';

    const locale: Record<LocalKey, string> = {
        key0001: 'English',
        key0002: 'Chinese',
        key0003: '{v1} and {v2}',
        key0004: 'Please choose your locale from: {v1} {v2}',
    };

    export default locale;

# Quick start

1. cli

   `npx i18n`
   you can get specific info with `npx i18n -h`

2. api

write your own node script like this and run it

    import I18nReplacer, { GlobalI18nFormatter } from 'i18-replacer';
    import { ScriptTarget } from 'typescript';

    I18nReplacer.createI18nReplacer().replace();

or with commonJs to run it:

    const { HookI18nFormatter } = require("i18-replacer")

    const I18nReplacer = require("i18-replacer").default;

    I18nReplacer.createI18nReplacer().replace()

the options is like this:

    export interface ReplacerOpt {
        // file or dirs to extract messages default is [process.cwd()]
        targets?: string[];
        // The location where the locale message files are generated default is [process.cwd()/i18n]
        distLocaleDir?: string;
        // the locale which is searched in targets default is zh-cn
        localeToReplace?: LocaleTypes;
        // the locale file default is [en-us, zh-cn]
        localesToGenerate?: LocaleTypes[];
        // formatter class, use could provide class implement the `I18nFormatter` class,
        // default provide two class:GlobalI18nFormatter and HookI18nFormatter
        I18nFormatterClass?: I18nFormatterCtr;
        // default is hook
        I18nFormatterClassAlias?: 'hook' | 'global';
        // if rename the key to meaningful variable if has related english translate
        meaningKey?: boolean;
        // decide which file or dir could be handled
        filters?: Filter[];
        // file name or dir to ignore
        excludes?: string[];
        debug?: boolean;
    }

## License

The MIT License.
