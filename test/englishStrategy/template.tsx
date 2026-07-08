import React from 'react';

function Component(props: { name: string }) {
  const title = 'Welcome back, user!';
  const token = 'user';
  const signal = 'a+b';
  const route = '/users/list';

  return (
    <button title="Action title" data-testid="submit-btn">
      {title} Click me {props.name} {route} {signal}
    </button>
  );
}

export default Component;
