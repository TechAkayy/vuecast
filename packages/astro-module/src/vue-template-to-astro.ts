import {
  baseParse,
  NodeTypes,
  type TemplateChildNode,
} from "@vue/compiler-dom";

export function vueTemplateAstroTransform(code: string, id = "Component.astro") {
  const split = splitAstroFrontmatter(code);
  if (!split) return null;

  const { frontmatterBlock, templatePart } = split;

  // Auto-detect: only convert when Vue-template syntax is present
  if (!isVueTemplate(templatePart)) return null;

  // Parse Vue template
  const vueAst = baseParse(templatePart, { comments: true });

  // Convert to Astro-ish template
  const astroTemplate = genChildren(vueAst.children).trimEnd();

  return {
    code: `${frontmatterBlock}\n${astroTemplate}\n`,
  };
}

/**
 * Splits an .astro file into:
 * - frontmatterBlock: '--- ... ---' (kept exactly)
 * - templatePart: everything after the second fence
 */
function splitAstroFrontmatter(code: string): null | {
  frontmatterBlock: string;
  templatePart: string;
} {
  if (!code.startsWith("---")) return null;

  // Find the closing fence of the first frontmatter
  // We look for "\n---" after the first 3 chars
  const fence = "\n---";
  const end = code.indexOf(fence, 3);
  if (end === -1) return null;

  const frontmatterBlock = code.slice(0, end + fence.length);

  // template part is everything after the closing fence (trim only the very first newline)
  const templatePart = code
    .slice(end + fence.length)
    .replace(/^\r?\n/, "");

  return { frontmatterBlock, templatePart };
}

/**
 * Vue-template auto detection.
 * We only look at templatePart (below the fence).
 *
 * Triggers:
 * - {{ ... }}
 * - v- directives
 * - shorthand :foo or @click
 */
function isVueTemplate(template: string): boolean {
  // mustache
  if (/\{\{\s*[^}]+?\s*\}\}/.test(template)) return true;

  // directives (v-if, v-for, v-bind, v-on, etc.)
  if (/\sv-(if|else-if|else|for|show|model|bind|on|slot)\b/.test(template))
    return true;

  // shorthand bindings (exclude things like XML namespaces by requiring whitespace before)
  if (/(?:\s|<)[:@][a-zA-Z]/.test(template)) return true;

  return false;
}

/* -------------------------------------------------------------------------- */
/*                         Vue Template AST → Astro                            */
/* -------------------------------------------------------------------------- */

function genChildren(children: TemplateChildNode[]): string {
  return children.map(genNode).join("");
}

function genNode(node: TemplateChildNode): string {
  switch (node.type) {
    case NodeTypes.TEXT:
      return node.content;

    case NodeTypes.INTERPOLATION:
      // {{ expr }} → {expr}
      return `{${node.content.content}}`;

    case NodeTypes.ELEMENT:
      return genElement(node as any);

    case NodeTypes.COMMENT:
      return `<!--${(node as any).content}-->`;

    default:
      return "";
  }
}

function genElement(el: any): string {
  const tag = el.tag;
  const { attrs, vIf, vElseIf, vElse, vFor } = splitDirectives(el.props);

  // v-for -> {source.map((item, idx) => (<tag ...>...</tag>))}
  if (vFor) {
    const { source, value, index } = parseVFor(vFor.exp?.content ?? "");
    const inner = genPlainElement(tag, attrs, el.children);
    const args = index ? `${value}, ${index}` : value;
    return `{${source}.map((${args}) => (${inner}))}`;
  }

  // NOTE: v-else / v-else-if chains require sibling grouping to do perfectly.
  // This v-if support is correct for standalone v-if elements.
  if (vIf) {
    const cond = vIf.exp?.content ?? "false";
    const thenBranch = genPlainElement(tag, attrs, el.children);

    // Minimal handling:
    // - v-else-if / v-else are not chained here (they’re sibling constructs).
    // If present, we keep them as plain elements (won’t render as intended).
    // You can add a sibling-pass later if needed.
    return `{${cond} ? (${thenBranch}) : null}`;
  }

  // v-else / v-else-if / v-else on a single node without sibling pass:
  // emit as normal element (so you don't lose markup)
  if (vElseIf || vElse) {
    return genPlainElement(tag, attrs, el.children);
  }

  return genPlainElement(tag, attrs, el.children);
}

function genPlainElement(
  tag: string,
  props: any[],
  children: TemplateChildNode[]
): string {
  const attrStr = props.map(genAttr).join("");
  const inner = genChildren(children);
  return `<${tag}${attrStr}>${inner}</${tag}>`;
}

function genAttr(p: any): string {
  // Plain attribute
  if (p.type === NodeTypes.ATTRIBUTE) {
    if (!p.value) return ` ${p.name}`;
    return ` ${p.name}="${escapeAttr(p.value.content)}"`;
  }

  // v-bind / :
  // :foo="expr" -> foo={expr}
  if (p.type === NodeTypes.DIRECTIVE && p.name === "bind") {
    const name = p.arg?.content;
    if (!name) return "";
    const expr = p.exp?.content ?? "true";
    return ` ${name}={${expr}}`;
  }

  // v-on / @
  // Astro HTML cannot execute these unless you later convert to an island.
  // Keep as data attribute so it round-trips and you can build islands later.
  if (p.type === NodeTypes.DIRECTIVE && p.name === "on") {
    const evt = p.arg?.content ?? "event";
    const expr = p.exp?.content ?? "";
    return ` data-on-${evt}="${escapeAttr(expr)}"`;
  }

  // Other directives ignored for now
  return "";
}

function splitDirectives(props: any[]) {
  const attrs: any[] = [];
  let vIf: any = null;
  let vElseIf: any = null;
  let vElse: any = null;
  let vFor: any = null;

  for (const p of props) {
    if (p.type === NodeTypes.DIRECTIVE) {
      if (p.name === "if") vIf = p;
      else if (p.name === "else-if") vElseIf = p;
      else if (p.name === "else") vElse = p;
      else if (p.name === "for") vFor = p;
      else attrs.push(p);
    } else {
      attrs.push(p);
    }
  }

  return { attrs, vIf, vElseIf, vElse, vFor };
}

/**
 * v-for="(item, i) in items" | v-for="item in items"
 */
function parseVFor(exp: string): { source: string; value: string; index: string | null } {
  const m = exp.match(/^\s*(.+?)\s+in\s+(.+)\s*$/);
  if (!m) return { source: exp, value: "item", index: null };

  const lhs = m[1].trim();
  const source = m[2].trim();

  if (lhs.startsWith("(") && lhs.endsWith(")")) {
    const parts = lhs.slice(1, -1).split(",").map((s) => s.trim());
    return {
      source,
      value: parts[0] || "item",
      index: parts[1] || null,
    };
  }

  return { source, value: lhs || "item", index: null };
}

function escapeAttr(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}
