import React from 'react';

function Component() {
  /* auto-i18n-collect-next */
  const name = 'lucy';
  const type = 'text';

  const value = {
    name: 'zcs',
  };

  return (
    <div
      name="sln"
      /* auto-i18n-collect-start */ text="hello sir!" /* auto-i18n-collect-end */
      type="text"
      /* auto-i18n-collect-next */
      fileName="excel"
    >
      hello {name}
    </div>
  );
}
