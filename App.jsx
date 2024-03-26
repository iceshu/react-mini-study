import React from "./core/React.js";

function Counter({ num }) {
  return <div>counter:{num}</div>;
}

function App() {
  return (
    <div>
      111
      <div>
        aaa <p id="p2">2</p>
      </div>
      <p id="p">bbb</p>
      <Counter num={12}></Counter>
      <Counter num={14}></Counter>
    </div>
  );
}

export default App;
