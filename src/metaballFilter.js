import { Filter, GlProgram, defaultFilterVert } from './vendor/pixi.min.mjs';
import { config } from './config.js';

const fragment = await fetch(new URL('./metaball.frag', import.meta.url)).then((r) => {
  if (!r.ok) throw new Error(`metaball.frag ${r.status}`);
  return r.text();
});

export function createMetaballFilter() {
  const { threshold, softness, stroke, fillAlpha, padding } = config.metaball;
  const filter = new Filter({
    glProgram: GlProgram.from({
      vertex: defaultFilterVert,
      fragment,
    }),
    resources: {
      metaballUniforms: {
        uThreshold: { value: threshold, type: 'f32' },
        uSoftness: { value: softness, type: 'f32' },
        uStroke: { value: stroke, type: 'f32' },
        uFillAlpha: { value: fillAlpha, type: 'f32' },
      },
    },
  });
  filter.padding = padding;
  return filter;
}

export function metaballAlpha(field, threshold, softness, stroke, fillAlpha) {
  const edge = smoothstep(threshold - stroke, threshold - stroke + softness, field);
  const fill = smoothstep(threshold, threshold + softness, field);
  return edge * (1 - fill) + fillAlpha * fill;
}

function smoothstep(e0, e1, x) {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

function assertStroke() {
  const { threshold, softness, stroke, fillAlpha } = config.metaball;
  if (metaballAlpha(0, threshold, softness, stroke, fillAlpha) !== 0) {
    throw new Error('metaball outside should be empty');
  }
  const rim = threshold - stroke * 0.5;
  const core = 1;
  if (!(metaballAlpha(rim, threshold, softness, stroke, fillAlpha) > fillAlpha)) {
    throw new Error('metaball stroke should be more solid than the fill');
  }
  if (Math.abs(metaballAlpha(core, threshold, softness, stroke, fillAlpha) - fillAlpha) > 1e-6) {
    throw new Error('metaball core should use fill alpha');
  }
}

assertStroke();
