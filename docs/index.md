# Sylphry

**Atomic CSS-in-JS: framework-agnostic, tokenized theming & breakpoints—import and go.**

[![npm](https://img.shields.io/npm/v/sylphry.svg)](https://www.npmjs.com/package/sylphry)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

## 🎯 Features

- **Atomic classes**
  Generate single-purpose, composable CSS utilities.
- **Framework-agnostic**
  Works in React, Vue, Svelte, or vanilla JS—no runtime deps.
- **Tokenized theming**
  Define color, spacing, or design tokens once; switch themes at runtime.
- **Responsive breakpoints**
  Built-in media variants—mobile-first with customizable breakpoints.
- **Zero config**
  Just install and import; no extra setup, no build step required.
- **TypeScript support**
  Fully typed API with token autocomplete and type-safe style keys.

## 🚀 Installation

```bash
npm install sylphry
# or
yarn add sylphry
```

## 🔧 Quickstart

```ts
import { createStyles } from "sylphry";

export default function Component() {
  return (
    <>
      <div className={styles.style1}>Hello</div>
      <div className={styles.style2}>World</div>
      <div className={styles(["style1", ["style2", false]])}>Merged</div>
      <div className={styles({ style2: true, style1: true })}>
        Another way to merge
      </div>
    </>
  );
}

const styles = createStyles({
  style1: {
    height: 100,
    width: 200,
    md: {
      height: 200,
      width: 300,
    },
    backgroundColor: "blue",
    ":hover": {
      backgroundColor: "green",
    },
  },
  style2: {
    height: 100,
    width: 200,
    "md:height": 200,
    "md:width": 300,
    backgroundColor: "orange",
  },
});
```

#### Composite Keys

Composite keys can be used as a shorthand for nested styles. Multiple breakpoints and pseudo styles can be combined, but only one `CSSProperty` can be used per composite key.

```ts
// breakpoint: sm, padding, :hover
"sm:padding:hover": <value>,
// "Create pseudo styling for :active:focus combo for both md and lg breakpoints
"md:lg:active:focus": { ... }
```

## 📖 API

### `createStyles(definitions, options?)`

Returns a function that:

- Accepts **flags** as an object `{ key: boolean }` or an array of keys/tuples
- Returns a unique class name string
- Has properties for each key, e.g. `styles.container`

`options` param:

```ts
type Options = {
  // Set a prefix for the all generated classnames. Useful for finding classes in the browser
  prefix?: string;
};
```

### `setTheme(themeName)`

Switches the active theme and rebuilds dynamic styles. Will use `default` theme if no matches are found.

---

## 🔄 Theming & Tokens

### Global Breakpoint and Token Definitions

#### Setup

There are 2 steps:

1. Create a config file at the root: `sylphry.config.cjs`
2. Install the sylphry vite plugin

#### Config

At the root of the project, create a config file `sylphry.config.cjs`.

Config Interface:

```ts
type Config = {
  // Media breakpoint definitions
  breakpoints?: Record<string, string>;
  // Global token definitions
  tokens?: Record<string, string | number | Tokens>;
  // Default unit for numeric values - defaults to "px"
  defaultUnit?: string;
  // The current theme to reference in the tokens - defaults to "default"
  activeTheme?: string;
};
```

Example Config: `sylphry.config.cjs`

```ts
module.exports = {
  breakpoints: {
    phone: "100px",
    tablet: "500px",
  },
  tokens: {
    fontFamily: "Arial, Helvetica, sans-serif",
    default: {
      primary: "#3498db",
      secondary: "#e74c3c",
      accent: "#f1c40f",
      spacing: {
        xs: "2px",
        sm: "40px",
        md: "8px",
        lg: "16px",
        xl: "32px",
      },
      fontSizes: {
        sm: "12px",
        md: "16px",
        lg: "20px",
        xl: "24px",
      },
    },
    dark: {
      primary: "#1f3a93",
      secondary: "#c0392b",
      accent: "#f39c12",
    },
    light: {
      primary: "#5dade2",
      secondary: "#ec7063",
      accent: "#f7dc6f",
    },
  },
  activeTheme: "dark",
};
```

#### Vite Plugin

Install the Vite plugin in `vite.config.ts`

```ts
import { defineConfig } from "vite";
import sylphry from "sylphry/vite-plugin";

export default defineConfig({
  plugins: [sylphry()],
});
```

#### Token Usage

- Use `$tokenName$` in any string value to inject token colors, spacing, etc.
- Supports default fallback if a token is missing in the active theme.
- Tokens can also provide a path `$path1:path2:tokenName$` to use specific tokens. This will still try to fallback to `default` if not found otherwise it will keep the original string.

```ts
const styles = createStyles({
  btn: {
    // Will attempt to find primary defined at the root, then at the active theme, then at the default theme
    background: "$primary$",
    ":hover": {
      // Will always use dark -> secondary even if the theme is something else
      background: "$dark:secondary$",
    },
  },
});
```

#### `styles` Options

The returned function from `createStyles` has an optional second param `options`.

```ts
type Options = {
  // Set a prefix for the generated classname. Useful for finding classes in the browser. This overrides the prefix set by createStyles
  prefix?: string;
  // Same structure as config. These token definitions will take priority over the tokens in the general config.
  tokens?: Tokens;
};
```

Example:

```ts
export default function Component() {
  const [color, setColor] = useState("green");
  const onClick = () => {
    setColor(prev => (prev === "green" ? "blue" : "green"));
  };

  return (
    <div
      className={styles(["style1"], {
        tokens: { color },
      })}
    >
      Hello
    </div>
  );
}

const styles = createStyles({
  style1: {
    backgroundColor: $color$,
  },
});
```

---

## 🛠️ Contributing

1. Fork the [Sylphry Repo](https://github.com/avisprince/sylphry)
2. Create your feature branch (`git checkout -b feat/YourFeature`)
3. Commit your changes (`git commit -m 'feat: add YourFeature'`)
4. Push to the branch (`git push origin feat/YourFeature`)
5. Open a Pull Request

Please follow the existing code style and run tests before opening a PR.

---

## 📄 License

This project is licensed under the **MIT License**. See [LICENSE](./LICENSE) for details.
