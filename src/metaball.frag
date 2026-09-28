in vec2 vTextureCoord;
out vec4 finalColor;
uniform sampler2D uTexture;
uniform float uThreshold;
uniform float uSoftness;
uniform float uStroke;
uniform float uFillAlpha;

void main(void) {
  vec4 s = texture(uTexture, vTextureCoord);
  float field = max(max(s.r, s.g), s.b);
  vec3 rgb = s.rgb / max(field, 1e-4);
  float outer = uThreshold - uStroke;
  float edge = smoothstep(outer, outer + uSoftness, field);
  float fill = smoothstep(uThreshold, uThreshold + uSoftness, field);
  float alpha = mix(edge, uFillAlpha, fill);
  finalColor = vec4(rgb * alpha, alpha);
}
