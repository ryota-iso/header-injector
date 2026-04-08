import type { HeaderMutationRule } from "./rules";

export interface KeyValueStorage {
  get<T>(key: string, fallback: T): Promise<T>;
  set<T>(key: string, value: T): Promise<void>;
  watch<T>(key: string, callback: (value: T) => void): () => void;
}

export interface HeaderEngine {
  applyRules(rules: HeaderMutationRule[]): Promise<void>;
}
