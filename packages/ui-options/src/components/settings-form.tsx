/** @jsxImportSource solid-js */

import type { JSX } from "solid-js";

export interface SettingsFormProps {
  children: JSX.Element;
  onSubmit: () => void | Promise<void>;
}

export function SettingsForm(props: SettingsFormProps) {
  return (
    <form
      style={{ display: "grid", gap: "16px" }}
      onSubmit={(event) => {
        event.preventDefault();
        void props.onSubmit();
      }}
    >
      {props.children}
    </form>
  );
}
