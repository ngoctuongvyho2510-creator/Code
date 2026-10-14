import type {
  MaterialCalibrationOverride,
  OfficialMaterialBrand,
} from '../../types/materialCatalog'

export type MaterialCalibrationStatus = 'draft' | 'approved'

export type MaterialCalibrationProfile = MaterialCalibrationOverride & {
  materialId: string
  brand: OfficialMaterialBrand
  manufacturerCode: string
  displayName: string
  status: MaterialCalibrationStatus
  notes: string
  updatedAt: string
}

export type MaterialCalibrationProfiles = Record<
  string,
  MaterialCalibrationProfile
>

export type MaterialCalibrationExport = {
  version: 1
  exportedAt: string
  profiles: MaterialCalibrationProfiles
}

const storageKey = 'modifywrap-material-calibration-v1'
const validHexPattern = /^#[0-9a-f]{6}$/i
const validBrands = new Set<OfficialMaterialBrand>(['3M', 'Avery Dennison'])
const validStatuses = new Set<MaterialCalibrationStatus>([
  'draft',
  'approved',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isOptionalHex(value: unknown): value is string | undefined {
  return value === undefined || (typeof value === 'string' && validHexPattern.test(value))
}

function isOptionalNumber(value: unknown): value is number | undefined {
  return value === undefined || (typeof value === 'number' && Number.isFinite(value))
}

function parseProfile(value: unknown): MaterialCalibrationProfile | null {
  if (!isRecord(value)) {
    return null
  }

  const {
    materialId,
    brand,
    manufacturerCode,
    displayName,
    status,
    notes,
    updatedAt,
    baseColor,
    secondaryColor,
    tertiaryColor,
    grazingColor,
    fresnelStrength,
    roughness,
    metalness,
    clearcoat,
    clearcoatRoughness,
    envMapIntensity,
    effectStrength,
  } = value

  if (
    typeof materialId !== 'string' ||
    typeof brand !== 'string' ||
    !validBrands.has(brand as OfficialMaterialBrand) ||
    typeof manufacturerCode !== 'string' ||
    typeof displayName !== 'string' ||
    typeof status !== 'string' ||
    !validStatuses.has(status as MaterialCalibrationStatus) ||
    typeof notes !== 'string' ||
    typeof updatedAt !== 'string' ||
    typeof baseColor !== 'string' ||
    !validHexPattern.test(baseColor) ||
    !isOptionalHex(secondaryColor) ||
    !isOptionalHex(tertiaryColor) ||
    !isOptionalHex(grazingColor) ||
    !isOptionalNumber(fresnelStrength) ||
    !isOptionalNumber(roughness) ||
    !isOptionalNumber(metalness) ||
    !isOptionalNumber(clearcoat) ||
    !isOptionalNumber(clearcoatRoughness) ||
    !isOptionalNumber(envMapIntensity) ||
    !isOptionalNumber(effectStrength)
  ) {
    return null
  }

  return {
    materialId,
    brand: brand as OfficialMaterialBrand,
    manufacturerCode,
    displayName,
    status: status as MaterialCalibrationStatus,
    notes,
    updatedAt,
    baseColor: baseColor.toLowerCase(),
    secondaryColor: secondaryColor?.toLowerCase(),
    tertiaryColor: tertiaryColor?.toLowerCase(),
    grazingColor: grazingColor?.toLowerCase(),
    fresnelStrength,
    roughness,
    metalness,
    clearcoat,
    clearcoatRoughness,
    envMapIntensity,
    effectStrength,
  }
}

export function loadCalibrationProfiles(): MaterialCalibrationProfiles {
  if (typeof window === 'undefined') {
    return {}
  }

  const serialized = window.localStorage.getItem(storageKey)

  if (!serialized) {
    return {}
  }

  try {
    const parsed = JSON.parse(serialized) as unknown
    return parseCalibrationExport(parsed).profiles
  } catch (error) {
    console.warn('Unable to load saved material calibration data.', error)
    return {}
  }
}

export function saveCalibrationProfiles(
  profiles: MaterialCalibrationProfiles,
): void {
  if (typeof window === 'undefined') {
    return
  }

  const payload: MaterialCalibrationExport = {
    version: 1,
    exportedAt: new Date().toISOString(),
    profiles,
  }

  window.localStorage.setItem(storageKey, JSON.stringify(payload))
}

export function parseCalibrationExport(
  value: unknown,
): MaterialCalibrationExport {
  if (!isRecord(value) || value.version !== 1 || !isRecord(value.profiles)) {
    throw new Error('Unsupported calibration file format.')
  }

  const profiles: MaterialCalibrationProfiles = {}

  for (const [materialId, profileValue] of Object.entries(value.profiles)) {
    const profile = parseProfile(profileValue)

    if (!profile || profile.materialId !== materialId) {
      continue
    }

    profiles[materialId] = profile
  }

  return {
    version: 1,
    exportedAt:
      typeof value.exportedAt === 'string'
        ? value.exportedAt
        : new Date().toISOString(),
    profiles,
  }
}

function downloadCalibrationFile(
  profiles: MaterialCalibrationProfiles,
  fileName: string,
): void {
  const payload: MaterialCalibrationExport = {
    version: 1,
    exportedAt: new Date().toISOString(),
    profiles,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = fileName
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

export function downloadCalibrationProfiles(
  profiles: MaterialCalibrationProfiles,
): void {
  downloadCalibrationFile(profiles, 'modifywrap-material-calibration.json')
}

export function downloadApprovedCalibrationProfiles(
  profiles: MaterialCalibrationProfiles,
): void {
  const approvedProfiles = Object.fromEntries(
    Object.entries(profiles).filter(
      ([, profile]) => profile.status === 'approved',
    ),
  ) as MaterialCalibrationProfiles

  downloadCalibrationFile(
    approvedProfiles,
    'approvedMaterialCalibrations.json',
  )
}
