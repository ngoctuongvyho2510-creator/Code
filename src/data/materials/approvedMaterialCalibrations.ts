import approvedCalibrationData from './approvedMaterialCalibrations.json'
import type { MaterialCalibrationOverride } from '../../types/materialCatalog'

const validHexPattern = /^#[0-9a-f]{6}$/i

type ApprovedCalibrationFile = {
  version: number
  profiles: Record<string, unknown>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getOptionalNumber(
  value: unknown,
  min: number,
  max: number,
): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined
  }

  return Math.min(max, Math.max(min, value))
}

function getOptionalHex(value: unknown): string | undefined {
  return typeof value === 'string' && validHexPattern.test(value)
    ? value.toLowerCase()
    : undefined
}

function parseApprovedOverride(
  value: unknown,
): MaterialCalibrationOverride | null {
  if (!isRecord(value)) {
    return null
  }

  if (value.status !== undefined && value.status !== 'approved') {
    return null
  }

  const baseColor = getOptionalHex(value.baseColor)

  if (!baseColor) {
    return null
  }

  return {
    baseColor,
    secondaryColor: getOptionalHex(value.secondaryColor),
    tertiaryColor: getOptionalHex(value.tertiaryColor),
    grazingColor: getOptionalHex(value.grazingColor),
    fresnelStrength: getOptionalNumber(value.fresnelStrength, 0, 1),
    roughness: getOptionalNumber(value.roughness, 0, 1),
    metalness: getOptionalNumber(value.metalness, 0, 1),
    clearcoat: getOptionalNumber(value.clearcoat, 0, 1),
    clearcoatRoughness: getOptionalNumber(
      value.clearcoatRoughness,
      0,
      1,
    ),
    envMapIntensity: getOptionalNumber(value.envMapIntensity, 0, 3),
    effectStrength: getOptionalNumber(value.effectStrength, 0, 1),
  }
}

const calibrationFile = approvedCalibrationData as ApprovedCalibrationFile
const approvedOverrides = new Map<string, MaterialCalibrationOverride>()

if (calibrationFile.version === 1 && isRecord(calibrationFile.profiles)) {
  for (const [materialId, value] of Object.entries(calibrationFile.profiles)) {
    const override = parseApprovedOverride(value)

    if (override) {
      approvedOverrides.set(materialId, override)
    }
  }
}

export function getApprovedMaterialCalibration(
  materialId: string,
): MaterialCalibrationOverride | null {
  return approvedOverrides.get(materialId) ?? null
}
