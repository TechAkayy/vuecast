import { describe, it, expect } from "vitest";
import { vueTemplateAstroTransform } from "./vue-template-to-astro";

function transformBody(src: string): string {
  const res = vueTemplateAstroTransform(src, "Component.astro");
  expect(res).not.toBeNull();
  return res!.code.replace(/^---[\s\S]*?---\r?\n?/, "");
}

describe("vueTemplateAstroTransform", () => {
  it("converts v-html to set:html", () => {
    const body = transformBody(`---
---
<div v-html="raw"></div>`);
    expect(body).toContain("<div set:html={raw}></div>");
  });

  it("converts v-text to set:text", () => {
    const body = transformBody(`---
---
<p v-text="msg">Hi</p>`);
    expect(body).toContain("<p set:text={msg}></p>");
  });

  it("supports v-show by toggling display style", () => {
    const body = transformBody(`---
---
<span v-show="ok">Hi</span>`);
    expect(body).toContain("<span style={(ok) ? '' : 'display: none;'}>Hi</span>");
  });

  it("merges v-show with existing style", () => {
    const body = transformBody(`---
---
<div style="color: red" v-show="ok">Hi</div>`);
    expect(body).toContain(
      "<div style={`color: red;${ok ? '' : 'display: none;'}`}>Hi</div>"
    );
  });

  it("supports v-bind object spread", () => {
    const body = transformBody(`---
---
<div v-bind="props"></div>`);
    expect(body).toContain("<div {...props}></div>");
  });

  it("supports v-if / v-else-if / v-else chains", () => {
    const body = transformBody(`---
---
<div v-if="a">A</div>
<div v-else-if="b">B</div>
<div v-else>C</div>`);
    expect(body).toContain(
      "{a ? (<div>A</div>) : b ? (<div>B</div>) : (<div>C</div>)}"
    );
  });

  it("converts template literal-like attribute values into Astro bindings", () => {
    const body = transformBody(`---
---
<div data-title="\${foo} + \${bar}"></div>
<span>{{ foo }}</span>`);
    expect(body).toContain("data-title={`${foo} + ${bar}`}");
  });
});
