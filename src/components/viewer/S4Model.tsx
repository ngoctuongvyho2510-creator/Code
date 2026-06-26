import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import {
  Box3,
  BufferGeometry,
  Color,
  EdgesGeometry,
  FrontSide,
  LineBasicMaterial,
  LineSegments,
  Material,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Quaternion,
  Raycaster,
  SRGBColorSpace,
  Texture,
  Vector2,
  Vector3,
  type Object3DEventMap,
} from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import {
  CALIPER_PAINT_MESH_NAMES,
  CHROME_DELETE_MESH_NAMES,
  FULL_BODY_MESH_NAMES,
  FULL_BODY_TARGET_ID,
  getSelectablePartByMeshName,
  getSelectionTarget,
  LICENSE_PLATE_MESH_NAMES,
  TINTABLE_GLASS_MESH_NAMES,
  WRAP_CAPABLE_MESH_NAMES,
} from '../../config/vehicleParts'
import type {
  AppliedDesignState,
  CaliperPaintConfig,
  CaliperPaintFinish,
  CaliperPaintPreviewState,
  ChromeDeleteConfig,
  ChromeDeleteFinish,
  ChromeDeletePreviewState,
  TintConfig,
  TintPreviewState,
  VehiclePartDefinition,
  WrapConfig,
  WrapFinish,
  WrapPreviewState,
} from '../../types/configurator'

const MODEL_URL = '/Mahir S4.glb'
const PLATE_TEXTURE_URL = '/MW Plate.png'
const MOUSE_CLICK_THRESHOLD_PX = 6
const TOUCH_TAP_THRESHOLD_PX = 10
const CAMERA_POSITION_EPSILON = 0.002
const CAMERA_TARGET_EPSILON = 0.002
const CAMERA_ROTATION_EPSILON = 0.001
const OUTLINE_EDGE_THRESHOLD_DEGREES = 28
const HOVER_OUTLINE_COLOR = new Color('#c49d59')
const SELECTED_OUTLINE_COLOR = new Color('#f1c76d')

type ModelMesh = Mesh<BufferGeometry, Material | Material[], Object3DEventMap>

type PreparedModelScene = {
  fallbackPlateSurfaceNames: string[]
  foundCaliperPaintMeshNames: Set<string>
  foundChromeDeleteMeshNames: Set<string>
  foundTintableMeshNames: Set<string>
  foundWrapCapableMeshNames: Set<string>
  nativePlateMeshNames: Set<string>
  originalFactoryMaterialsByMeshUuid: Map<string, Material | Material[]>
  runtimeFactoryMaterialsByMeshUuid: Map<string, Material | Material[]>
  scene: Object3D
}

type ModelInventoryRow = {
  name: string
  type: string
  material: string
  isMesh: boolean
  hasUv: boolean
  transparent: boolean
}

type PointerStart = {
  button: number
  cameraPosition: Vector3
  cameraQuaternion: Quaternion
  clientX: number
  clientY: number
  pointerId: number
  pointerType: string
  target: Vector3 | null
}

type S4ModelProps = {
  appliedDesign: AppliedDesignState
  caliperPaintPreview: CaliperPaintPreviewState | null
  controlsRef: RefObject<OrbitControlsImpl | null>
  chromeDeletePreview: ChromeDeletePreviewState | null
  selectedTargetId: string | null
  tintPreview: TintPreviewState | null
  wrapPreview: WrapPreviewState | null
  onPartSelect: (partId: string) => void
  onSelectionClear: () => void
}

const inspectedScenes = new WeakSet<Object3D>()
const inspectedCaliperPaintMeshScenes = new WeakSet<Object3D>()
const inspectedChromeDeleteMeshScenes = new WeakSet<Object3D>()
const inspectedTintableMeshScenes = new WeakSet<Object3D>()
const inspectedWrapMeshScenes = new WeakSet<Object3D>()
const plateMeshNames = new Set<string>(LICENSE_PLATE_MESH_NAMES)
const caliperPaintMeshNames = new Set<string>(CALIPER_PAINT_MESH_NAMES)
const chromeDeleteMeshNames = new Set<string>(CHROME_DELETE_MESH_NAMES)
const tintableMeshNames = new Set<string>(TINTABLE_GLASS_MESH_NAMES)
const fullBodyMeshNames = new Set<string>(FULL_BODY_MESH_NAMES)
const wrapCapableMeshNames = new Set<string>(WRAP_CAPABLE_MESH_NAMES)
const factoryChromeSideWindowTrimMeshNames = new Set<string>([
  'MW_TRIM_WINDOW_CHROME_L',
  'MW_TRIM_WINDOW_CHROME_R',
  'MW_TRIM_BODY_SIDE_WINDOW_FRAME_FL',
  'MW_TRIM_BODY_SIDE_WINDOW_FRAME_FR',
  'MW_TRIM_BODY_SIDE_WINDOW_FRAME_RL',
  'MW_TRIM_BODY_SIDE_WINDOW_FRAME_RR',
  'MW_TRIM_DOOR_WINDOW_FRAME_FL',
  'MW_TRIM_DOOR_WINDOW_FRAME_FR',
  'MW_TRIM_DOOR_WINDOW_FRAME_RL',
  'MW_TRIM_DOOR_WINDOW_FRAME_RR',
  'MW_TRIM_QUARTER_WINDOW_FRAME_L',
  'MW_TRIM_QUARTER_WINDOW_FRAME_R',
])
const cleanBlackExteriorTrimMeshNames = new Set<string>([
  'MW_TRIM_B_PILLAR_FL',
  'MW_TRIM_B_PILLAR_FR',
  'MW_TRIM_B_PILLAR_RL',
  'MW_TRIM_B_PILLAR_RR',
  'MW_INTERIOR_REAR_DOOR_QUARTER_WINDOW_TRIM_RL',
  'MW_INTERIOR_REAR_DOOR_QUARTER_WINDOW_TRIM_RR',
  'MW_TRIM_REAR_DOOR_QUARTER_APPLIQUE_RL',
  'MW_TRIM_REAR_DOOR_QUARTER_APPLIQUE_RR',
  'MW_TRIM_SAIL_PANEL_L',
  'MW_TRIM_SAIL_PANEL_R',
  'MW_TRIM_WINDSHIELD_SIDE_MOLDING_L',
  'MW_TRIM_WINDSHIELD_SIDE_MOLDING_R',
])
const plateMaterialNamePattern = /^LicPlate_/i
const factoryPaintMaterialName = 'carpaint'

const cleanFactoryPaintSettings = {
  clearcoat: 0.84,
  clearcoatRoughness: 0.08,
  envMapIntensity: 1.18,
  metalness: 0.02,
  reflectivity: 0.56,
  roughness: 0.24,
} as const

const cleanFactoryChromeTrimSettings = {
  clearcoat: 0.64,
  clearcoatRoughness: 0.04,
  color: '#f0eee7',
  envMapIntensity: 1.68,
  metalness: 1,
  reflectivity: 0.9,
  roughness: 0.08,
} as const

const cleanBlackExteriorTrimSettings = {
  clearcoat: 0.18,
  clearcoatRoughness: 0.34,
  color: '#030303',
  envMapIntensity: 0.78,
  metalness: 0,
  reflectivity: 0.26,
  roughness: 0.5,
} as const

const wrapFinishSettings = {
  gloss: {
    clearcoat: 0.92,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.35,
    reflectivity: 0.62,
    roughness: 0.18,
  },
  satin: {
    clearcoat: 0.48,
    clearcoatRoughness: 0.28,
    envMapIntensity: 1.05,
    reflectivity: 0.48,
    roughness: 0.45,
  },
  matte: {
    clearcoat: 0.08,
    clearcoatRoughness: 0.68,
    envMapIntensity: 0.78,
    reflectivity: 0.32,
    roughness: 0.78,
  },
} as const satisfies Record<
  WrapFinish,
  {
    clearcoat: number
    clearcoatRoughness: number
    envMapIntensity: number
    reflectivity: number
    roughness: number
  }
>

const chromeDeleteFinishSettings = {
  gloss: {
    clearcoat: 0.72,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.18,
    reflectivity: 0.5,
    roughness: 0.2,
  },
  satin: {
    clearcoat: 0.34,
    clearcoatRoughness: 0.28,
    envMapIntensity: 0.95,
    reflectivity: 0.38,
    roughness: 0.48,
  },
  matte: {
    clearcoat: 0.06,
    clearcoatRoughness: 0.65,
    envMapIntensity: 0.72,
    reflectivity: 0.24,
    roughness: 0.78,
  },
} as const satisfies Record<
  ChromeDeleteFinish,
  {
    clearcoat: number
    clearcoatRoughness: number
    envMapIntensity: number
    reflectivity: number
    roughness: number
  }
>

const caliperPaintFinishSettings = {
  gloss: {
    clearcoat: 0.86,
    clearcoatRoughness: 0.08,
    envMapIntensity: 1.18,
    reflectivity: 0.54,
    roughness: 0.18,
  },
  satin: {
    clearcoat: 0.34,
    clearcoatRoughness: 0.32,
    envMapIntensity: 0.92,
    reflectivity: 0.36,
    roughness: 0.44,
  },
  matte: {
    clearcoat: 0.04,
    clearcoatRoughness: 0.72,
    envMapIntensity: 0.72,
    reflectivity: 0.22,
    roughness: 0.78,
  },
} as const satisfies Record<
  CaliperPaintFinish,
  {
    clearcoat: number
    clearcoatRoughness: number
    envMapIntensity: number
    reflectivity: number
    roughness: number
  }
>

function isModelMesh(object: Object3D): object is ModelMesh {
  return object instanceof Mesh
}

function isOutlineObject(object: Object3D): boolean {
  let current: Object3D | null = object

  while (current) {
    if (current.userData.modifyWrapOutline === true) {
      return true
    }

    current = current.parent
  }

  return false
}

function getMaterials(material: Material | Material[]): Material[] {
  return Array.isArray(material) ? material : [material]
}

function cloneMaterials(material: Material | Material[]): Material | Material[] {
  if (Array.isArray(material)) {
    return material.map((item) => item.clone())
  }

  return material.clone()
}

function clearStandardMaterialTextureInputs(material: MeshStandardMaterial) {
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
  }
}

function applySmoothOpaqueSurfaceDefaults(material: MeshStandardMaterial) {
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

function createCleanFactoryPaintMaterial(
  material: MeshStandardMaterial,
): MeshPhysicalMaterial {
  const runtimeMaterial = new MeshPhysicalMaterial()

  runtimeMaterial.name = material.name
  runtimeMaterial.color.copy(material.color)
  runtimeMaterial.emissive.copy(material.emissive)
  runtimeMaterial.emissiveIntensity = 0
  runtimeMaterial.envMap = material.envMap
  runtimeMaterial.envMapIntensity = cleanFactoryPaintSettings.envMapIntensity
  runtimeMaterial.metalness = cleanFactoryPaintSettings.metalness
  runtimeMaterial.roughness = cleanFactoryPaintSettings.roughness
  runtimeMaterial.clearcoat = cleanFactoryPaintSettings.clearcoat
  runtimeMaterial.clearcoatRoughness =
    cleanFactoryPaintSettings.clearcoatRoughness
  runtimeMaterial.reflectivity = cleanFactoryPaintSettings.reflectivity

  clearStandardMaterialTextureInputs(runtimeMaterial)
  applySmoothOpaqueSurfaceDefaults(runtimeMaterial)

  return runtimeMaterial
}

function createCleanFactoryChromeTrimMaterial(
  material: MeshStandardMaterial,
): MeshPhysicalMaterial {
  const runtimeMaterial = new MeshPhysicalMaterial()

  runtimeMaterial.name = material.name
  runtimeMaterial.color.set(cleanFactoryChromeTrimSettings.color)
  runtimeMaterial.emissive.set(0, 0, 0)
  runtimeMaterial.emissiveIntensity = 0
  runtimeMaterial.envMap = material.envMap
  runtimeMaterial.envMapIntensity =
    cleanFactoryChromeTrimSettings.envMapIntensity
  runtimeMaterial.metalness = cleanFactoryChromeTrimSettings.metalness
  runtimeMaterial.roughness = cleanFactoryChromeTrimSettings.roughness
  runtimeMaterial.clearcoat = cleanFactoryChromeTrimSettings.clearcoat
  runtimeMaterial.clearcoatRoughness =
    cleanFactoryChromeTrimSettings.clearcoatRoughness
  runtimeMaterial.reflectivity = cleanFactoryChromeTrimSettings.reflectivity

  clearStandardMaterialTextureInputs(runtimeMaterial)
  applySmoothOpaqueSurfaceDefaults(runtimeMaterial)

  return runtimeMaterial
}

function createCleanBlackExteriorTrimMaterial(
  material: MeshStandardMaterial,
): MeshPhysicalMaterial {
  const runtimeMaterial = new MeshPhysicalMaterial()

  runtimeMaterial.name = material.name
  runtimeMaterial.color.set(cleanBlackExteriorTrimSettings.color)
  runtimeMaterial.emissive.set(0, 0, 0)
  runtimeMaterial.emissiveIntensity = 0
  runtimeMaterial.envMap = material.envMap
  runtimeMaterial.envMapIntensity =
    cleanBlackExteriorTrimSettings.envMapIntensity
  runtimeMaterial.metalness = cleanBlackExteriorTrimSettings.metalness
  runtimeMaterial.roughness = cleanBlackExteriorTrimSettings.roughness
  runtimeMaterial.clearcoat = cleanBlackExteriorTrimSettings.clearcoat
  runtimeMaterial.clearcoatRoughness =
    cleanBlackExteriorTrimSettings.clearcoatRoughness
  runtimeMaterial.reflectivity = cleanBlackExteriorTrimSettings.reflectivity

  clearStandardMaterialTextureInputs(runtimeMaterial)
  applySmoothOpaqueSurfaceDefaults(runtimeMaterial)

  return runtimeMaterial
}

function isFactoryPaintMaterial(material: Material): material is MeshStandardMaterial {
  return (
    material instanceof MeshStandardMaterial &&
    material.name === factoryPaintMaterialName
  )
}

function createRuntimeMaterial(
  material: Material,
  wrapCapable: boolean,
  tintCapable: boolean,
  chromeDeleteCapable: boolean,
  caliperPaintCapable: boolean,
  cleanFactoryChromeSideWindowTrim: boolean,
  cleanBlackExteriorTrim: boolean,
): Material {
  if (wrapCapable && isFactoryPaintMaterial(material)) {
    return createCleanFactoryPaintMaterial(material)
  }

  if (
    cleanFactoryChromeSideWindowTrim &&
    material instanceof MeshStandardMaterial
  ) {
    return createCleanFactoryChromeTrimMaterial(material)
  }

  if (cleanBlackExteriorTrim && material instanceof MeshStandardMaterial) {
    return createCleanBlackExteriorTrimMaterial(material)
  }

  if (
    (wrapCapable || tintCapable || chromeDeleteCapable || caliperPaintCapable) &&
    material instanceof MeshStandardMaterial
  ) {
    const runtimeMaterial = new MeshPhysicalMaterial()

    if (material instanceof MeshPhysicalMaterial) {
      runtimeMaterial.copy(material)
    } else {
      MeshStandardMaterial.prototype.copy.call(runtimeMaterial, material)
    }

    runtimeMaterial.name = material.name

    if (!(material instanceof MeshPhysicalMaterial)) {
      runtimeMaterial.clearcoat = 0
      runtimeMaterial.clearcoatRoughness = 0
      runtimeMaterial.reflectivity = 0.5
    }

    return runtimeMaterial
  }

  return material.clone()
}

function createRuntimeMaterials(
  material: Material | Material[],
  wrapCapable: boolean,
  tintCapable: boolean,
  chromeDeleteCapable: boolean,
  caliperPaintCapable: boolean,
  cleanFactoryChromeSideWindowTrim: boolean,
  cleanBlackExteriorTrim: boolean,
): Material | Material[] {
  if (Array.isArray(material)) {
    return material.map((item) =>
      createRuntimeMaterial(
        item,
        wrapCapable,
        tintCapable,
        chromeDeleteCapable,
        caliperPaintCapable,
        cleanFactoryChromeSideWindowTrim,
        cleanBlackExteriorTrim,
      ),
    )
  }

  return createRuntimeMaterial(
    material,
    wrapCapable,
    tintCapable,
    chromeDeleteCapable,
    caliperPaintCapable,
    cleanFactoryChromeSideWindowTrim,
    cleanBlackExteriorTrim,
  )
}

function getMaterialNames(material: Material | Material[]): string {
  return getMaterials(material)
    .map((item) => item.name || '(unnamed material)')
    .join(', ')
}

function hasTransparentMaterial(material: Material | Material[]): boolean {
  return getMaterials(material).some(
    (item) => item.transparent || item.opacity < 1 || item.alphaTest > 0,
  )
}

function hasLicensePlateMaterial(material: Material | Material[]): boolean {
  return getMaterials(material).some((item) =>
    plateMaterialNamePattern.test(item.name),
  )
}

function applyShadowSettings(scene: Object3D) {
  scene.traverse((object) => {
    if (!isModelMesh(object)) {
      return
    }

    const transparent = hasTransparentMaterial(object.material)
    object.castShadow = !transparent
    object.receiveShadow = !transparent
  })
}

function createPlateMaterial(plateTexture: Texture): MeshStandardMaterial {
  const material = new MeshStandardMaterial({
    color: '#ffffff',
    map: plateTexture,
    metalness: 0.04,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
    roughness: 0.48,
  })

  material.name = 'ModifyWrap License Plate'
  return material
}

function createPlateSurface(
  plateMesh: ModelMesh,
  plateTexture: Texture,
  rearPlate: boolean,
): Mesh<PlaneGeometry, MeshStandardMaterial> | null {
  plateMesh.geometry.computeBoundingBox()
  const boundingBox = plateMesh.geometry.boundingBox

  if (!boundingBox) {
    return null
  }

  const size = new Vector3()
  const center = new Vector3()

  boundingBox.getSize(size)
  boundingBox.getCenter(center)

  if (size.x <= 0 || size.y <= 0) {
    return null
  }

  const surface = new Mesh(
    new PlaneGeometry(size.x, size.y),
    createPlateMaterial(plateTexture),
  )
  const zOffset = size.z / 2 + 0.003

  surface.name = rearPlate
    ? 'MW_PART_LICENSE_PLATE_REAR_ARTWORK'
    : 'MW_PART_LICENSE_PLATE_FRONT_ARTWORK'
  surface.position.set(center.x, center.y, center.z + (rearPlate ? -zOffset : zOffset))
  surface.rotation.y = rearPlate ? Math.PI : 0
  surface.renderOrder = 6
  surface.userData.modifyWrapPlateSurface = true
  surface.raycast = () => undefined

  return surface
}

function addRuntimePlateSurfaces(
  scene: Object3D,
  plateTexture: Texture,
): string[] {
  const plateMeshes: ModelMesh[] = []

  scene.updateMatrixWorld(true)
  scene.traverse((object) => {
    if (isModelMesh(object) && hasLicensePlateMaterial(object.material)) {
      plateMeshes.push(object)
    }
  })

  const frontPlateMesh = plateMeshes.find((mesh) =>
    getPlateCenterZ(mesh) >= 0 && getMaterialNames(mesh.material).includes('white'),
  )
  const rearPlateMesh = plateMeshes.find((mesh) =>
    getPlateCenterZ(mesh) < 0 && getMaterialNames(mesh.material).includes('white'),
  )
  const addedSurfaceNames: string[] = []

  for (const [plateMesh, rearPlate] of [
    [frontPlateMesh, false],
    [rearPlateMesh, true],
  ] as const) {
    if (!plateMesh) {
      continue
    }

    const surface = createPlateSurface(plateMesh, plateTexture, rearPlate)

    if (!surface) {
      continue
    }

    plateMesh.add(surface)
    addedSurfaceNames.push(surface.name)
  }

  return addedSurfaceNames
}

function getPlateCenterZ(mesh: ModelMesh): number {
  const boundingBox = new Box3().setFromObject(mesh)
  const center = new Vector3()

  boundingBox.getCenter(center)
  return center.z
}

function prepareModelScene(
  scene: Object3D,
  nativePlateTexture: Texture,
  surfacePlateTexture: Texture,
): PreparedModelScene {
  const fallbackPlateSurfaceNames: string[] = []
  const foundCaliperPaintMeshNames = new Set<string>()
  const foundChromeDeleteMeshNames = new Set<string>()
  const foundTintableMeshNames = new Set<string>()
  const foundWrapCapableMeshNames = new Set<string>()
  const nativePlateMeshNames = new Set<string>()
  const originalFactoryMaterialsByMeshUuid = new Map<
    string,
    Material | Material[]
  >()
  const runtimeFactoryMaterialsByMeshUuid = new Map<
    string,
    Material | Material[]
  >()

  scene.traverse((object) => {
    if (!isModelMesh(object)) {
      return
    }

    originalFactoryMaterialsByMeshUuid.set(
      object.uuid,
      cloneMaterials(object.material),
    )

    const wrapCapable = wrapCapableMeshNames.has(object.name)
    const tintCapable = tintableMeshNames.has(object.name)
    const chromeDeleteCapable = chromeDeleteMeshNames.has(object.name)
    const caliperPaintCapable = caliperPaintMeshNames.has(object.name)
    const cleanFactoryChromeSideWindowTrim =
      factoryChromeSideWindowTrimMeshNames.has(object.name)
    const cleanBlackExteriorTrim = cleanBlackExteriorTrimMeshNames.has(
      object.name,
    )

    if (wrapCapable) {
      foundWrapCapableMeshNames.add(object.name)
    }

    if (chromeDeleteCapable) {
      foundChromeDeleteMeshNames.add(object.name)
    }

    if (caliperPaintCapable) {
      foundCaliperPaintMeshNames.add(object.name)
    }

    if (tintCapable) {
      foundTintableMeshNames.add(object.name)
    }

    if (plateMeshNames.has(object.name)) {
      nativePlateMeshNames.add(object.name)
      object.material = createPlateMaterial(nativePlateTexture)
    } else {
      object.material = createRuntimeMaterials(
        object.material,
        wrapCapable,
        tintCapable,
        chromeDeleteCapable,
        caliperPaintCapable,
        cleanFactoryChromeSideWindowTrim,
        cleanBlackExteriorTrim,
      )
    }

    runtimeFactoryMaterialsByMeshUuid.set(
      object.uuid,
      cloneMaterials(object.material),
    )
  })

  if (nativePlateMeshNames.size < plateMeshNames.size) {
    fallbackPlateSurfaceNames.push(
      ...addRuntimePlateSurfaces(scene, surfacePlateTexture),
    )
  }

  applyShadowSettings(scene)

  return {
    fallbackPlateSurfaceNames,
    foundCaliperPaintMeshNames,
    foundChromeDeleteMeshNames,
    foundTintableMeshNames,
    foundWrapCapableMeshNames,
    nativePlateMeshNames,
    originalFactoryMaterialsByMeshUuid,
    runtimeFactoryMaterialsByMeshUuid,
    scene,
  }
}

function disposeMaterial(material: Material | Material[]) {
  if (Array.isArray(material)) {
    for (const item of material) {
      item.dispose()
    }
    return
  }

  material.dispose()
}

function removeExistingOutlines(scene: Object3D) {
  const outlines: Object3D[] = []

  scene.traverse((object) => {
    if (object.userData.modifyWrapOutline === true) {
      outlines.push(object)
    }
  })

  for (const outline of outlines) {
    outline.parent?.remove(outline)

    if (outline instanceof LineSegments) {
      outline.geometry.dispose()
      disposeMaterial(outline.material)
    }
  }
}

function addOutline(mesh: ModelMesh, selected: boolean) {
  const outlineGeometry = new EdgesGeometry(
    mesh.geometry,
    OUTLINE_EDGE_THRESHOLD_DEGREES,
  )
  const outlineMaterial = new LineBasicMaterial({
    color: selected ? SELECTED_OUTLINE_COLOR : HOVER_OUTLINE_COLOR,
    depthTest: true,
    depthWrite: false,
    opacity: selected ? 0.95 : 0.58,
    toneMapped: false,
    transparent: true,
  })
  const outline = new LineSegments(outlineGeometry, outlineMaterial)

  outline.name = `MW_OUTLINE_${mesh.name}`
  outline.renderOrder = selected ? 12 : 11
  outline.scale.setScalar(selected ? 1.003 : 1.002)
  outline.userData.modifyWrapOutline = true
  outline.raycast = () => undefined
  mesh.add(outline)
}

function applyOutlines(
  scene: Object3D,
  selectedMeshNames: Set<string>,
  hoveredMeshNames: Set<string>,
) {
  removeExistingOutlines(scene)

  scene.traverse((object) => {
    if (!isModelMesh(object) || isOutlineObject(object)) {
      return
    }

    const selected = selectedMeshNames.has(object.name)
    const hovered = hoveredMeshNames.has(object.name)

    if (selected || hovered) {
      addOutline(object, selected)
    }
  })
}

function getInventory(scene: Object3D): ModelInventoryRow[] {
  const rows: ModelInventoryRow[] = []

  scene.traverse((object) => {
    const isMesh = isModelMesh(object)

    rows.push({
      name: object.name || '(unnamed object)',
      type: object.type,
      material: isMesh ? getMaterialNames(object.material) : '',
      isMesh,
      hasUv: isMesh && object.geometry.hasAttribute('uv'),
      transparent: isMesh && hasTransparentMaterial(object.material),
    })
  })

  return rows
}

function logDevelopmentInventory(scene: Object3D) {
  if (!import.meta.env.DEV || inspectedScenes.has(scene)) {
    return
  }

  inspectedScenes.add(scene)
  console.groupCollapsed('Mahir S4 GLB inventory')
  console.table(getInventory(scene))
  console.groupEnd()
}

function logMissingWrapCapableMeshes(preparedScene: PreparedModelScene) {
  if (
    !import.meta.env.DEV ||
    inspectedWrapMeshScenes.has(preparedScene.scene)
  ) {
    return
  }

  inspectedWrapMeshScenes.add(preparedScene.scene)

  const missingMeshNames = WRAP_CAPABLE_MESH_NAMES.filter(
    (meshName) => !preparedScene.foundWrapCapableMeshNames.has(meshName),
  )

  if (missingMeshNames.length === 0) {
    console.info('All registered wrap-capable meshes were found in Mahir S4.glb.')
    return
  }

  console.warn('Registered wrap-capable meshes not found in Mahir S4.glb')
  console.table(missingMeshNames)
}

function logMissingTintableMeshes(preparedScene: PreparedModelScene) {
  if (
    !import.meta.env.DEV ||
    inspectedTintableMeshScenes.has(preparedScene.scene)
  ) {
    return
  }

  inspectedTintableMeshScenes.add(preparedScene.scene)

  const missingMeshNames = TINTABLE_GLASS_MESH_NAMES.filter(
    (meshName) => !preparedScene.foundTintableMeshNames.has(meshName),
  )

  if (missingMeshNames.length === 0) {
    console.info('All registered tintable glass meshes were found in Mahir S4.glb.')
    return
  }

  console.warn('Registered tintable glass meshes not found in Mahir S4.glb')
  console.table(missingMeshNames)
}

function logMissingChromeDeleteMeshes(preparedScene: PreparedModelScene) {
  if (
    !import.meta.env.DEV ||
    inspectedChromeDeleteMeshScenes.has(preparedScene.scene)
  ) {
    return
  }

  inspectedChromeDeleteMeshScenes.add(preparedScene.scene)

  const missingMeshNames = CHROME_DELETE_MESH_NAMES.filter(
    (meshName) => !preparedScene.foundChromeDeleteMeshNames.has(meshName),
  )

  if (missingMeshNames.length === 0) {
    console.info('All registered chrome-delete meshes were found in Mahir S4.glb.')
    return
  }

  console.warn('Registered chrome-delete meshes not found in Mahir S4.glb')
  console.table(missingMeshNames)
}

function logMissingCaliperPaintMeshes(preparedScene: PreparedModelScene) {
  if (
    !import.meta.env.DEV ||
    inspectedCaliperPaintMeshScenes.has(preparedScene.scene)
  ) {
    return
  }

  inspectedCaliperPaintMeshScenes.add(preparedScene.scene)

  const missingMeshNames = CALIPER_PAINT_MESH_NAMES.filter(
    (meshName) => !preparedScene.foundCaliperPaintMeshNames.has(meshName),
  )

  if (missingMeshNames.length === 0) {
    console.info('All registered caliper-paint meshes were found in Mahir S4.glb.')
    return
  }

  console.warn('Registered caliper-paint meshes not found in Mahir S4.glb')
  console.table(missingMeshNames)
}

function copyMaterialState(
  target: Material | Material[],
  source: Material | Material[],
) {
  if (Array.isArray(target) && Array.isArray(source)) {
    const materialCount = Math.min(target.length, source.length)

    for (let index = 0; index < materialCount; index += 1) {
      target[index].copy(source[index])
      target[index].needsUpdate = true
    }

    return
  }

  if (!Array.isArray(target) && !Array.isArray(source)) {
    target.copy(source)
    target.needsUpdate = true
  }
}

function resetMeshMaterialToFactory(
  mesh: ModelMesh,
  preparedScene: PreparedModelScene,
) {
  const factoryMaterial =
    preparedScene.runtimeFactoryMaterialsByMeshUuid.get(mesh.uuid)

  if (!factoryMaterial) {
    return
  }

  copyMaterialState(mesh.material, factoryMaterial)
}

function applyWrapToMaterial(material: Material, wrap: WrapConfig) {
  if (!(material instanceof MeshStandardMaterial)) {
    return
  }

  const settings = wrapFinishSettings[wrap.finish]

  clearStandardMaterialTextureInputs(material)
  applySmoothOpaqueSurfaceDefaults(material)

  material.color.setStyle(wrap.color, SRGBColorSpace)
  material.emissive.set(0, 0, 0)
  material.emissiveIntensity = 0
  material.metalness = 0.02
  material.roughness = settings.roughness
  material.envMapIntensity = settings.envMapIntensity

  if (material instanceof MeshPhysicalMaterial) {
    material.clearcoat = settings.clearcoat
    material.clearcoatRoughness = settings.clearcoatRoughness
    material.reflectivity = settings.reflectivity
  }

  material.needsUpdate = true
}

function applyWrapToMesh(mesh: ModelMesh, wrap: WrapConfig) {
  for (const material of getMaterials(mesh.material)) {
    applyWrapToMaterial(material, wrap)
  }
}

function getEffectiveWrapForMesh(
  meshName: string,
  appliedDesign: AppliedDesignState,
  wrapPreview: WrapPreviewState | null,
): WrapConfig | null {
  const part = getSelectablePartByMeshName(meshName)

  if (!part?.services.includes('wrap')) {
    return null
  }

  const previewAppliesToFullBody = wrapPreview?.targetId === FULL_BODY_TARGET_ID
  const previewAppliesToPart = wrapPreview?.targetId === part.id

  const partWrap = previewAppliesToPart
    ? wrapPreview.wrap
    : (appliedDesign.parts[part.id]?.wrap ?? null)

  if (partWrap) {
    return partWrap
  }

  if (!fullBodyMeshNames.has(meshName)) {
    return null
  }

  return previewAppliesToFullBody
    ? wrapPreview.wrap
    : appliedDesign.fullBody.wrap
}

function applyWrapMaterials(
  preparedScene: PreparedModelScene,
  appliedDesign: AppliedDesignState,
  wrapPreview: WrapPreviewState | null,
) {
  preparedScene.scene.traverse((object) => {
    if (!isModelMesh(object) || !wrapCapableMeshNames.has(object.name)) {
      return
    }

    resetMeshMaterialToFactory(object, preparedScene)

    const wrap = getEffectiveWrapForMesh(
      object.name,
      appliedDesign,
      wrapPreview,
    )

    if (wrap) {
      applyWrapToMesh(object, wrap)
    }
  })
}

function clampTintVlt(vlt: number): number {
  if (!Number.isFinite(vlt)) {
    return 35
  }

  return Math.min(100, Math.max(5, vlt))
}

function getTintDarkness(vlt: number): number {
  return (100 - clampTintVlt(vlt)) / 95
}

function getTintColor(vlt: number): Color {
  const darkness = getTintDarkness(vlt)
  const color = new Color('#9aa4ad')

  color.lerp(new Color('#050608'), darkness)
  return color
}

function getTintAttenuationColor(vlt: number): Color {
  const darkness = getTintDarkness(vlt)
  const color = new Color('#c7d0d7')

  color.lerp(new Color('#020304'), darkness)
  return color
}

function applyTintToMaterial(material: Material, tint: TintConfig) {
  if (!(material instanceof MeshStandardMaterial)) {
    return
  }

  const darkness = getTintDarkness(tint.vlt)

  material.color.copy(getTintColor(tint.vlt))
  material.transparent = true
  material.opacity = 0.22 + darkness * 0.5
  material.depthWrite = false
  material.metalness = 0
  material.roughness = 0.035 + darkness * 0.08
  material.envMapIntensity = 1.22 + darkness * 0.34

  if (material instanceof MeshPhysicalMaterial) {
    material.clearcoat = 0.52 + darkness * 0.18
    material.clearcoatRoughness = 0.035 + darkness * 0.04
    material.reflectivity = 0.72 + darkness * 0.18
    material.transmission = 0.9 - darkness * 0.48
    material.thickness = 0.18 + darkness * 0.58
    material.attenuationColor.copy(getTintAttenuationColor(tint.vlt))
    material.attenuationDistance = 3.2 - darkness * 2.72
    material.ior = 1.45
  }

  material.needsUpdate = true
}

function applyTintToMesh(mesh: ModelMesh, tint: TintConfig) {
  for (const material of getMaterials(mesh.material)) {
    applyTintToMaterial(material, tint)
  }
}

function getEffectiveTintForMesh(
  meshName: string,
  appliedDesign: AppliedDesignState,
  tintPreview: TintPreviewState | null,
  previewTargetIds: Set<string>,
): TintConfig | null {
  if (!tintableMeshNames.has(meshName)) {
    return null
  }

  const part = getSelectablePartByMeshName(meshName)

  if (!part?.services.includes('tint')) {
    return null
  }

  if (tintPreview && previewTargetIds.has(part.id)) {
    return tintPreview.tint
  }

  return appliedDesign.parts[part.id]?.tint ?? null
}

function applyTintMaterials(
  preparedScene: PreparedModelScene,
  appliedDesign: AppliedDesignState,
  tintPreview: TintPreviewState | null,
) {
  const previewTargetIds = new Set(tintPreview?.targetIds ?? [])

  preparedScene.scene.traverse((object) => {
    if (!isModelMesh(object) || !tintableMeshNames.has(object.name)) {
      return
    }

    resetMeshMaterialToFactory(object, preparedScene)

    const tint = getEffectiveTintForMesh(
      object.name,
      appliedDesign,
      tintPreview,
      previewTargetIds,
    )

    if (tint) {
      applyTintToMesh(object, tint)
    }
  })
}

function applyChromeDeleteToMaterial(
  material: Material,
  chromeDelete: ChromeDeleteConfig,
) {
  if (!(material instanceof MeshStandardMaterial)) {
    return
  }

  const settings = chromeDeleteFinishSettings[chromeDelete.finish]

  clearStandardMaterialTextureInputs(material)
  applySmoothOpaqueSurfaceDefaults(material)

  material.color.setStyle(chromeDelete.color, SRGBColorSpace)
  material.emissive.set(0, 0, 0)
  material.emissiveIntensity = 0
  material.metalness = 0.02
  material.roughness = settings.roughness
  material.envMapIntensity = settings.envMapIntensity

  if (material instanceof MeshPhysicalMaterial) {
    material.clearcoat = settings.clearcoat
    material.clearcoatRoughness = settings.clearcoatRoughness
    material.reflectivity = settings.reflectivity
    material.transmission = 0
    material.thickness = 0
  }

  material.needsUpdate = true
}

function applyChromeDeleteToMesh(
  mesh: ModelMesh,
  chromeDelete: ChromeDeleteConfig,
) {
  for (const material of getMaterials(mesh.material)) {
    applyChromeDeleteToMaterial(material, chromeDelete)
  }
}

function getEffectiveChromeDeleteForMesh(
  meshName: string,
  appliedDesign: AppliedDesignState,
  chromeDeletePreview: ChromeDeletePreviewState | null,
  previewTargetIds: Set<string>,
): ChromeDeleteConfig | null {
  if (!chromeDeleteMeshNames.has(meshName)) {
    return null
  }

  const part = getSelectablePartByMeshName(meshName)

  if (!part?.services.includes('chrome-delete')) {
    return null
  }

  if (chromeDeletePreview && previewTargetIds.has(part.id)) {
    return chromeDeletePreview.chromeDelete
  }

  return appliedDesign.parts[part.id]?.chromeDelete ?? null
}

function applyChromeDeleteMaterials(
  preparedScene: PreparedModelScene,
  appliedDesign: AppliedDesignState,
  chromeDeletePreview: ChromeDeletePreviewState | null,
) {
  const previewTargetIds = new Set(chromeDeletePreview?.targetIds ?? [])

  preparedScene.scene.traverse((object) => {
    if (!isModelMesh(object) || !chromeDeleteMeshNames.has(object.name)) {
      return
    }

    resetMeshMaterialToFactory(object, preparedScene)

    const chromeDelete = getEffectiveChromeDeleteForMesh(
      object.name,
      appliedDesign,
      chromeDeletePreview,
      previewTargetIds,
    )

    if (chromeDelete) {
      applyChromeDeleteToMesh(object, chromeDelete)
    }
  })
}

function applyCaliperPaintToMaterial(
  material: Material,
  caliperPaint: CaliperPaintConfig,
) {
  if (!(material instanceof MeshStandardMaterial)) {
    return
  }

  const settings = caliperPaintFinishSettings[caliperPaint.finish]

  clearStandardMaterialTextureInputs(material)
  applySmoothOpaqueSurfaceDefaults(material)

  material.color.setStyle(caliperPaint.color, SRGBColorSpace)
  material.emissive.set(0, 0, 0)
  material.emissiveIntensity = 0
  material.metalness = 0
  material.roughness = settings.roughness
  material.envMapIntensity = settings.envMapIntensity

  if (material instanceof MeshPhysicalMaterial) {
    material.clearcoat = settings.clearcoat
    material.clearcoatRoughness = settings.clearcoatRoughness
    material.reflectivity = settings.reflectivity
    material.transmission = 0
    material.thickness = 0
  }

  material.needsUpdate = true
}

function applyCaliperPaintToMesh(
  mesh: ModelMesh,
  caliperPaint: CaliperPaintConfig,
) {
  for (const material of getMaterials(mesh.material)) {
    applyCaliperPaintToMaterial(material, caliperPaint)
  }
}

function getEffectiveCaliperPaintForMesh(
  meshName: string,
  appliedDesign: AppliedDesignState,
  caliperPaintPreview: CaliperPaintPreviewState | null,
  previewTargetIds: Set<string>,
): CaliperPaintConfig | null {
  if (!caliperPaintMeshNames.has(meshName)) {
    return null
  }

  const part = getSelectablePartByMeshName(meshName)

  if (!part?.services.includes('caliper-paint')) {
    return null
  }

  if (caliperPaintPreview && previewTargetIds.has(part.id)) {
    return caliperPaintPreview.caliperPaint
  }

  return appliedDesign.parts[part.id]?.caliperPaint ?? null
}

function applyCaliperPaintMaterials(
  preparedScene: PreparedModelScene,
  appliedDesign: AppliedDesignState,
  caliperPaintPreview: CaliperPaintPreviewState | null,
) {
  const previewTargetIds = new Set(caliperPaintPreview?.targetIds ?? [])

  preparedScene.scene.traverse((object) => {
    if (!isModelMesh(object) || !caliperPaintMeshNames.has(object.name)) {
      return
    }

    resetMeshMaterialToFactory(object, preparedScene)

    const caliperPaint = getEffectiveCaliperPaintForMesh(
      object.name,
      appliedDesign,
      caliperPaintPreview,
      previewTargetIds,
    )

    if (caliperPaint) {
      applyCaliperPaintToMesh(object, caliperPaint)
    }
  })
}

function resolveSelectablePart(object: Object3D): VehiclePartDefinition | null {
  let current: Object3D | null = object

  while (current) {
    const part = current.name ? getSelectablePartByMeshName(current.name) : null

    if (part) {
      return part
    }

    current = current.parent
  }

  return null
}

function getTargetMeshNames(targetId: string | null): Set<string> {
  if (!targetId) {
    return new Set()
  }

  const target = getSelectionTarget(targetId)
  return new Set(target?.meshNames ?? [])
}

function getPointerCoordinates(
  event: PointerEvent,
  element: HTMLCanvasElement,
): Vector2 {
  const rect = element.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1)

  return new Vector2(x, y)
}

function getPartIdFromPointer(
  event: PointerEvent,
  canvas: HTMLCanvasElement,
  camera: Parameters<Raycaster['setFromCamera']>[1],
  scene: Object3D,
  raycaster: Raycaster,
): string | null {
  raycaster.setFromCamera(getPointerCoordinates(event, canvas), camera)

  const intersections = raycaster.intersectObject(scene, true)
  let firstPart: VehiclePartDefinition | null = null

  for (const intersection of intersections) {
    if (isOutlineObject(intersection.object)) {
      continue
    }

    const part = resolveSelectablePart(intersection.object)

    if (!part) {
      continue
    }

    firstPart ??= part

    if (
      part.services.includes('chrome-delete') ||
      part.services.includes('caliper-paint')
    ) {
      return part.id
    }
  }

  if (firstPart) {
    return firstPart.id
  }

  return null
}

function getMovedDistance(pointerStart: PointerStart, event: PointerEvent): number {
  return Math.hypot(
    event.clientX - pointerStart.clientX,
    event.clientY - pointerStart.clientY,
  )
}

function controlsMovedMeaningfully(
  pointerStart: PointerStart,
  controls: OrbitControlsImpl | null,
  cameraPosition: Vector3,
  cameraQuaternion: Quaternion,
): boolean {
  if (
    cameraPosition.distanceTo(pointerStart.cameraPosition) >
    CAMERA_POSITION_EPSILON
  ) {
    return true
  }

  if (
    cameraQuaternion.angleTo(pointerStart.cameraQuaternion) >
    CAMERA_ROTATION_EPSILON
  ) {
    return true
  }

  if (
    controls &&
    pointerStart.target &&
    controls.target.distanceTo(pointerStart.target) > CAMERA_TARGET_EPSILON
  ) {
    return true
  }

  return false
}

function isPrimarySelectionPointer(event: PointerEvent): boolean {
  if (event.pointerType === 'mouse') {
    return event.button === 0
  }

  if (event.pointerType === 'touch') {
    return event.isPrimary
  }

  return event.button === 0
}

function getSelectionThreshold(pointerType: string): number {
  return pointerType === 'touch'
    ? TOUCH_TAP_THRESHOLD_PX
    : MOUSE_CLICK_THRESHOLD_PX
}

export function S4Model({
  appliedDesign,
  caliperPaintPreview,
  chromeDeletePreview,
  controlsRef,
  selectedTargetId,
  tintPreview,
  wrapPreview,
  onPartSelect,
  onSelectionClear,
}: S4ModelProps) {
  const gltf = useGLTF(MODEL_URL)
  const plateTexture = useTexture(PLATE_TEXTURE_URL)
  const { camera, gl } = useThree()
  const pointerStartRef = useRef<PointerStart | null>(null)
  const raycasterRef = useRef(new Raycaster())
  const activeTouchPointersRef = useRef(new Set<number>())
  const multiTouchGestureRef = useRef(false)
  const [hoveredPartId, setHoveredPartId] = useState<string | null>(null)

  const preparedNativePlateTexture = useMemo(() => {
    const texture = plateTexture.clone()

    texture.colorSpace = SRGBColorSpace
    texture.flipY = false
    texture.needsUpdate = true

    return texture
  }, [plateTexture])

  const preparedSurfacePlateTexture = useMemo(() => {
    const texture = plateTexture.clone()

    texture.colorSpace = SRGBColorSpace
    texture.flipY = true
    texture.needsUpdate = true

    return texture
  }, [plateTexture])

  const preparedScene = useMemo(() => {
    const clonedScene = clone(gltf.scene)
    return prepareModelScene(
      clonedScene,
      preparedNativePlateTexture,
      preparedSurfacePlateTexture,
    )
  }, [gltf.scene, preparedNativePlateTexture, preparedSurfacePlateTexture])

  const modelScene = preparedScene.scene

  const selectedMeshNames = useMemo(
    () => getTargetMeshNames(selectedTargetId),
    [selectedTargetId],
  )

  const hoveredMeshNames = useMemo(() => {
    const targetMeshNames = getTargetMeshNames(hoveredPartId)

    for (const meshName of selectedMeshNames) {
      targetMeshNames.delete(meshName)
    }

    return targetMeshNames
  }, [hoveredPartId, selectedMeshNames])

  useEffect(() => {
    logDevelopmentInventory(gltf.scene)
  }, [gltf.scene])

  useEffect(() => {
    logMissingWrapCapableMeshes(preparedScene)
  }, [preparedScene])

  useEffect(() => {
    logMissingTintableMeshes(preparedScene)
  }, [preparedScene])

  useEffect(() => {
    logMissingChromeDeleteMeshes(preparedScene)
  }, [preparedScene])

  useEffect(() => {
    logMissingCaliperPaintMeshes(preparedScene)
  }, [preparedScene])

  useEffect(() => {
    applyWrapMaterials(preparedScene, appliedDesign, wrapPreview)
  }, [appliedDesign, preparedScene, wrapPreview])

  useEffect(() => {
    applyTintMaterials(preparedScene, appliedDesign, tintPreview)
  }, [appliedDesign, preparedScene, tintPreview])

  useEffect(() => {
    applyChromeDeleteMaterials(
      preparedScene,
      appliedDesign,
      chromeDeletePreview,
    )
  }, [appliedDesign, chromeDeletePreview, preparedScene])

  useEffect(() => {
    applyCaliperPaintMaterials(
      preparedScene,
      appliedDesign,
      caliperPaintPreview,
    )
  }, [appliedDesign, caliperPaintPreview, preparedScene])

  useEffect(() => {
    applyOutlines(modelScene, selectedMeshNames, hoveredMeshNames)

    return () => {
      removeExistingOutlines(modelScene)
    }
  }, [hoveredMeshNames, modelScene, selectedMeshNames])

  useEffect(() => {
    document.body.style.cursor = hoveredPartId ? 'pointer' : ''

    return () => {
      document.body.style.cursor = ''
    }
  }, [hoveredPartId])

  useEffect(() => {
    const canvas = gl.domElement

    function updateTouchPointers(event: PointerEvent, active: boolean) {
      if (event.pointerType !== 'touch') {
        return
      }

      if (active) {
        activeTouchPointersRef.current.add(event.pointerId)
      } else {
        activeTouchPointersRef.current.delete(event.pointerId)
      }

      if (activeTouchPointersRef.current.size > 1) {
        multiTouchGestureRef.current = true
        pointerStartRef.current = null
      }
    }

    function handlePointerDown(event: PointerEvent) {
      updateTouchPointers(event, true)
      setHoveredPartId(null)

      if (
        !isPrimarySelectionPointer(event) ||
        activeTouchPointersRef.current.size > 1
      ) {
        pointerStartRef.current = null
        return
      }

      pointerStartRef.current = {
        button: event.button,
        cameraPosition: camera.position.clone(),
        cameraQuaternion: camera.quaternion.clone(),
        clientX: event.clientX,
        clientY: event.clientY,
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        target: controlsRef.current?.target.clone() ?? null,
      }
    }

    function handlePointerMove(event: PointerEvent) {
      const pointerStart = pointerStartRef.current

      if (pointerStart) {
        const movedDistance = getMovedDistance(pointerStart, event)

        if (movedDistance > getSelectionThreshold(pointerStart.pointerType)) {
          pointerStartRef.current = null
        }
      }

      if (event.pointerType !== 'mouse' || event.buttons !== 0) {
        setHoveredPartId(null)
        return
      }

      setHoveredPartId(
        getPartIdFromPointer(
          event,
          canvas,
          camera,
          modelScene,
          raycasterRef.current,
        ),
      )
    }

    function handlePointerUp(event: PointerEvent) {
      const pointerStart = pointerStartRef.current
      pointerStartRef.current = null
      const wasMultiTouchGesture = multiTouchGestureRef.current

      updateTouchPointers(event, false)

      if (activeTouchPointersRef.current.size === 0) {
        multiTouchGestureRef.current = false
      }

      if (
        !pointerStart ||
        pointerStart.pointerId !== event.pointerId ||
        wasMultiTouchGesture
      ) {
        return
      }

      if (
        getMovedDistance(pointerStart, event) >
        getSelectionThreshold(pointerStart.pointerType)
      ) {
        return
      }

      if (
        controlsMovedMeaningfully(
          pointerStart,
          controlsRef.current,
          camera.position,
          camera.quaternion,
        )
      ) {
        return
      }

      const partId = getPartIdFromPointer(
        event,
        canvas,
        camera,
        modelScene,
        raycasterRef.current,
      )

      if (partId) {
        onPartSelect(partId)
      } else {
        onSelectionClear()
      }
    }

    function handlePointerCancel(event: PointerEvent) {
      updateTouchPointers(event, false)
      pointerStartRef.current = null
      setHoveredPartId(null)

      if (activeTouchPointersRef.current.size === 0) {
        multiTouchGestureRef.current = false
      }
    }

    function handlePointerLeave() {
      pointerStartRef.current = null
      setHoveredPartId(null)
    }

    function preventContextMenu(event: MouseEvent) {
      event.preventDefault()
    }

    canvas.addEventListener('pointerdown', handlePointerDown)
    canvas.addEventListener('pointermove', handlePointerMove)
    canvas.addEventListener('pointerup', handlePointerUp)
    canvas.addEventListener('pointercancel', handlePointerCancel)
    canvas.addEventListener('pointerleave', handlePointerLeave)
    canvas.addEventListener('contextmenu', preventContextMenu)

    return () => {
      canvas.removeEventListener('pointerdown', handlePointerDown)
      canvas.removeEventListener('pointermove', handlePointerMove)
      canvas.removeEventListener('pointerup', handlePointerUp)
      canvas.removeEventListener('pointercancel', handlePointerCancel)
      canvas.removeEventListener('pointerleave', handlePointerLeave)
      canvas.removeEventListener('contextmenu', preventContextMenu)
    }
  }, [
    camera,
    controlsRef,
    gl.domElement,
    modelScene,
    onPartSelect,
    onSelectionClear,
  ])

  return <primitive object={modelScene} />
}
