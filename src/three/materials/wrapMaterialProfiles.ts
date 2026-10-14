import { Color, SRGBColorSpace } from 'three'
import { getApprovedMaterialCalibration } from '../../data/materials/approvedMaterialCalibrations'
import { getOfficialMaterialById } from '../../data/materials/catalog'
import type { WrapConfig, WrapFinish } from '../../types/configurator'
import type {
  MaterialCalibrationOverride,
  MaterialCatalogItem,
  RenderPresetId,
} from '../../types/materialCatalog'
import {
  isCustomWrapSelection,
  isOfficialWrapSelection,
  normalizeCustomWrapSelection,
} from '../../utils/materialCatalog'
import { resolveMaterialColors } from './materialColorResolver'

export type ResolvedWrapVisual = {
  materialId: string
  manufacturerCode: string
  preset: RenderPresetId
  baseColor: string
  secondaryColor?: string
  tertiaryColor?: string
  grazingColor: string
  fresnelStrength: number
  roughness: number
  metalness: number
  clearcoat: number
  clearcoatRoughness: number
  envMapIntensity: number
  effectStrength: number
}

type WrapVisualSettings = Pick<
  ResolvedWrapVisual,
  | 'clearcoat'
  | 'clearcoatRoughness'
  | 'effectStrength'
  | 'fresnelStrength'
  | 'envMapIntensity'
  | 'metalness'
  | 'roughness'
>

const supportedWrapPresets = new Set<RenderPresetId>([
  'solid_high_gloss',
  'solid_gloss',
  'solid_satin',
  'solid_matte',
  'metallic',
  'liquid_metallic',
  'pearl',
  'color_shift',
  'carbon_fiber',
  'brushed_metal',
  'rugged_texture',
  'diamond_flake',
  'chrome',
  'special_effect',
  'patterned_texture',
])

const visualSettingsByPreset = {
  solid_high_gloss: {
    roughness: 0.03,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.01,
    envMapIntensity: 1.32,
    effectStrength: 0,
    fresnelStrength: 0.18,
  },
  solid_gloss: {
    roughness: 0.09,
    metalness: 0,
    clearcoat: 0.96,
    clearcoatRoughness: 0.03,
    envMapIntensity: 1.12,
    effectStrength: 0,
    fresnelStrength: 0.13,
  },
  solid_satin: {
    roughness: 0.34,
    metalness: 0,
    clearcoat: 0.18,
    clearcoatRoughness: 0.22,
    envMapIntensity: 0.88,
    effectStrength: 0,
    fresnelStrength: 0.07,
  },
  solid_matte: {
    roughness: 0.58,
    metalness: 0,
    clearcoat: 0.01,
    clearcoatRoughness: 0.5,
    envMapIntensity: 0.52,
    effectStrength: 0,
    fresnelStrength: 0.025,
  },
  metallic: {
    roughness: 0.19,
    metalness: 0.14,
    clearcoat: 0.94,
    clearcoatRoughness: 0.045,
    envMapIntensity: 1.1,
    effectStrength: 0.16,
    fresnelStrength: 0.12,
  },
  liquid_metallic: {
  roughness: 0.12,
  metalness: 0.2,
  clearcoat: 0.9,
  clearcoatRoughness: 0.04,
  envMapIntensity: 1.12,
  effectStrength: 0.42,
  fresnelStrength: 0.12,
},
  pearl: {
    roughness: 0.28,
    metalness: 0.02,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
    envMapIntensity: 0.9,
    effectStrength: 0.3,
    fresnelStrength: 0.08,
  },
  color_shift: {
    roughness: 0.24,
    metalness: 0.03,
    clearcoat: 0.82,
    clearcoatRoughness: 0.1,
    envMapIntensity: 0.96,
    effectStrength: 1,
    fresnelStrength: 0,
  },
  carbon_fiber: {
    roughness: 0.36,
    metalness: 0.03,
    clearcoat: 0.52,
    clearcoatRoughness: 0.2,
    envMapIntensity: 0.84,
    effectStrength: 0.58,
    fresnelStrength: 0.05,
  },
  brushed_metal: {
    roughness: 0.36,
    metalness: 0.52,
    clearcoat: 0.2,
    clearcoatRoughness: 0.24,
    envMapIntensity: 1.04,
    effectStrength: 0.5,
    fresnelStrength: 0.04,
  },
  rugged_texture: {
    roughness: 0.74,
    metalness: 0,
    clearcoat: 0.04,
    clearcoatRoughness: 0.58,
    envMapIntensity: 0.56,
    effectStrength: 0.58,
    fresnelStrength: 0.02,
  },
  diamond_flake: {
    roughness: 0.18,
    metalness: 0.2,
    clearcoat: 0.96,
    clearcoatRoughness: 0.045,
    envMapIntensity: 1.08,
    effectStrength: 0.22,
    fresnelStrength: 0.1,
  },
  chrome: {
    roughness: 0.075,
    metalness: 1,
    clearcoat: 0.06,
    clearcoatRoughness: 0.04,
    envMapIntensity: 1.38,
    effectStrength: 0,
    fresnelStrength: 0,
  },
  special_effect: {
    roughness: 0.29,
    metalness: 0.03,
    clearcoat: 0.76,
    clearcoatRoughness: 0.12,
    envMapIntensity: 0.88,
    effectStrength: 0.24,
    fresnelStrength: 0.06,
  },
  patterned_texture: {
    roughness: 0.54,
    metalness: 0,
    clearcoat: 0.14,
    clearcoatRoughness: 0.38,
    envMapIntensity: 0.66,
    effectStrength: 0.46,
    fresnelStrength: 0.03,
  },
} as const satisfies Record<RenderPresetId, WrapVisualSettings>

const customFinishPresetIds = {
  gloss: 'solid_gloss',
  satin: 'solid_satin',
  matte: 'solid_matte',
} as const satisfies Record<WrapFinish, RenderPresetId>

const resolvedVisualCache = new Map<string, ResolvedWrapVisual>()

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function createDefaultGrazingColor(
  baseColor: string,
  preset: RenderPresetId,
): string {
  const color = new Color().setStyle(baseColor, SRGBColorSpace)
  const hsl = { h: 0, s: 0, l: 0 }

  color.getHSL(hsl, SRGBColorSpace)

  const saturationBoost =
    preset === 'solid_high_gloss' ||
    preset === 'solid_gloss' ||
    preset === 'metallic' ||
    preset === 'pearl' ||
    preset === 'diamond_flake'
      ? 0.06
      : 0.03

  const lightnessReduction =
    preset === 'solid_high_gloss'
      ? 0.11
      : preset === 'solid_gloss' || preset === 'metallic'
        ? 0.09
        : preset === 'solid_satin' || preset === 'pearl'
          ? 0.065
          : 0.04

  color.setHSL(
    hsl.h,
    clamp01(hsl.s + saturationBoost),
    clamp01(hsl.l - lightnessReduction),
    SRGBColorSpace,
  )

  return `#${color.getHexString(SRGBColorSpace)}`
}

const validHexPattern = /^#[0-9a-f]{6}$/i

function getCalibrationColor(
  color: string | undefined,
  fallback: string | undefined,
): string | undefined {
  return color && validHexPattern.test(color) ? color.toLowerCase() : fallback
}

function applyCalibrationOverride(
  visual: ResolvedWrapVisual,
  override: MaterialCalibrationOverride,
): ResolvedWrapVisual {
  return Object.freeze({
    ...visual,
    baseColor:
      getCalibrationColor(override.baseColor, visual.baseColor) ??
      visual.baseColor,
    secondaryColor: getCalibrationColor(
      override.secondaryColor,
      visual.secondaryColor,
    ),
    tertiaryColor: getCalibrationColor(
      override.tertiaryColor,
      visual.tertiaryColor,
    ),
    grazingColor:
      getCalibrationColor(override.grazingColor, visual.grazingColor) ??
      visual.grazingColor,
    fresnelStrength:
      override.fresnelStrength === undefined
        ? visual.fresnelStrength
        : clamp01(override.fresnelStrength),
    roughness:
      override.roughness === undefined
        ? visual.roughness
        : clamp01(override.roughness),
    metalness:
      override.metalness === undefined
        ? visual.metalness
        : clamp01(override.metalness),
    clearcoat:
      override.clearcoat === undefined
        ? visual.clearcoat
        : clamp01(override.clearcoat),
    clearcoatRoughness:
      override.clearcoatRoughness === undefined
        ? visual.clearcoatRoughness
        : clamp01(override.clearcoatRoughness),
    envMapIntensity:
      override.envMapIntensity === undefined
        ? visual.envMapIntensity
        : Math.min(3, Math.max(0, override.envMapIntensity)),
    effectStrength:
      override.effectStrength === undefined
        ? visual.effectStrength
        : clamp01(override.effectStrength),
  })
}

function getSupportedPreset(preset: RenderPresetId): RenderPresetId {
  return supportedWrapPresets.has(preset) ? preset : 'solid_gloss'
}

function getOfficialPreset(material: MaterialCatalogItem): RenderPresetId {
  const code = material.manufacturerCode
  if (code === 'G344') {
  return 'liquid_metallic'
}
  const effectType = material.effectType.toLowerCase()
  const group = material.catalogGroup.toLowerCase()
  if (code === 'HG378') {
  return 'color_shift'
}

  if (code.startsWith('SF100-')) {
    return 'chrome'
  }

  if (effectType === 'diamond' || group === 'diamond') {
    return 'diamond_flake'
  }

  if (effectType === 'color_shift' || group === 'colorflow') {
    return 'color_shift'
  }

  if (effectType === 'carbon_fiber') {
    return 'carbon_fiber'
  }

  if (effectType === 'brushed') {
    return 'brushed_metal'
  }

  if (effectType === 'rugged') {
    return 'rugged_texture'
  }

  return getSupportedPreset(material.renderPresetId)
}

function adjustSettingsForOfficialMaterial(
  settings: WrapVisualSettings,
  material: MaterialCatalogItem,
  preset: RenderPresetId,
): WrapVisualSettings {
  const finish = material.surfaceFinish

  if (preset === 'color_shift') {
    if (finish === 'satin') {
      return {
        ...settings,
        roughness: 0.48,
        clearcoat: 0.24,
        clearcoatRoughness: 0.34,
        envMapIntensity: 0.78,
        effectStrength: 1,
      }
    }

    if (finish === 'high_gloss') {
      return {
        ...settings,
        roughness: 0.08,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        envMapIntensity: 1.12,
        effectStrength: 1,
      }
    }
  }

  if (preset === 'metallic') {
    if (finish === 'matte') {
      return {
        ...settings,
        roughness: 0.62,
        clearcoat: 0.12,
        clearcoatRoughness: 0.45,
        envMapIntensity: 0.62,
        effectStrength: 0.12,
      }
    }

    if (finish === 'satin') {
      return {
        ...settings,
        roughness: 0.46,
        clearcoat: 0.3,
        clearcoatRoughness: 0.28,
        envMapIntensity: 0.74,
        effectStrength: 0.14,
      }
    }
  }

  if (preset === 'pearl' && finish === 'satin') {
    return {
      ...settings,
      roughness: 0.46,
      clearcoat: 0.32,
      clearcoatRoughness: 0.28,
      envMapIntensity: 0.74,
      effectStrength: 0.28,
    }
  }

  if (preset === 'special_effect' && finish === 'satin') {
    return {
      ...settings,
      roughness: 0.46,
      clearcoat: 0.28,
      clearcoatRoughness: 0.3,
      envMapIntensity: 0.76,
      effectStrength: 0.22,
    }
  }

  return settings
}

function createOfficialWrapVisual(material: MaterialCatalogItem): ResolvedWrapVisual {
  const preset = getOfficialPreset(material)
  const settings = adjustSettingsForOfficialMaterial(
    visualSettingsByPreset[preset],
    material,
    preset,
  )
  const colors = resolveMaterialColors(material)
  const baseColor = colors.baseColor

  const visual: ResolvedWrapVisual = {
    materialId: material.id,
    manufacturerCode: material.manufacturerCode,
    preset,
    baseColor,
    secondaryColor: colors.secondaryColor,
    tertiaryColor: colors.tertiaryColor,
    grazingColor: createDefaultGrazingColor(baseColor, preset),
    fresnelStrength: clamp01(settings.fresnelStrength),
    roughness: clamp01(settings.roughness),
    metalness: clamp01(settings.metalness),
    clearcoat: clamp01(settings.clearcoat),
    clearcoatRoughness: clamp01(settings.clearcoatRoughness),
    envMapIntensity: Math.max(0, settings.envMapIntensity),
    effectStrength: clamp01(settings.effectStrength),
  }
  const approvedCalibration = getApprovedMaterialCalibration(material.id)

  return approvedCalibration
    ? applyCalibrationOverride(visual, approvedCalibration)
    : Object.freeze(visual)
}

function createCustomWrapVisual(
  color: string,
  finish: WrapFinish,
): ResolvedWrapVisual {
  const preset = customFinishPresetIds[finish]
  const settings = visualSettingsByPreset[preset]

  return Object.freeze({
    materialId: `custom:${finish}:${color}`,
    manufacturerCode: `CUSTOM-${finish.toUpperCase()}`,
    preset,
    baseColor: color,
    grazingColor: createDefaultGrazingColor(color, preset),
    fresnelStrength: settings.fresnelStrength,
    roughness: settings.roughness,
    metalness: settings.metalness,
    clearcoat: settings.clearcoat,
    clearcoatRoughness: settings.clearcoatRoughness,
    envMapIntensity: settings.envMapIntensity,
    effectStrength: settings.effectStrength,
  })
}

export function isSupportedWrapPreset(
  preset: string,
): preset is RenderPresetId {
  return supportedWrapPresets.has(preset as RenderPresetId)
}

export function resolveWrapVisual(wrap: WrapConfig): ResolvedWrapVisual | null {
  if (isOfficialWrapSelection(wrap)) {
    const material = getOfficialMaterialById(wrap.materialId)

    if (!material) {
      return null
    }

    if (wrap.calibrationOverride) {
      return applyCalibrationOverride(
        createOfficialWrapVisual(material),
        wrap.calibrationOverride,
      )
    }

    const cacheKey = `official:${wrap.materialId}`
    const cachedVisual = resolvedVisualCache.get(cacheKey)

    if (cachedVisual) {
      return cachedVisual
    }

    const visual = createOfficialWrapVisual(material)

    resolvedVisualCache.set(cacheKey, visual)
    return visual
  }

  if (isCustomWrapSelection(wrap)) {
    const customWrap = normalizeCustomWrapSelection(wrap)
    const cacheKey = `custom:${customWrap.finish}:${customWrap.color}`
    const cachedVisual = resolvedVisualCache.get(cacheKey)

    if (cachedVisual) {
      return cachedVisual
    }

    const visual = createCustomWrapVisual(
      customWrap.color,
      customWrap.finish,
    )

    resolvedVisualCache.set(cacheKey, visual)
    return visual
  }

  return null
}
