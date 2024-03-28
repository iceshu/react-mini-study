import React from "./core/React.js";
let show = false;
let countFoo = 1;
function Foo() {
  console.log("Foo");
  const update = React.update();
  const handleClick = () => {
    countFoo++;
    update();
  };
  return (
    <div>
      <h1>foo</h1>
      {countFoo}
      <button onClick={handleClick}>点击</button>
    </div>
  );
}
let countBar = 1;
function Bar() {
  console.log("bar");
  const update = React.update();
  const handleClick = () => {
    countBar++;
    update();
  };
  return (
    <div>
      <h1>bar</h1>
      {countBar}
      <button onClick={handleClick}>点击</button>
    </div>
  );
}

function App() {
  return (
    <div>
      111
      <Foo></Foo>
      <Bar></Bar>
    </div>
  );
}

export default App;
