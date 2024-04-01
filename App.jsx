import React from "./core/React.js";
const { useEffect } = React;
let show = false;
let countFoo = 1;
function Foo() {
  const [count, setCount] = React.useState(1);
  const [bar, setBar] = React.useState("bar");
  const handleClick = () => {
    setCount((c) => c + 1);
    setBar((s) => s + "bar");
  };
  useEffect(() => {
    console.log("init");
    return () => {
      console.log("1");
    };
  }, []);

  useEffect(() => {
    console.log("111");
    return () => {
      console.log("2");
    };
  }, [count]);
  return (
    <div>
      <h1>foo</h1>
      {count}
      <div></div>
      {bar}
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
