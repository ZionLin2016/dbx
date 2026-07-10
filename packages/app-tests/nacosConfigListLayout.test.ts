import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "vitest";

test("Nacos config list uses scrollable custom column widths instead of four equal columns", () => {
  const nacosConsole = readFileSync("apps/desktop/src/components/nacos/NacosAdminConsole.vue", "utf8");

  assert.match(nacosConsole, /const configListGridTemplate = "minmax\(\d+px,[^"]+\) minmax\(\d+px,[^"]+\) minmax\(\d+px,[^"]+\) " \+ configFormatColumnWidth;/);
  assert.match(nacosConsole, /const configListMinWidth = "\d+px";/);
  assert.match(nacosConsole, /const configFormatColumnWidth = "\d+px";/);
  assert.match(nacosConsole, /configListGridTemplate.*configFormatColumnWidth/);
  assert.match(nacosConsole, /:style="\{ minWidth: configListMinWidth \}"/);
  assert.match(nacosConsole, /:style="\{ gridTemplateColumns: configListGridTemplate \}"/);
  assert.doesNotMatch(nacosConsole, /grid-cols-4 border-b bg-muted px-3 py-2/);
  assert.doesNotMatch(nacosConsole, /grid w-full grid-cols-4 items-center border-b px-3 py-2\.5/);
});
