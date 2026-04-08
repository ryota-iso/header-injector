/** @jsxImportSource solid-js */

import type { JSX } from "solid-js";
import { splitProps } from "solid-js";

export interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  children: JSX.Element;
}

export function Button(props: ButtonProps) {
  const [local, rest] = splitProps(props, ["class", "children", "type"]);

  return (
    <button
      class={`inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 ${local.class ?? ""}`}
      type={local.type ?? "button"}
      {...rest}
    >
      {local.children}
    </button>
  );
}
