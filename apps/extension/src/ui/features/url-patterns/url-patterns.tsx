/** @jsxImportSource solid-js */

import { Index, Show, createMemo, createSignal } from "solid-js";

import { Button } from "../../components/button";
import { DenyIcon, GlobeIcon, PlusIcon } from "../../components/icons";
import { Section } from "../../components/section";
import { Tabs } from "../../components/tabs";
import { PatternRow } from "./pattern-row";

type TabValue = "include" | "exclude";

export interface UrlPatternsProps {
  includePatterns: string[];
  excludePatterns: string[];
  includeErrors: (string | undefined)[];
  excludeErrors: (string | undefined)[];
  setIncludePatterns: (patterns: string[]) => void;
  setExcludePatterns: (patterns: string[]) => void;
}

export function UrlPatterns(props: UrlPatternsProps) {
  const [activeTab, setActiveTab] = createSignal<TabValue>("include");

  const isInclude = createMemo(() => activeTab() === "include");
  const currentPatterns = createMemo(() => (isInclude() ? props.includePatterns : props.excludePatterns));
  const currentErrors = createMemo(() => (isInclude() ? props.includeErrors : props.excludeErrors));

  function setCurrent(next: string[]) {
    if (isInclude()) {
      props.setIncludePatterns(next);
    } else {
      props.setExcludePatterns(next);
    }
  }

  function addPattern() {
    setCurrent([...currentPatterns(), ""]);
  }

  function updatePattern(index: number, value: string) {
    setCurrent(currentPatterns().map((pattern, patternIndex) => (patternIndex === index ? value : pattern)));
  }

  function removePattern(index: number) {
    setCurrent(currentPatterns().filter((_pattern, patternIndex) => patternIndex !== index));
  }

  return (
    <Section
      action={
        <Button onClick={addPattern}>
          <PlusIcon class="h-4 w-4" />
          <span>Add Pattern</span>
        </Button>
      }
      description="Define which URLs should have headers applied or excluded."
      title="URL Patterns"
    >
      <div class="flex flex-col gap-4">
        <Tabs
          items={[
            {
              value: "include",
              label: "Include",
              count: props.includePatterns.length,
              icon: <GlobeIcon class="h-4 w-4" />,
            },
            {
              value: "exclude",
              label: "Exclude",
              count: props.excludePatterns.length,
              icon: <DenyIcon class="h-4 w-4" />,
            },
          ]}
          value={activeTab()}
          onChange={setActiveTab}
        />

        <div class="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <Show
            fallback={
              <div class="px-5 py-10 text-center text-sm text-zinc-500">No patterns yet. Click "Add Pattern" to add one.</div>
            }
            when={currentPatterns().length > 0}
          >
            <div class="divide-y divide-zinc-100">
              <Index each={currentPatterns()}>
                {(pattern, index) => (
                  <PatternRow
                    error={currentErrors()[index]}
                    icon={
                      <div
                        class={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${
                          isInclude() ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                        }`}
                      >
                        <Show fallback={<DenyIcon class="h-4 w-4" />} when={isInclude()}>
                          <GlobeIcon class="h-4 w-4" />
                        </Show>
                      </div>
                    }
                    pattern={pattern()}
                    onRemove={() => removePattern(index)}
                    onUpdate={(value) => updatePattern(index, value)}
                  />
                )}
              </Index>
            </div>
          </Show>
        </div>
      </div>
    </Section>
  );
}
