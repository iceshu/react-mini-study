import React from "./core/React.js";
let num = 0;
function Counter() {
  return (
    <div>
      counter:{num}
      <button
        onClick={() => {
          console.log("fff");
          num++;
          React.update();
        }}
      >
        测试
      </button>
    </div>
  );
}

function App() {
  return (
    <div>
      111
      <div>
        aaa <p id="p2">2</p>
      </div>
      <p id="p">bbb</p>
      <Counter></Counter>
    </div>
  );
}

export default App;
