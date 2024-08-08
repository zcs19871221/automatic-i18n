import { useState } from "react";
import "./App.css";

function App() {
  const [name, setName] = useState("");

  document.getElementById("root")

  return (
   <div><input value={name} onChange={(e) => {
        setName(e.target.value)
      }}/></div>
  );
}

function afterSwitch(msg: string) {
  alert(`switched to :${msg}`);
}
export default App;
