import { Color, SRGBColorSpace, Vector3 } from 'three'
import type { MeshPhysicalMaterial } from 'three'
import type { ResolvedWrapVisual } from './wrapMaterialProfiles'

type WrapShader = Parameters<
  NonNullable<MeshPhysicalMaterial['onBeforeCompile']>
>[0]

type WrapShaderUniforms = {
  effectKind: { value: number }
  effectStrength: { value: number }
  fresnelStrength: { value: number }
  seed: { value: number }
  grazingColor: { value: Color }
  secondaryColor: { value: Color }
  tertiaryColor: { value: Color }
}

type WrapShaderState = {
  uniforms: WrapShaderUniforms
}

type WrapShaderUserData = MeshPhysicalMaterial['userData'] & {
  modifyWrapShaderProgramKey?: string
  modifyWrapShaderState?: WrapShaderState
}

export type WrapLightingStateUpdate = {
  color?: Color | string
  intensity?: number
  position?: Vector3 | readonly [number, number, number]
}

const sharedWrapLightingUniforms = {
  color: { value: new Color('#ffffff') },
  intensity: { value: 0.72 },
  position: { value: new Vector3(5.5, 4.5, 4.5) },
}

export function setWrapLightingState(update: WrapLightingStateUpdate) {
  if (update.position) {
    if (update.position instanceof Vector3) {
      sharedWrapLightingUniforms.position.value.copy(update.position)
    } else {
      sharedWrapLightingUniforms.position.value.set(...update.position)
    }
  }

  if (update.color) {
    if (update.color instanceof Color) {
      sharedWrapLightingUniforms.color.value.copy(update.color)
    } else {
      sharedWrapLightingUniforms.color.value.setStyle(
        update.color,
        SRGBColorSpace,
      )
    }
  }

  if (typeof update.intensity === 'number') {
    sharedWrapLightingUniforms.intensity.value = Math.min(
      1.5,
      Math.max(0, update.intensity),
    )
  }
}

const wrapShaderProgramKey = 'modifywrap-official-wrap-pbr-v6'

const wrapShaderGlobals = `
uniform float uWrapEffectKind;
uniform float uWrapEffectStrength;
uniform float uWrapFresnelStrength;
uniform float uWrapSeed;
uniform vec3 uWrapGrazingColor;
uniform vec3 uWrapSecondaryColor;
uniform vec3 uWrapTertiaryColor;
uniform vec3 uWrapLightPosition;
uniform vec3 uWrapLightColor;
uniform float uWrapLightIntensity;
varying vec3 vWrapWorldPosition;
varying vec3 vWrapWorldNormal;

float wrapHash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float wrapValueNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = smoothstep(vec3(0.0), vec3(1.0), fract(p));
  float n000 = wrapHash13(i + vec3(0.0, 0.0, 0.0));
  float n100 = wrapHash13(i + vec3(1.0, 0.0, 0.0));
  float n010 = wrapHash13(i + vec3(0.0, 1.0, 0.0));
  float n110 = wrapHash13(i + vec3(1.0, 1.0, 0.0));
  float n001 = wrapHash13(i + vec3(0.0, 0.0, 1.0));
  float n101 = wrapHash13(i + vec3(1.0, 0.0, 1.0));
  float n011 = wrapHash13(i + vec3(0.0, 1.0, 1.0));
  float n111 = wrapHash13(i + vec3(1.0, 1.0, 1.0));
  float nx00 = mix(n000, n100, f.x);
  float nx10 = mix(n010, n110, f.x);
  float nx01 = mix(n001, n101, f.x);
  float nx11 = mix(n011, n111, f.x);
  float nxy0 = mix(nx00, nx10, f.y);
  float nxy1 = mix(nx01, nx11, f.y);
  return mix(nxy0, nxy1, f.z);
}

vec3 wrapTriplanarWeights(vec3 normal) {
  vec3 blend = max(abs(normalize(normal)), vec3(0.0001));
  blend = pow(blend, vec3(3.0));
  return blend / (blend.x + blend.y + blend.z);
}

float wrapFineLine(vec2 uv, float scale) {
  float line = sin((uv.x * 0.72 + uv.y * 0.28) * scale + uWrapSeed * 6.28318);
  float aa = max(fwidth(line), 0.015);
  return smoothstep(-aa, aa, line);
}

float wrapBrushPattern(vec3 position, vec3 normal) {
  vec3 weights = wrapTriplanarWeights(normal);
  float yz = wrapFineLine(position.yz, 185.0);
  float xz = wrapFineLine(position.xz, 210.0);
  float xy = wrapFineLine(position.xy, 195.0);
  return dot(vec3(yz, xz, xy), weights);
}

vec3 wrapCarbonTriplanarWeights(vec3 normal) {
  vec3 blend = max(abs(normalize(normal)), vec3(0.0001));

  // Sharper projection selection prevents three different weave
  // directions from overlapping across curved body panels.
  blend = pow(blend, vec3(8.0));

  float total = max(blend.x + blend.y + blend.z, 0.0001);
  return blend / total;
}

float wrapCarbonAAStripe(float coordinate, float halfWidth) {
  float distanceToCenter = abs(fract(coordinate) - 0.5);

  // Screen-space antialiasing prevents sparkling and moire.
  float aa = max(fwidth(coordinate) * 1.25, 0.002);

  return 1.0 - smoothstep(
    halfWidth - aa,
    halfWidth + aa,
    distanceToCenter
  );
}

float wrapCarbonPlane(vec2 uv) {
  // World-space scale. Higher than the old value so the weave
  // no longer appears as oversized tiles.
  vec2 scaled = uv * 42.0;

  // Dominant twill direction plus a subtle under-weave.
  float primary = wrapCarbonAAStripe(
    scaled.x + scaled.y,
    0.17
  );

  float secondary = wrapCarbonAAStripe(
    scaled.x - scaled.y + 0.5,
    0.11
  );

  float weave = clamp(
    primary * 0.76 + secondary * 0.24,
    0.0,
    1.0
  );

  // When the weave becomes smaller than a screen pixel,
  // fade it to its average instead of allowing white noise.
  float footprint = length(fwidth(scaled));
  float detailVisibility =
    1.0 - smoothstep(0.45, 1.2, footprint);

  return mix(0.5, weave, detailVisibility);
}

float wrapCarbonPattern(vec3 position, vec3 normal) {
  vec3 weights = wrapCarbonTriplanarWeights(normal);

  float yz = wrapCarbonPlane(position.yz);
  float xz = wrapCarbonPlane(position.xz);
  float xy = wrapCarbonPlane(position.xy);

  return dot(vec3(yz, xz, xy), weights);
}

float wrapPatternedEmboss(vec3 position, vec3 normal) {
  vec3 weights = wrapTriplanarWeights(normal);
  vec2 uv = position.xz * weights.y + position.xy * weights.z + position.yz * weights.x;
  vec2 cell = fract(uv * 22.0);
  float crossA = 1.0 - smoothstep(0.035, 0.11, abs(cell.x - 0.5));
  float crossB = 1.0 - smoothstep(0.035, 0.11, abs(cell.y - 0.5));
  return max(crossA, crossB) * 0.75;
}

float wrapMicroflake(vec3 position, float scale, float threshold) {
  vec3 cell = floor(position * scale + uWrapSeed * 29.0);
  return smoothstep(threshold, 1.0, wrapHash13(cell));
}

float wrapRuggedNoise(vec3 position) {
  float low = wrapValueNoise(position * 26.0 + uWrapSeed * 11.0);
  float high = wrapValueNoise(position * 71.0 + uWrapSeed * 17.0);
  return mix(low, high, 0.35);
}
`

const wrapVertexVaryings = `
varying vec3 vWrapWorldPosition;
varying vec3 vWrapWorldNormal;
`

const wrapVertexAssignments = `
vec4 wrapWorldPosition = modelMatrix * vec4(transformed, 1.0);
vWrapWorldPosition = wrapWorldPosition.xyz;
vWrapWorldNormal = normalize(mat3(modelMatrix) * objectNormal);
`

const wrapColorFragment = `
vec3 wrapNormal = normalize(vWrapWorldNormal);
vec3 wrapView = normalize(cameraPosition - vWrapWorldPosition);
vec3 wrapLight = normalize(uWrapLightPosition - vWrapWorldPosition);
vec3 wrapHalfVector = normalize(wrapLight + wrapView);

float wrapFacing = clamp(dot(wrapNormal, wrapView), 0.0, 1.0);
float wrapFresnel = 1.0 - wrapFacing;
float wrapNdotL = clamp(dot(wrapNormal, wrapLight), 0.0, 1.0);
float wrapHalfHighlight = pow(
  clamp(dot(wrapNormal, wrapHalfVector), 0.0, 1.0),
  22.0
);
float wrapLightResponse = clamp(
  (
    smoothstep(0.04, 0.96, wrapNdotL) * 0.72 +
    wrapHalfHighlight * 0.28
  ) * uWrapLightIntensity,
  0.0,
  1.0
);

float wrapFilmAngle = pow(clamp(wrapFresnel, 0.0, 1.0), 1.35);
float wrapFilmBlend = clamp(
  smoothstep(0.06, 0.92, wrapFilmAngle) * uWrapFresnelStrength,
  0.0,
  0.45
);
diffuseColor.rgb = mix(
  diffuseColor.rgb,
  uWrapGrazingColor,
  wrapFilmBlend
);

// A very small light-facing lift prevents dark colors from looking like a
// flat black overlay while leaving the physical clearcoat reflection intact.
diffuseColor.rgb *= mix(0.985, 1.035, wrapLightResponse);

if (abs(uWrapEffectKind - 1.0) < 0.5) {
  float flake = wrapMicroflake(vWrapWorldPosition, 235.0, 0.994);
  float sparkle = flake * wrapHalfHighlight * uWrapEffectStrength;
  diffuseColor.rgb += uWrapLightColor * sparkle * 0.16;
}

if (abs(uWrapEffectKind - 8.0) < 0.5) {
  // Broad light creates a wide golden-copper midtone.
  float broadLight = smoothstep(0.02, 0.82, wrapNdotL);

  // Keeps the golden response visible across curved body panels,
  // rather than only at the extreme outer edge.
  float curvatureBand =
    smoothstep(0.05, 0.52, wrapFresnel) *
    (1.0 - smoothstep(0.78, 0.98, wrapFresnel));

  float liquidResponse = clamp(
    broadLight * 0.72 +
    curvatureBand * 0.44 +
    wrapHalfHighlight * 0.24,
    0.0,
    1.0
  );

  // Stronger internal gold than the previous version.
  vec3 liquidCopperColor = mix(
    uWrapGrazingColor,
    uWrapTertiaryColor,
    0.58
  );

  float goldenBlend =
    smoothstep(0.10, 0.92, liquidResponse) *
    (0.30 + uWrapEffectStrength * 0.72);

  goldenBlend = clamp(goldenBlend, 0.0, 0.72);

  diffuseColor.rgb = mix(
    diffuseColor.rgb,
    liquidCopperColor,
    goldenBlend
  );

  // Retain deep copper shadows for contrast.
  float shadowMask =
    (1.0 - broadLight) *
    (1.0 - smoothstep(0.58, 0.95, wrapFresnel));

  diffuseColor.rgb *=
    1.0 -
    shadowMask *
    (0.08 + uWrapEffectStrength * 0.12);

  // Subtle warm metallic variation beneath the clearcoat.
  float warmGrain = wrapValueNoise(
    vWrapWorldPosition * 265.0 + uWrapSeed * 23.0
  );

  float warmVariation = mix(
    0.970,
    1.035,
    warmGrain
  );

  diffuseColor.rgb *= mix(
    1.0,
    warmVariation,
    uWrapEffectStrength * 0.55
  );

  // Fine golden particles.
  float liquidFlake = wrapMicroflake(
    vWrapWorldPosition,
    260.0,
    0.982
  );

  float liquidGlint =
    liquidFlake *
    smoothstep(0.10, 0.90, wrapNdotL) *
    mix(0.35, 1.0, wrapHalfHighlight) *
    uWrapEffectStrength;

  vec3 goldenGlint = mix(
    uWrapGrazingColor,
    uWrapTertiaryColor,
    0.82
  );

  diffuseColor.rgb +=
    goldenGlint *
    liquidGlint *
    0.12;
}

if (abs(uWrapEffectKind - 2.0) < 0.5) {
  float viewPearl = smoothstep(0.18, 0.92, wrapFresnel);
  float lightPearl = smoothstep(0.14, 0.92, wrapLightResponse) *
    mix(0.28, 0.58, wrapFresnel);
  float pearl = max(viewPearl * 0.62, lightPearl) * uWrapEffectStrength;
  diffuseColor.rgb = mix(diffuseColor.rgb, uWrapSecondaryColor, pearl * 0.32);
}

if (abs(uWrapEffectKind - 3.0) < 0.5) {
  float angular = pow(clamp(wrapFresnel, 0.0, 1.0), 0.72);
  float viewMidShift = smoothstep(0.08, 0.62, angular);
  float lightShift = smoothstep(0.12, 0.92, wrapLightResponse);
  float midShift = clamp(
    (viewMidShift * 0.72 + lightShift * 0.28) * uWrapEffectStrength,
    0.0,
    0.9
  );
  float edgeShift = smoothstep(0.56, 0.96, angular) * uWrapEffectStrength;

  vec3 illuminatedColor = mix(
    diffuseColor.rgb,
    uWrapSecondaryColor,
    lightShift * 0.42 * uWrapEffectStrength
  );
  vec3 shiftedColor = mix(illuminatedColor, uWrapSecondaryColor, midShift * 0.72);
  vec3 edgeColor = mix(uWrapGrazingColor, uWrapTertiaryColor, 0.34);
  diffuseColor.rgb = mix(shiftedColor, edgeColor, edgeShift * 0.82);
}

if (abs(uWrapEffectKind - 4.0) < 0.5) {
  float weave = wrapCarbonPattern(
    vWrapWorldPosition,
    wrapNormal
  );

  // Carbon should be revealed mainly through surface response,
  // not through high-contrast white and black pixels.
  float weaveTone = mix(0.982, 1.018, weave);

  diffuseColor.rgb *= mix(
    1.0,
    weaveTone,
    uWrapEffectStrength * 0.72
  );
}

if (abs(uWrapEffectKind - 6.0) < 0.5) {
  float rugged = wrapRuggedNoise(vWrapWorldPosition);
  float ruggedTone = mix(0.965, 1.025, rugged);
  diffuseColor.rgb *= mix(1.0, ruggedTone, uWrapEffectStrength);
}

if (abs(uWrapEffectKind - 7.0) < 0.5) {
  float flake = wrapMicroflake(vWrapWorldPosition, 190.0, 0.992);
  float sparkle = flake * wrapHalfHighlight * uWrapEffectStrength;
  diffuseColor.rgb += uWrapLightColor * sparkle * 0.38;
}

if (abs(uWrapEffectKind - 9.0) < 0.5) {
  float viewPearl = smoothstep(0.22, 0.94, wrapFresnel);
  float lightPearl = smoothstep(0.16, 0.94, wrapLightResponse) *
    mix(0.2, 0.48, wrapFresnel);
  float pearl = max(viewPearl * 0.68, lightPearl) * uWrapEffectStrength;
  diffuseColor.rgb = mix(diffuseColor.rgb, uWrapSecondaryColor, pearl * 0.28);
}

if (abs(uWrapEffectKind - 10.0) < 0.5) {
  float emboss = wrapPatternedEmboss(vWrapWorldPosition, wrapNormal);
  float embossTone = mix(0.96, 1.025, emboss);
  diffuseColor.rgb *= mix(1.0, embossTone, uWrapEffectStrength);
}
`


const wrapRoughnessFragment = `
if (abs(uWrapEffectKind - 1.0) < 0.5) {
  float micro = wrapValueNoise(vWrapWorldPosition * 240.0 + uWrapSeed * 17.0);
  roughnessFactor = clamp(
    roughnessFactor + (micro - 0.5) * 0.035 * uWrapEffectStrength,
    0.08,
    1.0
  );
}

if (abs(uWrapEffectKind - 8.0) < 0.5) {
  float liquidGrain = wrapValueNoise(
    vWrapWorldPosition * 295.0 + uWrapSeed * 19.0
  );

  float liquidFlake = wrapMicroflake(
    vWrapWorldPosition,
    310.0,
    0.988
  );

  roughnessFactor = clamp(
    roughnessFactor +
    (liquidGrain - 0.5) * 0.045 * uWrapEffectStrength -
    liquidFlake * 0.070 * uWrapEffectStrength,
    0.06,
    0.55
  );
}

if (abs(uWrapEffectKind - 4.0) < 0.5) {
  float weave = wrapCarbonPattern(
    vWrapWorldPosition,
    vWrapWorldNormal
  );

  // Preserve the calibrated roughness value and add only
  // a small weave response around it.
  roughnessFactor = clamp(
    roughnessFactor +
      (weave - 0.5) *
      0.065 *
      uWrapEffectStrength,
    0.08,
    1.0
  );
}

if (abs(uWrapEffectKind - 5.0) < 0.5) {
  float brush = wrapBrushPattern(vWrapWorldPosition, vWrapWorldNormal);
  roughnessFactor = clamp(
    roughnessFactor + (brush - 0.5) * 0.16 * uWrapEffectStrength,
    0.12,
    0.72
  );
}

if (abs(uWrapEffectKind - 6.0) < 0.5) {
  float rugged = wrapRuggedNoise(vWrapWorldPosition);
  roughnessFactor = clamp(
    roughnessFactor + (rugged - 0.5) * 0.16 * uWrapEffectStrength,
    0.52,
    0.94
  );
}

if (abs(uWrapEffectKind - 7.0) < 0.5) {
  float flake = wrapMicroflake(vWrapWorldPosition, 190.0, 0.992);
  roughnessFactor = clamp(
    roughnessFactor - flake * 0.18 * uWrapEffectStrength,
    0.055,
    1.0
  );
}

if (abs(uWrapEffectKind - 9.0) < 0.5) {
  float micro = wrapValueNoise(vWrapWorldPosition * 170.0 + uWrapSeed * 13.0);
  roughnessFactor = clamp(
    roughnessFactor + (micro - 0.5) * 0.025 * uWrapEffectStrength,
    0.1,
    1.0
  );
}

if (abs(uWrapEffectKind - 10.0) < 0.5) {
  float emboss = wrapPatternedEmboss(vWrapWorldPosition, vWrapWorldNormal);
  roughnessFactor = clamp(
    roughnessFactor + (emboss - 0.5) * 0.14 * uWrapEffectStrength,
    0.28,
    0.86
  );
}
`

const wrapMetalnessFragment = `
if (abs(uWrapEffectKind - 1.0) < 0.5) {
  float micro = wrapValueNoise(vWrapWorldPosition * 240.0 + uWrapSeed * 17.0);
  metalnessFactor = clamp(
    metalnessFactor + (micro - 0.5) * 0.025 * uWrapEffectStrength,
    0.0,
    1.0
  );
}

if (abs(uWrapEffectKind - 8.0) < 0.5) {
  float liquidGrain = wrapValueNoise(
    vWrapWorldPosition * 265.0 + uWrapSeed * 31.0
  );

  float liquidFlake = wrapMicroflake(
    vWrapWorldPosition,
    310.0,
    0.988
  );

  metalnessFactor = clamp(
    metalnessFactor +
    (liquidGrain - 0.5) * 0.040 * uWrapEffectStrength +
    liquidFlake * 0.090 * uWrapEffectStrength,
    0.0,
    1.0
  );
}

if (abs(uWrapEffectKind - 7.0) < 0.5) {
  float flake = wrapMicroflake(vWrapWorldPosition, 190.0, 0.992);
  metalnessFactor = clamp(
    metalnessFactor + flake * 0.08 * uWrapEffectStrength,
    0.0,
    1.0
  );
}
`

function getEffectKind(preset: ResolvedWrapVisual['preset']): number {
  if (preset === 'metallic') {
    return 1
  }

  if (preset === 'liquid_metallic') {
  return 8
}

  if (preset === 'pearl') {
    return 2
  }

  if (preset === 'color_shift') {
    return 3
  }

  if (preset === 'carbon_fiber') {
  // Carbon now uses UV normal and roughness maps.
  // Do not run the old triplanar procedural effect.
  return 0
}

  if (preset === 'brushed_metal') {
    return 5
  }

  if (preset === 'rugged_texture') {
    return 6
  }

  if (preset === 'diamond_flake') {
    return 7
  }

  if (preset === 'special_effect') {
    return 9
  }

  if (preset === 'patterned_texture') {
    return 10
  }

  return 0
}

function getSeed(manufacturerCode: string, preset: string): number {
  let hash = 2166136261
  const seedText = `${preset}:${manufacturerCode}`

  for (let index = 0; index < seedText.length; index += 1) {
    hash ^= seedText.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0) / 4294967295
}

function createUniforms(visual: ResolvedWrapVisual): WrapShaderUniforms {
  const grazingColor = new Color().setStyle(
    visual.grazingColor,
    SRGBColorSpace,
  )
  const secondaryColor = new Color().setStyle(
    visual.secondaryColor ?? visual.baseColor,
    SRGBColorSpace,
  )
  const tertiaryColor = new Color().setStyle(
    visual.tertiaryColor ?? visual.secondaryColor ?? visual.baseColor,
    SRGBColorSpace,
  )

  return {
    effectKind: { value: getEffectKind(visual.preset) },
    effectStrength: { value: visual.effectStrength },
    fresnelStrength: { value: visual.fresnelStrength },
    seed: { value: getSeed(visual.manufacturerCode, visual.preset) },
    grazingColor: { value: grazingColor },
    secondaryColor: { value: secondaryColor },
    tertiaryColor: { value: tertiaryColor },
  }
}

function getUserData(material: MeshPhysicalMaterial): WrapShaderUserData {
  return material.userData as WrapShaderUserData
}

function replaceChunk(source: string, marker: string, replacement: string): string {
  if (!source.includes(marker)) {
    return source
  }

  return source.replace(marker, `${marker}\n${replacement}`)
}

function patchShader(shader: WrapShader, uniforms: WrapShaderUniforms) {
  shader.uniforms.uWrapEffectKind = uniforms.effectKind
  shader.uniforms.uWrapEffectStrength = uniforms.effectStrength
  shader.uniforms.uWrapFresnelStrength = uniforms.fresnelStrength
  shader.uniforms.uWrapSeed = uniforms.seed
  shader.uniforms.uWrapGrazingColor = uniforms.grazingColor
  shader.uniforms.uWrapSecondaryColor = uniforms.secondaryColor
  shader.uniforms.uWrapTertiaryColor = uniforms.tertiaryColor
  shader.uniforms.uWrapLightPosition = sharedWrapLightingUniforms.position
  shader.uniforms.uWrapLightColor = sharedWrapLightingUniforms.color
  shader.uniforms.uWrapLightIntensity = sharedWrapLightingUniforms.intensity

  shader.vertexShader = replaceChunk(
    shader.vertexShader,
    '#include <common>',
    wrapVertexVaryings,
  )
  shader.vertexShader = replaceChunk(
    shader.vertexShader,
    '#include <begin_vertex>',
    wrapVertexAssignments,
  )
  shader.fragmentShader = replaceChunk(
    shader.fragmentShader,
    '#include <common>',
    wrapShaderGlobals,
  )
  shader.fragmentShader = replaceChunk(
    shader.fragmentShader,
    '#include <color_fragment>',
    wrapColorFragment,
  )
  shader.fragmentShader = replaceChunk(
    shader.fragmentShader,
    '#include <roughnessmap_fragment>',
    wrapRoughnessFragment,
  )
  shader.fragmentShader = replaceChunk(
    shader.fragmentShader,
    '#include <metalnessmap_fragment>',
    wrapMetalnessFragment,
  )
}

function updateUniforms(
  uniforms: WrapShaderUniforms,
  visual: ResolvedWrapVisual,
) {
  uniforms.effectKind.value = getEffectKind(visual.preset)
  uniforms.effectStrength.value = visual.effectStrength
  uniforms.fresnelStrength.value = visual.fresnelStrength
  uniforms.seed.value = getSeed(visual.manufacturerCode, visual.preset)
  uniforms.grazingColor.value.setStyle(
    visual.grazingColor,
    SRGBColorSpace,
  )
  uniforms.secondaryColor.value.setStyle(
    visual.secondaryColor ?? visual.baseColor,
    SRGBColorSpace,
  )
  uniforms.tertiaryColor.value.setStyle(
    visual.tertiaryColor ?? visual.secondaryColor ?? visual.baseColor,
    SRGBColorSpace,
  )
}

export function applyWrapMaterialShader(
  material: MeshPhysicalMaterial,
  visual: ResolvedWrapVisual,
): boolean {
  const userData = getUserData(material)
  const existingState = userData.modifyWrapShaderState

  if (
    existingState &&
    userData.modifyWrapShaderProgramKey === wrapShaderProgramKey
  ) {
    updateUniforms(existingState.uniforms, visual)
    return false
  }

  const state: WrapShaderState = {
    uniforms: createUniforms(visual),
  }

  userData.modifyWrapShaderState = state
  userData.modifyWrapShaderProgramKey = wrapShaderProgramKey
  material.onBeforeCompile = (shader) => {
    patchShader(shader, state.uniforms)
  }
  material.customProgramCacheKey = () => wrapShaderProgramKey

  return true
}
