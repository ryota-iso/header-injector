/** @jsxImportSource solid-js */

import type { HeaderEntry } from "../../../core";
import { createDefaultHeaderEntry } from "../../../core";
import { Index, Show } from "solid-js";

import { Button } from "../../components/button";
import { PlusIcon } from "../../components/icons";
import { Section } from "../../components/section";
import { HeaderRow } from "./header-row";

export interface RequestHeadersProps {
  headers: HeaderEntry[];
  errorsByHeaderId: Map<string, string>;
  setHeaders: (headers: HeaderEntry[]) => void;
}

let headerIdCounter = 0;

function createHeaderId(): string {
  headerIdCounter += 1;
  return `header-${Date.now()}-${headerIdCounter}`;
}

export function RequestHeaders(props: RequestHeadersProps) {
  function addHeader() {
    props.setHeaders([...props.headers, createDefaultHeaderEntry(createHeaderId())]);
  }

  function updateHeader(id: string, patch: Partial<HeaderEntry>) {
    props.setHeaders(props.headers.map((header) => (header.id === id ? { ...header, ...patch } : header)));
  }

  function removeHeader(id: string) {
    props.setHeaders(props.headers.filter((header) => header.id !== id));
  }

  return (
    <Section
      action={
        <Button onClick={addHeader}>
          <PlusIcon class="h-4 w-4" />
          <span>Add Header</span>
        </Button>
      }
      description="Headers to be added to matching requests."
      title="Request Headers"
    >
      <div class="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        <div class="grid grid-cols-[60px_minmax(0,1fr)_minmax(0,1fr)_44px] items-center gap-4 border-b border-zinc-200 bg-zinc-50/60 px-5 py-2.5 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          <span>On</span>
          <span>Name</span>
          <span>Value</span>
          <span />
        </div>

        <Show
          fallback={
            <div class="px-5 py-10 text-center text-sm text-zinc-500">No headers configured. Click "Add Header" to add one.</div>
          }
          when={props.headers.length > 0}
        >
          <div class="divide-y divide-zinc-100">
            <Index each={props.headers}>
              {(header) => (
                <HeaderRow
                  error={props.errorsByHeaderId.get(header().id)}
                  header={header()}
                  onRemove={() => removeHeader(header().id)}
                  onUpdate={(patch) => updateHeader(header().id, patch)}
                />
              )}
            </Index>
          </div>
        </Show>
      </div>
    </Section>
  );
}
