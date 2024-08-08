import { useIntl } from 'react-intl';
import { useState } from 'react';
import './App.css';
import { i18n } from './i18n/index.tsx';

function App() {
  const intl = useIntl();

  const [name, setName] = useState('');

  document.getElementById(
    intl.formatMessage({
      id: 'key0001',
      defaultMessage: 'root',
    })
  );

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
        id: 'key0002',
        defaultMessage: 'switched to :{v1}',
      },
      { v1: msg }
    )
  );
}
export default App;
