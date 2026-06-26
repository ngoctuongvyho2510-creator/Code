import {
  FULL_BODY_PART_IDS,
  FULL_BODY_TARGET_ID,
  getDefaultChromeDeleteScope,
  getDefaultTintScope,
  getSelectionTarget,
  resolveChromeDeleteScopeTargetIds,
  resolveTintScopeTargetIds,
} from '../config/vehicleParts'
import type {
  AppliedDesignState,
  ChromeDeleteConfig,
  ChromeDeleteFinish,
  ChromeDeleteScope,
  DraftSelectionState,
  LayeredSurfaceState,
  SelectionTargetId,
  ServiceId,
  TintConfig,
  TintScope,
  WrapConfig,
  WrapFinish,
} from '../types/configurator'

const DEFAULT_WRAP_CONFIG: WrapConfig = {
  color: '#c49d59',
  finish: 'gloss',
}

const DEFAULT_TINT_CONFIG: TintConfig = {
  vlt: 35,
}

const DEFAULT_CHROME_DELETE_CONFIG: ChromeDeleteConfig = {
  color: '#050505',
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
      type: 'update-tint-draft'
      patch: Partial<TintConfig>
    }
  | {
      type: 'update-tint-scope'
      scope: TintScope
    }
  | {
      type: 'update-chrome-delete-draft'
      patch: Partial<ChromeDeleteConfig>
    }
  | {
      type: 'update-chrome-delete-scope'
      scope: ChromeDeleteScope
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
      type: 'reset-tint'
      targetId: SelectionTargetId
      scope: TintScope
    }
  | {
      type: 'reset-chrome-delete'
      targetId: SelectionTargetId
      scope: ChromeDeleteScope
    }
  | {
      type: 'reset-all-wraps'
    }

function createLayeredSurfaceState(): LayeredSurfaceState {
  return {
    wrap: null,
    tint: null,
    chromeDelete: null,
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

  if (serviceId === 'tint') {
    return {
      ...surfaceState,
      tint: DEFAULT_TINT_CONFIG,
    }
  }

  if (serviceId === 'chrome-delete') {
    return {
      ...surfaceState,
      chromeDelete: DEFAULT_CHROME_DELETE_CONFIG,
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

function setTintOnSurface(
  surfaceState: LayeredSurfaceState,
  tintConfig: TintConfig,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    tint: tintConfig,
  }
}

function clearTintFromSurface(
  surfaceState: LayeredSurfaceState,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    tint: null,
  }
}

function setChromeDeleteOnSurface(
  surfaceState: LayeredSurfaceState,
  chromeDeleteConfig: ChromeDeleteConfig,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    chromeDelete: chromeDeleteConfig,
  }
}

function clearChromeDeleteFromSurface(
  surfaceState: LayeredSurfaceState,
): LayeredSurfaceState {
  return {
    ...surfaceState,
    chromeDelete: null,
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

function getAppliedTintForTarget(
  appliedDesign: AppliedDesignState,
  targetId: SelectionTargetId,
): TintConfig | null {
  return appliedDesign.parts[targetId]?.tint ?? null
}

function createTintDraft(
  appliedDesign: AppliedDesignState,
  targetId: SelectionTargetId,
): TintConfig {
  return getAppliedTintForTarget(appliedDesign, targetId) ?? DEFAULT_TINT_CONFIG
}

function getAppliedChromeDeleteForTarget(
  appliedDesign: AppliedDesignState,
  targetId: SelectionTargetId,
): ChromeDeleteConfig | null {
  return appliedDesign.parts[targetId]?.chromeDelete ?? null
}

function createChromeDeleteDraft(
  appliedDesign: AppliedDesignState,
  targetId: SelectionTargetId,
): ChromeDeleteConfig {
  return (
    getAppliedChromeDeleteForTarget(appliedDesign, targetId) ??
    DEFAULT_CHROME_DELETE_CONFIG
  )
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

function updateTintDraft(
  currentTint: TintConfig,
  patch: Partial<TintConfig>,
): TintConfig {
  const patchedVlt = patch.vlt ?? currentTint.vlt

  return {
    vlt: clampTintVlt(patchedVlt),
  }
}

function updateChromeDeleteDraft(
  currentChromeDelete: ChromeDeleteConfig,
  patch: Partial<ChromeDeleteConfig>,
): ChromeDeleteConfig {
  const finish = patch.finish

  return {
    color: patch.color ?? currentChromeDelete.color,
    finish: isChromeDeleteFinish(finish)
      ? finish
      : currentChromeDelete.finish,
  }
}

function isWrapFinish(finish: WrapFinish | undefined): finish is WrapFinish {
  return finish === 'gloss' || finish === 'satin' || finish === 'matte'
}

function isChromeDeleteFinish(
  finish: ChromeDeleteFinish | undefined,
): finish is ChromeDeleteFinish {
  return finish === 'gloss' || finish === 'satin' || finish === 'matte'
}

function clampTintVlt(vlt: number): number {
  if (!Number.isFinite(vlt)) {
    return DEFAULT_TINT_CONFIG.vlt
  }

  return Math.min(100, Math.max(5, Math.round(vlt)))
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

function setTintForTargetIds(
  parts: AppliedDesignState['parts'],
  targetIds: readonly SelectionTargetId[],
  tintConfig: TintConfig,
): AppliedDesignState['parts'] {
  const nextParts: AppliedDesignState['parts'] = {
    ...parts,
  }

  for (const targetId of targetIds) {
    const currentPartState = nextParts[targetId] ?? createLayeredSurfaceState()

    nextParts[targetId] = setTintOnSurface(currentPartState, tintConfig)
  }

  return nextParts
}

function clearTintForTargetIds(
  parts: AppliedDesignState['parts'],
  targetIds: readonly SelectionTargetId[],
): AppliedDesignState['parts'] {
  const nextParts: AppliedDesignState['parts'] = {
    ...parts,
  }

  for (const targetId of targetIds) {
    const currentPartState = nextParts[targetId] ?? createLayeredSurfaceState()

    nextParts[targetId] = clearTintFromSurface(currentPartState)
  }

  return nextParts
}

function setChromeDeleteForTargetIds(
  parts: AppliedDesignState['parts'],
  targetIds: readonly SelectionTargetId[],
  chromeDeleteConfig: ChromeDeleteConfig,
): AppliedDesignState['parts'] {
  const nextParts: AppliedDesignState['parts'] = {
    ...parts,
  }

  for (const targetId of targetIds) {
    const currentPartState = nextParts[targetId] ?? createLayeredSurfaceState()

    nextParts[targetId] = setChromeDeleteOnSurface(
      currentPartState,
      chromeDeleteConfig,
    )
  }

  return nextParts
}

function clearChromeDeleteForTargetIds(
  parts: AppliedDesignState['parts'],
  targetIds: readonly SelectionTargetId[],
): AppliedDesignState['parts'] {
  const nextParts: AppliedDesignState['parts'] = {
    ...parts,
  }

  for (const targetId of targetIds) {
    const currentPartState = nextParts[targetId] ?? createLayeredSurfaceState()

    nextParts[targetId] = clearChromeDeleteFromSurface(currentPartState)
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
        tintConfig: null,
        tintScope: null,
        chromeDeleteConfig: null,
        chromeDeleteScope: null,
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
    const defaultTintScope =
      action.serviceId === 'tint'
        ? getDefaultTintScope(state.draftSelection.targetId)
        : null
    const tintConfig =
      action.serviceId === 'tint' && defaultTintScope
        ? createTintDraft(state.appliedDesign, state.draftSelection.targetId)
        : null
    const defaultChromeDeleteScope =
      action.serviceId === 'chrome-delete'
        ? getDefaultChromeDeleteScope(state.draftSelection.targetId)
        : null
    const chromeDeleteConfig =
      action.serviceId === 'chrome-delete' && defaultChromeDeleteScope
        ? createChromeDeleteDraft(
            state.appliedDesign,
            state.draftSelection.targetId,
          )
        : null

    return {
      ...state,
      draftSelection: {
        ...state.draftSelection,
        serviceId: action.serviceId,
        wrapConfig,
        tintConfig,
        tintScope: defaultTintScope,
        chromeDeleteConfig,
        chromeDeleteScope: defaultChromeDeleteScope,
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

  if (action.type === 'update-tint-draft') {
    const draftSelection = state.draftSelection

    if (draftSelection?.serviceId !== 'tint') {
      return state
    }

    const currentTint =
      draftSelection.tintConfig ??
      createTintDraft(state.appliedDesign, draftSelection.targetId)

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        tintConfig: updateTintDraft(currentTint, action.patch),
      },
    }
  }

  if (action.type === 'update-tint-scope') {
    const draftSelection = state.draftSelection

    if (draftSelection?.serviceId !== 'tint') {
      return state
    }

    if (
      resolveTintScopeTargetIds(
        draftSelection.targetId,
        action.scope,
      ).length === 0
    ) {
      return state
    }

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        tintScope: action.scope,
      },
    }
  }

  if (action.type === 'update-chrome-delete-draft') {
    const draftSelection = state.draftSelection

    if (draftSelection?.serviceId !== 'chrome-delete') {
      return state
    }

    const currentChromeDelete =
      draftSelection.chromeDeleteConfig ??
      createChromeDeleteDraft(state.appliedDesign, draftSelection.targetId)

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        chromeDeleteConfig: updateChromeDeleteDraft(
          currentChromeDelete,
          action.patch,
        ),
      },
    }
  }

  if (action.type === 'update-chrome-delete-scope') {
    const draftSelection = state.draftSelection

    if (draftSelection?.serviceId !== 'chrome-delete') {
      return state
    }

    if (
      resolveChromeDeleteScopeTargetIds(
        draftSelection.targetId,
        action.scope,
      ).length === 0
    ) {
      return state
    }

    return {
      ...state,
      draftSelection: {
        ...draftSelection,
        chromeDeleteScope: action.scope,
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
        tintConfig: null,
        tintScope: null,
        chromeDeleteConfig: null,
        chromeDeleteScope: null,
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

    if (draftSelection.serviceId === 'tint') {
      if (!draftSelection.tintConfig || !draftSelection.tintScope) {
        return state
      }

      const tintTargetIds = resolveTintScopeTargetIds(
        draftSelection.targetId,
        draftSelection.tintScope,
      )

      if (tintTargetIds.length === 0) {
        return state
      }

      return {
        ...state,
        appliedDesign: {
          ...state.appliedDesign,
          parts: setTintForTargetIds(
            state.appliedDesign.parts,
            tintTargetIds,
            draftSelection.tintConfig,
          ),
        },
        draftSelection: null,
      }
    }

    if (draftSelection.serviceId === 'chrome-delete') {
      if (
        !draftSelection.chromeDeleteConfig ||
        !draftSelection.chromeDeleteScope
      ) {
        return state
      }

      const chromeDeleteTargetIds = resolveChromeDeleteScopeTargetIds(
        draftSelection.targetId,
        draftSelection.chromeDeleteScope,
      )

      if (chromeDeleteTargetIds.length === 0) {
        return state
      }

      return {
        ...state,
        appliedDesign: {
          ...state.appliedDesign,
          parts: setChromeDeleteForTargetIds(
            state.appliedDesign.parts,
            chromeDeleteTargetIds,
            draftSelection.chromeDeleteConfig,
          ),
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

  if (action.type === 'reset-tint') {
    const tintTargetIds = resolveTintScopeTargetIds(
      action.targetId,
      action.scope,
    )

    if (tintTargetIds.length === 0) {
      return state
    }

    return {
      ...state,
      appliedDesign: {
        ...state.appliedDesign,
        parts: clearTintForTargetIds(state.appliedDesign.parts, tintTargetIds),
      },
      draftSelection: null,
    }
  }

  if (action.type === 'reset-chrome-delete') {
    const chromeDeleteTargetIds = resolveChromeDeleteScopeTargetIds(
      action.targetId,
      action.scope,
    )

    if (chromeDeleteTargetIds.length === 0) {
      return state
    }

    return {
      ...state,
      appliedDesign: {
        ...state.appliedDesign,
        parts: clearChromeDeleteForTargetIds(
          state.appliedDesign.parts,
          chromeDeleteTargetIds,
        ),
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
