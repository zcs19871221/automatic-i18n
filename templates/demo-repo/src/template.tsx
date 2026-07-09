import React from 'react';

function LocaleDemo(props: { name: string }) {
  const title = 'Welcome back, user!';
  const lang = 'English';
  const content = `${title} Current language: ${lang}`;

  return (
    <div className="card">
      <h3>{title}</h3>
      <p>{content}</p>
      <button title="Switch language">Hello {props.name}</button>
    </div>
  );
}

export default LocaleDemo;
