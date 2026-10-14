export type OfficialMaterialBrand = '3M' | 'Avery Dennison'

export type MaterialCatalogBrandTab = '3M' | 'Avery' | 'Custom'

export type MaterialCatalogFilter =
  | 'all'
  | 'high-gloss'
  | 'gloss'
  | 'satin'
  | 'matte'
  | 'metallic'
  | 'pearl'
  | 'color-shift'
  | 'texture'
  | 'chrome'
  | 'special'

export type RenderPresetId =
  | 'solid_high_gloss'
  | 'solid_gloss'
  | 'solid_satin'
  | 'solid_matte'
  | 'metallic'
  | 'liquid_metallic'
  | 'pearl'
  | 'color_shift'
  | 'carbon_fiber'
  | 'brushed_metal'
  | 'rugged_texture'
  | 'diamond_flake'
  | 'chrome'
  | 'patterned_texture'
  | 'special_effect'

export type RenderPresetDefinition = {
  id: RenderPresetId
  surfaceModel: 'MeshPhysicalMaterial' | 'custom physical shader'
  roughness: number
  metalness: number
  clearcoat: number
  clearcoatRoughness: number
  anisotropy: number
  envMapIntensity: number
  effectStrength: number
  flakeStrength: number
  normalOrTexture: string
  dynamicDriver: string
  dayBehavior: string
  nightOrUvBehavior: string
}

export type MaterialCatalogItem = {
  id: string
  brand: OfficialMaterialBrand
  series: string
  manufacturerCode: string
  displayName: string
  catalogGroup: string
  surfaceFinish: string
  effectType: string
  primaryHex: string
  secondaryHex: string | null
  tertiaryHex: string | null
  renderPresetId: RenderPresetId
  swatchAsset: string
  catalogStatus: 'official'
  previewAccuracy: 'approximate'
  sortOrder: number
  sourceDocument?: string
  sourceUrl?: string
}


export type MaterialCalibrationOverride = {
  baseColor: string
  secondaryColor?: string
  tertiaryColor?: string
  grazingColor?: string
  fresnelStrength?: number
  roughness?: number
  metalness?: number
  clearcoat?: number
  clearcoatRoughness?: number
  envMapIntensity?: number
  effectStrength?: number
}

export type OfficialWrapSelection = {
  kind: 'official'
  materialId: string
  brand: OfficialMaterialBrand
  manufacturerCode: string
  displayName: string
  renderPresetId: RenderPresetId
  calibrationOverride?: MaterialCalibrationOverride
  calibrationRevision?: number
}

export type CustomWrapSelection = {
  kind: 'custom'
  color: string
  finish: 'gloss' | 'satin' | 'matte'
}

export type WrapMaterialSelection =
  | OfficialWrapSelection
  | CustomWrapSelection
