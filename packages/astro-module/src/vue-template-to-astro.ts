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
  if (/\sv-(if|else-if|else|for|show|model|bind|on|slot|html|text)\b/.test(template))
    return true;

  // shorthand bindings (exclude things like XML namespaces by requiring whitespace before)
  if (/(?:\s|<)[:@][a-zA-Z]/.test(template)) return true;

  return false;
}

/* -------------------------------------------------------------------------- */
/*                         Vue Template AST → Astro                            */
/* -------------------------------------------------------------------------- */

function genChildren(children: TemplateChildNode[]): string {
  let out = "";

  for (let i = 0; i < children.length; i++) {
    const node = children[i];

    // Group v-if / v-else-if / v-else sibling chains
    if (node.type === NodeTypes.ELEMENT && hasDirective(node, "if")) {
      const chain: Array<{ node: any; type: "if" | "else-if" | "else" }> = [
        { node, type: "if" },
      ];

      let j = i + 1;
      for (; j < children.length; j++) {
        const sib = children[j];
        if (sib.type !== NodeTypes.ELEMENT) break;
        if (hasDirective(sib, "else-if")) {
          chain.push({ node: sib, type: "else-if" });
          continue;
        }
        if (hasDirective(sib, "else")) {
          chain.push({ node: sib, type: "else" });
          j++;
          break;
        }
        break;
      }

      out += genIfChain(chain);
      i = j - 1;
      continue;
    }

    out += genNode(node);
  }

  return out;
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
  const { attrs, vIf, vElseIf, vElse, vFor, vShow, vText, vHtml } =
    splitDirectives(el.props);

  // v-for -> {source.map((item, idx) => (<tag ...>...</tag>))}
  if (vFor) {
    const { source, value, index } = parseVFor(vFor.exp?.content ?? "");
    const inner = genPlainElement(tag, attrs, el.children, { vShow, vText, vHtml });
    const args = index ? `${value}, ${index}` : value;
    return `{${source}.map((${args}) => (${inner}))}`;
  }

  // NOTE: v-else / v-else-if chains require sibling grouping to do perfectly.
  // This v-if support is correct for standalone v-if elements.
  if (vIf) {
    const cond = vIf.exp?.content ?? "false";
    const thenBranch = genPlainElement(tag, attrs, el.children, { vShow, vText, vHtml });

    // Minimal handling:
    // - v-else-if / v-else are not chained here (they’re sibling constructs).
    // If present, we keep them as plain elements (won’t render as intended).
    // You can add a sibling-pass later if needed.
    return `{${cond} ? (${thenBranch}) : null}`;
  }

  // v-else / v-else-if / v-else on a single node without sibling pass:
  // emit as normal element (so you don't lose markup)
  if (vElseIf || vElse) {
    return genPlainElement(tag, attrs, el.children, { vShow, vText, vHtml });
  }

  return genPlainElement(tag, attrs, el.children, { vShow, vText, vHtml });
}

function genPlainElement(
  tag: string,
  props: any[],
  children: TemplateChildNode[],
  extras?: { vShow?: any; vText?: any; vHtml?: any }
): string {
  let attrs = props;
  if (extras?.vShow) attrs = applyVShow(attrs, extras.vShow);

  let attrStr = attrs.map(genAttr).join("");

  if (extras?.vHtml) {
    const expr = extras.vHtml.exp?.content ?? "''";
    attrStr += ` set:html={${expr}}`;
    children = [];
  } else if (extras?.vText) {
    const expr = extras.vText.exp?.content ?? "''";
    attrStr += ` set:text={${expr}}`;
    children = [];
  }

  const inner = genChildren(children);
  return `<${tag}${attrStr}>${inner}</${tag}>`;
}

function genAttr(p: any): string {
  // Plain attribute
  if (p.type === NodeTypes.ATTRIBUTE) {
    if (!p.value) return ` ${p.name}`;
    const raw = p.value.content ?? "";
    if (/\$\{[^}]+?\}/.test(raw)) {
      const trimmed = raw.startsWith("`") && raw.endsWith("`") ? raw.slice(1, -1) : raw;
      const safe = trimmed.replace(/`/g, "\\`");
      return ` ${p.name}={\`${safe}\`}`;
    }
    return ` ${p.name}="${escapeAttr(raw)}"`;
  }

  // v-bind / :
  // :foo="expr" -> foo={expr}
  if (p.type === NodeTypes.DIRECTIVE && p.name === "bind") {
    const name = p.arg?.content;
    if (!name) {
      const expr = p.exp?.content ?? "{}";
      return ` {...${expr}}`;
    }
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
  let vShow: any = null;
  let vText: any = null;
  let vHtml: any = null;

  for (const p of props) {
    if (p.type === NodeTypes.DIRECTIVE) {
      if (p.name === "if") vIf = p;
      else if (p.name === "else-if") vElseIf = p;
      else if (p.name === "else") vElse = p;
      else if (p.name === "for") vFor = p;
      else if (p.name === "show") vShow = p;
      else if (p.name === "text") vText = p;
      else if (p.name === "html") vHtml = p;
      else attrs.push(p);
    } else {
      attrs.push(p);
    }
  }

  return { attrs, vIf, vElseIf, vElse, vFor, vShow, vText, vHtml };
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

function hasDirective(node: any, name: string): boolean {
  return !!node.props?.some(
    (p: any) => p.type === NodeTypes.DIRECTIVE && p.name === name
  );
}

function genIfChain(
  chain: Array<{ node: any; type: "if" | "else-if" | "else" }>
): string {
  const parts = chain.map((item) => {
    const split = splitDirectives(item.node.props);
    const branch = genElementFromSplit(item.node, split, { ignoreIf: true });
    const cond =
      item.type === "else"
        ? null
        : item.type === "if"
        ? split.vIf?.exp?.content ?? "false"
        : split.vElseIf?.exp?.content ?? "false";
    return { cond, branch };
  });

  let expr = "";
  for (let i = 0; i < parts.length; i++) {
    const { cond, branch } = parts[i];
    if (i === 0) {
      expr = `${cond} ? (${branch}) : `;
    } else if (cond) {
      expr += `${cond} ? (${branch}) : `;
    } else {
      expr += `(${branch})`;
    }
  }

  if (!parts.some((p) => p.cond === null)) expr += "null";
  return `{${expr}}`;
}

function genElementFromSplit(
  el: any,
  split: ReturnType<typeof splitDirectives>,
  opts?: { ignoreIf?: boolean }
): string {
  const tag = el.tag;
  const { attrs, vIf, vElseIf, vElse, vFor, vShow, vText, vHtml } = split;

  if (vFor) {
    const { source, value, index } = parseVFor(vFor.exp?.content ?? "");
    const inner = genPlainElement(tag, attrs, el.children, { vShow, vText, vHtml });
    const args = index ? `${value}, ${index}` : value;
    return `{${source}.map((${args}) => (${inner}))}`;
  }

  if (!opts?.ignoreIf && vIf) {
    const cond = vIf.exp?.content ?? "false";
    const thenBranch = genPlainElement(tag, attrs, el.children, {
      vShow,
      vText,
      vHtml,
    });
    return `{${cond} ? (${thenBranch}) : null}`;
  }

  if (!opts?.ignoreIf && (vElseIf || vElse)) {
    return genPlainElement(tag, attrs, el.children, { vShow, vText, vHtml });
  }

  return genPlainElement(tag, attrs, el.children, { vShow, vText, vHtml });
}

function applyVShow(attrs: any[], vShow: any): any[] {
  const showExpr = vShow.exp?.content ?? "false";
  const showStyleExpr = `(${showExpr}) ? '' : 'display: none;'`;
  const next = [...attrs];

  const styleIdx = next.findIndex((p) => {
    if (p.type === NodeTypes.ATTRIBUTE) return p.name === "style";
    return (
      p.type === NodeTypes.DIRECTIVE &&
      p.name === "bind" &&
      p.arg?.content === "style"
    );
  });

  if (styleIdx === -1) {
    next.push({
      type: NodeTypes.DIRECTIVE,
      name: "bind",
      arg: { content: "style" },
      exp: { content: showStyleExpr },
    });
    return next;
  }

  const styleProp = next[styleIdx];
  if (styleProp.type === NodeTypes.ATTRIBUTE) {
    const base = styleProp.value?.content ?? "";
    const sep = base && !/;\s*$/.test(base) ? ";" : "";
    const safe = base.replace(/`/g, "\\`");
    const merged = `\`${safe}${sep}\${${showExpr} ? '' : 'display: none;'}\``;
    next[styleIdx] = {
      type: NodeTypes.DIRECTIVE,
      name: "bind",
      arg: { content: "style" },
      exp: { content: merged },
    };
    return next;
  }

  const baseExpr = styleProp.exp?.content ?? "''";
  styleProp.exp = {
    content: `(${baseExpr} ?? '') + (${showStyleExpr})`,
  };
  next[styleIdx] = styleProp;
  return next;
}
