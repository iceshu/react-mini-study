function createTextNode(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: [],
    },
  };
}
function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map((child) => {
        const isText = typeof child === "string" || typeof child === "number";
        return isText ? createTextNode(child) : child;
      }),
    },
  };
}
let nextWorkOfUnit = null;
let wipRoot = null;
let currentNode = null;
function render(el, container) {
  wipRoot = {
    dom: container,
    props: { children: [el] },
  };
  nextWorkOfUnit = wipRoot;
}
function commitWork(fiber) {
  if (!fiber) return;
  let fiberParent = fiber.parent;
  while (!fiberParent.dom) {
    fiberParent = fiberParent.parent;
  }
  if (fiber.effectTag === "update") {
    updateProps(fiber.dom, fiber.props, fiber.alternate?.props);
  } else if (fiber.effectTag === "placement") {
    if (fiber.dom) {
      fiberParent.dom.append(fiber.dom);
    }
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}
function commitRoot() {
  commitWork(wipRoot.child);
  currentNode = wipRoot;
  wipRoot = null;
}
function workLoop(deadline) {
  let shouldYield = false;
  while (!shouldYield && nextWorkOfUnit) {
    nextWorkOfUnit = performWorkOfUnit(nextWorkOfUnit);
    shouldYield = !deadline.timeRemaining() < 1;
  }
  if (!nextWorkOfUnit && wipRoot != null) {
    commitRoot();
  }
  requestIdleCallback(workLoop);
}

function createDom(type) {
  if (type === "TEXT_ELEMENT") {
    return document.createTextNode("");
  }
  return document.createElement(type);
}
function updateProps(dom, nextProps, prevProps) {
  //删除
  if (prevProps) {
    Object.keys(prevProps).forEach((key) => {
      if (key !== "children") {
        if (!(key in nextProps)) {
          dom.removeAttribute(key);
        }
      }
    });
  }

  Object.keys(nextProps).forEach((key) => {
    if (key !== "children") {
      if (key.startsWith("on")) {
        const eventType = key.toLowerCase().substring(2);
        dom.removeEventListener(eventType, prevProps[key]);
        dom.addEventListener(eventType, nextProps[key]);
      } else {
        if (key !== "children") {
          dom[key] = nextProps[key];
        }
      }
    }
  });
}

function reconcileChildren(fiber, children) {
  let oldFiber = fiber.alternate?.child;
  let prevChild = null;
  children.forEach((child, index) => {
    const isSameType = oldFiber?.type === child.type;
    let newFiber;
    if (isSameType) {
      //update
      newFiber = {
        type: child.type,
        props: child.props,
        child: null,
        parent: fiber,
        sibling: null,
        dom: oldFiber.dom,
        effectTag: "update",
        alternate: oldFiber,
      };
    } else {
      newFiber = {
        type: child.type,
        props: child.props,
        child: null,
        parent: fiber,
        sibling: null,
        dom: null,
        effectTag: "placement",
      };
    }
    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }
    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevChild.sibling = newFiber;
    }
    prevChild = newFiber;
  });
}

function updateFunctionComponent(fiber) {
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}
function updateHostComponent(fiber) {
  if (!fiber.dom) {
    const dom = (fiber.dom = createDom(fiber.type));
    updateProps(dom, fiber.props, {});
  }
  const children = fiber.props.children;
  reconcileChildren(fiber, children);
}

function performWorkOfUnit(fiber) {
  const isFunctionComponent = typeof fiber.type === "function";
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) return nextFiber.sibling;
    nextFiber = nextFiber.parent;
  }
}
requestIdleCallback(workLoop);

function update() {
  wipRoot = {
    dom: currentNode.dom,
    props: currentNode.props,
    alternate: currentNode,
  };
  nextWorkOfUnit = wipRoot;
}
const React = { createElement, render, update };
export default React;
