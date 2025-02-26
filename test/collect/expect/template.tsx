import React from 'react';
import { i18n } from './index.tsx';

function Component() {
  /* auto-i18n-collect-next */
  const name = i18n.intl.formatMessage({
    id: 'key1b2e24430__',
    defaultMessage: 'lucy',
  });
  const type = 'text';

  const value = {
    name: 'zcs',
  };

  return (
    <div
      name="sln"
      /* auto-i18n-collect-start */ text={i18n.intl.formatMessage({
        id: 'key13b999b27__',
        defaultMessage: 'hello sir!',
      })} /* auto-i18n-collect-end */
      type="text"
      /* auto-i18n-collect-next */
      fileName={i18n.intl.formatMessage({
        id: 'key11e39f792__',
        defaultMessage: 'excel',
      })}
    >
      {i18n.intl.formatMessage(
        {
          id: 'key1eaa0f157__',
          defaultMessage: 'hello {v1}',
        },
        { v1: name }
      )}
    </div>
  );
}
