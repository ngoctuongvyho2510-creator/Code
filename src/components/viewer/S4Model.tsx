import { useEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import {
  BufferGeometry,
  Material,
  Mesh,
  Object3D,
  type Object3DEventMap,
} from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'

const MODEL_URL = '/Mahir S4.glb'

type ModelMesh = Mesh<BufferGeometry, Material | Material[], Object3DEventMap>

type ModelInventoryRow = {
  name: string
  type: string
  material: string
  isMesh: boolean
  hasUv: boolean
  transparent: boolean
}

const inspectedScenes = new WeakSet<Object3D>()

function isModelMesh(object: Object3D): object is ModelMesh {
  return object instanceof Mesh
}

function getMaterials(material: Material | Material[]): Material[] {
  return Array.isArray(material) ? material : [material]
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

export function S4Model() {
  const gltf = useGLTF(MODEL_URL)
  const modelScene = useMemo(() => clone(gltf.scene), [gltf.scene])

  useEffect(() => {
    applyShadowSettings(modelScene)
    logDevelopmentInventory(gltf.scene)
  }, [gltf.scene, modelScene])

  return <primitive object={modelScene} />
}
