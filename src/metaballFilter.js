import { Filter, GlProgram, defaultFilterVert } from "./vendor/pixi.min.mjs";
import { config } from "./config.js";

const fragment = await fetch(new URL("./metaball.frag", import.meta.url)).then(
  (r) => {
    if (!r.ok) throw new Error(`metaball.frag ${r.status}`);
    return r.text();
  },
);

export function createMetaballFilter() {
  const { threshold, padding } = config.metaball;
  const filter = new Filter({
    glProgram: GlProgram.from({
      vertex: defaultFilterVert,
      fragment,
    }),
    resources: {
      metaballUniforms: {
        uThreshold: { value: threshold, type: "f32" },
      },
    },
  });
  filter.padding = padding;
  return filter;
}

export function metaballBody(a, threshold) {
  return smoothstep(threshold - 0.04, threshold + 0.02, a);
}

function smoothstep(e0, e1, x) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}
