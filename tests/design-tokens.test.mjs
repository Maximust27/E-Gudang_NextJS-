import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { test } from "node:test"

function readTokens(css,selector) {
  const block=css.split(selector+" {")[1]?.split("}")[0];
  if (!block) throw new Error("Missing token block: "+selector);
  return Object.fromEntries([...block.matchAll(/--([\w-]+):\s*([^;]+);/g)].map(([,key,value])=>[key,value.trim()]));
}

function token(tokens,key) {
  const value=tokens[key];
  if (!value) throw new Error("Missing token: "+key);
  const alias=/^var\(--([\w-]+)\)$/.exec(value);
  return alias?token(tokens,alias[1]):value;
}

function luminance(hex) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) throw new Error("Expected a six-digit hex token: "+hex);
  const [r,g,b]=hex.slice(1).match(/../g).map(v=>{
    const n=parseInt(v,16)/255;
    return n<=0.04045?n/12.92:((n+0.055)/1.055)**2.4;
  });
  return 0.2126*r+0.7152*g+0.0722*b;
}

function ratio(a,b) {
  const values=[luminance(a),luminance(b)].sort((x,y)=>y-x);
  return (values[0]+0.05)/(values[1]+0.05);
}

const css = readFileSync(new URL("../styles/tokens.css", import.meta.url), "utf8")
const light = readTokens(css, ":root")
const dark = { ...light, ...readTokens(css, ".dark") }

const textPairs = [
  [
    "foreground",
    "background"
  ],
  [
    "card-foreground",
    "card"
  ],
  [
    "popover-foreground",
    "popover"
  ],
  [
    "muted-foreground",
    "card"
  ],
  [
    "muted-foreground",
    "background"
  ],
  [
    "primary-foreground",
    "primary"
  ],
  [
    "primary-foreground",
    "primary-hover"
  ],
  [
    "secondary-foreground",
    "secondary"
  ],
  [
    "accent-foreground",
    "accent"
  ],
  [
    "success-foreground",
    "success-surface"
  ],
  [
    "warning-foreground",
    "warning-surface"
  ],
  [
    "danger-foreground",
    "danger-surface"
  ],
  [
    "destructive-foreground",
    "destructive"
  ],
  [
    "destructive-foreground",
    "destructive-hover"
  ],
  [
    "sidebar-foreground",
    "sidebar"
  ],
  [
    "sidebar-primary-foreground",
    "sidebar-primary"
  ],
  [
    "sidebar-accent-foreground",
    "sidebar-accent"
  ]
]
const nonTextPairs = [
  [
    "input",
    "card"
  ],
  [
    "input",
    "background"
  ],
  [
    "ring",
    "card"
  ],
  [
    "sidebar-ring",
    "sidebar"
  ],
  [
    "chart-1",
    "card"
  ],
  [
    "chart-2",
    "card"
  ]
]
const dimensions = {
  "control-height": "2.5rem",
  "control-compact-height": "2rem",
  "control-touch-height": "2.75rem",
  "table-header-height": "2.75rem",
  "table-row-height": "3rem",
  "app-header-height": "4rem",
  "app-sidebar-width": "16rem",
  "app-sidebar-collapsed-width": "4rem",
  "ds-radius-sm": "0.375rem",
  "ds-radius-md": "0.5rem",
  "ds-radius-lg": "0.75rem",
  "ds-radius-xl": "1rem"
}

for (const [name, colors] of Object.entries({ light, dark })) {
  test(`${name}: semantic text contrast >= 4.5:1`, () => {
    for (const [fg, bg] of textPairs) {
      const contrast = ratio(token(colors, fg), token(colors, bg))
      assert.ok(contrast >= 4.5, `${fg}/${bg}: ${contrast.toFixed(2)}:1`)
    }
  })

  test(`${name}: control and chart contrast >= 3:1`, () => {
    for (const [fg, bg] of nonTextPairs) {
      const contrast = ratio(token(colors, fg), token(colors, bg))
      assert.ok(contrast >= 3, `${fg}/${bg}: ${contrast.toFixed(2)}:1`)
    }
  })
}

test("documented control, table, layout and radius sizes", () => {
  for (const [name, value] of Object.entries(dimensions)) {
    assert.equal(token(light, name), value, name)
  }
})
