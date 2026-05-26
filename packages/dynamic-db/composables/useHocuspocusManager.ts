import { HocuspocusProvider } from '@hocuspocus/provider'
import * as Y from 'yjs'

interface AwarenessUser {
  id: string
  name: string
  color: string
}

export interface AwarenessFocus {
  menuId?: string
  rowId?: string | null
  cellId?: string | null
  editingCell?: boolean
  editingRow?: boolean
  editingColumn?: boolean
  status?: 'editing' | 'saved'
}

export interface AwarenessChange {
  id: string
  type: 'row_updated' | 'row_created' | 'row_deleted' | 'rows_deleted' | 'column_config_updated'
  rowId?: string
  rowIds?: string[]
  fieldId?: string
  fieldName?: string
  viewId?: string
  tableId: string
  menuId: string
  timestamp: number
  userId: string
}

export interface AwarenessState {
  user?: AwarenessUser
  focus?: AwarenessFocus
  changes?: AwarenessChange[]
}

export interface UpdatedRow {
  userId: string
  userName: string
  userColor: string
  rowId: string
  cellId?: string
  menuId?: string
}

export interface RemoteChangeEvent {
  change: AwarenessChange
  userName: string
  userColor: string
}

export interface RoomState {
  name: string
  provider: HocuspocusProvider
  connected: boolean
  connecting: boolean
  awarenessStates: AwarenessState[]
  joinedAt: number
  updatedRows: UpdatedRow[]
  remoteChanges: RemoteChangeEvent[]
}

export interface LockRecord {
  roomName: string
  userId: string
  userName: string
  userColor: string
  rowId?: string | null
  cellId?: string | null
  menuId?: string
  editingCell?: boolean,
  editingRow?: boolean
  editingColumn?: boolean
}

const MAX_CONCURRENT_ROOMS = 3

const COLOR_PALETTE = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16',
  '#10b981', '#06b6d4', '#3b82f6', '#6366f1',
  '#8b5cf6', '#d946ef', '#f43f5e', '#78716c'
]

function getUserColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % COLOR_PALETTE.length
  return COLOR_PALETTE[index]
}

function getSessionAwarenessId(): string {
  const key = 'hocuspocus-awareness-id'
  let id = sessionStorage.getItem(key)
  if (!id) {
    id = Math.random().toString(36).slice(2, 8)
    sessionStorage.setItem(key, id)
  }
  return id
}

export { getSessionAwarenessId }

function getLocalUser(): AwarenessUser | undefined {
  const userJson = localStorage.getItem('docpal-user')
  if (!userJson) return undefined
  try {
    const user = JSON.parse(userJson)
    const realUserId = user.userId || ''
    const id = getSessionAwarenessId()
    const name = user.username || user.name || 'Unknown'
    return { id, name, color: getUserColor(realUserId) }
  } catch {
    return undefined
  }
}

function getToken(): string {
  return localStorage.getItem('access_token') || ''
}

export function useAwarenessDiff(states: Ref<AwarenessState[]>) {
  const previous = ref<AwarenessState[]>([])

  const diff = computed(() => {
    const curr = states.value
    const prev = previous.value

    const prevCells = new Map(prev.map(s => [`${s.user?.id}:${s.focus?.rowId}:${s.focus?.cellId}`, s]))
    const currCells = new Map(curr.map(s => [`${s.user?.id}:${s.focus?.rowId}:${s.focus?.cellId}`, s]))

    const added: AwarenessState[] = []
    const removed: AwarenessState[] = []

    for (const [key, state] of currCells) {
      if (!prevCells.has(key)) {
        added.push(state)
      }
    }

    for (const [key, state] of prevCells) {
      if (!currCells.has(key)) {
        removed.push(state)
      }
    }

    return { added, removed }
  })

  watch(states, (newVal) => {
    previous.value = JSON.parse(JSON.stringify(newVal))
  }, { flush: 'post' })

  return { previous, diff }
}

export function useHocuspocusManager() {
  const config = useRuntimeConfig()
  const hocuspocusUrl = computed(() => (config.public.HOCUSPOCUS_URL as string | undefined) || 'ws://localhost:1234')

  const roomMeta = useState<Record<string, Omit<RoomState, 'provider'>>>('hocuspocus-rooms', () => ({}))
  const lockRecords = useState<LockRecord[]>('hocuspocus-locks', () => [])
  const providers = new Map<string, HocuspocusProvider>()
  const localAwareness = useState<any>('hocuspocus-local')
  const rooms = computed<RoomState[]>(() => {
    return Object.values(roomMeta.value).map((meta) => {
      const provider = providers.get(meta.name)
      return {
        ...meta,
        provider: provider!
      } as RoomState
    })
  })

  function getRoomState(roomName: string): RoomState | undefined {
    const meta = roomMeta.value[roomName]
    const provider = providers.get(roomName)
    if (!meta || !provider) return undefined
    return { ...meta, provider }
  }

  function isConnected(roomName: string): boolean {
    return roomMeta.value[roomName]?.connected ?? false
  }

  function leaveRoom(roomName: string) {
    const provider = providers.get(roomName)
    if (provider) {
      provider.destroy()
      providers.delete(roomName)
    }
    delete roomMeta.value[roomName]
  }

  function leaveAllRooms() {
    const names = Object.keys(roomMeta.value)
    names.forEach(leaveRoom)
  }

  function evictOldestRoom() {
    const entries = Object.values(roomMeta.value)
    if (entries.length === 0) return
    const oldest = entries.reduce((a, b) => (a.joinedAt < b.joinedAt ? a : b))
    leaveRoom(oldest.name)
  }

  function joinRoom(roomName: string) {
    const url = hocuspocusUrl.value
    if (!url) {
      console.warn('[hocuspocus] No HOCUSPOCUS_URL configured')
      return
    }

    if (roomMeta.value[roomName]) {
      return
    }

    if (Object.keys(roomMeta.value).length >= MAX_CONCURRENT_ROOMS) {
      evictOldestRoom()
    }

    const joinedAt = Date.now()
    const ydoc = new Y.Doc()
    const provider = new HocuspocusProvider({
      url,
      name: roomName,
      token: getToken(),
      document: ydoc,
      onAuthenticated: () => {
        if (roomMeta.value[roomName]) {
          roomMeta.value[roomName].connected = true
          roomMeta.value[roomName].connecting = false
        }
        const localUser = getLocalUser()
        if (localUser) {
          provider.awareness?.setLocalStateField('user', localUser)
        }
      },
      onAuthenticationFailed: () => {
        if (roomMeta.value[roomName]) {
          roomMeta.value[roomName].connected = false
          roomMeta.value[roomName].connecting = false
        }
      },
      onClose: () => {
        if (roomMeta.value[roomName]) {
          roomMeta.value[roomName].connected = false
        }
      },
      onAwarenessChange: (e) => {
        const localUser = getLocalUser()
        const awarenessStates: AwarenessState[] = []
        const newLocks: LockRecord[] = []
        const currentStates = new Map<string, any>()

        const newRemoteChanges: RemoteChangeEvent[] = []

        e.states.forEach((state: any) => {
          if (state.user) {
            currentStates.set(state.user.id, state)
          }
          if (state.user && state.user.id !== localUser?.id) {
            awarenessStates.push(state as AwarenessState)
            if (state.focus && (state.focus.editingCell || state.focus.editingRow || state.focus.editingColumn)) {
              newLocks.push({
                roomName,
                userId: state.user.id,
                userName: state.user.name,
                userColor: state.user.color,
                rowId: state.focus.rowId,
                cellId: state.focus.cellId,
                menuId: state.focus.menuId,
                editingCell: state.focus.editingCell,
                editingRow: state.focus.editingRow,
                editingColumn: state.focus.editingColumn
              })
            }
            for (const change of state.changes || []) {
              if (processedChangeIds.has(change.id)) continue
              processedChangeIds.add(change.id)
              newRemoteChanges.push({
                change,
                userName: state.user.name,
                userColor: state.user.color
              })
            }
          } else {
            if(state.user) localAwareness.value = state
          }
        })

        // Detect editing -> saved transitions
        const newlySaved: UpdatedRow[] = []
        for (const [userId, current] of currentStates) {
          if (userId === localUser?.id) continue
          const previous = previousStates.get(userId)
          const transitioned = previous?.focus?.status === 'editing' && current.focus?.status === 'saved'
          const key = `${userId}:${current.focus?.rowId}`
          if (current.focus?.rowId && transitioned && !doneRows.has(key)) {
            doneRows.add(key)
            newlySaved.push({
              userId: current.user.id,
              userName: current.user.name,
              userColor: current.user.color,
              rowId: current.focus.rowId,
              cellId: current.focus.cellId,
              menuId: current.focus.menuId
            })
          }
        }

        // Cleanup doneRows for users no longer in 'saved' status
        for (const key of doneRows) {
          const [uid] = key.split(':')
          const state = currentStates.get(uid)
          if (!state || state.focus?.status !== 'saved') {
            doneRows.delete(key)
          }
        }

        previousStates.clear()
        for (const [k, v] of currentStates) previousStates.set(k, v)

        if (roomMeta.value[roomName]) {
          roomMeta.value[roomName].awarenessStates = awarenessStates
          roomMeta.value[roomName].updatedRows = newlySaved
          if (newRemoteChanges.length > 0) {
            roomMeta.value[roomName].remoteChanges = newRemoteChanges
          }
        }
        // Update lockRecords: remove old locks for this room, add new ones
        lockRecords.value = [
          ...lockRecords.value.filter((l) => l.roomName !== roomName),
          ...newLocks
        ]
      }
    })

    providers.set(roomName, provider)
    const previousStates = new Map<string, any>()
    const doneRows = new Set<string>()
    const processedChangeIds = new Set<string>()

    roomMeta.value[roomName] = {
      name: roomName,
      connected: false,
      connecting: true,
      awarenessStates: [],
      joinedAt,
      updatedRows: [],
      remoteChanges: []
    }
  }

  function setFocus(roomName: string, focus: Partial<AwarenessFocus>) {
    const provider = providers.get(roomName)
    if (!provider?.awareness) return
    const current = (provider.awareness.getLocalState() as any)?.focus || {}
    provider.awareness.setLocalStateField('focus', { ...current, ...focus })
  }

  function clearFocus(roomName: string) {
    const provider = providers.get(roomName)
    if (!provider?.awareness) return
    provider.awareness.setLocalStateField('focus', undefined)
  }

  function broadcastChanges(roomName: string, changes: AwarenessChange[]) {
    const provider = providers.get(roomName)
    if (!provider?.awareness) return
    provider.awareness.setLocalStateField('changes', changes)
    // setTimeout(() => {
    //   provider.awareness.setLocalStateField('changes', undefined)
    // }, 3000)
  }

  return {
    rooms: readonly(rooms),
    roomMeta,
    lockRecords,
    localAwareness,
    joinRoom,
    leaveRoom,
    leaveAllRooms,
    getRoomState,
    setFocus,
    clearFocus,
    broadcastChanges,
    isConnected
  }
}
