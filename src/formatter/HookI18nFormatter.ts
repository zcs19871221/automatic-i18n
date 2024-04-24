import {
  JsxChildContext,
  ReplaceContext,
  StringLiteralContext,
  TemplateStringContext,
} from '../replaceContexts';
import { HookInsertFunctionContext } from '../replaceContexts/HookInsertFunctionContext';
import {
  I18nFormatter,
  FormatOptions,
  FormatReturnType,
} from './I18nFormatter';

export default class HookI18nFormatter extends I18nFormatter {
  entryFile(localeFiles: string[], defaultLocale: string): string {
    return `
      import React, {
        ReactNode,
        useState,
        createContext,
        useContext,
        useMemo,
        useLayoutEffect,
      } from 'react';
      import { IntlProvider } from 'react-intl';

      import type { AvailableLocale, LocaleContextValue, LocalKey } from './types.ts';

      export function importMessages(
        locale: AvailableLocale,
      ): Promise<Record<LocalKey, string>> {
        switch (locale) {
          ${localeFiles
            .map(
              (name) => `
            case '${name}':
              return import('./${name}.ts') as unknown as Promise<
                Record<LocalKey, string>
              >;`
            )
            .join('')}
          default: {
            const error: never = locale;
            throw new Error(error);
          }
        }
      }

      const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

      export function useLocale(): LocaleContextValue {
        const context = useContext(LocaleContext);

        if (context === undefined) {
          throw new Error('useLocale must be used within the LocaleProvider context');
        }

        return context;
      }

      export function LocaleProvider({
        children,
        defaultLocale,
        defaultMessages,
      }: {
        defaultLocale: AvailableLocale;
        children: ReactNode;
        defaultMessages?: Readonly<Record<string, string>>;
      }) {
        const [messages, setMessages] = useState(defaultMessages);
        const [locale, setLocale] = useState(defaultLocale);

        useLayoutEffect(() => {
          let cancelled = false;

          async function fetchMessages() {
            const importedMessages = await importMessages(locale);
            if (!cancelled) {
              setMessages(importedMessages);
              document.documentElement.lang = locale;
            }
          }

          fetchMessages();

          return () => {
            cancelled = true;
          };
        }, [locale]);

        const value = useMemo(
          (): LocaleContextValue => ({
            locale,
            setLocale,
            fetchingMessages: !messages,
          }),
          [locale, messages],
        );

        return (
          <LocaleContext.Provider value={value}>
            <IntlProvider locale={locale} messages={messages}>
              {children}
            </IntlProvider>
          </LocaleContext.Provider>
        );
      }

   `;
  }
  public override renderJsxChildContext(
    context: JsxChildContext,
    { params, defaultMessage }: FormatOptions,
    intlId: string
  ): FormatReturnType | null {
    const paramString = this.paramsString(params);
    const newText = `
      <FormattedMessage
        id="${intlId}"
        defaultMessage="${defaultMessage}"
        ${paramString ? `values={${paramString}}` : ''}
      />
    `;
    return {
      newText,
      dependencies: {
        moduleName: 'react-intl',
        names: ['FormattedMessage'],
      },
    };
  }

  public override renderTemplateStringContext(
    context: TemplateStringContext,
    opt: FormatOptions,
    intlId: string
  ): FormatReturnType | null {
    return this.render(context, opt, intlId);
  }

  private render(
    context: ReplaceContext,
    { params, defaultMessage, originStr }: FormatOptions,
    intlId: string
  ) {
    const parentFunctionBlockNode = HookInsertFunctionContext.getComponent(
      context.getNode()!
    );
    if (!parentFunctionBlockNode) {
      context.i18nReplacer.addWarning({
        text: `unable to replace ${context
          .getNode()!
          .getText()} in non component context, put it in React component or use GlobalFormatter `,
        start: context.getNode()?.getStart() ?? 0,
        end: context.getNode()?.getEnd() ?? 0,
        fileContext: context.fileContext,
      });

      return null;
    }
    const existingIntlExpression = parentFunctionBlockNode
      .getText()
      .match(/(?:(?:const)|(?:var)|(?:let)) ([\S]+) = useIntl()/);
    let intlObj = 'intl';
    if (existingIntlExpression) {
      intlObj = existingIntlExpression[1];
    }
    const newText = this.intlExpression(
      intlId,
      defaultMessage,
      intlObj,
      params
    );

    const hookInsertContext = new HookInsertFunctionContext(
      parentFunctionBlockNode,
      context.fileContext
    );
    if (
      !context.fileContext
        .getChildren()
        .some(
          (c) =>
            c instanceof HookInsertFunctionContext &&
            c.start === hookInsertContext.start
        ) &&
      existingIntlExpression == null
    ) {
      context.fileContext.addChildren(hookInsertContext);
      hookInsertContext.generateMessage();
    }

    return {
      newText,
      dependencies: {
        moduleName: 'react-intl',
        names: ['useIntl'],
      },
    };
  }

  public override renderStringLiteralContext(
    context: StringLiteralContext,
    opt: FormatOptions,
    intlId: string
  ): FormatReturnType | null {
    return this.render(context, opt, intlId);
  }

  private intlExpression(
    intlId: string,
    defaultMessage: string,
    intlObj: string,
    params?: Record<string, string>
  ) {
    const paramString = this.paramsString(params);

    return `
    ${intlObj}.formatMessage({
            id: '${intlId}',
            defaultMessage: '${defaultMessage}'
          }${paramString ? ',' + paramString : ''})`;
  }
}
