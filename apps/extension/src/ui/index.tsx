/** @jsxImportSource solid-js */

import { render } from "solid-js/web";

import { App } from "./app";

const root = document.querySelector<HTMLDivElement>("#root");

if (!root) {
  throw new Error("Root element was not found");
}

render(() => <App />, root);
