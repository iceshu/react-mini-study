import React from "./React.js";
const ReactDom = {
  createRoot(Container) {
    return {
      render(App) {
        React.render(App, Container);
      },
    };
  },
};
export default ReactDom;
