import { HocuspocusProvider } from '@hocuspocus/provider'
import { EventType, useEventBus } from 'eventbus'

interface AwarenessUser {
  id: string
  name: string
  color: string
}

interface AwarenessFocus {
  tableId?: string
  rowId?: string
  cellId?: string
}

export interface AwarenessState {
  user?: AwarenessUser
  focus?: AwarenessFocus
}

export interface RoomState {
  name: string
  provider: HocuspocusProvider
  connected: boolean
  connecting: boolean
  awarenessStates: AwarenessState[]
  joinedAt: number
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

function getLocalUser(): AwarenessUser | undefined {
  const userJson = localStorage.getItem('docpal-user')
  if (!userJson) return undefined
  try {
    const user = JSON.parse(userJson)
    const id = user.userId || ''
    const name = user.username || user.name || 'Unknown'
    return { id, name, color: getUserColor(id) }
  } catch {
    return undefined
  }
}

function getToken(): string {
  return localStorage.getItem('access_token') || ''
}

export function useHocuspocusManager() {
  const config = useRuntimeConfig()
  const hocuspocusUrl = computed(() => (config.public.HOCUSPOCUS_URL as string | undefined) || 'ws://localhost:1234')

  // Store serializable room metadata in useState; provider instances live in a module-level WeakMap
  const roomMeta = useState<Record<string, Omit<RoomState, 'provider'>>>('hocuspocus-rooms', () => ({}))
  const providers = new Map<string, HocuspocusProvider>()

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
    emitBus(EventType.HOCUSPOCUS_ROOM_DISCONNECTED, { roomName })
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
    emitBus(EventType.HOCUSPOCUS_ROOM_EVICTED, { roomName: oldest.name })
  }

  function joinRoom(roomName: string) {
    const url = hocuspocusUrl.value
    if (!url) {
      console.warn('[hocuspocus] No HOCUSPOCUS_URL configured')
      return
    }

    if (roomMeta.value[roomName]) {
      // Already joined
      return
    }

    // FIFO eviction
    if (Object.keys(roomMeta.value).length >= MAX_CONCURRENT_ROOMS) {
      evictOldestRoom()
    }

    const joinedAt = Date.now()

    const provider = new HocuspocusProvider({
      url,
      name: roomName,
      token: getToken(),
      connect: true,
      onAuthenticated: () => {
        if (roomMeta.value[roomName]) {
          roomMeta.value[roomName].connected = true
          roomMeta.value[roomName].connecting = false
        }
        emitBus(EventType.HOCUSPOCUS_ROOM_CONNECTED, { roomName })
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
        emitBus(EventType.HOCUSPOCUS_ROOM_DISCONNECTED, { roomName })
      }
    })

    provider.on('awareness', () => {
      const states: AwarenessState[] = []
      const localUser = getLocalUser()
      provider.awareness.getStates().forEach((state: any) => {
        if (state.user && state.user.id !== localUser?.id) {
          states.push(state as AwarenessState)
        }
      })
      if (roomMeta.value[roomName]) {
        roomMeta.value[roomName].awarenessStates = states
      }
      emitBus(EventType.HOCUSPOCUS_AWARENESS_UPDATE, { roomName, states })
    })

    providers.set(roomName, provider)
    roomMeta.value[roomName] = {
      name: roomName,
      connected: false,
      connecting: true,
      awarenessStates: [],
      joinedAt
    }
  }

  function setFocus(roomName: string, focus: AwarenessFocus) {
    const provider = providers.get(roomName)
    const localUser = getLocalUser()
    if (!provider || !localUser) return
    provider.awareness.setLocalState({
      user: localUser,
      focus
    })
  }

  function clearFocus(roomName: string) {
    const provider = providers.get(roomName)
    const localUser = getLocalUser()
    if (!provider || !localUser) return
    provider.awareness.setLocalState({
      user: localUser,
      focus: undefined
    })
  }

  return {
    rooms: readonly(rooms),
    joinRoom,
    leaveRoom,
    leaveAllRooms,
    getRoomState,
    setFocus,
    clearFocus,
    isConnected
  }
}

function emitBus(key: EventType, payload?: any) {
  const bus = useEventBus(key)
  bus.emit(payload)
}
