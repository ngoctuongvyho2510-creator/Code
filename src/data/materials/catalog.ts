import officialMaterialsData from './officialMaterials.json'
import { renderPresets } from './renderPresets'
import type {
  MaterialCatalogBrandTab,
  MaterialCatalogFilter,
  MaterialCatalogItem,
  OfficialMaterialBrand,
  RenderPresetDefinition,
  RenderPresetId,
} from '../../types/materialCatalog'

export const materialCatalogBrandOptions = [
  { id: '3M', label: '3M' },
  { id: 'Avery', label: 'Avery' },
  { id: 'Custom', label: 'Custom' },
] as const satisfies readonly {
  id: MaterialCatalogBrandTab
  label: string
}[]

export const materialCatalogFilterOptions = [
  { id: 'all', label: 'All' },
  { id: 'high-gloss', label: 'High Gloss' },
  { id: 'gloss', label: 'Gloss' },
  { id: 'satin', label: 'Satin' },
  { id: 'matte', label: 'Matte' },
  { id: 'metallic', label: 'Metallic' },
  { id: 'pearl', label: 'Pearl' },
  { id: 'color-shift', label: 'Color Shift' },
  { id: 'texture', label: 'Texture' },
  { id: 'chrome', label: 'Chrome' },
  { id: 'special', label: 'Special' },
] as const satisfies readonly {
  id: MaterialCatalogFilter
  label: string
}[]

export const officialMaterials =
  officialMaterialsData as readonly MaterialCatalogItem[]

export const officialMaterialCount = officialMaterials.length
export const officialMaterialCountByBrand = {
  '3M': officialMaterials.filter((material) => material.brand === '3M').length,
  Avery: officialMaterials.filter(
    (material) => material.brand === 'Avery Dennison',
  ).length,
} as const satisfies Record<'3M' | 'Avery', number>

const officialMaterialsById = new Map(
  officialMaterials.map((material) => [material.id, material]),
)

const officialBrandByTab = {
  '3M': '3M',
  Avery: 'Avery Dennison',
} as const satisfies Record<'3M' | 'Avery', OfficialMaterialBrand>

export function getOfficialMaterialById(
  materialId: string,
): MaterialCatalogItem | null {
  return officialMaterialsById.get(materialId) ?? null
}

export function getRenderPreset(
  presetId: RenderPresetId,
): RenderPresetDefinition {
  return renderPresets[presetId]
}

export function filterOfficialMaterials(
  brandTab: MaterialCatalogBrandTab,
  filter: MaterialCatalogFilter,
): readonly MaterialCatalogItem[] {
  if (brandTab !== '3M' && brandTab !== 'Avery') {
    return []
  }

  const brand = officialBrandByTab[brandTab]

  return officialMaterials.filter(
    (material) =>
      material.brand === brand && matchesMaterialFilter(material, filter),
  )
}

export function getBrandTabForOfficialBrand(
  brand: OfficialMaterialBrand,
): MaterialCatalogBrandTab {
  return brand === 'Avery Dennison' ? 'Avery' : '3M'
}

function matchesMaterialFilter(
  material: Pick<
    MaterialCatalogItem,
    'catalogGroup' | 'effectType' | 'renderPresetId' | 'surfaceFinish'
  >,
  filter: MaterialCatalogFilter,
): boolean {
  if (filter === 'all') {
    return true
  }

  const effect = material.effectType.toLowerCase()
  const finish = material.surfaceFinish.toLowerCase()
  const group = material.catalogGroup.toLowerCase()
  const preset = material.renderPresetId

  if (filter === 'high-gloss') {
    return group === 'high gloss' || finish === 'high_gloss'
  }

  if (filter === 'gloss') {
    return (
      (group.includes('gloss') || finish.includes('gloss')) &&
      group !== 'high gloss' &&
      finish !== 'high_gloss'
    )
  }

  if (filter === 'satin') {
    return finish.includes('satin') || preset === 'solid_satin'
  }

  if (filter === 'matte') {
    return finish.includes('matte') || preset === 'solid_matte'
  }

  if (filter === 'metallic') {
    return effect === 'metallic' || preset === 'metallic'
  }

  if (filter === 'pearl') {
    return effect === 'pearl' || preset === 'pearl'
  }

  if (filter === 'color-shift') {
    return (
      effect === 'color_shift' ||
      preset === 'color_shift' ||
      group === 'colorflow'
    )
  }

  if (filter === 'texture') {
    return (
      effect === 'carbon_fiber' ||
      effect === 'brushed' ||
      effect === 'patterned' ||
      effect === 'rugged' ||
      finish.includes('textured') ||
      preset === 'carbon_fiber' ||
      preset === 'brushed_metal' ||
      preset === 'patterned_texture' ||
      preset === 'rugged_texture'
    )
  }

  if (filter === 'chrome') {
    return effect === 'chrome' || preset === 'chrome'
  }

  return (
    effect === 'diamond' ||
    effect === 'special_effect' ||
    preset === 'diamond_flake' ||
    preset === 'special_effect'
  )
}
