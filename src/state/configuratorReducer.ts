import {
  FULL_BODY_PART_IDS,
  FULL_BODY_TARGET_ID,
  getSelectionTarget,
} from '../config/vehicleParts'
import type {
  AppliedDesignState,
  DraftSelectionState,
  LayeredSurfaceState,
  SelectionTargetId,
  ServiceId,
  WrapConfig,
  WrapFinish,
} from '../types/configurator'

const DEFAULT_WRAP_CONFIG: WrapConfig = {
  color: '#c49d59',
  finish: 'gloss',
}

export type ConfiguratorState = {
  appliedDesign: AppliedDesignState
  draftSelection: DraftSelectionState | null
}

export type ConfiguratorAction =
  | {
      type: 'select-target'
      targetId: SelectionTargetId
    }
  | {
      type: 'select-service'
      serviceId: ServiceId
    }
  | {
      type: 'update-wrap-draft'
      patch: Partial<WrapConfig>
    }
  | {
      type: 'clear-service'
    }
  | {
      type: 'cancel-draft'
    }
  | {
      type: 'apply-draft'
    }
  | {
      type: 'apply-wrap-all'
    }
  | {
      type: 'reset-wrap'
      targetId: SelectionTargetId
    }
  | {
      type: 'reset-all-wraps'
    }

function createLayeredSurfaceState(): LayeredSurfaceState {
  return {
    wrap: null,
    artwork: null,
    ppf: null,
    ceramic: null,
    services: {},
  }
}

function applyServiceToSurface(
  surfaceState: LayeredSurfaceState,
  serviceId: ServiceId,
): LayeredSurfaceState {
  const appliedService = { serviceId }

  if (serviceId === 'wrap') {
    return {
      ...surfaceState,
      wrap: DEFAULT_WRAP_CONFIG,
    }
  }

  if (serviceId === 'artwork') {
    return {
      ...surfaceState,
      artwork: appliedService,
    }
  }

  if (serviceId === 'ppf') {
    return {
      ...surfaceState,
      ppf: appliedService,
    }
  }

  if (serviceId === 'ceramic') {
    return {
      ...surfaceState,
      ceramic: appliedService,
    }
  }

  return {
    ...surfaceState,
    services: {
      ...surfaceState.services,
      [serviceId]: appliedService,
    },
  }
}

function setWrapOnSurface(
  surfaceState: LayeredSurfaceState,
  wrapConfig: WrapConfig,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    wrap: wrapConfig,
  }
}

function clearWrapFromSurface(
  surfaceState: LayeredSurfaceState,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    wrap: null,
  }
}

function getAppliedWrapForTarget(
  appliedDesign: AppliedDesignState,
  targetId: SelectionTargetId,
): WrapConfig | null {
  if (targetId === FULL_BODY_TARGET_ID) {
    return appliedDesign.fullBody.wrap
  }

  const target = getSelectionTarget(targetId)
  const partWrap = appliedDesign.parts[targetId]?.wrap ?? null

  if (partWrap) {
    return partWrap
  }

  if (target?.fullBody) {
    return appliedDesign.fullBody.wrap
  }

  return null
}

function createWrapDraft(
  appliedDesign: AppliedDesignState,
  targetId: SelectionTargetId,
): WrapConfig {
  return getAppliedWrapForTarget(appliedDesign, targetId) ?? DEFAULT_WRAP_CONFIG
}

function updateWrapDraft(
  currentWrap: WrapConfig,
  patch: Partial<WrapConfig>,
): WrapConfig {
  const finish = patch.finish

  return {
    color: patch.color ?? currentWrap.color,
    finish: isWrapFinish(finish) ? finish : currentWrap.finish,
  }
}

function isWrapFinish(finish: WrapFinish | undefined): finish is WrapFinish {
  return finish === 'gloss' || finish === 'satin' || finish === 'matte'
}

function clearFullBodyPartWraps(
  parts: AppliedDesignState['parts'],
): AppliedDesignState['parts'] {
  const fullBodyPartIds = new Set(FULL_BODY_PART_IDS)
  const nextParts: AppliedDesignState['parts'] = {}

  for (const [partId, partState] of Object.entries(parts)) {
    nextParts[partId] = fullBodyPartIds.has(partId)
      ? clearWrapFromSurface(partState)
      : partState
  }

  return nextParts
}

export const initialConfiguratorState: ConfiguratorState = {
  appliedDesign: {
    fullBody: createLayeredSurfaceState(),
    parts: {},
  },
  draftSelection: null,
}

export function configuratorReducer(
  state: ConfiguratorState,
  action: ConfiguratorAction,
): ConfiguratorState {
  if (action.type === 'select-target') {
    const target = getSelectionTarget(action.targetId)

    if (!target) {
      return state
    }

    return {
      ...state,
      draftSelection: {
        targetId: target.id,
        serviceId: null,
        wrapConfig: null,
      },
    }
  }

  if (action.type === 'select-service') {
    if (!state.draftSelection) {
      return state
    }

    const wrapConfig =
      action.serviceId === 'wrap'
        ? createWrapDraft(state.appliedDesign, state.draftSelection.targetId)
        : null

    return {
      ...state,
      draftSelection: {
        ...state.draftSelection,
        serviceId: action.serviceId,
        wrapConfig,
      },
    }
  }

  if (action.type === 'update-wrap-draft') {
    const draftSelection = state.draftSelection

    if (draftSelection?.serviceId !== 'wrap') {
      return state
    }

    const currentWrap =
      draftSelection.wrapConfig ??
      createWrapDraft(state.appliedDesign, draftSelection.targetId)

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        wrapConfig: updateWrapDraft(currentWrap, action.patch),
      },
    }
  }

  if (action.type === 'clear-service') {
    if (!state.draftSelection) {
      return state
    }

    return {
      ...state,
      draftSelection: {
        ...state.draftSelection,
        serviceId: null,
        wrapConfig: null,
      },
    }
  }

  if (action.type === 'cancel-draft') {
    return {
      ...state,
      draftSelection: null,
    }
  }

  if (action.type === 'apply-draft') {
    const draftSelection = state.draftSelection

    if (!draftSelection?.serviceId) {
      return state
    }

    if (draftSelection.serviceId === 'wrap') {
      if (!draftSelection.wrapConfig) {
        return state
      }

      if (draftSelection.targetId === FULL_BODY_TARGET_ID) {
        return {
          ...state,
          appliedDesign: {
            ...state.appliedDesign,
            fullBody: setWrapOnSurface(
              state.appliedDesign.fullBody,
              draftSelection.wrapConfig,
            ),
          },
          draftSelection: null,
        }
      }

      const currentPartState =
        state.appliedDesign.parts[draftSelection.targetId] ??
        createLayeredSurfaceState()

      return {
        ...state,
        appliedDesign: {
          ...state.appliedDesign,
          parts: {
            ...state.appliedDesign.parts,
            [draftSelection.targetId]: setWrapOnSurface(
              currentPartState,
              draftSelection.wrapConfig,
            ),
          },
        },
        draftSelection: null,
      }
    }

    if (draftSelection.targetId === FULL_BODY_TARGET_ID) {
      return {
        ...state,
        appliedDesign: {
          ...state.appliedDesign,
          fullBody: applyServiceToSurface(
            state.appliedDesign.fullBody,
            draftSelection.serviceId,
          ),
        },
        draftSelection: null,
      }
    }

    const currentPartState =
      state.appliedDesign.parts[draftSelection.targetId] ??
      createLayeredSurfaceState()

    return {
      ...state,
      appliedDesign: {
        ...state.appliedDesign,
        parts: {
          ...state.appliedDesign.parts,
          [draftSelection.targetId]: applyServiceToSurface(
            currentPartState,
            draftSelection.serviceId,
          ),
        },
      },
      draftSelection: null,
    }
  }

  if (action.type === 'apply-wrap-all') {
    const draftSelection = state.draftSelection

    if (
      draftSelection?.targetId !== FULL_BODY_TARGET_ID ||
      draftSelection.serviceId !== 'wrap' ||
      !draftSelection.wrapConfig
    ) {
      return state
    }

    return {
      ...state,
      appliedDesign: {
        ...state.appliedDesign,
        fullBody: setWrapOnSurface(
          state.appliedDesign.fullBody,
          draftSelection.wrapConfig,
        ),
        parts: clearFullBodyPartWraps(state.appliedDesign.parts),
      },
      draftSelection: null,
    }
  }

  if (action.type === 'reset-wrap') {
    if (action.targetId === FULL_BODY_TARGET_ID) {
      return {
        ...state,
        appliedDesign: {
          ...state.appliedDesign,
          fullBody: clearWrapFromSurface(state.appliedDesign.fullBody),
        },
        draftSelection: null,
      }
    }

    const currentPartState =
      state.appliedDesign.parts[action.targetId] ?? createLayeredSurfaceState()

    return {
      ...state,
      appliedDesign: {
        ...state.appliedDesign,
        parts: {
          ...state.appliedDesign.parts,
          [action.targetId]: clearWrapFromSurface(currentPartState),
        },
      },
      draftSelection: null,
    }
  }

  if (action.type === 'reset-all-wraps') {
    return {
      ...state,
      appliedDesign: {
        ...state.appliedDesign,
        fullBody: clearWrapFromSurface(state.appliedDesign.fullBody),
        parts: clearFullBodyPartWraps(state.appliedDesign.parts),
      },
      draftSelection: null,
    }
  }

  return state
}
