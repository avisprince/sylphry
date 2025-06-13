# Sylphry

**Atomic CSS-in-JS: framework-agnostic, tokenized theming & breakpoints—import and go.**

## COMING SOON!!

---

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

---

## 🚀 Installation

```bash
npm install sylphry
# or
yarn add sylphry
```

---

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

---

## 📖 API

### `initialize(options)`

- **`tokens?`** – your token map (themes × token names)
- **`breakpoints?`** – override default breakpoints
- **`defaultUnit?`** – unit for numeric values (default: `"px"`)
- **`prefix?`** – class-name prefix (e.g. `"sylphry"`)

### `createStyles(definitions, options?)`

Returns a function that:

- Accepts **flags** as an object `{ key: boolean }` or an array of keys/tuples
- Returns a unique class name string
- Has properties for each key, e.g. `useStyles.container`

#### Definitions shape

```ts
type NestedStyles = Record<string, string | number> | CSSProperties;

interface CreateStylesOptions {
  breakpoints?: Record<string, string>;
  defaultUnit?: string;
  prefix?: string;
  tokens?: ThemeTokens;
}
```

### `setTheme(themeName)`

Switches the active theme (must match one of your token keys) and rebuilds dynamic styles.

---

## 🔄 Theming & Tokens

- Use `$tokenName$` in any string value to inject token colors, spacing, etc.
- Supports default-theme fallback if a token is missing in the active theme.

```ts
const useBtn = createStyles({
  btn: {
    background: "$primary$",
    ":hover": { background: "$secondary$" },
  },
});
```

---

## 🎛 Custom Breakpoints

Override or extend the built-in breakpoints:

```ts
initialize({
  breakpoints: {
    sm: "480px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
  },
});
```

Then in your styles:

```ts
const useBox = createStyles({
  box: {
    width: 100,
    sm: { width: 150 },
    md: { width: 200 },
  },
});
```

---

## 🛠️ Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feat/YourFeature`)
3. Commit your changes (`git commit -m 'feat: add YourFeature'`)
4. Push to the branch (`git push origin feat/YourFeature`)
5. Open a Pull Request

Please follow the existing code style and run tests before opening a PR.

---

## 📄 License

This project is licensed under the **MIT License**. See [LICENSE](./LICENSE) for details.

---

_Made with 💨 by Avi Prince(https://github.com/avisprince)_
