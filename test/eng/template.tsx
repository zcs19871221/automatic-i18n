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
