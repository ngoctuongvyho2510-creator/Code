import { getBrandTabForOfficialBrand } from '../data/materials/catalog'
import type {
  CustomWrapSelection,
  MaterialCatalogBrandTab,
  OfficialWrapSelection,
} from '../types/materialCatalog'
import type { WrapConfig, WrapFinish } from '../types/configurator'

const fallbackCustomWrapSelection: CustomWrapSelection = {
  kind: 'custom',
  color: '#c49d59',
  finish: 'gloss',
}

const validHexColorPattern = /^#[0-9A-Fa-f]{6}$/
const wrapFinishSet = new Set<WrapFinish>(['gloss', 'satin', 'matte'])

export function isOfficialWrapSelection(
  wrap: WrapConfig,
): wrap is OfficialWrapSelection {
  return 'kind' in wrap && wrap.kind === 'official'
}

export function isCustomWrapSelection(
  wrap: WrapConfig,
): wrap is CustomWrapSelection {
  return !('kind' in wrap) || wrap.kind === 'custom'
}

export function normalizeCustomWrapSelection(
  wrap: WrapConfig | null | undefined,
): CustomWrapSelection {
  if (!wrap || !isCustomWrapSelection(wrap)) {
    return fallbackCustomWrapSelection
  }

  const color = validHexColorPattern.test(wrap.color)
    ? wrap.color.toLowerCase()
    : fallbackCustomWrapSelection.color

  return {
    kind: 'custom',
    color,
    finish: wrapFinishSet.has(wrap.finish)
      ? wrap.finish
      : fallbackCustomWrapSelection.finish,
  }
}

export function getWrapCatalogBrandTab(
  wrap: WrapConfig | null | undefined,
): MaterialCatalogBrandTab {
  if (!wrap || isCustomWrapSelection(wrap)) {
    return 'Custom'
  }

  if (isOfficialWrapSelection(wrap)) {
    return getBrandTabForOfficialBrand(wrap.brand)
  }

  return 'Custom'
}
