import type { MaterialCatalogItem } from '../../types/materialCatalog'

type ResolvedMaterialColors = {
  baseColor: string
  secondaryColor?: string
  tertiaryColor?: string
}

type MaterialColorOverride = ResolvedMaterialColors & {
  note: string
}

const materialColorOverrides: Record<string, MaterialColorOverride> = {
  HGP278: {
    baseColor: '#38236b',
    secondaryColor: '#bb347f',
    tertiaryColor: '#2455a4',
    note: '3M High Gloss Flip Deep Space',
  },
  HGP221: {
    baseColor: '#161016',
    secondaryColor: '#0d6f86',
    tertiaryColor: '#763f89',
    note: '3M High Gloss Flip Black Psychedelic',
  },
  GP278: {
    baseColor: '#38236b',
    secondaryColor: '#bb347f',
    tertiaryColor: '#2455a4',
    note: '3M Gloss Flip Deep Space',
  },
  GP281: {
    baseColor: '#1b7893',
    secondaryColor: '#754466',
    tertiaryColor: '#d2c39c',
    note: '3M Gloss Flip Psychedelic',
  },
  SP213: {
    baseColor: '#e94c42',
    secondaryColor: '#8b1c5c',
    tertiaryColor: '#f59c48',
    note: '3M Satin Flip Electric Coral',
  },
  SP236: {
    baseColor: '#42181d',
    secondaryColor: '#b6422d',
    tertiaryColor: '#d69055',
    note: '3M Satin Flip Volcanic Flare',
  },
  SP264: {
    baseColor: '#74640c',
    secondaryColor: '#c2b83f',
    tertiaryColor: '#6d3172',
    note: '3M Satin Flip Golden Aurora',
  },
  SP280: {
    baseColor: '#eef1f2',
    secondaryColor: '#95c5df',
    tertiaryColor: '#d3b5cc',
    note: '3M Satin Flip Ghost Pearl',
  },
  SP281: {
    baseColor: '#1b7893',
    secondaryColor: '#754466',
    tertiaryColor: '#d2c39c',
    note: '3M Satin Flip Psychedelic',
  },
  'SW900-476-S': {
    baseColor: '#101012',
    secondaryColor: '#9a1821',
    tertiaryColor: '#d79a3a',
    note: 'Avery ColorFlow Black / Red',
  },
  'SW900-551-S': {
    baseColor: '#17246f',
    secondaryColor: '#9b1824',
    tertiaryColor: '#50306b',
    note: 'Avery ColorFlow Blue / Red',
  },
  'SW900-673-S': {
    baseColor: '#0b7f9f',
    secondaryColor: '#5c2382',
    tertiaryColor: '#183d64',
    note: 'Avery ColorFlow Cyan / Purple',
  },
  'SW900-610-S': {
    baseColor: '#1b6f42',
    secondaryColor: '#5d247a',
    tertiaryColor: '#164d68',
    note: 'Avery ColorFlow Green / Purple',
  },
  'SW900-788-S': {
    baseColor: '#1a9db4',
    secondaryColor: '#164f9d',
    tertiaryColor: '#c7d3d6',
    note: 'Avery ColorFlow Cyan / Blue',
  },
  'SW900-634-S': {
    baseColor: '#b7bec2',
    secondaryColor: '#236ca2',
    tertiaryColor: '#e3dfcf',
    note: 'Avery ColorFlow Silver / Blue',
  },
  'SW900-786-S': {
    baseColor: '#b8c4bc',
    secondaryColor: '#2a723a',
    tertiaryColor: '#edf3e9',
    note: 'Avery ColorFlow Silver / Green',
  },
  'SW900-251-S': {
    baseColor: '#b8bdbc',
    secondaryColor: '#c79f35',
    tertiaryColor: '#f0dc7d',
    note: 'Avery ColorFlow Silver / Gold',
  },
  'SW900-446-S': {
    baseColor: '#8c1c19',
    secondaryColor: '#d39531',
    tertiaryColor: '#4d1d12',
    note: 'Avery ColorFlow Red / Gold',
  },
  'SW900-552-S': {
    baseColor: '#17246f',
    secondaryColor: '#9b1824',
    tertiaryColor: '#50306b',
    note: 'Avery ColorFlow Blue / Red',
  },
  'SW900-674-S': {
    baseColor: '#0b7f9f',
    secondaryColor: '#5c2382',
    tertiaryColor: '#183d64',
    note: 'Avery ColorFlow Cyan / Purple',
  },
  'SW900-611-S': {
    baseColor: '#1b6f42',
    secondaryColor: '#5d247a',
    tertiaryColor: '#164d68',
    note: 'Avery ColorFlow Green / Purple',
  },
  'SW900-787-S': {
    baseColor: '#b8c4bc',
    secondaryColor: '#2a723a',
    tertiaryColor: '#edf3e9',
    note: 'Avery ColorFlow Silver / Green',
  },
  'SW900-789-S': {
    baseColor: '#143b1f',
    secondaryColor: '#5d247a',
    tertiaryColor: '#081711',
    note: 'Avery ColorFlow Green / Purple',
  },
  'SW900-252-S': {
    baseColor: '#b8bdbc',
    secondaryColor: '#c79f35',
    tertiaryColor: '#f0dc7d',
    note: 'Avery ColorFlow Silver / Gold',
  },
  'SW900-447-S': {
    baseColor: '#8c1c19',
    secondaryColor: '#d39531',
    tertiaryColor: '#4d1d12',
    note: 'Avery ColorFlow Red / Gold',
  },
  'SW900-448-S': {
    baseColor: '#c51f2d',
    secondaryColor: '#842044',
    tertiaryColor: '#eda2a9',
    note: 'Avery Special Effects Gloss Passion Red',
  },
  'SW900-568-S': {
    baseColor: '#6b2b85',
    secondaryColor: '#a63f95',
    tertiaryColor: '#261947',
    note: 'Avery Special Effects Gloss Fun Purple',
  },
  'SW900-629-S': {
    baseColor: '#1267ad',
    secondaryColor: '#45adc9',
    tertiaryColor: '#2b2b72',
    note: 'Avery Special Effects Satin Wave Blue',
  },
  'SW900-716-S': {
    baseColor: '#078b94',
    secondaryColor: '#2fc8be',
    tertiaryColor: '#194b68',
    note: 'Avery Special Effects Satin Cool Teal',
  },
  'SW900-316-S': {
    baseColor: '#e95b19',
    secondaryColor: '#f4a13a',
    tertiaryColor: '#8c2013',
    note: 'Avery Special Effects Satin Stunning Orange',
  },
  'SW900-261-S': {
    baseColor: '#e0bd23',
    secondaryColor: '#f1db52',
    tertiaryColor: '#f28b24',
    note: 'Avery Special Effects Satin Energetic Yellow',
  },
}

const validHexPattern = /^#[0-9a-f]{6}$/i

function normalizeHex(hexColor: string): string {
  return hexColor.toLowerCase()
}

function isValidHex(hexColor: string | null | undefined): hexColor is string {
  return typeof hexColor === 'string' && validHexPattern.test(hexColor)
}

function getCatalogPalette(material: MaterialCatalogItem): string[] {
  return [material.primaryHex, material.secondaryHex, material.tertiaryHex]
    .filter(isValidHex)
    .map(normalizeHex)
}

function chooseAccentColor(
  palette: readonly string[],
  baseColor: string,
  preferredIndex: number,
): string | undefined {
  const preferred = palette[preferredIndex]

  if (preferred && preferred !== baseColor) {
    return preferred
  }

  return palette.find((color) => color !== baseColor)
}

export function resolveMaterialColors(
  material: MaterialCatalogItem,
): ResolvedMaterialColors {
  const override = materialColorOverrides[material.manufacturerCode]

  if (override) {
    return {
      baseColor: normalizeHex(override.baseColor),
      secondaryColor: override.secondaryColor
        ? normalizeHex(override.secondaryColor)
        : undefined,
      tertiaryColor: override.tertiaryColor
        ? normalizeHex(override.tertiaryColor)
        : undefined,
    }
  }

  const palette = getCatalogPalette(material)
  const primaryColor = isValidHex(material.primaryHex)
    ? normalizeHex(material.primaryHex)
    : palette[0]

  // The catalog swatches contain printed highlights and shadows. The first
  // calibrated color is the representative body color; never re-rank the
  // palette by luminance because that turns black/carbon/rugged/diamond films
  // into their white highlight sample.
  const baseColor = primaryColor ?? '#808080'

  return {
    baseColor,
    secondaryColor: chooseAccentColor(palette, baseColor, 1),
    tertiaryColor: chooseAccentColor(palette, baseColor, 2),
  }
}

export function getMaterialColorOverrideCodes(): readonly string[] {
  return Object.keys(materialColorOverrides)
}
