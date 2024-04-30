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

`npm install i18n-replacer`

write your own node script like this and run it, the below codes show all the option, the values is the options's default value if you pass nothing.

    import I18nReplacer, { GlobalI18nFormatter } from 'i18-replacer';
    import { ScriptTarget } from 'typescript';

    I18nReplacer.createI18nReplacer({
        // dir to work
        workingDir: process.cwd(),

        // The automatically generated folder name will be used to store the generated language files. will create a folder in workingDir/generatedFilesDir
        generatedFilesDir: 'i18n',

        // tell the project which file or dirs could be replaced
        filesOrDirsToReplace: [process.cwd],

        // filter to decide which files could be replaced
        fileFilter: () => true,

        // The locale message files in the following array will be generated
        localesToGenerate: ['en-us', 'zh-cn'],

        // The following language will be searched in source file and extract and replace
        localeToReplace: 'zh-cn',

        // class to implement generate file and code, there are two default class: HookI18nFormatter and GlobalI18nFormatter
        I18nFormatter: GlobalI18nFormatter,

        // pass to typescript compiler to generate ast tree for searching and replacing
        tsTarget: ScriptTarget.ES2015

        // will use this config to format generated code
        prettierConfig: {
            singleQuote: true,
            tabWidth: 2,
        },
    }).replace();

or use pure node to run it:

    const { HookI18nFormatter } = require("i18-replacer")

    const I18nReplacer = require("i18-replacer").default;

    I18nReplacer.createI18nReplacer({
        I18nFormatter: HookI18nFormatter,
        workingDir: 'c:/work/home/web/src'
    }).replace()

## License

The MIT License.
