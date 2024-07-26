// @ts-nocheck
import { i18n } from './index.tsx';

const common = (
  <>
    {i18n.intl.formatMessage(
      {
        id: 'key0001',
        defaultMessage: '哈哈{v1}你好',
      },
      { v1: name }
    )}
  </>
);
const nest1 = (
  <div
    name={i18n.intl.formatMessage({
      id: 'key0002',
      defaultMessage: '你好',
    })}
    age={
      <div>
        {i18n.intl.formatMessage({
          id: 'key0003',
          defaultMessage: 'sd你好fs',
        })}
      </div>
    }
  >
    <div>
      {i18n.intl.formatMessage({
        id: 'key0004',
        defaultMessage: '哈哈',
      })}
    </div>
    {i18n.intl.formatMessage(
      {
        id: 'key0001',
        defaultMessage: '哈哈{v1}你好',
      },
      { v1: name }
    )}
    <div>
      {i18n.intl.formatMessage({
        id: 'key0002',
        defaultMessage: '你好',
      })}
    </div>
    <span>
      {i18n.intl.formatMessage({
        id: 'key0002',
        defaultMessage: '你好',
      })}
      {flag ? (
        i18n.intl.formatMessage(
          {
            id: 'key0005',
            defaultMessage: '哈哈{v1}',
          },
          { v1: name }
        )
      ) : (
        <h1>
          {i18n.intl.formatMessage({
            id: 'key0004',
            defaultMessage: '哈哈',
          })}
        </h1>
      )}
    </span>
    <span>
      {i18n.intl.formatMessage(
        {
          id: 'key0006',
          defaultMessage: '你好{v1}',
        },
        {
          v1: flag
            ? i18n.intl.formatMessage(
                {
                  id: 'key0005',
                  defaultMessage: '哈哈{v1}',
                },
                { v1: name }
              )
            : i18n.intl.formatMessage({
                id: 'key0004',
                defaultMessage: '哈哈',
              }),
        }
      )}
    </span>
    <span>
      {i18n.intl.formatMessage(
        {
          id: 'key0007',
          defaultMessage: '准备{v1}再见{v1}',
        },
        { v1: age }
      )}
    </span>
    <span>
      {flag
        ? i18n.intl.formatMessage({
            id: 'key0008',
            defaultMessage: '再见',
          })
        : i18n.intl.formatMessage(
            {
              id: 'key0005',
              defaultMessage: '哈哈{v1}',
            },
            { v1: name }
          )}
    </span>
    <span>{flag}</span>
    <span>flag</span>
    <span>
      {flag
        ? i18n.intl.formatMessage({
            id: 'key0008',
            defaultMessage: '再见',
          })
        : i18n.intl.formatMessage(
            {
              id: 'key0005',
              defaultMessage: '哈哈{v1}',
            },
            { v1: name }
          )}
    </span>
    ;
    <span
      className={css`
        margin-left: 20px;
      `}
      style={{
        width: '20px',
      }}
      name={i18n.intl.formatMessage({
        id: 'key0009',
        defaultMessage: '张成思',
      })}
    />
  </div>
);
