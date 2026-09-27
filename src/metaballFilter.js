import { Filter, GlProgram, defaultFilterVert } from '../pixi.min.mjs';
import { config } from '../config.js';

const fragment = `
in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform float uThreshold;
uniform float uSoftness;
uniform vec4 uColor;
void main(void) {
  float field = texture(uTexture, vTextureCoord).r;
  float alpha = smoothstep(uThreshold - uSoftness, uThreshold + uSoftness, field);
  finalColor = vec4(uColor.rgb * alpha, uColor.a * alpha);
}
`;

export function createMetaballFilter() {
  const { threshold, softness, color, padding } = config.metaball;
  const filter = new Filter({
    glProgram: GlProgram.from({
      vertex: defaultFilterVert,
      fragment,
    }),
    resources: {
      metaballUniforms: {
        uThreshold: { value: threshold, type: 'f32' },
        uSoftness: { value: softness, type: 'f32' },
        uColor: { value: color, type: 'vec4<f32>' },
      },
    },
  });
  filter.padding = padding;
  return filter;
}
