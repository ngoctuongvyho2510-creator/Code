import { Environment, Lightformer } from '@react-three/drei'

export type LightingMode = 'studio' | 'day' | 'night'

type StudioEnvironmentProps = {
  mode: LightingMode
}

type EnvironmentPreset = {
  ceilingColor: string
  ceilingIntensity: number
  environmentIntensity: number
  floorColor: string
  floorIntensity: number
  frontColor: string
  frontIntensity: number
  oppositeColor: string
  oppositeIntensity: number
  rearColor: string
  rearIntensity: number
  sideColor: string
  sideIntensity: number
}

const environmentPresets = {
  studio: {
  ceilingColor: '#ffffff',
  ceilingIntensity: 2.6,

  environmentIntensity: 0.92,

  floorColor: '#d7dde4',
  floorIntensity: 0.32,

  frontColor: '#ffffff',
  frontIntensity: 1.8,

  oppositeColor: '#ffffff',
  oppositeIntensity: 1.4,

  rearColor: '#e9edf2',
  rearIntensity: 1.0,

  sideColor: '#f5f7fa',
  sideIntensity: 2.05,
},
  day: {
    ceilingColor: '#eaf5ff',
    ceilingIntensity: 4.2,
    environmentIntensity: 1.16,
    floorColor: '#d7c8ae',
    floorIntensity: 0.92,
    frontColor: '#fff4df',
    frontIntensity: 3,
    oppositeColor: '#d8ecff',
    oppositeIntensity: 2.1,
    rearColor: '#dcecff',
    rearIntensity: 1.7,
    sideColor: '#e4f2ff',
    sideIntensity: 3.2,
  },
  night: {
    ceilingColor: '#c7ddff',
    ceilingIntensity: 1.05,
    environmentIntensity: 0.66,
    floorColor: '#75839a',
    floorIntensity: 0.2,
    frontColor: '#ffffff',
    frontIntensity: 2.45,
    oppositeColor: '#78a8ff',
    oppositeIntensity: 1.35,
    rearColor: '#9bb8e6',
    rearIntensity: 0.82,
    sideColor: '#a8c8ff',
    sideIntensity: 1.85,
  },
} as const satisfies Record<LightingMode, EnvironmentPreset>

export function StudioEnvironment({ mode }: StudioEnvironmentProps) {
  const preset = environmentPresets[mode]

  return (
    <Environment
      key={mode}
      background={false}
      environmentIntensity={preset.environmentIntensity}
      frames={1}
      resolution={512}
    >
      {/* Long ceiling card: clean reflection across roof and hood. */}
      <Lightformer
        color={preset.ceilingColor}
        form="rect"
        intensity={preset.ceilingIntensity}
        position={[0, 5.2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[8.5, 0.85, 1]}
      />

      {/* Main side strip: long reflection across doors and shoulder line. */}
      <Lightformer
        color={preset.sideColor}
        form="rect"
        intensity={preset.sideIntensity}
        position={[-5, 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        scale={[5.5, 0.55, 1]}
      />

      {/* Opposite strip: keeps the far side readable. */}
      <Lightformer
        color={preset.oppositeColor}
        form="rect"
        intensity={preset.oppositeIntensity}
        position={[5, 2.4, -1]}
        rotation={[0, -Math.PI / 2, 0]}
        scale={[4.5, 0.3, 1]}
      />

      {/* Front card: hood, fenders, grille and front badges. */}
      <Lightformer
        color={preset.frontColor}
        form="rect"
        intensity={preset.frontIntensity}
        position={[0, 2.7, 6]}
        rotation={[0, Math.PI, 0]}
        scale={[3.8, 0.55, 1]}
      />

      {/* Rear card: trunk and rear quarter readability. */}
      <Lightformer
        color={preset.rearColor}
        form="rect"
        intensity={preset.rearIntensity}
        position={[0, 2.2, -6]}
        rotation={[0, 0, 0]}
        scale={[3.5, 0.35, 1]}
      />

      {/* Broad low fill: gives wheels, badges and chrome something to reflect. */}
      <Lightformer
        color={preset.floorColor}
        form="rect"
        intensity={preset.floorIntensity}
        position={[0, -1.1, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[11, 7, 1]}
      />
    </Environment>
  )
}
