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
let currentFiber = null;
let currentRoot = null;
let deletes = [];
let wipFiber = null;
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

function commitEffectHooks() {
  function run(fiber) {
    if (!fiber) return;
    if (!fiber.alternate) {
      fiber?.effectHooks?.forEach((newHook) => {
        newHook.cleanUp = newHook.callBack();
      });
    } else {
      fiber?.effectHooks?.forEach((newHook, index) => {
        if (newHook.deps.length === 0) return;
        const oldEffectHook = fiber.alternate.effectHooks[index];
        const needUpdate = oldEffectHook.deps.some((oldDep, i) => {
          return oldDep !== fiber.effectHook?.deps[i];
        });
        needUpdate && (newHook.cleanUp = newHook?.callBack());
      });
    }

    run(fiber.child);
    run(fiber.sibling);
  }

  function runCleanUp(fiber) {
    if (!fiber) return;
    fiber?.alternate?.effectHooks?.forEach((hook) => {
      if (hook?.deps?.length) {
        hook?.cleanUp?.();
      }
    });
    runCleanUp(fiber.child);
    runCleanUp(fiber.sibling);
  }
  runCleanUp(wipRoot);
  run(wipRoot);
}
function commitRoot() {
  deletes.forEach(commitDelete);
  commitWork(wipRoot.child);
  commitEffectHooks();

  currentRoot = wipRoot;
  wipRoot = null;
  deletes = [];
}
function commitDelete(fiber) {
  if (fiber.dom) {
    let fiberParent = fiber.parent;
    while (!fiberParent.dom) {
      fiberParent = fiberParent.parent;
    }
    fiberParent.dom.removeChild(fiber.dom);
  } else {
    commitDelete(fiber.child);
  }
}
function workLoop(deadline) {
  let shouldYield = false;
  while (!shouldYield && nextWorkOfUnit) {
    nextWorkOfUnit = performWorkOfUnit(nextWorkOfUnit);
    if (wipRoot?.sibling?.type === nextWorkOfUnit?.type) {
      nextWorkOfUnit = null;
    }
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
      if (child) {
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

      oldFiber && deletes.push(oldFiber);
    }
    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }
    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevChild.sibling = newFiber;
    }
    if (newFiber) {
      prevChild = newFiber;
    }
  });
  while (oldFiber) {
    oldFiber && deletes.push(oldFiber);
    oldFiber = oldFiber.sibling;
  }
}

function updateFunctionComponent(fiber) {
  stateHooks = [];
  stateHooksIndex = 0;
  effectHooks = [];
  wipFiber = fiber;
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

let stateHooks = null;
let stateHooksIndex = 0;
function useState(initialState) {
  let currentFiber = wipFiber;
  const oldHook = currentFiber?.alternate?.stateHooks[stateHooksIndex];
  const stateHook = {
    state: oldHook?.state || initialState,
    queue: oldHook?.queue || [],
  };
  stateHook.queue.forEach((action) => {
    stateHook.state = action(stateHook.state);
  });
  stateHook.queue = [];
  stateHooksIndex++;
  stateHooks.push(stateHook);
  currentFiber.stateHooks = stateHooks;
  function setState(action) {
    const fn = typeof action === "function" ? action : () => action;
    const eagerState = fn(stateHook.state);
    if (eagerState === stateHook.state) return;
    stateHook.queue.push(fn);
    wipRoot = {
      ...currentFiber,
      alternate: currentFiber,
    };
    nextWorkOfUnit = wipRoot;
  }

  return [stateHook.state, setState];
}

let effectHooks;
function useEffect(callBack, deps) {
  const effectHook = {
    callBack,
    deps,
    cleanUp: undefined,
  };
  effectHooks.push(effectHook);
  wipFiber.effectHooks = effectHooks;
}

function update() {
  let currentFiber = wipFiber;
  return () => {
    wipRoot = {
      ...currentFiber,
      alternate: currentFiber,
    };
    nextWorkOfUnit = wipRoot;
  };
}
const React = { createElement, render, update, useState, useEffect };
export default React;
