import { useIntl, FormattedMessage } from 'react-intl';
import React from 'react';

function Component(props: { name: string }) {
  const intl = useIntl();

  const title = intl.formatMessage({
    id: 'key199c71859__',
    defaultMessage: 'Welcome back, user!',
  });
  const token = 'user';
  const signal = 'a+b';
  const route = '/users/list';

  return (
    <button
      title={intl.formatMessage({
        id: 'key1fa68539e__',
        defaultMessage: 'Action title',
      })}
      data-testid="submit-btn"
    >
      <FormattedMessage
        id="key1ef3e3d1c__"
        defaultMessage="{v1} Click me {v2} {v3} {v4}"
        values={{ v1: title, v2: props.name, v3: route, v4: signal }}
      />
    </button>
  );
}

export default Component;
