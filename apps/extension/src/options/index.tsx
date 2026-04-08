/** @jsxImportSource solid-js */

import { render } from "solid-js/web";

import { App } from "./App";

const root = document.querySelector<HTMLDivElement>("#root");

if (!root) {
  throw new Error("Options root element was not found");
}

render(() => <App />, root);
