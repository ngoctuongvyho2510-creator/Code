import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { useGLTF, useTexture } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import {
  BufferGeometry,
  Color,
  EdgesGeometry,
  LineBasicMaterial,
  LineSegments,
  Material,
  Mesh,
  MeshStandardMaterial,
  Object3D,
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
  getSelectablePartByMeshName,
  getSelectionTarget,
  LICENSE_PLATE_MESH_NAMES,
} from '../../config/vehicleParts'

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
  controlsRef: RefObject<OrbitControlsImpl | null>
  selectedTargetId: string | null
  onPartSelect: (partId: string) => void
  onSelectionClear: () => void
}

const inspectedScenes = new WeakSet<Object3D>()
const plateMeshNames = new Set<string>(LICENSE_PLATE_MESH_NAMES)

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
    roughness: 0.48,
  })

  material.name = 'ModifyWrap License Plate'
  return material
}

function prepareModelScene(scene: Object3D, plateTexture: Texture) {
  scene.traverse((object) => {
    if (!isModelMesh(object)) {
      return
    }

    if (plateMeshNames.has(object.name)) {
      object.material = createPlateMaterial(plateTexture)
    } else {
      object.material = cloneMaterials(object.material)
    }
  })

  applyShadowSettings(scene)
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

function resolveSelectablePartId(object: Object3D): string | null {
  let current: Object3D | null = object

  while (current) {
    const part = current.name ? getSelectablePartByMeshName(current.name) : null

    if (part) {
      return part.id
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

  for (const intersection of intersections) {
    if (isOutlineObject(intersection.object)) {
      continue
    }

    const partId = resolveSelectablePartId(intersection.object)

    if (partId) {
      return partId
    }
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
  controlsRef,
  selectedTargetId,
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

  const preparedPlateTexture = useMemo(() => {
    const texture = plateTexture.clone()

    texture.colorSpace = SRGBColorSpace
    texture.flipY = false
    texture.needsUpdate = true

    return texture
  }, [plateTexture])

  const modelScene = useMemo(() => {
    const clonedScene = clone(gltf.scene)
    prepareModelScene(clonedScene, preparedPlateTexture)
    return clonedScene
  }, [gltf.scene, preparedPlateTexture])

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
