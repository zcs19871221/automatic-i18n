import { useState } from 'react';
import './App.css';
import { i18n } from './i18n/index.tsx';

function App() {
  const [name, setName] = useState('');

  document.getElementById('root');

  return (
    <div>
      <input
        value={name}
        onChange={(e) => {
          setName(e.target.value);
        }}
      />
    </div>
  );
}

function afterSwitch(msg: string) {
  alert(
    i18n.intl.formatMessage(
      {
        id: 'key0001',
        defaultMessage: 'switched to :{v1}',
      },
      { v1: msg }
    )
  );
}
export default App;
