/** @jsxImportSource solid-js */

import type { JSX } from "solid-js";
import { splitProps } from "solid-js";

export type TextInputProps = JSX.InputHTMLAttributes<HTMLInputElement>;

export function TextInput(props: TextInputProps) {
  const [local, rest] = splitProps(props, ["class", "type"]);

  return (
    <input
      class={`w-full rounded-md border border-zinc-200 bg-white px-3 py-1.5 font-mono text-sm text-zinc-900 placeholder:text-zinc-300 transition focus:border-zinc-400 focus:outline-none ${local.class ?? ""}`}
      type={local.type ?? "text"}
      {...rest}
    />
  );
}
