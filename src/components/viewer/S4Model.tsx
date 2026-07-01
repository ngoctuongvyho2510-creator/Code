import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import {
  AdditiveBlending,
  Box3,
  BufferGeometry,
  CanvasTexture,
  ClampToEdgeWrapping,
  Color,
  EdgesGeometry,
  Euler,
  FrontSide,
  LineBasicMaterial,
  LineSegments,
  Material,
  Matrix4,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Quaternion,
  Raycaster,
  RepeatWrapping,
  SRGBColorSpace,
  Texture,
  Vector2,
  Vector3,
  MathUtils,
  type Object3DEventMap,
  type Intersection,
} from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import {
  ARTWORK_MESH_NAMES,
  CALIPER_PAINT_MESH_NAMES,
  CERAMIC_MESH_NAMES,
  CHROME_DELETE_MESH_NAMES,
  FULL_BODY_MESH_NAMES,
  FULL_BODY_TARGET_ID,
  getSelectablePartByMeshName,
  getSelectionTarget,
  LICENSE_PLATE_MESH_NAMES,
  LIGHT_TINT_MESH_NAMES,
  PPF_MESH_NAMES,
  POWDER_COAT_MESH_NAMES,
  TINTABLE_GLASS_MESH_NAMES,
  WRAP_CAPABLE_MESH_NAMES,
} from '../../config/vehicleParts'
import type {
  AppliedDesignState,
  ArtworkDraftState,
  ArtworkPlacement,
  ArtworkPreviewState,
  ArtworkVector3,
  ArtworkVector4,
  CaliperPaintConfig,
  CaliperPaintFinish,
  CaliperPaintPreviewState,
  CeramicConfig,
  CeramicPreviewState,
  ChromeDeleteConfig,
  ChromeDeleteFinish,
  ChromeDeletePreviewState,
  FreeArtworkItem,
  FreeArtworkPreviewState,
  LightTintConfig,
  LightTintPreviewState,
  PpfConfig,
  PpfFinish,
  PpfPreviewState,
  PowderCoatConfig,
  PowderCoatFinish,
  PowderCoatPreviewState,
  TintConfig,
  TintPreviewState,
  VehiclePartDefinition,
  WrapConfig,
  WrapPreviewState,
} from '../../types/configurator'
import type { RenderPresetId } from '../../types/materialCatalog'
import {
  resolveWrapMaterialRenderProfile,
  type WrapMaterialRenderProfile,
} from '../../utils/wrapMaterialRenderer'

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
const ARTWORK_SURFACE_OFFSET = 0.0015
const ARTWORK_RENDER_ORDER = 14
const ARTWORK_PREVIEW_RENDER_ORDER = 16
const FREE_ARTWORK_RENDER_ORDER = 14.2
const FREE_ARTWORK_PREVIEW_RENDER_ORDER = 16.2
const PPF_RENDER_ORDER = 18
const PPF_PREVIEW_RENDER_ORDER = 18.4
const WORLD_UP = new Vector3(0, 1, 0)
const PROJECTOR_AXIS = new Vector3(0, 0, 1)

type ModelMesh = Mesh<BufferGeometry, Material | Material[], Object3DEventMap>

type PreparedModelScene = {
  caliperPaintMeshes: ModelMesh[]
  chromeDeleteMeshes: ModelMesh[]
  fallbackPlateSurfaceNames: string[]
  foundCaliperPaintMeshNames: Set<string>
  foundChromeDeleteMeshNames: Set<string>
  foundLightTintMeshNames: Set<string>
  foundPowderCoatMeshNames: Set<string>
  foundTintableMeshNames: Set<string>
  foundWrapCapableMeshNames: Set<string>
  lightTintMeshes: ModelMesh[]
  nativePlateMeshNames: Set<string>
  originalFactoryMaterialsByMeshUuid: Map<string, Material | Material[]>
  outlineGeometriesByMeshUuid: Map<string, EdgesGeometry>
  powderCoatMeshes: ModelMesh[]
  runtimeFactoryMaterialsByMeshUuid: Map<string, Material | Material[]>
  scene: Object3D
  selectableMeshes: ModelMesh[]
  tintableMeshes: ModelMesh[]
  wrapCapableMeshes: ModelMesh[]
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

type ArtworkDragState = {
  animationFrameId: number | null
  lastTransform: Partial<ArtworkDraftState> | null
  latestEvent: PointerEvent | null
  pointerId: number
}

type FreeArtworkDragState = {
  animationFrameId: number | null
  artworkId: string
  lastTransform: Partial<FreeArtworkItem> | null
  latestEvent: PointerEvent | null
  pointerId: number
}

type FreeArtworkTargetEntry = {
  mesh: ModelMesh
  worldBounds: Box3
}

type FreeArtworkTargetCache = {
  bounds: Box3 | null
  entries: FreeArtworkTargetEntry[]
  meshes: ModelMesh[]
}

type PpfTargetEntry = {
  mesh: ModelMesh
  partId: string
}

type S4ModelProps = {
  appliedDesign: AppliedDesignState
  artworkPreview: ArtworkPreviewState | null
  caliperPaintPreview: CaliperPaintPreviewState | null
  controlsRef: RefObject<OrbitControlsImpl | null>
  chromeDeletePreview: ChromeDeletePreviewState | null
  ceramicPreview: CeramicPreviewState | null
  freeArtworkPreview: FreeArtworkPreviewState | null
  lightTintPreview: LightTintPreviewState | null
  ppfPreview: PpfPreviewState | null
  powderCoatPreview: PowderCoatPreviewState | null
  selectedTargetId: string | null
  tintPreview: TintPreviewState | null
  wrapPreview: WrapPreviewState | null
  onArtworkPreviewTransformChange: (patch: Partial<ArtworkDraftState>) => void
  onFreeArtworkTransformChange: (
    artworkId: string,
    patch: Partial<FreeArtworkItem>,
  ) => void
  onPartSelect: (partId: string) => void
  onSelectionClear: () => void
}

const inspectedScenes = new WeakSet<Object3D>()
const inspectedCaliperPaintMeshScenes = new WeakSet<Object3D>()
const inspectedChromeDeleteMeshScenes = new WeakSet<Object3D>()
const inspectedLightTintMeshScenes = new WeakSet<Object3D>()
const inspectedPowderCoatMeshScenes = new WeakSet<Object3D>()
const inspectedTintableMeshScenes = new WeakSet<Object3D>()
const inspectedWrapMeshScenes = new WeakSet<Object3D>()
const plateMeshNames = new Set<string>(LICENSE_PLATE_MESH_NAMES)
const artworkMeshNames = new Set<string>(ARTWORK_MESH_NAMES)
const caliperPaintMeshNames = new Set<string>(CALIPER_PAINT_MESH_NAMES)
const ceramicMeshNames = new Set<string>(CERAMIC_MESH_NAMES)
const chromeDeleteMeshNames = new Set<string>(CHROME_DELETE_MESH_NAMES)
const lightTintMeshNames = new Set<string>(LIGHT_TINT_MESH_NAMES)
const ppfMeshNames = new Set<string>(PPF_MESH_NAMES)
const powderCoatMeshNames = new Set<string>(POWDER_COAT_MESH_NAMES)
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

const powderCoatFinishSettings = {
  gloss: {
    clearcoat: 0.62,
    clearcoatRoughness: 0.1,
    envMapIntensity: 1.12,
    metalness: 0.18,
    reflectivity: 0.46,
    roughness: 0.22,
  },
  satin: {
    clearcoat: 0.28,
    clearcoatRoughness: 0.34,
    envMapIntensity: 0.92,
    metalness: 0.12,
    reflectivity: 0.34,
    roughness: 0.5,
  },
  matte: {
    clearcoat: 0.05,
    clearcoatRoughness: 0.76,
    envMapIntensity: 0.74,
    metalness: 0.08,
    reflectivity: 0.22,
    roughness: 0.8,
  },
} as const satisfies Record<
  PowderCoatFinish,
  {
    clearcoat: number
    clearcoatRoughness: number
    envMapIntensity: number
    metalness: number
    reflectivity: number
    roughness: number
  }
>

type PpfMaterialSettings = {
  clearcoat: number
  clearcoatRoughness: number
  envMapIntensity: number
  opacity: number
  reflectivity: number
  roughness: number
  specularIntensity: number
}

const ppfFinishSettings = {
  gloss: {
    clearcoat: 1,
    clearcoatRoughness: 0.035,
    envMapIntensity: 0.34,
    opacity: 0.026,
    reflectivity: 0.42,
    roughness: 0.04,
    specularIntensity: 0.22,
  },
  matte: {
    clearcoat: 0.16,
    clearcoatRoughness: 0.82,
    envMapIntensity: 0.18,
    opacity: 0.018,
    reflectivity: 0.14,
    roughness: 0.88,
    specularIntensity: 0.08,
  },
} as const satisfies Record<PpfFinish, PpfMaterialSettings>

const ceramicBodySettings = {
  clearcoatBoost: 0.08,
  clearcoatRoughnessMultiplier: 0.72,
  colorDepthMix: 0.025,
  envMapIntensityBoost: 0.06,
  reflectivityBoost: 0.055,
  roughnessMultiplier: 0.86,
} as const

const ceramicDepthColor = new Color('#050505')

function getPpfFinishSettings(
  finish: PpfFinish,
  ceramicEnabled: boolean,
): PpfMaterialSettings {
  const settings = ppfFinishSettings[finish]

  if (!ceramicEnabled) {
    return settings
  }

  if (finish === 'gloss') {
    return {
      ...settings,
      clearcoat: 1,
      clearcoatRoughness: 0.025,
      envMapIntensity: 0.42,
      opacity: 0.028,
      reflectivity: 0.5,
      roughness: 0.035,
      specularIntensity: 0.28,
    }
  }

  return {
    ...settings,
    clearcoat: 0.18,
    clearcoatRoughness: 0.76,
    envMapIntensity: 0.2,
    opacity: 0.018,
    reflectivity: 0.16,
    roughness: 0.84,
    specularIntensity: 0.1,
  }
}

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
  lightTintCapable: boolean,
  chromeDeleteCapable: boolean,
  caliperPaintCapable: boolean,
  powderCoatCapable: boolean,
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
    (
      wrapCapable ||
      tintCapable ||
      lightTintCapable ||
      chromeDeleteCapable ||
      caliperPaintCapable ||
      powderCoatCapable
    ) &&
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
  lightTintCapable: boolean,
  chromeDeleteCapable: boolean,
  caliperPaintCapable: boolean,
  powderCoatCapable: boolean,
  cleanFactoryChromeSideWindowTrim: boolean,
  cleanBlackExteriorTrim: boolean,
): Material | Material[] {
  if (Array.isArray(material)) {
    return material.map((item) =>
      createRuntimeMaterial(
        item,
        wrapCapable,
        tintCapable,
        lightTintCapable,
        chromeDeleteCapable,
        caliperPaintCapable,
        powderCoatCapable,
        cleanFactoryChromeSideWindowTrim,
        cleanBlackExteriorTrim,
      ),
    )
  }

  return createRuntimeMaterial(
    material,
    wrapCapable,
    tintCapable,
    lightTintCapable,
    chromeDeleteCapable,
    caliperPaintCapable,
    powderCoatCapable,
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
  const caliperPaintMeshes: ModelMesh[] = []
  const chromeDeleteMeshes: ModelMesh[] = []
  const fallbackPlateSurfaceNames: string[] = []
  const foundCaliperPaintMeshNames = new Set<string>()
  const foundChromeDeleteMeshNames = new Set<string>()
  const foundLightTintMeshNames = new Set<string>()
  const foundPowderCoatMeshNames = new Set<string>()
  const foundTintableMeshNames = new Set<string>()
  const foundWrapCapableMeshNames = new Set<string>()
  const lightTintMeshes: ModelMesh[] = []
  const nativePlateMeshNames = new Set<string>()
  const originalFactoryMaterialsByMeshUuid = new Map<
    string,
    Material | Material[]
  >()
  const outlineGeometriesByMeshUuid = new Map<string, EdgesGeometry>()
  const powderCoatMeshes: ModelMesh[] = []
  const runtimeFactoryMaterialsByMeshUuid = new Map<
    string,
    Material | Material[]
  >()
  const selectableMeshes: ModelMesh[] = []
  const tintableMeshes: ModelMesh[] = []
  const wrapCapableMeshes: ModelMesh[] = []

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
    const lightTintCapable = lightTintMeshNames.has(object.name)
    const chromeDeleteCapable = chromeDeleteMeshNames.has(object.name)
    const caliperPaintCapable = caliperPaintMeshNames.has(object.name)
    const powderCoatCapable = powderCoatMeshNames.has(object.name)
    const cleanFactoryChromeSideWindowTrim =
      factoryChromeSideWindowTrimMeshNames.has(object.name)
    const cleanBlackExteriorTrim = cleanBlackExteriorTrimMeshNames.has(
      object.name,
    )
    const selectablePart = getSelectablePartByMeshName(object.name)

    if (selectablePart) {
      selectableMeshes.push(object)
    }

    if (wrapCapable) {
      foundWrapCapableMeshNames.add(object.name)
      wrapCapableMeshes.push(object)
    }

    if (chromeDeleteCapable) {
      foundChromeDeleteMeshNames.add(object.name)
      chromeDeleteMeshes.push(object)
    }

    if (caliperPaintCapable) {
      foundCaliperPaintMeshNames.add(object.name)
      caliperPaintMeshes.push(object)
    }

    if (powderCoatCapable) {
      foundPowderCoatMeshNames.add(object.name)
      powderCoatMeshes.push(object)
    }

    if (lightTintCapable) {
      foundLightTintMeshNames.add(object.name)
      lightTintMeshes.push(object)
    }

    if (tintCapable) {
      foundTintableMeshNames.add(object.name)
      tintableMeshes.push(object)
    }

    if (plateMeshNames.has(object.name)) {
      nativePlateMeshNames.add(object.name)
      object.material = createPlateMaterial(nativePlateTexture)
    } else {
      object.material = createRuntimeMaterials(
        object.material,
        wrapCapable,
        tintCapable,
        lightTintCapable,
        chromeDeleteCapable,
        caliperPaintCapable,
        powderCoatCapable,
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
    caliperPaintMeshes,
    chromeDeleteMeshes,
    fallbackPlateSurfaceNames,
    foundCaliperPaintMeshNames,
    foundChromeDeleteMeshNames,
    foundLightTintMeshNames,
    foundPowderCoatMeshNames,
    foundTintableMeshNames,
    foundWrapCapableMeshNames,
    lightTintMeshes,
    nativePlateMeshNames,
    originalFactoryMaterialsByMeshUuid,
    outlineGeometriesByMeshUuid,
    powderCoatMeshes,
    runtimeFactoryMaterialsByMeshUuid,
    scene,
    selectableMeshes,
    tintableMeshes,
    wrapCapableMeshes,
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

function disposeMaterialMap(materialsByMeshUuid: Map<string, Material | Material[]>) {
  for (const material of materialsByMeshUuid.values()) {
    disposeMaterial(material)
  }

  materialsByMeshUuid.clear()
}

function disposePreparedModelScene(preparedScene: PreparedModelScene) {
  removeExistingOutlines(preparedScene.scene)

  const disposedMaterials = new Set<Material>()

  preparedScene.scene.traverse((object) => {
    if (!isModelMesh(object)) {
      return
    }

    for (const material of getMaterials(object.material)) {
      if (!disposedMaterials.has(material)) {
        material.dispose()
        disposedMaterials.add(material)
      }
    }

    if (object.userData.modifyWrapPlateSurface === true) {
      object.geometry.dispose()
    }
  })

  disposeMaterialMap(preparedScene.originalFactoryMaterialsByMeshUuid)
  disposeMaterialMap(preparedScene.runtimeFactoryMaterialsByMeshUuid)

  for (const geometry of preparedScene.outlineGeometriesByMeshUuid.values()) {
    geometry.dispose()
  }

  preparedScene.outlineGeometriesByMeshUuid.clear()
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
      if (outline.userData.modifyWrapCachedGeometry !== true) {
        outline.geometry.dispose()
      }

      disposeMaterial(outline.material)
    }
  }
}

function getOutlineGeometry(
  mesh: ModelMesh,
  preparedScene: PreparedModelScene,
): EdgesGeometry {
  const cachedGeometry =
    preparedScene.outlineGeometriesByMeshUuid.get(mesh.uuid)

  if (cachedGeometry) {
    return cachedGeometry
  }

  const outlineGeometry = new EdgesGeometry(
    mesh.geometry,
    OUTLINE_EDGE_THRESHOLD_DEGREES,
  )

  preparedScene.outlineGeometriesByMeshUuid.set(mesh.uuid, outlineGeometry)

  return outlineGeometry
}

function addOutline(
  mesh: ModelMesh,
  selected: boolean,
  preparedScene: PreparedModelScene,
) {
  const outlineGeometry = getOutlineGeometry(mesh, preparedScene)
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
  outline.userData.modifyWrapCachedGeometry = true
  outline.raycast = () => undefined
  mesh.add(outline)
}

function applyOutlines(
  preparedScene: PreparedModelScene,
  selectedMeshNames: Set<string>,
  hoveredMeshNames: Set<string>,
) {
  removeExistingOutlines(preparedScene.scene)

  for (const mesh of preparedScene.selectableMeshes) {
    const selected = selectedMeshNames.has(mesh.name)
    const hovered = hoveredMeshNames.has(mesh.name)

    if (selected || hovered) {
      addOutline(mesh, selected, preparedScene)
    }
  }
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

function logMissingPowderCoatMeshes(preparedScene: PreparedModelScene) {
  if (
    !import.meta.env.DEV ||
    inspectedPowderCoatMeshScenes.has(preparedScene.scene)
  ) {
    return
  }

  inspectedPowderCoatMeshScenes.add(preparedScene.scene)

  const missingMeshNames = POWDER_COAT_MESH_NAMES.filter(
    (meshName) => !preparedScene.foundPowderCoatMeshNames.has(meshName),
  )

  if (missingMeshNames.length === 0) {
    console.info('All registered powder-coat meshes were found in Mahir S4.glb.')
    return
  }

  console.warn('Registered powder-coat meshes not found in Mahir S4.glb')
  console.table(missingMeshNames)
}

function logMissingLightTintMeshes(preparedScene: PreparedModelScene) {
  if (
    !import.meta.env.DEV ||
    inspectedLightTintMeshScenes.has(preparedScene.scene)
  ) {
    return
  }

  inspectedLightTintMeshScenes.add(preparedScene.scene)

  const missingMeshNames = LIGHT_TINT_MESH_NAMES.filter(
    (meshName) => !preparedScene.foundLightTintMeshNames.has(meshName),
  )

  if (missingMeshNames.length === 0) {
    console.info('All registered light-tint meshes were found in Mahir S4.glb.')
    return
  }

  console.warn('Registered light-tint meshes not found in Mahir S4.glb')
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

type WrapProceduralTextureKey =
  | 'brushed'
  | 'carbon'
  | 'diamond'
  | 'microflake'
  | 'phosphor'
  | 'rugged'
  | 'velvet'

const wrapProceduralTextureCache = new Map<
  WrapProceduralTextureKey,
  Texture
>()

function getWrapProceduralTexture(
  key: WrapProceduralTextureKey,
): Texture {
  const cachedTexture = wrapProceduralTextureCache.get(key)

  if (cachedTexture) {
    return cachedTexture
  }

  const texture = createWrapProceduralTexture(key)

  wrapProceduralTextureCache.set(key, texture)
  return texture
}

function createWrapProceduralTexture(
  key: WrapProceduralTextureKey,
): Texture {
  const size = 128
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  canvas.width = size
  canvas.height = size

  if (!context) {
    throw new Error('Wrap material texture canvas unavailable')
  }

  drawWrapProceduralTexture(context, key, size)

  const texture = new CanvasTexture(canvas)
  const repeat = getWrapTextureRepeat(key)

  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.set(repeat.x, repeat.y)
  texture.needsUpdate = true

  return texture
}

function drawWrapProceduralTexture(
  context: CanvasRenderingContext2D,
  key: WrapProceduralTextureKey,
  size: number,
) {
  let seed = key.length * 7919
  const random = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }

  context.clearRect(0, 0, size, size)
  context.fillStyle = 'rgb(128,128,128)'
  context.fillRect(0, 0, size, size)

  if (key === 'carbon') {
    context.fillStyle = 'rgb(92,92,92)'
    context.fillRect(0, 0, size, size)
    context.strokeStyle = 'rgba(190,190,190,0.42)'
    context.lineWidth = 2

    for (let offset = -size; offset < size * 2; offset += 8) {
      context.beginPath()
      context.moveTo(offset, 0)
      context.lineTo(offset + size, size)
      context.stroke()
      context.beginPath()
      context.moveTo(offset + 4, size)
      context.lineTo(offset + size + 4, 0)
      context.stroke()
    }

    return
  }

  if (key === 'brushed') {
    context.fillStyle = 'rgb(122,122,122)'
    context.fillRect(0, 0, size, size)

    for (let y = 0; y < size; y += 1) {
      const shade = 102 + Math.round(random() * 48)

      context.fillStyle = `rgb(${shade},${shade},${shade})`
      context.fillRect(0, y, size, 1)
    }

    return
  }

  if (key === 'rugged') {
    context.fillStyle = 'rgb(148,148,148)'
    context.fillRect(0, 0, size, size)

    for (let index = 0; index < 900; index += 1) {
      const shade = 90 + Math.round(random() * 100)

      context.fillStyle = `rgba(${shade},${shade},${shade},0.68)`
      context.fillRect(
        Math.floor(random() * size),
        Math.floor(random() * size),
        1 + Math.floor(random() * 3),
        1 + Math.floor(random() * 3),
      )
    }

    return
  }

  if (key === 'velvet') {
    context.fillStyle = 'rgb(112,112,112)'
    context.fillRect(0, 0, size, size)

    for (let x = 0; x < size; x += 2) {
      const shade = 92 + Math.round(random() * 64)

      context.strokeStyle = `rgba(${shade},${shade},${shade},0.55)`
      context.beginPath()
      context.moveTo(x, 0)
      context.lineTo(x + random() * 8 - 4, size)
      context.stroke()
    }

    return
  }

  const sparkleCount =
    key === 'diamond' ? 420 : key === 'microflake' ? 360 : 180

  for (let index = 0; index < sparkleCount; index += 1) {
    const shade =
      key === 'phosphor'
        ? 142 + Math.round(random() * 68)
        : 82 + Math.round(random() * 150)
    const alpha = key === 'diamond' ? 0.82 : 0.46

    context.fillStyle = `rgba(${shade},${shade},${shade},${alpha})`
    context.fillRect(
      Math.floor(random() * size),
      Math.floor(random() * size),
      key === 'diamond' ? 1 : 2,
      key === 'diamond' ? 1 : 2,
    )
  }
}

function getWrapTextureRepeat(
  key: WrapProceduralTextureKey,
): { x: number; y: number } {
  if (key === 'brushed') {
    return { x: 14, y: 34 }
  }

  if (key === 'carbon') {
    return { x: 24, y: 24 }
  }

  if (key === 'rugged') {
    return { x: 30, y: 30 }
  }

  if (key === 'velvet') {
    return { x: 20, y: 20 }
  }

  return { x: 42, y: 42 }
}

function applyWrapProceduralTexture(
  material: MeshStandardMaterial,
  presetId: RenderPresetId,
) {
  if (presetId === 'metallic') {
    const texture = getWrapProceduralTexture('microflake')

    material.roughnessMap = texture
    material.bumpMap = texture
    material.bumpScale = 0.0018
    return
  }

  if (presetId === 'diamond_flake') {
    const texture = getWrapProceduralTexture('diamond')

    material.roughnessMap = texture
    material.bumpMap = texture
    material.bumpScale = 0.0024
    return
  }

  if (presetId === 'special_effect') {
    const texture = getWrapProceduralTexture('microflake')

    material.roughnessMap = texture
    material.bumpMap = texture
    material.bumpScale = 0.0018
    return
  }

  if (presetId === 'carbon_fiber') {
    const texture = getWrapProceduralTexture('carbon')

    material.roughnessMap = texture
    material.bumpMap = texture
    material.bumpScale = 0.0045
    return
  }

  if (presetId === 'brushed_metal') {
    const texture = getWrapProceduralTexture('brushed')

    material.roughnessMap = texture
    material.bumpMap = texture
    material.bumpScale = 0.0032
    return
  }

  if (
    presetId === 'rugged_texture' ||
    presetId === 'patterned_texture' ||
    presetId === 'textured_generic'
  ) {
    const texture = getWrapProceduralTexture('rugged')

    material.roughnessMap = texture
    material.bumpMap = texture
    material.bumpScale = 0.011
    return
  }

  if (presetId === 'velvet') {
    const texture = getWrapProceduralTexture('velvet')

    material.roughnessMap = texture
    material.bumpMap = texture
    material.bumpScale = 0.005
    return
  }

  if (presetId === 'glow_in_dark') {
    const texture = getWrapProceduralTexture('phosphor')

    material.roughnessMap = texture
    material.bumpMap = texture
    material.bumpScale = 0.002
  }
}

function getWrapEnvMapIntensity(presetId: RenderPresetId): number {
  if (presetId === 'solid_high_gloss') {
    return 1.38
  }

  if (presetId === 'solid_gloss') {
    return 1.24
  }

  if (presetId === 'solid_satin') {
    return 1.02
  }

  if (presetId === 'solid_matte' || presetId === 'velvet') {
    return 0.72
  }

  if (presetId === 'chrome') {
    return 1.86
  }

  if (presetId === 'brushed_metal') {
    return 1.28
  }

  if (
    presetId === 'rugged_texture' ||
    presetId === 'patterned_texture' ||
    presetId === 'textured_generic'
  ) {
    return 0.86
  }

  return 1.22
}

function getWrapReflectivity(presetId: RenderPresetId): number {
  if (presetId === 'solid_matte' || presetId === 'velvet') {
    return 0.22
  }

  if (presetId === 'solid_satin' || presetId === 'rugged_texture') {
    return 0.42
  }

  if (presetId === 'chrome') {
    return 1
  }

  return 0.58
}

function getColorFromHex(hexColor: string): Color {
  return new Color().setStyle(hexColor, SRGBColorSpace)
}

function getWrapDisplayColor(profile: WrapMaterialRenderProfile): Color {
  const color = getColorFromHex(profile.colorHex)
  const secondaryColor = profile.secondaryColorHex
    ? getColorFromHex(profile.secondaryColorHex)
    : null
  const tertiaryColor = profile.tertiaryColorHex
    ? getColorFromHex(profile.tertiaryColorHex)
    : null

  if (profile.renderPresetId === 'photochromic' && secondaryColor) {
    const sunlight = Math.min(1, Math.max(0, profile.previewIntensity))

    color.lerp(secondaryColor, sunlight * 0.72)

    if (tertiaryColor && sunlight > 0.45) {
      color.lerp(tertiaryColor, (sunlight - 0.45) * 0.5)
    }
  }

  if (profile.renderPresetId === 'fluorescent' && secondaryColor) {
    color.lerp(secondaryColor, profile.previewMode === 'uv' ? 0.32 : 0.12)
  }

  if (profile.renderPresetId === 'pearl' && secondaryColor) {
    color.lerp(secondaryColor, 0.08)
  }

  if (profile.renderPresetId === 'color_shift' && secondaryColor) {
    color.lerp(secondaryColor, 0.06)
  }

  if (
    profile.renderPresetId === 'glow_in_dark' &&
    profile.previewMode === 'night' &&
    secondaryColor
  ) {
    color.lerp(secondaryColor, 0.18)
  }

  return color
}

function applyPhysicalWrapPreset(
  material: MeshPhysicalMaterial,
  profile: WrapMaterialRenderProfile,
) {
  const preset = profile.renderPreset
  const secondaryColor = profile.secondaryColorHex
    ? getColorFromHex(profile.secondaryColorHex)
    : null
  const tertiaryColor = profile.tertiaryColorHex
    ? getColorFromHex(profile.tertiaryColorHex)
    : null

  material.clearcoat = preset.clearcoat
  material.clearcoatRoughness = preset.clearcoatRoughness
  material.reflectivity = getWrapReflectivity(profile.renderPresetId)
  material.transmission = 0
  material.thickness = 0
  material.iridescence = 0
  material.iridescenceIOR = 1.3
  material.iridescenceThicknessRange = [100, 420]
  material.sheen = 0
  material.sheenRoughness = 1
  material.specularIntensity = 1
  material.anisotropy = preset.anisotropy

  if (profile.renderPresetId === 'pearl') {
    material.iridescence = 0.18
    material.sheen = 0.22
    material.sheenRoughness = 0.42

    if (secondaryColor) {
      material.sheenColor.copy(secondaryColor)
    }
  }

  if (profile.renderPresetId === 'color_shift') {
    material.iridescence = 0.54
    material.iridescenceThicknessRange = [190, 680]
    material.sheen = 0.28
    material.sheenRoughness = 0.36

    if (secondaryColor) {
      material.sheenColor.copy(secondaryColor)
    }

    if (tertiaryColor) {
      material.specularColor.copy(tertiaryColor)
    }
  }

  if (profile.renderPresetId === 'chrome') {
    material.reflectivity = 1
    material.specularIntensity = 1
  }

  if (profile.renderPresetId === 'fluorescent') {
    material.specularIntensity = profile.previewMode === 'uv' ? 1.18 : 1.08
  }

  if (profile.renderPresetId === 'velvet') {
    material.clearcoat = 0
    material.clearcoatRoughness = 0.9
    material.reflectivity = 0.14
    material.sheen = 0.72
    material.sheenRoughness = 0.78

    if (secondaryColor) {
      material.sheenColor.copy(secondaryColor)
    }
  }
}

function applyWrapEmission(
  material: MeshStandardMaterial,
  profile: WrapMaterialRenderProfile,
) {
  material.emissive.set(0, 0, 0)
  material.emissiveIntensity = 0

  if (profile.renderPresetId === 'fluorescent') {
    const emissiveColor = profile.secondaryColorHex ?? profile.colorHex

    material.emissive.copy(getColorFromHex(emissiveColor))
    material.emissiveIntensity = profile.previewMode === 'uv' ? 0.085 : 0.028
    return
  }

  if (
    profile.renderPresetId === 'glow_in_dark' &&
    profile.previewMode === 'night'
  ) {
    const emissiveColor =
      profile.tertiaryColorHex ?? profile.secondaryColorHex ?? profile.colorHex

    material.emissive.copy(getColorFromHex(emissiveColor))
    material.emissiveIntensity = 0.32
  }
}

function applyWrapToMaterial(material: Material, wrap: WrapConfig) {
  if (!(material instanceof MeshStandardMaterial)) {
    return
  }

  const profile = resolveWrapMaterialRenderProfile(wrap)

  if (!profile) {
    return
  }

  clearStandardMaterialTextureInputs(material)
  applySmoothOpaqueSurfaceDefaults(material)

  material.color.copy(getWrapDisplayColor(profile))
  material.metalness = profile.renderPreset.metalness
  material.roughness = profile.renderPreset.roughness
  material.envMapIntensity = getWrapEnvMapIntensity(profile.renderPresetId)
  applyWrapEmission(material, profile)
  applyWrapProceduralTexture(material, profile.renderPresetId)

  if (material instanceof MeshPhysicalMaterial) {
    applyPhysicalWrapPreset(material, profile)
  }

  material.needsUpdate = true
}

function applyWrapToMesh(mesh: ModelMesh, wrap: WrapConfig) {
  for (const material of getMaterials(mesh.material)) {
    applyWrapToMaterial(material, wrap)
  }
}

function applyCeramicToMaterial(material: Material) {
  if (!(material instanceof MeshStandardMaterial)) {
    return
  }

  material.color.lerp(ceramicDepthColor, ceramicBodySettings.colorDepthMix)
  material.roughness = Math.max(
    0.08,
    material.roughness * ceramicBodySettings.roughnessMultiplier,
  )
  material.envMapIntensity = Math.min(
    1.65,
    material.envMapIntensity + ceramicBodySettings.envMapIntensityBoost,
  )

  if (material instanceof MeshPhysicalMaterial) {
    material.clearcoat = Math.min(
      1,
      material.clearcoat + ceramicBodySettings.clearcoatBoost,
    )
    material.clearcoatRoughness = Math.max(
      0.035,
      material.clearcoatRoughness *
        ceramicBodySettings.clearcoatRoughnessMultiplier,
    )
    material.reflectivity = Math.min(
      0.78,
      material.reflectivity + ceramicBodySettings.reflectivityBoost,
    )
    material.transmission = 0
    material.thickness = 0
  }

  material.needsUpdate = true
}

function applyCeramicToMesh(mesh: ModelMesh) {
  for (const material of getMaterials(mesh.material)) {
    applyCeramicToMaterial(material)
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
  ceramicPreview: CeramicPreviewState | null,
  ppfPreview: PpfPreviewState | null,
) {
  const ceramicPreviewTargetIds = new Set(ceramicPreview?.targetIds ?? [])
  const ppfPreviewTargetIds = new Set(ppfPreview?.targetIds ?? [])

  for (const object of preparedScene.wrapCapableMeshes) {
    resetMeshMaterialToFactory(object, preparedScene)

    const wrap = getEffectiveWrapForMesh(
      object.name,
      appliedDesign,
      wrapPreview,
    )

    if (wrap) {
      applyWrapToMesh(object, wrap)
    }

    if (!ceramicMeshNames.has(object.name)) {
      continue
    }

    const part = getSelectablePartByMeshName(object.name)

    if (!part) {
      continue
    }

    const ceramic = getEffectiveCeramicForTarget(
      part.id,
      appliedDesign,
      ceramicPreview,
      ceramicPreviewTargetIds,
    )
    const ppf = getEffectivePpfForTarget(
      part.id,
      appliedDesign,
      ppfPreview,
      ppfPreviewTargetIds,
    )

    if (ceramic?.enabled && !ppf) {
      applyCeramicToMesh(object)
    }
  }
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

  for (const object of preparedScene.tintableMeshes) {
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
  }
}

function clampLightTintDarkness(darkness: number): number {
  if (!Number.isFinite(darkness)) {
    return 25
  }

  return Math.min(100, Math.max(0, darkness))
}

function getLightTintDarknessFactor(lightTint: LightTintConfig): number {
  return clampLightTintDarkness(lightTint.darkness) / 100
}

function applyLightTintToMaterial(
  material: Material,
  lightTint: LightTintConfig,
) {
  if (!(material instanceof MeshStandardMaterial)) {
    return
  }

  const darkness = getLightTintDarknessFactor(lightTint)
  const smokeColor = new Color('#050608')
  const originalOpacity = material.opacity
  const wasTransparent = material.transparent || originalOpacity < 1
  const lensBaseOpacity = wasTransparent ? originalOpacity : 0.68

  material.color.lerp(smokeColor, 0.18 + darkness * 0.64)
  material.emissive.set(0, 0, 0)
  material.emissiveIntensity = 0
  material.transparent = true
  material.opacity = Math.min(0.88, lensBaseOpacity + darkness * 0.28)
  material.depthTest = true
  material.depthWrite = false
  material.alphaHash = false
  material.alphaTest = 0
  material.metalness = Math.min(material.metalness, 0.08)
  material.roughness = Math.min(
    0.48,
    Math.max(0.04, material.roughness + darkness * 0.1),
  )
  material.envMapIntensity = Math.max(
    material.envMapIntensity,
    1.08 + darkness * 0.26,
  )
  material.toneMapped = true
  material.vertexColors = false

  if (material instanceof MeshPhysicalMaterial) {
    material.clearcoat = Math.max(material.clearcoat, 0.42 + darkness * 0.24)
    material.clearcoatRoughness = Math.min(
      0.22,
      Math.max(0.04, material.clearcoatRoughness + darkness * 0.06),
    )
    material.reflectivity = Math.max(
      material.reflectivity,
      0.62 + darkness * 0.16,
    )
    material.transmission = Math.max(0, material.transmission * 0.75)
    material.thickness = Math.max(material.thickness, 0.04)
  }

  material.needsUpdate = true
}

function applyLightTintToMesh(mesh: ModelMesh, lightTint: LightTintConfig) {
  for (const material of getMaterials(mesh.material)) {
    applyLightTintToMaterial(material, lightTint)
  }
}

function getEffectiveLightTintForMesh(
  meshName: string,
  appliedDesign: AppliedDesignState,
  lightTintPreview: LightTintPreviewState | null,
  previewTargetIds: Set<string>,
): LightTintConfig | null {
  if (!lightTintMeshNames.has(meshName)) {
    return null
  }

  const part = getSelectablePartByMeshName(meshName)

  if (!part?.services.includes('tint')) {
    return null
  }

  if (lightTintPreview && previewTargetIds.has(part.id)) {
    return lightTintPreview.lightTint
  }

  return appliedDesign.parts[part.id]?.lightTint ?? null
}

function applyLightTintMaterials(
  preparedScene: PreparedModelScene,
  appliedDesign: AppliedDesignState,
  lightTintPreview: LightTintPreviewState | null,
) {
  const previewTargetIds = new Set(lightTintPreview?.targetIds ?? [])

  for (const object of preparedScene.lightTintMeshes) {
    resetMeshMaterialToFactory(object, preparedScene)

    const lightTint = getEffectiveLightTintForMesh(
      object.name,
      appliedDesign,
      lightTintPreview,
      previewTargetIds,
    )

    if (lightTint) {
      applyLightTintToMesh(object, lightTint)
    }
  }
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

  for (const object of preparedScene.chromeDeleteMeshes) {
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
  }
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

  for (const object of preparedScene.caliperPaintMeshes) {
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
  }
}

function applyPowderCoatToMaterial(
  material: Material,
  powderCoat: PowderCoatConfig,
) {
  if (!(material instanceof MeshStandardMaterial)) {
    return
  }

  const settings = powderCoatFinishSettings[powderCoat.finish]

  clearStandardMaterialTextureInputs(material)
  applySmoothOpaqueSurfaceDefaults(material)

  material.color.setStyle(powderCoat.color, SRGBColorSpace)
  material.emissive.set(0, 0, 0)
  material.emissiveIntensity = 0
  material.metalness = settings.metalness
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

function applyPowderCoatToMesh(
  mesh: ModelMesh,
  powderCoat: PowderCoatConfig,
) {
  for (const material of getMaterials(mesh.material)) {
    applyPowderCoatToMaterial(material, powderCoat)
  }
}

function getEffectivePowderCoatForMesh(
  meshName: string,
  appliedDesign: AppliedDesignState,
  powderCoatPreview: PowderCoatPreviewState | null,
  previewTargetIds: Set<string>,
): PowderCoatConfig | null {
  if (!powderCoatMeshNames.has(meshName)) {
    return null
  }

  const part = getSelectablePartByMeshName(meshName)

  if (!part?.services.includes('powder-coat')) {
    return null
  }

  if (powderCoatPreview && previewTargetIds.has(part.id)) {
    return powderCoatPreview.powderCoat
  }

  return appliedDesign.parts[part.id]?.powderCoat ?? null
}

function applyPowderCoatMaterials(
  preparedScene: PreparedModelScene,
  appliedDesign: AppliedDesignState,
  powderCoatPreview: PowderCoatPreviewState | null,
) {
  const previewTargetIds = new Set(powderCoatPreview?.targetIds ?? [])

  for (const object of preparedScene.powderCoatMeshes) {
    resetMeshMaterialToFactory(object, preparedScene)

    const powderCoat = getEffectivePowderCoatForMesh(
      object.name,
      appliedDesign,
      powderCoatPreview,
      previewTargetIds,
    )

    if (powderCoat) {
      applyPowderCoatToMesh(object, powderCoat)
    }
  }
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

function vectorToTuple(vector: Vector3): ArtworkVector3 {
  return [
    Number(vector.x.toFixed(5)),
    Number(vector.y.toFixed(5)),
    Number(vector.z.toFixed(5)),
  ] as const
}

function eulerToTuple(euler: Euler): ArtworkVector3 {
  return [
    Number(euler.x.toFixed(5)),
    Number(euler.y.toFixed(5)),
    Number(euler.z.toFixed(5)),
  ] as const
}

function tupleToVector(tuple: ArtworkVector3): Vector3 {
  return new Vector3(tuple[0], tuple[1], tuple[2])
}

function tupleToEuler(tuple: ArtworkVector3): Euler {
  return new Euler(tuple[0], tuple[1], tuple[2])
}

function quaternionToTuple(quaternion: Quaternion): ArtworkVector4 {
  return [
    Number(quaternion.x.toFixed(5)),
    Number(quaternion.y.toFixed(5)),
    Number(quaternion.z.toFixed(5)),
    Number(quaternion.w.toFixed(5)),
  ] as const
}

function tupleToQuaternion(tuple: ArtworkVector4): Quaternion {
  return new Quaternion(tuple[0], tuple[1], tuple[2], tuple[3]).normalize()
}

function getRotatedArtworkOrientation(
  orientation: ArtworkVector3,
  rotation: number,
): Euler {
  const normal = PROJECTOR_AXIS.clone()
    .applyEuler(tupleToEuler(orientation))
    .normalize()

  return createArtworkOrientation(normal, rotation)
}

function getRotatedFreeArtworkOrientation(artwork: FreeArtworkItem): Euler {
  const orientation = tupleToQuaternion(artwork.projectorQuaternion)
  const spin = new Quaternion().setFromAxisAngle(
    PROJECTOR_AXIS,
    MathUtils.degToRad(artwork.rotation),
  )

  orientation.multiply(spin)
  return new Euler().setFromQuaternion(orientation)
}

type ArtworkAspectSource = {
  aspectRatio: number
  imageHeight: number
  imageWidth: number
}

function getArtworkAspectRatio(artwork: ArtworkAspectSource): number {
  if (artwork.imageWidth > 0 && artwork.imageHeight > 0) {
    return artwork.imageWidth / artwork.imageHeight
  }

  if (Number.isFinite(artwork.aspectRatio) && artwork.aspectRatio > 0) {
    return artwork.aspectRatio
  }

  return 1
}

function getArtworkProjectionSize(
  scale: number,
  aspectRatio: number,
): ArtworkVector3 {
  const safeScale = Math.max(0.01, scale)
  const safeAspectRatio =
    Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : 1
  const width =
    safeAspectRatio >= 1
      ? safeScale
      : Math.max(0.01, safeScale * safeAspectRatio)
  const height =
    safeAspectRatio >= 1
      ? Math.max(0.01, safeScale / safeAspectRatio)
      : safeScale
  const depth = Math.max(0.08, Math.max(width, height) * 0.45)

  return [width, height, depth] as const
}

function getArtworkTargetAspect(mesh: ModelMesh): number {
  const boundingBox = new Box3().setFromObject(mesh)
  const size = new Vector3()

  boundingBox.getSize(size)

  const dimensions = [size.x, size.y, size.z]
    .filter((dimension) => dimension > 0.001)
    .sort((first, second) => second - first)

  if (dimensions.length < 2) {
    return 1
  }

  return dimensions[0] / dimensions[1]
}

function getArtworkTargetMeshes(
  scene: Object3D,
  targetId: string,
): ModelMesh[] {
  const target = getSelectionTarget(targetId)
  const targetMeshNames = new Set(target?.meshNames ?? [])
  const targetMeshes: ModelMesh[] = []

  scene.traverse((object) => {
    if (
      isModelMesh(object) &&
      artworkMeshNames.has(object.name) &&
      targetMeshNames.has(object.name)
    ) {
      targetMeshes.push(object)
    }
  })

  return targetMeshes
}

function getFreeArtworkTargetCache(scene: Object3D): FreeArtworkTargetCache {
  const entries: FreeArtworkTargetEntry[] = []
  const bounds = new Box3()

  scene.traverse((object) => {
    if (isModelMesh(object) && fullBodyMeshNames.has(object.name)) {
      object.updateWorldMatrix(true, false)

      const worldBounds = new Box3().setFromObject(object)

      entries.push({
        mesh: object,
        worldBounds,
      })
      bounds.union(worldBounds)
    }
  })

  return {
    bounds: entries.length > 0 ? bounds : null,
    entries,
    meshes: entries.map((entry) => entry.mesh),
  }
}

function getPpfTargetEntries(scene: Object3D): PpfTargetEntry[] {
  const entries: PpfTargetEntry[] = []

  scene.traverse((object) => {
    if (!isModelMesh(object) || !ppfMeshNames.has(object.name)) {
      return
    }

    const part = getSelectablePartByMeshName(object.name)

    if (!part?.fullBody || !part.services.includes('ppf')) {
      return
    }

    entries.push({
      mesh: object,
      partId: part.id,
    })
  })

  return entries
}

function getLargestArtworkMesh(meshes: readonly ModelMesh[]): ModelMesh | null {
  let largestMesh: ModelMesh | null = null
  let largestVolume = 0

  for (const mesh of meshes) {
    const box = new Box3().setFromObject(mesh)
    const size = new Vector3()

    box.getSize(size)

    const volume = Math.max(0, size.x) * Math.max(0, size.y) * Math.max(0, size.z)

    if (!largestMesh || volume > largestVolume) {
      largestMesh = mesh
      largestVolume = volume
    }
  }

  return largestMesh
}

function getLargestFreeArtworkTarget(
  targetCache: FreeArtworkTargetCache,
): ModelMesh | null {
  let largestMesh: ModelMesh | null = null
  let largestVolume = 0
  const size = new Vector3()

  for (const entry of targetCache.entries) {
    entry.worldBounds.getSize(size)

    const volume = Math.max(0, size.x) * Math.max(0, size.y) * Math.max(0, size.z)

    if (!largestMesh || volume > largestVolume) {
      largestMesh = entry.mesh
      largestVolume = volume
    }
  }

  return largestMesh
}

function createArtworkOrientation(normal: Vector3, rotation: number): Euler {
  const cleanNormal = normal.lengthSq() > 0 ? normal.clone().normalize() : WORLD_UP
  const orientation = new Quaternion().setFromUnitVectors(
    PROJECTOR_AXIS,
    cleanNormal,
  )
  const spin = new Quaternion().setFromAxisAngle(
    PROJECTOR_AXIS,
    MathUtils.degToRad(rotation),
  )

  orientation.multiply(spin)
  return new Euler().setFromQuaternion(orientation)
}

function createProjectorQuaternion(normal: Vector3): Quaternion {
  const cleanNormal = normal.lengthSq() > 0 ? normal.clone().normalize() : WORLD_UP

  return new Quaternion().setFromUnitVectors(PROJECTOR_AXIS, cleanNormal)
}

function getIntersectionNormal(
  intersection: Intersection<Object3D>,
  cameraPosition: Vector3,
): Vector3 {
  if (!intersection.face) {
    return cameraPosition.clone().sub(intersection.point).normalize()
  }

  return intersection.face.normal
    .clone()
    .transformDirection(intersection.object.matrixWorld)
    .normalize()
}

function getArtworkTransformFromIntersection(
  intersection: Intersection<Object3D>,
  cameraPosition: Vector3,
  scale: number,
  rotation: number,
  aspectRatio: number,
): Partial<ArtworkDraftState> {
  const normal = getIntersectionNormal(intersection, cameraPosition)
  const position = intersection.point
    .clone()
    .addScaledVector(normal, ARTWORK_SURFACE_OFFSET)
  const orientation = createArtworkOrientation(normal, rotation)
  const size = getArtworkProjectionSize(scale, aspectRatio)

  return {
    position: vectorToTuple(position),
    orientation: eulerToTuple(orientation),
    size,
  }
}

function getFreeArtworkTransformFromIntersection(
  intersection: Intersection<Object3D>,
  cameraPosition: Vector3,
): Partial<FreeArtworkItem> {
  const normal = getIntersectionNormal(intersection, cameraPosition)
  const position = intersection.point
    .clone()
    .addScaledVector(normal, ARTWORK_SURFACE_OFFSET)
  const projectorQuaternion = createProjectorQuaternion(normal)

  return {
    projectorPosition: vectorToTuple(position),
    projectorQuaternion: quaternionToTuple(projectorQuaternion),
  }
}

function getDefaultArtworkTransform(
  mesh: ModelMesh,
  cameraPosition: Vector3,
  scale: number,
  rotation: number,
  aspectRatio: number,
): Partial<ArtworkDraftState> | null {
  const boundingBox = new Box3().setFromObject(mesh)
  const center = new Vector3()

  boundingBox.getCenter(center)

  const direction = center.clone().sub(cameraPosition).normalize()
  const raycaster = new Raycaster(cameraPosition, direction)
  const intersection = raycaster.intersectObject(mesh, false)[0]

  if (intersection) {
    return getArtworkTransformFromIntersection(
      intersection,
      cameraPosition,
      scale,
      rotation,
      aspectRatio,
    )
  }

  const fallbackNormal = cameraPosition.clone().sub(center).normalize()
  const fallbackPosition = center
    .clone()
    .addScaledVector(fallbackNormal, ARTWORK_SURFACE_OFFSET)
  const fallbackOrientation = createArtworkOrientation(fallbackNormal, rotation)

  return {
    position: vectorToTuple(fallbackPosition),
    orientation: eulerToTuple(fallbackOrientation),
    size: getArtworkProjectionSize(scale, aspectRatio),
  }
}

function freeArtworkHasProjector(item: FreeArtworkItem): boolean {
  return (
    Math.abs(item.projectorPosition[0]) > 0.0001 ||
    Math.abs(item.projectorPosition[1]) > 0.0001 ||
    Math.abs(item.projectorPosition[2]) > 0.0001 ||
    Math.abs(item.projectorQuaternion[0]) > 0.0001 ||
    Math.abs(item.projectorQuaternion[1]) > 0.0001 ||
    Math.abs(item.projectorQuaternion[2]) > 0.0001 ||
    Math.abs(item.projectorQuaternion[3] - 1) > 0.0001
  )
}

function getDefaultFreeArtworkTransform(
  targetCache: FreeArtworkTargetCache,
  cameraPosition: Vector3,
): Partial<FreeArtworkItem> | null {
  const bounds = targetCache.bounds

  if (!bounds) {
    return null
  }

  const center = new Vector3()
  bounds.getCenter(center)

  const direction = center.clone().sub(cameraPosition).normalize()
  const raycaster = new Raycaster(cameraPosition, direction)
  const intersection = raycaster.intersectObjects(targetCache.meshes, false)[0]

  if (intersection) {
    return getFreeArtworkTransformFromIntersection(intersection, cameraPosition)
  }

  const fallbackMesh = getLargestFreeArtworkTarget(targetCache)

  if (!fallbackMesh) {
    return null
  }

  const fallbackBounds = new Box3().setFromObject(fallbackMesh)
  const fallbackCenter = new Vector3()

  fallbackBounds.getCenter(fallbackCenter)

  const fallbackNormal = cameraPosition.clone().sub(fallbackCenter).normalize()
  const fallbackPosition = fallbackCenter
    .clone()
    .addScaledVector(fallbackNormal, ARTWORK_SURFACE_OFFSET)

  return {
    projectorPosition: vectorToTuple(fallbackPosition),
    projectorQuaternion: quaternionToTuple(
      createProjectorQuaternion(fallbackNormal),
    ),
  }
}

function getArtworkTransformFromPointer(
  event: PointerEvent,
  canvas: HTMLCanvasElement,
  camera: Parameters<Raycaster['setFromCamera']>[1],
  scene: Object3D,
  raycaster: Raycaster,
  artwork: ArtworkPlacement,
): Partial<ArtworkDraftState> | null {
  const targetMeshes = getArtworkTargetMeshes(scene, artwork.targetPartId)

  if (targetMeshes.length === 0) {
    return null
  }

  raycaster.setFromCamera(getPointerCoordinates(event, canvas), camera)

  const intersection = raycaster.intersectObjects(targetMeshes, false)[0]

  if (!intersection) {
    return null
  }

  return getArtworkTransformFromIntersection(
    intersection,
    camera.position,
    artwork.scale,
    artwork.rotation,
    getArtworkAspectRatio(artwork),
  )
}

function getFreeArtworkTransformFromPointer(
  event: PointerEvent,
  canvas: HTMLCanvasElement,
  camera: Parameters<Raycaster['setFromCamera']>[1],
  targetCache: FreeArtworkTargetCache,
  raycaster: Raycaster,
): Partial<FreeArtworkItem> | null {
  if (targetCache.meshes.length === 0) {
    return null
  }

  raycaster.setFromCamera(getPointerCoordinates(event, canvas), camera)

  const intersection = raycaster.intersectObjects(targetCache.meshes, false)[0]

  if (!intersection) {
    return null
  }

  return getFreeArtworkTransformFromIntersection(
    intersection,
    camera.position,
  )
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
      part.services.includes('caliper-paint') ||
      part.services.includes('powder-coat') ||
      (part.surfaceType === 'light' && part.services.includes('tint'))
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

function createArtworkMaterial(texture: Texture): MeshStandardMaterial {
  const material = new MeshStandardMaterial({
    alphaTest: 0.02,
    depthTest: true,
    depthWrite: false,
    map: texture,
    metalness: 0,
    opacity: 1,
    polygonOffset: true,
    polygonOffsetFactor: -6,
    polygonOffsetUnits: -6,
    roughness: 0.38,
    side: FrontSide,
    toneMapped: true,
    transparent: true,
  })

  material.name = 'ModifyWrap Artwork Overlay'
  return material
}

function getAppliedArtworkPlacements(
  appliedDesign: AppliedDesignState,
): ArtworkPlacement[] {
  return Object.values(appliedDesign.parts).flatMap((partState) => [
    ...partState.artwork,
  ])
}

type ArtworkOverlayItem = {
  artwork: ArtworkPlacement
  preview: boolean
}

function getArtworkOverlayItems(
  appliedDesign: AppliedDesignState,
  artworkPreview: ArtworkPreviewState | null,
): ArtworkOverlayItem[] {
  const items = getAppliedArtworkPlacements(appliedDesign).map((artwork) => ({
    artwork,
    preview: false,
  }))

  if (artworkPreview?.artwork.imageSource) {
    items.push({
      artwork: artworkPreview.artwork,
      preview: true,
    })
  }

  return items
}

function usePreparedArtworkTexture(
  artwork: ArtworkPlacement,
  targetAspectRatio: number,
): Texture {
  const sourceTexture = useTexture(artwork.imageSource)
  const { gl } = useThree()

  const texture = useMemo(() => {
    const preparedTexture = sourceTexture.clone()

    preparedTexture.anisotropy = Math.min(
      8,
      gl.capabilities.getMaxAnisotropy(),
    )
    preparedTexture.center.set(0.5, 0.5)
    preparedTexture.colorSpace = SRGBColorSpace
    preparedTexture.flipY = artwork.mode !== 'fill'
    preparedTexture.wrapS = ClampToEdgeWrapping
    preparedTexture.wrapT = ClampToEdgeWrapping

    if (artwork.mode === 'fill') {
      const sourceAspectRatio = getArtworkAspectRatio(artwork)
      const safeTargetAspectRatio =
        Number.isFinite(targetAspectRatio) && targetAspectRatio > 0
          ? targetAspectRatio
          : 1
      const zoom = Math.max(1, artwork.scale)
      const baseRepeatX =
        sourceAspectRatio > safeTargetAspectRatio
          ? safeTargetAspectRatio / sourceAspectRatio
          : 1
      const baseRepeatY =
        sourceAspectRatio > safeTargetAspectRatio
          ? 1
          : sourceAspectRatio / safeTargetAspectRatio
      const repeatX = Math.min(1, baseRepeatX / zoom)
      const repeatY = Math.min(1, baseRepeatY / zoom)
      const offsetX = (artwork.offsetX ?? 0) * (1 - repeatX) * 0.5
      const offsetY = (artwork.offsetY ?? 0) * (1 - repeatY) * 0.5

      preparedTexture.repeat.set(repeatX, repeatY)
      preparedTexture.offset.set(
        0.5 - repeatX / 2 + offsetX,
        0.5 - repeatY / 2 + offsetY,
      )
      preparedTexture.rotation = MathUtils.degToRad(artwork.rotation)
    }

    preparedTexture.needsUpdate = true
    return preparedTexture
  }, [
    artwork,
    gl.capabilities,
    sourceTexture,
    targetAspectRatio,
  ])

  useEffect(() => {
    return () => {
      texture.dispose()
    }
  }, [texture])

  return texture
}

type ArtworkOverlayProps = {
  artwork: ArtworkPlacement
  modelScene: Object3D
  preview: boolean
}

function ArtworkOverlay({
  artwork,
  modelScene,
  preview,
}: ArtworkOverlayProps) {
  const { camera } = useThree()

  const targetMesh = useMemo(
    () =>
      getLargestArtworkMesh(
        getArtworkTargetMeshes(modelScene, artwork.targetPartId),
      ),
    [artwork.targetPartId, modelScene],
  )
  const targetAspectRatio = useMemo(
    () => (targetMesh ? getArtworkTargetAspect(targetMesh) : 1),
    [targetMesh],
  )
  const texture = usePreparedArtworkTexture(artwork, targetAspectRatio)

  const overlay = useMemo(() => {
    if (!targetMesh) {
      return null
    }

    const material = createArtworkMaterial(texture)
    let overlayMesh: Mesh<BufferGeometry, MeshStandardMaterial>

    if (artwork.mode === 'fill' && targetMesh.geometry.hasAttribute('uv')) {
      targetMesh.updateWorldMatrix(true, false)

      overlayMesh = new Mesh(targetMesh.geometry.clone(), material)
      overlayMesh.matrix.copy(targetMesh.matrixWorld)
      overlayMesh.matrixAutoUpdate = false
      overlayMesh.frustumCulled = false
    } else {
      const fallbackTransform = getDefaultArtworkTransform(
        targetMesh,
        camera.position,
        artwork.scale,
        artwork.rotation,
        getArtworkAspectRatio(artwork),
      )
      const position =
        artwork.position ??
        fallbackTransform?.position ??
        ([0, 0, 0] as const)
      const orientation =
        artwork.orientation ??
        fallbackTransform?.orientation ??
        ([0, 0, 0] as const)
      const size =
        fallbackTransform?.size ??
        getArtworkProjectionSize(artwork.scale, getArtworkAspectRatio(artwork))

      overlayMesh = new Mesh(
        new DecalGeometry(
          targetMesh,
          tupleToVector(position),
          getRotatedArtworkOrientation(orientation, artwork.rotation),
          tupleToVector(size),
        ),
        material,
      )
    }

    overlayMesh.name = preview
      ? `MW_ARTWORK_PREVIEW_${artwork.id}`
      : `MW_ARTWORK_${artwork.id}`
    overlayMesh.renderOrder = preview
      ? ARTWORK_PREVIEW_RENDER_ORDER
      : ARTWORK_RENDER_ORDER
    overlayMesh.userData.modifyWrapArtwork = true
    overlayMesh.raycast = () => undefined

    return overlayMesh
  }, [
    artwork,
    camera.position,
    preview,
    targetMesh,
    texture,
  ])

  useEffect(() => {
    return () => {
      if (!overlay) {
        return
      }

      overlay.geometry.dispose()
      disposeMaterial(overlay.material)
    }
  }, [overlay])

  return overlay ? <primitive object={overlay} /> : null
}

type ArtworkOverlaysProps = {
  appliedDesign: AppliedDesignState
  artworkPreview: ArtworkPreviewState | null
  modelScene: Object3D
}

function ArtworkOverlays({
  appliedDesign,
  artworkPreview,
  modelScene,
}: ArtworkOverlaysProps) {
  const overlayItems = useMemo(
    () => getArtworkOverlayItems(appliedDesign, artworkPreview),
    [appliedDesign, artworkPreview],
  )

  return (
    <>
      {overlayItems.map((item) => (
        <ArtworkOverlay
          artwork={item.artwork}
          key={`${item.preview ? 'preview' : 'applied'}-${item.artwork.id}`}
          modelScene={modelScene}
          preview={item.preview}
        />
      ))}
    </>
  )
}

function getFreeArtworkItems(
  appliedDesign: AppliedDesignState,
  freeArtworkPreview: FreeArtworkPreviewState | null,
): FreeArtworkItem[] {
  const items = freeArtworkPreview?.items ?? appliedDesign.freeArtwork

  return [...items]
    .filter((item) => item.visible && item.imageSource)
    .sort((first, second) => first.layerOrder - second.layerOrder)
}

function getFreeArtworkProjectionSize(artwork: FreeArtworkItem): Vector3 {
  const [width, height, baseDepth] = getArtworkProjectionSize(
    artwork.uniformScale,
    getArtworkAspectRatio(artwork),
  )
  const depth = Math.max(baseDepth, Math.max(width, height) * 0.72)

  return new Vector3(width, height, depth)
}

function getProjectorWorldBounds(
  position: Vector3,
  orientation: Euler,
  size: Vector3,
): Box3 {
  const halfSize = size.clone().multiplyScalar(0.5)
  const matrix = new Matrix4().compose(
    position,
    new Quaternion().setFromEuler(orientation),
    new Vector3(1, 1, 1),
  )
  const bounds = new Box3()
  const corner = new Vector3()

  for (const x of [-halfSize.x, halfSize.x]) {
    for (const y of [-halfSize.y, halfSize.y]) {
      for (const z of [-halfSize.z, halfSize.z]) {
        corner.set(x, y, z).applyMatrix4(matrix)
        bounds.expandByPoint(corner)
      }
    }
  }

  return bounds
}

function usePreparedFreeArtworkTexture(artwork: FreeArtworkItem): Texture {
  const sourceTexture = useTexture(artwork.imageSource)
  const { gl } = useThree()

  const texture = useMemo(() => {
    const preparedTexture = sourceTexture.clone()

    preparedTexture.anisotropy = Math.min(
      8,
      gl.capabilities.getMaxAnisotropy(),
    )
    preparedTexture.center.set(0.5, 0.5)
    preparedTexture.colorSpace = SRGBColorSpace
    preparedTexture.flipY = true
    preparedTexture.wrapS = ClampToEdgeWrapping
    preparedTexture.wrapT = ClampToEdgeWrapping
    preparedTexture.needsUpdate = true

    return preparedTexture
  }, [gl.capabilities, sourceTexture])

  useEffect(() => {
    return () => {
      texture.dispose()
    }
  }, [texture])

  return texture
}

type FreeArtworkOverlayProps = {
  artwork: FreeArtworkItem
  preview: boolean
  targetCache: FreeArtworkTargetCache
}

const FreeArtworkOverlay = memo(function FreeArtworkOverlay({
  artwork,
  preview,
  targetCache,
}: FreeArtworkOverlayProps) {
  const texture = usePreparedFreeArtworkTexture(artwork)

  const overlayGroup = useMemo(() => {
    if (
      targetCache.entries.length === 0 ||
      !artwork.visible ||
      !freeArtworkHasProjector(artwork)
    ) {
      return null
    }

    const group = new Object3D()
    const material = createArtworkMaterial(texture)
    const projectorPosition = tupleToVector(artwork.projectorPosition)
    const projectorOrientation = getRotatedFreeArtworkOrientation(artwork)
    const projectorSize = getFreeArtworkProjectionSize(artwork)
    const projectorBounds = getProjectorWorldBounds(
      projectorPosition,
      projectorOrientation,
      projectorSize,
    )

    group.name = preview
      ? `MW_FREE_ART_PREVIEW_${artwork.id}`
      : `MW_FREE_ART_${artwork.id}`
    group.userData.modifyWrapFreeArtwork = true
    group.userData.freeArtworkId = artwork.id

    for (const target of targetCache.entries) {
      if (!target.worldBounds.intersectsBox(projectorBounds)) {
        continue
      }

      const targetMesh = target.mesh

      targetMesh.updateWorldMatrix(true, false)

      const geometry = new DecalGeometry(
        targetMesh,
        projectorPosition,
        projectorOrientation,
        projectorSize,
      )
      const positionAttribute = geometry.getAttribute('position')

      if (!positionAttribute || positionAttribute.count === 0) {
        geometry.dispose()
        continue
      }

      const fragment = new Mesh(geometry, material)
      fragment.name = `${group.name}_${targetMesh.name}`
      fragment.renderOrder =
        (preview ? FREE_ARTWORK_PREVIEW_RENDER_ORDER : FREE_ARTWORK_RENDER_ORDER) +
        artwork.layerOrder * 0.01
      fragment.userData.modifyWrapFreeArtwork = true
      fragment.userData.freeArtworkId = artwork.id
      fragment.userData.sourceMeshName = targetMesh.name
      group.add(fragment)
    }

    if (group.children.length === 0) {
      disposeMaterial(material)
      return null
    }

    return group
  }, [artwork, preview, targetCache, texture])

  useEffect(() => {
    return () => {
      if (!overlayGroup) {
        return
      }

      const disposedMaterials = new Set<Material>()

      overlayGroup.traverse((object) => {
        if (!isModelMesh(object)) {
          return
        }

        object.geometry.dispose()

        if (Array.isArray(object.material)) {
          for (const material of object.material) {
            if (!disposedMaterials.has(material)) {
              material.dispose()
              disposedMaterials.add(material)
            }
          }
          return
        }

        if (!disposedMaterials.has(object.material)) {
          object.material.dispose()
          disposedMaterials.add(object.material)
        }
      })
    }
  }, [overlayGroup])

  return overlayGroup ? <primitive object={overlayGroup} /> : null
})

type FreeArtworkOverlaysProps = {
  appliedDesign: AppliedDesignState
  freeArtworkPreview: FreeArtworkPreviewState | null
  targetCache: FreeArtworkTargetCache
}

function FreeArtworkOverlays({
  appliedDesign,
  freeArtworkPreview,
  targetCache,
}: FreeArtworkOverlaysProps) {
  const items = useMemo(
    () => getFreeArtworkItems(appliedDesign, freeArtworkPreview),
    [appliedDesign, freeArtworkPreview],
  )

  return (
    <>
      {items.map((artwork) => (
        <FreeArtworkOverlay
          artwork={artwork}
          key={`${freeArtworkPreview ? 'preview' : 'applied'}-${artwork.id}`}
          preview={Boolean(freeArtworkPreview)}
          targetCache={targetCache}
        />
      ))}
    </>
  )
}

function getEffectivePpfForTarget(
  partId: string,
  appliedDesign: AppliedDesignState,
  ppfPreview: PpfPreviewState | null,
  previewTargetIds: Set<string>,
): { ppf: PpfConfig; preview: boolean } | null {
  if (ppfPreview && !ppfPreview.fullBodyBase && previewTargetIds.has(partId)) {
    return {
      ppf: ppfPreview.ppf,
      preview: true,
    }
  }

  const partPpf = appliedDesign.parts[partId]?.ppf ?? null

  if (partPpf) {
    return {
      ppf: partPpf,
      preview: false,
    }
  }

  if (ppfPreview?.fullBodyBase) {
    return {
      ppf: ppfPreview.ppf,
      preview: true,
    }
  }

  const fullBodyPpf = appliedDesign.fullBody.ppf

  return fullBodyPpf
    ? {
        ppf: fullBodyPpf,
        preview: false,
      }
      : null
}

function getEffectiveCeramicForTarget(
  partId: string,
  appliedDesign: AppliedDesignState,
  ceramicPreview: CeramicPreviewState | null,
  previewTargetIds: Set<string>,
): CeramicConfig | null {
  if (
    ceramicPreview &&
    !ceramicPreview.fullBodyBase &&
    previewTargetIds.has(partId)
  ) {
    return ceramicPreview.ceramic
  }

  const partCeramic = appliedDesign.parts[partId]?.ceramic ?? null

  if (partCeramic) {
    return partCeramic
  }

  if (ceramicPreview?.fullBodyBase) {
    return ceramicPreview.ceramic
  }

  return appliedDesign.fullBody.ceramic
}

function createPpfMaterial(
  ppf: PpfConfig,
  ceramicEnabled: boolean,
): MeshPhysicalMaterial {
  const settings = getPpfFinishSettings(ppf.finish, ceramicEnabled)
  const material = new MeshPhysicalMaterial({
    blending: AdditiveBlending,
    color: '#000000',
    depthTest: true,
    depthWrite: false,
    envMapIntensity: settings.envMapIntensity,
    metalness: 0,
    opacity: settings.opacity,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
    roughness: settings.roughness,
    side: FrontSide,
    toneMapped: false,
    transparent: true,
  })

  material.name = `ModifyWrap ${ppf.finish} PPF Overlay`
  material.alphaHash = false
  material.alphaTest = 0
  material.clearcoat = settings.clearcoat
  material.clearcoatRoughness = settings.clearcoatRoughness
  material.ior = 1.46
  material.premultipliedAlpha = false
  material.reflectivity = settings.reflectivity
  material.specularColor = new Color('#ffffff')
  material.specularIntensity = settings.specularIntensity
  material.transmission = 0
  material.thickness = 0
  material.needsUpdate = true

  return material
}

type PpfOverlayProps = {
  ceramicEnabled: boolean
  finish: PpfFinish
  mesh: ModelMesh
  partId: string
  preview: boolean
}

function disablePpfRaycast() {
  return undefined
}

const PpfOverlay = memo(function PpfOverlay({
  ceramicEnabled,
  finish,
  mesh,
  partId,
  preview,
}: PpfOverlayProps) {
  const geometry = useMemo(() => mesh.geometry.clone(), [mesh])
  const matrix = useMemo(() => {
    mesh.updateWorldMatrix(true, false)

    return mesh.matrixWorld.clone()
  }, [mesh])
  const material = useMemo(
    () => createPpfMaterial({ finish }, ceramicEnabled),
    [ceramicEnabled, finish],
  )
  const name = preview
    ? `MW_PPF_PREVIEW_${partId}_${mesh.name}`
    : `MW_PPF_${partId}_${mesh.name}`
  const renderOrder = preview ? PPF_PREVIEW_RENDER_ORDER : PPF_RENDER_ORDER
  const userData = useMemo(
    () => ({
      modifyWrapPpf: true,
      ppfPartId: partId,
      sourceMeshName: mesh.name,
    }),
    [mesh.name, partId],
  )

  useEffect(() => {
    return () => {
      geometry.dispose()
    }
  }, [geometry])

  useEffect(() => {
    return () => {
      disposeMaterial(material)
    }
  }, [material])

  return (
    <mesh
      frustumCulled={false}
      geometry={geometry}
      material={material}
      matrix={matrix}
      matrixAutoUpdate={false}
      name={name}
      raycast={disablePpfRaycast}
      renderOrder={renderOrder}
      userData={userData}
    />
  )
})

type PpfOverlaysProps = {
  appliedDesign: AppliedDesignState
  ceramicPreview: CeramicPreviewState | null
  ppfPreview: PpfPreviewState | null
  targetEntries: readonly PpfTargetEntry[]
}

function PpfOverlays({
  appliedDesign,
  ceramicPreview,
  ppfPreview,
  targetEntries,
}: PpfOverlaysProps) {
  const previewTargetIds = useMemo(
    () => new Set(ppfPreview?.targetIds ?? []),
    [ppfPreview],
  )
  const ceramicPreviewTargetIds = useMemo(
    () => new Set(ceramicPreview?.targetIds ?? []),
    [ceramicPreview],
  )
  const items = useMemo(
    () =>
      targetEntries.flatMap((target) => {
        const effectivePpf = getEffectivePpfForTarget(
          target.partId,
          appliedDesign,
          ppfPreview,
          previewTargetIds,
        )

        const ceramic = getEffectiveCeramicForTarget(
          target.partId,
          appliedDesign,
          ceramicPreview,
          ceramicPreviewTargetIds,
        )

        return effectivePpf
          ? [
              {
                ceramicEnabled: ceramic?.enabled === true,
                finish: effectivePpf.ppf.finish,
                mesh: target.mesh,
                partId: target.partId,
                preview: effectivePpf.preview,
              },
            ]
          : []
      }),
    [
      appliedDesign,
      ceramicPreview,
      ceramicPreviewTargetIds,
      ppfPreview,
      previewTargetIds,
      targetEntries,
    ],
  )

  return (
    <>
      {items.map((item) => (
        <PpfOverlay
          ceramicEnabled={item.ceramicEnabled}
          finish={item.finish}
          key={`${item.partId}-${item.mesh.uuid}`}
          mesh={item.mesh}
          partId={item.partId}
          preview={item.preview}
        />
      ))}
    </>
  )
}

export function S4Model({
  appliedDesign,
  artworkPreview,
  caliperPaintPreview,
  ceramicPreview,
  chromeDeletePreview,
  controlsRef,
  freeArtworkPreview,
  lightTintPreview,
  ppfPreview,
  powderCoatPreview,
  selectedTargetId,
  tintPreview,
  wrapPreview,
  onArtworkPreviewTransformChange,
  onFreeArtworkTransformChange,
  onPartSelect,
  onSelectionClear,
}: S4ModelProps) {
  const gltf = useGLTF(MODEL_URL)
  const plateTexture = useTexture(PLATE_TEXTURE_URL)
  const { camera, gl, scene: rootScene } = useThree()
  const pointerStartRef = useRef<PointerStart | null>(null)
  const artworkDragRef = useRef<ArtworkDragState | null>(null)
  const freeArtworkDragRef = useRef<FreeArtworkDragState | null>(null)
  const artworkPreviewRef = useRef<ArtworkPreviewState | null>(artworkPreview)
  const freeArtworkPreviewRef =
    useRef<FreeArtworkPreviewState | null>(freeArtworkPreview)
  const selectedTargetIdRef = useRef<string | null>(selectedTargetId)
  const onArtworkPreviewTransformChangeRef = useRef(
    onArtworkPreviewTransformChange,
  )
  const onFreeArtworkTransformChangeRef = useRef(
    onFreeArtworkTransformChange,
  )
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
  const freeArtworkTargetCache = useMemo(
    () => getFreeArtworkTargetCache(modelScene),
    [modelScene],
  )
  const ppfTargetEntries = useMemo(
    () => getPpfTargetEntries(modelScene),
    [modelScene],
  )

  useEffect(() => {
    return () => {
      disposePreparedModelScene(preparedScene)
    }
  }, [preparedScene])

  useEffect(() => {
    return () => {
      preparedNativePlateTexture.dispose()
    }
  }, [preparedNativePlateTexture])

  useEffect(() => {
    return () => {
      preparedSurfacePlateTexture.dispose()
    }
  }, [preparedSurfacePlateTexture])

  useEffect(() => {
    artworkPreviewRef.current = artworkPreview
    freeArtworkPreviewRef.current = freeArtworkPreview
    selectedTargetIdRef.current = selectedTargetId
    onArtworkPreviewTransformChangeRef.current =
      onArtworkPreviewTransformChange
    onFreeArtworkTransformChangeRef.current = onFreeArtworkTransformChange
  }, [
    artworkPreview,
    freeArtworkPreview,
    onArtworkPreviewTransformChange,
    onFreeArtworkTransformChange,
    selectedTargetId,
  ])

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
    logMissingPowderCoatMeshes(preparedScene)
  }, [preparedScene])

  useEffect(() => {
    logMissingLightTintMeshes(preparedScene)
  }, [preparedScene])

  useEffect(() => {
    applyWrapMaterials(
      preparedScene,
      appliedDesign,
      wrapPreview,
      ceramicPreview,
      ppfPreview,
    )
  }, [appliedDesign, ceramicPreview, ppfPreview, preparedScene, wrapPreview])

  useEffect(() => {
    applyTintMaterials(preparedScene, appliedDesign, tintPreview)
  }, [appliedDesign, preparedScene, tintPreview])

  useEffect(() => {
    applyLightTintMaterials(preparedScene, appliedDesign, lightTintPreview)
  }, [appliedDesign, lightTintPreview, preparedScene])

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
    applyPowderCoatMaterials(preparedScene, appliedDesign, powderCoatPreview)
  }, [appliedDesign, powderCoatPreview, preparedScene])

  useEffect(() => {
    applyOutlines(preparedScene, selectedMeshNames, hoveredMeshNames)

    return () => {
      removeExistingOutlines(modelScene)
    }
  }, [hoveredMeshNames, modelScene, preparedScene, selectedMeshNames])

  useEffect(() => {
    const artwork = artworkPreview?.artwork

    if (
      !artwork ||
      artwork.mode !== 'place' ||
      !artwork.imageSource ||
      (artwork.position && artwork.orientation && artwork.size)
    ) {
      return
    }

    const targetMesh = getLargestArtworkMesh(
      getArtworkTargetMeshes(modelScene, artwork.targetPartId),
    )

    if (!targetMesh) {
      return
    }

    const defaultTransform = getDefaultArtworkTransform(
      targetMesh,
      camera.position,
      artwork.scale,
      artwork.rotation,
      getArtworkAspectRatio(artwork),
    )

    if (defaultTransform) {
      onArtworkPreviewTransformChange(defaultTransform)
    }
  }, [
    artworkPreview?.artwork,
    camera.position,
    modelScene,
    onArtworkPreviewTransformChange,
  ])

  useEffect(() => {
    const selectedFreeArtwork = freeArtworkPreview?.items.find(
      (item) => item.id === freeArtworkPreview.selectedItemId,
    )

    if (
      !selectedFreeArtwork ||
      !selectedFreeArtwork.imageSource ||
      freeArtworkHasProjector(selectedFreeArtwork)
    ) {
      return
    }

    const defaultTransform = getDefaultFreeArtworkTransform(
      freeArtworkTargetCache,
      camera.position,
    )

    if (defaultTransform) {
      onFreeArtworkTransformChange(
        selectedFreeArtwork.id,
        defaultTransform,
      )
    } else {
      console.warn(
        'ModifyWrap Free Art could not find a valid painted body placement.',
      )
    }
  }, [
    camera.position,
    freeArtworkTargetCache,
    freeArtworkPreview,
    onFreeArtworkTransformChange,
  ])

  useEffect(() => {
    document.body.style.cursor = hoveredPartId ? 'pointer' : ''

    return () => {
      document.body.style.cursor = ''
    }
  }, [hoveredPartId])

  useEffect(() => {
    const canvas = gl.domElement

    function setControlsEnabled(enabled: boolean) {
      const controls = controlsRef.current

      if (controls) {
        controls.enabled = enabled
      }
    }

    function trySetPointerCapture(event: PointerEvent) {
      try {
        if (!canvas.hasPointerCapture(event.pointerId)) {
          canvas.setPointerCapture(event.pointerId)
        }
      } catch {
        // Pointer capture can be unavailable for interrupted synthetic gestures.
      }
    }

    function tryReleasePointerCapture(event: PointerEvent) {
      try {
        if (canvas.hasPointerCapture(event.pointerId)) {
          canvas.releasePointerCapture(event.pointerId)
        }
      } catch {
        // Ignore stale capture ownership during HMR or canceled gestures.
      }
    }

    function cancelArtworkDragFrame(drag: ArtworkDragState) {
      if (drag.animationFrameId !== null) {
        window.cancelAnimationFrame(drag.animationFrameId)
        drag.animationFrameId = null
      }

      drag.latestEvent = null
    }

    function cancelFreeArtworkDragFrame(drag: FreeArtworkDragState) {
      if (drag.animationFrameId !== null) {
        window.cancelAnimationFrame(drag.animationFrameId)
        drag.animationFrameId = null
      }

      drag.latestEvent = null
    }

    function stopArtworkDrag(event?: PointerEvent) {
      const drag = artworkDragRef.current

      if (!drag) {
        return
      }

      cancelArtworkDragFrame(drag)

      if (event) {
        tryReleasePointerCapture(event)
      }

      artworkDragRef.current = null
      setControlsEnabled(true)
    }

    function stopFreeArtworkDrag(event?: PointerEvent) {
      const drag = freeArtworkDragRef.current

      if (!drag) {
        return
      }

      cancelFreeArtworkDragFrame(drag)

      if (event) {
        tryReleasePointerCapture(event)
      }

      freeArtworkDragRef.current = null
      setControlsEnabled(true)
    }

    function getActiveArtworkTransform(
      event: PointerEvent,
    ): Partial<ArtworkDraftState> | null {
      const artwork = artworkPreviewRef.current?.artwork

      if (
        !artwork ||
        artwork.mode !== 'place' ||
        !artwork.imageSource ||
        artwork.targetPartId !== selectedTargetIdRef.current
      ) {
        return null
      }

      return getArtworkTransformFromPointer(
        event,
        canvas,
        camera,
        modelScene,
        raycasterRef.current,
        artwork,
      )
    }

    function getActiveFreeArtworkItem(): FreeArtworkItem | null {
      const preview = freeArtworkPreviewRef.current

      if (!preview?.selectedItemId) {
        return null
      }

      return (
        preview.items.find((item) => item.id === preview.selectedItemId) ?? null
      )
    }

    function getActiveFreeArtworkTransform(
      event: PointerEvent,
    ): Partial<FreeArtworkItem> | null {
      const artwork = getActiveFreeArtworkItem()

      if (!artwork?.imageSource || artwork.locked) {
        return null
      }

      return getFreeArtworkTransformFromPointer(
        event,
        canvas,
        camera,
        freeArtworkTargetCache,
        raycasterRef.current,
      )
    }

    function applyArtworkDragTransform(
      drag: ArtworkDragState,
      event: PointerEvent,
    ) {
      const artworkTransform = getActiveArtworkTransform(event)

      if (!artworkTransform) {
        return
      }

      drag.lastTransform = artworkTransform
      onArtworkPreviewTransformChangeRef.current(artworkTransform)
    }

    function scheduleArtworkDragTransform(
      drag: ArtworkDragState,
      event: PointerEvent,
    ) {
      drag.latestEvent = event

      if (drag.animationFrameId !== null) {
        return
      }

      drag.animationFrameId = window.requestAnimationFrame(() => {
        drag.animationFrameId = null

        const latestEvent = drag.latestEvent
        drag.latestEvent = null

        if (latestEvent) {
          applyArtworkDragTransform(drag, latestEvent)
        }
      })
    }

    function flushArtworkDragTransform(
      drag: ArtworkDragState,
      event: PointerEvent,
    ) {
      cancelArtworkDragFrame(drag)
      applyArtworkDragTransform(drag, event)
    }

    function applyFreeArtworkDragTransform(
      drag: FreeArtworkDragState,
      event: PointerEvent,
    ) {
      const freeArtworkTransform = getActiveFreeArtworkTransform(event)

      if (!freeArtworkTransform) {
        return
      }

      drag.lastTransform = freeArtworkTransform
      onFreeArtworkTransformChangeRef.current(
        drag.artworkId,
        freeArtworkTransform,
      )
    }

    function scheduleFreeArtworkDragTransform(
      drag: FreeArtworkDragState,
      event: PointerEvent,
    ) {
      drag.latestEvent = event

      if (drag.animationFrameId !== null) {
        return
      }

      drag.animationFrameId = window.requestAnimationFrame(() => {
        drag.animationFrameId = null

        const latestEvent = drag.latestEvent
        drag.latestEvent = null

        if (latestEvent) {
          applyFreeArtworkDragTransform(drag, latestEvent)
        }
      })
    }

    function flushFreeArtworkDragTransform(
      drag: FreeArtworkDragState,
      event: PointerEvent,
    ) {
      cancelFreeArtworkDragFrame(drag)
      applyFreeArtworkDragTransform(drag, event)
    }

    function pointerHitsActiveFreeArtwork(
      event: PointerEvent,
      artworkId: string,
    ): boolean {
      const overlayFragments: Object3D[] = []

      rootScene.traverse((object) => {
        if (
          object.userData.modifyWrapFreeArtwork === true &&
          object.userData.freeArtworkId === artworkId &&
          isModelMesh(object)
        ) {
          overlayFragments.push(object)
        }
      })

      if (overlayFragments.length === 0) {
        return false
      }

      raycasterRef.current.setFromCamera(
        getPointerCoordinates(event, canvas),
        camera,
      )

      return raycasterRef.current.intersectObjects(overlayFragments, false)
        .length > 0
    }

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
        stopArtworkDrag(event)
        stopFreeArtworkDrag(event)
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

      const activeFreeArtwork = getActiveFreeArtworkItem()

      if (
        activeFreeArtwork &&
        pointerHitsActiveFreeArtwork(event, activeFreeArtwork.id)
      ) {
        const freeArtworkTransform = getActiveFreeArtworkTransform(event)

        if (freeArtworkTransform) {
          freeArtworkDragRef.current = {
            animationFrameId: null,
            artworkId: activeFreeArtwork.id,
            lastTransform: freeArtworkTransform,
            latestEvent: null,
            pointerId: event.pointerId,
          }
          pointerStartRef.current = null
          setControlsEnabled(false)
          trySetPointerCapture(event)
          onFreeArtworkTransformChangeRef.current(
            activeFreeArtwork.id,
            freeArtworkTransform,
          )
          event.preventDefault()
          return
        }
      }

      const artworkTransform = getActiveArtworkTransform(event)

      if (artworkTransform) {
        artworkDragRef.current = {
          animationFrameId: null,
          lastTransform: artworkTransform,
          latestEvent: null,
          pointerId: event.pointerId,
        }
        pointerStartRef.current = null
        setControlsEnabled(false)
        trySetPointerCapture(event)
        onArtworkPreviewTransformChangeRef.current(artworkTransform)
        event.preventDefault()
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
      const freeArtworkDrag = freeArtworkDragRef.current

      if (freeArtworkDrag?.pointerId === event.pointerId) {
        scheduleFreeArtworkDragTransform(freeArtworkDrag, event)
        event.preventDefault()
        return
      }

      const artworkDrag = artworkDragRef.current

      if (artworkDrag?.pointerId === event.pointerId) {
        scheduleArtworkDragTransform(artworkDrag, event)
        event.preventDefault()
        return
      }

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
      const freeArtworkDrag = freeArtworkDragRef.current

      if (freeArtworkDrag?.pointerId === event.pointerId) {
        updateTouchPointers(event, false)
        flushFreeArtworkDragTransform(freeArtworkDrag, event)
        stopFreeArtworkDrag(event)

        if (activeTouchPointersRef.current.size === 0) {
          multiTouchGestureRef.current = false
        }

        event.preventDefault()
        return
      }

      const artworkDrag = artworkDragRef.current

      if (artworkDrag?.pointerId === event.pointerId) {
        updateTouchPointers(event, false)
        flushArtworkDragTransform(artworkDrag, event)
        stopArtworkDrag(event)

        if (activeTouchPointersRef.current.size === 0) {
          multiTouchGestureRef.current = false
        }

        event.preventDefault()
        return
      }

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

      const activeFreeArtwork = getActiveFreeArtworkItem()

      if (activeFreeArtwork && !activeFreeArtwork.locked) {
        const freeArtworkTransform = getActiveFreeArtworkTransform(event)

        if (freeArtworkTransform) {
          onFreeArtworkTransformChangeRef.current(
            activeFreeArtwork.id,
            freeArtworkTransform,
          )
          event.preventDefault()
          return
        }
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
      stopArtworkDrag(event)
      stopFreeArtworkDrag(event)
      pointerStartRef.current = null
      setHoveredPartId(null)

      if (activeTouchPointersRef.current.size === 0) {
        multiTouchGestureRef.current = false
      }
    }

    function handlePointerLeave() {
      stopArtworkDrag()
      stopFreeArtworkDrag()
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
      stopArtworkDrag()
      stopFreeArtworkDrag()
    }
  }, [
    camera,
    controlsRef,
    freeArtworkTargetCache,
    gl.domElement,
    modelScene,
    onPartSelect,
    onSelectionClear,
    rootScene,
  ])

  return (
    <>
      <primitive object={modelScene} />
      <ArtworkOverlays
        appliedDesign={appliedDesign}
        artworkPreview={artworkPreview}
        modelScene={modelScene}
      />
      <FreeArtworkOverlays
        appliedDesign={appliedDesign}
        freeArtworkPreview={freeArtworkPreview}
        targetCache={freeArtworkTargetCache}
      />
      <PpfOverlays
        appliedDesign={appliedDesign}
        ceramicPreview={ceramicPreview}
        ppfPreview={ppfPreview}
        targetEntries={ppfTargetEntries}
      />
    </>
  )
}
