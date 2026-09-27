import { Filter, GlProgram, defaultFilterVert } from './vendor/pixi.min.mjs';
import { config } from './config.js';

const fragment = `
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform float uThreshold;
uniform float uSoftness;
void main(void) {
  vec4 s = texture(uTexture, vTextureCoord);
  float field = max(max(s.r, s.g), s.b);
  float alpha = smoothstep(uThreshold - uSoftness, uThreshold + uSoftness, field);
  vec3 rgb = s.rgb / max(field, 1e-4);
  finalColor = vec4(rgb * alpha, alpha);
}
`;

export function createMetaballFilter() {
  const { threshold, softness, padding } = config.metaball;
  const filter = new Filter({
    glProgram: GlProgram.from({
      vertex: defaultFilterVert,
      fragment,
    }),
    resources: {
      metaballUniforms: {
        uThreshold: { value: threshold, type: 'f32' },
        uSoftness: { value: softness, type: 'f32' },
      },
    },
  });
  filter.padding = padding;
  return filter;
}
