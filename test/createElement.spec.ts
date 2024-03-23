import { describe, it, expect } from "vitest";
import React from "../core/React";
describe("createElement", () => {
  it("happy path", () => {
    const el = React.createElement("div", null, "666");
    expect(el).toMatchInlineSnapshot(`
      {
        "props": {
          "children": [
            {
              "props": {
                "children": [],
                "nodeValue": "666",
              },
              "type": "TEXT_ELEMENT",
            },
          ],
        },
        "type": "div",
      }
    `);
  });

  it("happy path with props", () => {
    const el = React.createElement("div", { id: "id" }, "666");
    expect(el).toMatchInlineSnapshot(`
      {
        "props": {
          "children": [
            {
              "props": {
                "children": [],
                "nodeValue": "666",
              },
              "type": "TEXT_ELEMENT",
            },
          ],
          "id": "id",
        },
        "type": "div",
      }
    `);
  });
});
