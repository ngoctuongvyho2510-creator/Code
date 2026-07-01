import { getOfficialMaterialById, getRenderPreset } from '../data/materials/catalog'
import type { WrapConfig, WrapFinish } from '../types/configurator'
import type { RenderPresetDefinition, RenderPresetId } from '../types/materialCatalog'
import {
  isCustomWrapSelection,
  isOfficialWrapSelection,
  normalizeCustomWrapSelection,
} from './materialCatalog'

export type WrapMaterialRenderProfile = {
  colorHex: string
  secondaryColorHex: string | null
  tertiaryColorHex: string | null
  renderPreset: RenderPresetDefinition
  renderPresetId: RenderPresetId
  previewIntensity: number
  previewMode: 'daylight' | 'uv' | 'day' | 'night' | undefined
}

const customFinishPresetIds = {
  gloss: 'solid_gloss',
  satin: 'solid_satin',
  matte: 'solid_matte',
} as const satisfies Record<WrapFinish, RenderPresetId>

export function resolveWrapMaterialRenderProfile(
  wrap: WrapConfig,
): WrapMaterialRenderProfile | null {
  if (isOfficialWrapSelection(wrap)) {
    const material = getOfficialMaterialById(wrap.materialId)

    if (!material) {
      return null
    }

    return {
      colorHex: material.primaryHex,
      secondaryColorHex: material.secondaryHex,
      tertiaryColorHex: material.tertiaryHex,
      renderPreset: getRenderPreset(material.renderPresetId),
      renderPresetId: material.renderPresetId,
      previewIntensity: 0,
      previewMode: undefined,
    }
  }

  if (isCustomWrapSelection(wrap)) {
    const customWrap = normalizeCustomWrapSelection(wrap)
    const renderPresetId = customFinishPresetIds[customWrap.finish]

    return {
      colorHex: customWrap.color,
      secondaryColorHex: null,
      tertiaryColorHex: null,
      renderPreset: getRenderPreset(renderPresetId),
      renderPresetId,
      previewIntensity: 0,
      previewMode: undefined,
    }
  }

  return null
}
