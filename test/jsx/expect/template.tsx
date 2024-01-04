// @ts-nocheck
import { i18 } from './';

const common = <>{i18.intl.formatMessage({ id: 'key0001' }, { v1: name })}</>;
const nest1 = (
  <div name={i18.intl.formatMessage({ id: 'key0002' })} age={<div>sdffs</div>}>
    <div>{i18.intl.formatMessage({ id: 'key0003' })}</div>
    {i18.intl.formatMessage({ id: 'key0001' }, { v1: name })}
    <div>{i18.intl.formatMessage({ id: 'key0002' })}</div>
    <span>
      {i18.intl.formatMessage({ id: 'key0002' })}
      {flag ? (
        i18.intl.formatMessage({ id: 'key0004' }, { v1: name })
      ) : (
        <h1>{i18.intl.formatMessage({ id: 'key0003' })}</h1>
      )}
    </span>
    <span>
      {i18.intl.formatMessage(
        { id: 'key0005' },
        {
          v1: flag
            ? i18.intl.formatMessage({ id: 'key0004' }, { v1: name })
            : i18.intl.formatMessage({ id: 'key0003' }),
        }
      )}
    </span>
    <span>{i18.intl.formatMessage({ id: 'key0006' }, { v1: age })}</span>
  </div>
);
