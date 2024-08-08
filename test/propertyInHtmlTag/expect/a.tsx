import { useIntl, FormattedMessage } from 'react-intl';
// @ts-ignore
import React from 'react';

const Comp4 = () => {
  const intl = useIntl();
  return (
    <div
      onClick={() => {
        alert(
          intl.formatMessage({
            id: 'key0001',
            defaultMessage: '张三',
          })
        );
      }}
    >
      <FormattedMessage id="key0002" defaultMessage="你好" />
    </div>
  );
};
