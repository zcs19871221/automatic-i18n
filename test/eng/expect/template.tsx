import { useIntl, FormattedMessage } from 'react-intl';
import React from 'react';

function Component() {
  const intl = useIntl();

  const en = 'English';
  const cn = 'Chinese';
  const locales = intl.formatMessage(
    {
      id: 'key0001',
      defaultMessage: '{v1} and {v2}',
    },
    { v1: en, v2: cn }
  );

  return (
    <div>
      <FormattedMessage
        id="key0002"
        defaultMessage="Please choose your locale from: {v1} {v2}"
        values={{ v1: en, v2: cn }}
      />
    </div>
  );
}
