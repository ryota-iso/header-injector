/** @jsxImportSource solid-js */

import type { JSX } from "solid-js";
import { Show } from "solid-js";

export interface SectionProps {
  title: string;
  description?: string;
  action?: JSX.Element;
  children: JSX.Element;
}

export function Section(props: SectionProps) {
  return (
    <section class="@container flex flex-col gap-4">
      <div class="flex flex-col gap-3 @[400px]:flex-row @[400px]:items-start @[400px]:justify-between @[400px]:gap-4">
        <div class="flex min-w-0 flex-col gap-1">
          <h2 class="text-lg font-semibold text-zinc-900">{props.title}</h2>
          <Show when={props.description}>
            <p class="text-sm text-zinc-500">{props.description}</p>
          </Show>
        </div>
        <Show when={props.action}>{props.action}</Show>
      </div>
      {props.children}
    </section>
  );
}
