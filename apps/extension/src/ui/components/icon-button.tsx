/** @jsxImportSource solid-js */

import type { JSX } from "solid-js";
import { splitProps } from "solid-js";

export interface IconButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  children: JSX.Element;
  label: string;
}

export function IconButton(props: IconButtonProps) {
  const [local, rest] = splitProps(props, ["class", "children", "type", "label"]);

  return (
    <button
      aria-label={local.label}
      class={`inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 ${local.class ?? ""}`}
      type={local.type ?? "button"}
      {...rest}
    >
      {local.children}
    </button>
  );
}
