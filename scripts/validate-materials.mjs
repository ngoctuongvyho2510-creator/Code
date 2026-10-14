import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDirectory, '..')

const supportedPresets = new Set([
  'solid_high_gloss',
  'solid_gloss',
  'solid_satin',
  'solid_matte',
  'metallic',
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

const representativeTextureCodes = {
  carbon_fiber: 'SW900-194-X',
  brushed_metal: 'SW900-812-X',
  rugged_texture: 'SW900-182-X',
}

const requiredStaticFiles = [
  'src/components/viewer/S4Model.tsx',
  'src/three/materials/createWrapMaterial.ts',
  'src/three/materials/wrapMaterialProfiles.ts',
  'src/three/materials/wrapMaterialShaders.ts',
]

function readProjectFile(relativePath) {
  return readFileSync(path.join(projectRoot, relativePath), 'utf8')
}

function fail(message) {
  throw new Error(message)
}

function assert(condition, message) {
  if (!condition) {
    fail(message)
  }
}

function resolvePreset(material) {
  const code = material.manufacturerCode
  const effectType = material.effectType.toLowerCase()
  const group = material.catalogGroup.toLowerCase()

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

  return material.renderPresetId
}

function getOfficialMaterials() {
  const catalogSource = readProjectFile('src/data/materials/officialMaterials.json')

  return JSON.parse(catalogSource)
}

function validateCatalogCounts(materials) {
  const threeMCount = materials.filter((material) => material.brand === '3M').length
  const averyCount = materials.filter(
    (material) => material.brand === 'Avery Dennison',
  ).length

  assert(threeMCount === 111, `Expected 111 3M records, found ${threeMCount}`)
  assert(
    averyCount === 151,
    `Expected 151 Avery records, found ${averyCount}`,
  )

  return { averyCount, threeMCount }
}

function validateResolvedPresets(materials) {
  for (const material of materials) {
    const resolvedPreset = resolvePreset(material)

    assert(
      supportedPresets.has(resolvedPreset),
      `${material.manufacturerCode} resolves to unsupported preset ${resolvedPreset}`,
    )
    assert(
      typeof material.primaryHex === 'string' && material.primaryHex.length > 0,
      `${material.manufacturerCode} has no resolvable primary color`,
    )

    if (material.manufacturerCode.startsWith('SF100-')) {
      assert(
        resolvedPreset === 'chrome',
        `${material.manufacturerCode} must resolve to chrome`,
      )
    }

    if (
      material.effectType.toLowerCase() === 'diamond' ||
      material.catalogGroup.toLowerCase() === 'diamond'
    ) {
      assert(
        resolvedPreset === 'diamond_flake',
        `${material.manufacturerCode} must resolve to diamond_flake`,
      )
    }

    if (
      material.effectType.toLowerCase() === 'color_shift' ||
      material.catalogGroup.toLowerCase() === 'colorflow'
    ) {
      assert(
        resolvedPreset === 'color_shift',
        `${material.manufacturerCode} must resolve to color_shift`,
      )
    }
  }
}

function validateTextureFamilies(materials) {
  for (const [expectedPreset, code] of Object.entries(representativeTextureCodes)) {
    const material = materials.find((item) => item.manufacturerCode === code)

    assert(material, `Missing representative material ${code}`)
    assert(
      resolvePreset(material) === expectedPreset,
      `${code} must resolve to ${expectedPreset}`,
    )
  }
}

function validateRendererSource() {
  const sourceByFile = Object.fromEntries(
    requiredStaticFiles.map((relativePath) => [
      relativePath,
      readProjectFile(relativePath),
    ]),
  )
  const combinedSource = Object.values(sourceByFile).join('\n')

  assert(
    !sourceByFile['src/components/viewer/S4Model.tsx'].includes('swatchAsset'),
    'S4Model must not read swatchAsset for vehicle materials',
  )
  assert(
    !combinedSource.includes('applyWrapProceduralTexture') &&
      !combinedSource.includes('wrapProceduralTextureCache') &&
      !combinedSource.includes('getWrapProceduralTexture') &&
      !combinedSource.includes('createWrapProceduralTexture'),
    'Old white-noise wrap texture generator is still referenced',
  )
  assert(
    !combinedSource.includes('Math.random()'),
    'Wrap renderer must not use Math.random during render',
  )
  assert(
    !sourceByFile['src/three/materials/wrapMaterialShaders.ts'].includes(
      'mesh.uuid',
    ),
    'Shader preset seed must not use mesh UUID',
  )
  assert(
    !sourceByFile['src/three/materials/createWrapMaterial.ts'].includes(
      'swatchAsset',
    ) &&
      !sourceByFile['src/three/materials/wrapMaterialProfiles.ts'].includes(
        'swatchAsset',
      ),
    'Central wrap renderer must not use swatchAsset as a material texture',
  )
}

const materials = getOfficialMaterials()
const counts = validateCatalogCounts(materials)

validateResolvedPresets(materials)
validateTextureFamilies(materials)
validateRendererSource()

console.info(
  `Material validation passed: ${counts.threeMCount} 3M, ${counts.averyCount} Avery.`,
)
