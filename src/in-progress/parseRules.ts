import { globalConfig } from "../config";
import { ParsedRules, Primitive, Style } from "../types/core.types";
import { PSEUDO_NAMES } from "../types/pseudo.types";
import { isObject } from "../utils";

interface Context {
  bps: string[];
  pseudos: string[];
}

export function parseRules(rules: Style): ParsedRules {
  const statics: ParsedRules["statics"] = [];
  const pseudos: ParsedRules["pseudos"] = [];
  const variants: ParsedRules["variants"] = {};

  function walk(node: unknown, ctx: Context = { bps: [], pseudos: [] }) {
    if (!isObject(node)) return;

    for (const [key, rawValue] of Object.entries(node)) {
      if (rawValue == null) continue;

      // split into parts around “:”
      const parts = key.split(":").filter(Boolean);
      const bps = parts.filter(p => p in globalConfig.breakpoints);
      const pseus = parts.filter(p => PSEUDO_NAMES.has(p));
      const props = parts.filter(p => !bps.includes(p) && !pseus.includes(p));

      // 1) Primitive leaf: must have exactly one prop
      if (!isObject(rawValue)) {
        if (props.length !== 1) {
          throw new Error(
            `Invalid composite key "${key}": expected exactly one CSS property but found [${props.join(
              ", "
            )}]`
          );
        }
        const prop = props[0];
        const allBps = [...ctx.bps, ...bps];
        const allPseus = [...ctx.pseudos, ...pseus];
        const pseudo = allPseus.length ? allPseus.join(":") : undefined;

        if (allBps.length) {
          for (const bp of allBps) {
            variants[bp] ||= [];
            variants[bp]!.push({ prop, raw: rawValue as Primitive, pseudo });
          }
        } else if (allPseus.length) {
          for (const ps of allPseus) {
            pseudos.push([ps, prop, rawValue as Primitive]);
          }
        } else {
          statics.push([prop, rawValue as Primitive]);
        }
        continue;
      } else {
        // 2) Grouping object:
        //    - If it's a single-part key (no “:”), always recurse.
        //    - If it's multi-part with props, error.
        if (parts.length > 1 && props.length > 0) {
          // only error when a composite key (has “:”) carries props on an object
          throw new Error(
            `Invalid composite key "${key}": qualifiers [${[
              ...bps,
              ...pseus,
            ].join(
              ", "
            )}] cannot be combined with object value containing props [${props.join(
              ", "
            )}]`
          );
        }
        // otherwise treat as grouping — accumulate qualifiers and recurse
        walk(rawValue, {
          bps: [...ctx.bps, ...bps],
          pseudos: [...ctx.pseudos, ...pseus],
        });
      }
    }
  }

  walk(rules);
  return { statics, pseudos, variants };
}
