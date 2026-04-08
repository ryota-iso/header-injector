import { describe, expect, it } from "vitest";

import { createDynamicRules, matchPatternToDnrCondition } from "./header-engine";

describe("createDynamicRules", () => {
  it("include pattern複数件をmodifyHeaders rule複数件へ展開する", () => {
    expect(
      createDynamicRules([
        {
          id: 10,
          enabled: true,
          includePatterns: ["https://api.example.com/*", "*://*.example.com/private/*"],
          excludePatterns: [],
          resourceTypes: ["xmlhttprequest"],
          requestHeaders: [{ header: "X-Test", operation: "set", value: "1" }],
        },
      ]),
    ).toEqual([
      {
        id: 1,
        priority: 1,
        action: {
          type: "modifyHeaders",
          requestHeaders: [{ header: "X-Test", operation: "set", value: "1" }],
        },
        condition: {
          resourceTypes: ["xmlhttprequest"],
          regexFilter: "^https://api\\.example\\.com/.*$",
        },
      },
      {
        id: 2,
        priority: 1,
        action: {
          type: "modifyHeaders",
          requestHeaders: [{ header: "X-Test", operation: "set", value: "1" }],
        },
        condition: {
          resourceTypes: ["xmlhttprequest"],
          regexFilter: "^https?://(?:[^/]+\\.)*example\\.com/private/.*$",
        },
      },
    ]);
  });

  it("exclude patternを高priorityのallow ruleへ展開する", () => {
    expect(
      createDynamicRules([
        {
          id: 1,
          enabled: true,
          includePatterns: ["https://example.com/*"],
          excludePatterns: ["https://example.com/private/*"],
          resourceTypes: ["main_frame"],
          requestHeaders: [{ header: "X-Test", operation: "set", value: "1" }],
        },
      ]),
    ).toEqual([
      {
        id: 1,
        priority: 2,
        action: { type: "allow" },
        condition: {
          resourceTypes: ["main_frame"],
          regexFilter: "^https://example\\.com/private/.*$",
        },
      },
      {
        id: 2,
        priority: 1,
        action: {
          type: "modifyHeaders",
          requestHeaders: [{ header: "X-Test", operation: "set", value: "1" }],
        },
        condition: {
          resourceTypes: ["main_frame"],
          regexFilter: "^https://example\\.com/.*$",
        },
      },
    ]);
  });

  it("includeなしではcatch-all ruleを生成する", () => {
    expect(
      createDynamicRules([
        {
          id: 1,
          enabled: true,
          includePatterns: [],
          excludePatterns: [],
          resourceTypes: ["xmlhttprequest"],
          requestHeaders: [{ header: "X-Test", operation: "set", value: "1" }],
        },
      ]),
    ).toEqual([
      {
        id: 1,
        priority: 1,
        action: {
          type: "modifyHeaders",
          requestHeaders: [{ header: "X-Test", operation: "set", value: "1" }],
        },
        condition: {
          resourceTypes: ["xmlhttprequest"],
          urlFilter: "|http*",
        },
      },
    ]);
  });

  it("headerが空の入力ではruleを生成しない", () => {
    expect(
      createDynamicRules([
        {
          id: 1,
          enabled: true,
          includePatterns: ["https://example.com/*"],
          excludePatterns: [],
          resourceTypes: ["xmlhttprequest"],
          requestHeaders: [],
        },
      ]),
    ).toEqual([]);
  });
});

describe("matchPatternToDnrCondition", () => {
  it("schemeとhostのバリエーションをregexFilterへ変換する", () => {
    expect(matchPatternToDnrCondition("*://example.com/*", ["main_frame"])).toEqual({
      resourceTypes: ["main_frame"],
      regexFilter: "^https?://example\\.com/.*$",
    });
    expect(matchPatternToDnrCondition("https://*.example.com/api/*", ["main_frame"])).toEqual({
      resourceTypes: ["main_frame"],
      regexFilter: "^https://(?:[^/]+\\.)*example\\.com/api/.*$",
    });
    expect(matchPatternToDnrCondition("https://*/public/*", ["main_frame"])).toEqual({
      resourceTypes: ["main_frame"],
      regexFilter: "^https://[^/]+/public/.*$",
    });
  });

  it("all_urlsはcatch-all条件へ変換する", () => {
    expect(matchPatternToDnrCondition("<all_urls>", ["xmlhttprequest"])).toEqual({
      resourceTypes: ["xmlhttprequest"],
      urlFilter: "|http*",
    });
  });
});
