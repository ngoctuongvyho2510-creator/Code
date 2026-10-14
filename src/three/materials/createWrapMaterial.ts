import {
  Color,
  FrontSide,
  Material,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  SRGBColorSpace,
} from 'three'
import type { ResolvedWrapVisual } from './wrapMaterialProfiles'
import { applyWrapMaterialShader } from './wrapMaterialShaders'
import { getCarbonFiberTextures } from './carbonFiberTextures'

const blackColor = new Color(0, 0, 0)

function setColorFromHex(target: Color, hexColor: string) {
  target.setStyle(hexColor, SRGBColorSpace)
}

function clearWrapTextureInputs(material: MeshStandardMaterial): boolean {
  const hadTextureInput = Boolean(
    material.map ||
      material.lightMap ||
      material.aoMap ||
      material.emissiveMap ||
      material.bumpMap ||
      material.normalMap ||
      material.displacementMap ||
      material.roughnessMap ||
      material.metalnessMap ||
      material.alphaMap,
  )

  material.map = null
  material.lightMap = null
  material.aoMap = null
  material.emissiveMap = null
  material.bumpMap = null
  material.normalMap = null
  material.displacementMap = null
  material.roughnessMap = null
  material.metalnessMap = null
  material.alphaMap = null

  if (material instanceof MeshPhysicalMaterial) {
    const hadPhysicalTextureInput = Boolean(
      material.clearcoatMap ||
        material.clearcoatRoughnessMap ||
        material.clearcoatNormalMap ||
        material.iridescenceMap ||
        material.iridescenceThicknessMap ||
        material.sheenColorMap ||
        material.sheenRoughnessMap ||
        material.specularColorMap ||
        material.specularIntensityMap ||
        material.thicknessMap ||
        material.transmissionMap ||
        material.anisotropyMap,
    )

    material.clearcoatMap = null
    material.clearcoatRoughnessMap = null
    material.clearcoatNormalMap = null
    material.iridescenceMap = null
    material.iridescenceThicknessMap = null
    material.sheenColorMap = null
    material.sheenRoughnessMap = null
    material.specularColorMap = null
    material.specularIntensityMap = null
    material.thicknessMap = null
    material.transmissionMap = null
    material.anisotropyMap = null

    return hadTextureInput || hadPhysicalTextureInput
  }

  return hadTextureInput
}

function applyCarbonFiberTextureInputs(
  material: MeshStandardMaterial,
  visual: ResolvedWrapVisual,
): boolean {
  if (
    visual.preset !== 'carbon_fiber' ||
    !(material instanceof MeshPhysicalMaterial)
  ) {
    return false
  }

  const { normalMap, roughnessMap } =
    getCarbonFiberTextures()

  // UV-based carbon surface detail.
  // Base colour, grazing colour and lighting remain unchanged.
  material.normalMap = normalMap
  material.normalScale.set(0.22, 0.22)

  material.roughnessMap = roughnessMap

  // Keep the outer clearcoat smooth.
  // The weave exists underneath the glossy film layer.
  material.clearcoatNormalMap = null
  material.clearcoatRoughnessMap = null

  return true
}
function applyOpaqueWrapDefaults(material: MeshStandardMaterial) {
  material.alphaHash = false
  material.alphaTest = 0
  material.depthTest = true
  material.depthWrite = true
  material.flatShading = false
  material.opacity = 1
  material.side = FrontSide
  material.toneMapped = true
  material.transparent = false
  material.vertexColors = false
}

function getWrapReflectivity(visual: ResolvedWrapVisual): number {
  if (visual.preset === 'chrome') {
    return 1
  }

  if (visual.preset === 'solid_matte' || visual.preset === 'rugged_texture') {
    return 0.16
  }

  if (visual.preset === 'solid_satin') {
    return 0.28
  }

  if (visual.preset === 'solid_high_gloss') {
    return 0.72
  }

  if (visual.preset === 'solid_gloss') {
    return 0.62
  }

  return 0.56
}

function getWrapSpecularIntensity(visual: ResolvedWrapVisual): number {
  if (visual.preset === 'chrome') {
    return 1
  }

  if (visual.preset === 'solid_matte' || visual.preset === 'rugged_texture') {
    return 0.36
  }

  if (visual.preset === 'solid_satin') {
    return 0.52
  }

  if (visual.preset === 'solid_high_gloss') {
    return 0.96
  }

  if (visual.preset === 'solid_gloss') {
    return 0.84
  }

  return 0.76
}

function getWrapAnisotropy(visual: ResolvedWrapVisual): number {
  if (visual.preset === 'brushed_metal') {
    return 0.85
  }

  if (visual.preset === 'carbon_fiber') {
    return 0.32
  }

  if (visual.preset === 'chrome') {
    return 0.12
  }

  return 0
}

function applyPhysicalWrapSettings(
  material: MeshPhysicalMaterial,
  visual: ResolvedWrapVisual,
): boolean {
  material.clearcoat = visual.clearcoat
  material.clearcoatRoughness = visual.clearcoatRoughness
  material.reflectivity = getWrapReflectivity(visual)
  material.transmission = 0
  material.thickness = 0
  material.ior = visual.preset === 'chrome' ? 1.8 : 1.52
  material.iridescence = 0
  material.iridescenceIOR = 1.3
  material.iridescenceThicknessRange = [100, 420]
  material.sheen = 0
  material.sheenRoughness = 1
  material.specularIntensity = getWrapSpecularIntensity(visual)
  material.specularColor.set(1, 1, 1)
  material.anisotropy = getWrapAnisotropy(visual)
  material.anisotropyRotation = 0

  if (visual.preset === 'pearl' || visual.preset === 'special_effect') {
    material.sheen = 0.1
    material.sheenRoughness = 0.48

    if (visual.secondaryColor) {
      setColorFromHex(material.sheenColor, visual.secondaryColor)
    }
  }

  // Color-shift is handled in the diffuse layer. Tinting the dielectric
  // specular lobe with a tertiary color washes dark films toward white under
  // strong studio reflections, so keep the physical specular response neutral.
  return applyWrapMaterialShader(material, visual)
}

export function applyWrapVisualToMaterial(
  material: Material,
  visual: ResolvedWrapVisual,
): boolean {
  if (!(material instanceof MeshStandardMaterial)) {
    return false
  }

  const clearedTextureInputs = clearWrapTextureInputs(material)

const appliedCarbonTextureInputs =
  applyCarbonFiberTextureInputs(material, visual)

applyOpaqueWrapDefaults(material)
  setColorFromHex(material.color, visual.baseColor)
  material.emissive.copy(blackColor)
  material.emissiveIntensity = 0
  material.metalness = visual.metalness
  material.roughness = visual.roughness
  material.envMap = null
  material.envMapIntensity = visual.envMapIntensity

  const shaderNeedsUpdate =
    material instanceof MeshPhysicalMaterial
      ? applyPhysicalWrapSettings(material, visual)
      : false

  material.needsUpdate =
  clearedTextureInputs ||
  appliedCarbonTextureInputs ||
  shaderNeedsUpdate
  return true
}
