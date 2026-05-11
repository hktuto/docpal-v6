import { HocuspocusProvider } from '@hocuspocus/provider'

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

interface AwarenessState {
  user?: AwarenessUser
  focus?: AwarenessFocus
}

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

export function useHocuspocusAwareness(databaseId: MaybeRef<string>) {
  const config = useRuntimeConfig()
  const hocuspocusUrl = computed(() => config.public.HOCUSPOCUS_URL as string | undefined)

  const userState = useUserState()
  const token = computed(() => localStorage.getItem('access_token') || '')

  const provider = shallowRef<HocuspocusProvider | null>(null)
  const awarenessStates = ref<AwarenessState[]>([])
  const connected = ref(false)
  const connecting = ref(false)

  const localUser = computed<AwarenessUser | undefined>(() => {
    const user = userState.value
    if (!user) return undefined
    const id = user.userId || ''
    const name = user.username || user.name || 'Unknown'
    return { id, name, color: getUserColor(id) }
  })

  function initProvider() {
    const dbId = unref(databaseId)
    const url = hocuspocusUrl.value
    if (!dbId || !url || provider.value) return

    connecting.value = true

    const p = new HocuspocusProvider({
      url,
      name: `dynamic-db:${dbId}`,
      token: token.value,
      connect: true,
      onAuthenticated: () => {
        connected.value = true
        connecting.value = false
      },
      onAuthenticationFailed: () => {
        connected.value = false
        connecting.value = false
        console.warn('[hocuspocus] Authentication failed')
      },
      onClose: () => {
        connected.value = false
      }
    })

    p.on('awareness', () => {
      const states: AwarenessState[] = []
      p.awareness.getStates().forEach((state: any) => {
        if (state.user && state.user.id !== localUser.value?.id) {
          states.push(state as AwarenessState)
        }
      })
      awarenessStates.value = states
    })

    provider.value = p
  }

  function destroyProvider() {
    if (provider.value) {
      provider.value.destroy()
      provider.value = null
      connected.value = false
      awarenessStates.value = []
    }
  }

  function setFocus(focus: AwarenessFocus) {
    const p = provider.value
    if (!p || !localUser.value) return
    p.awareness.setLocalState({
      user: localUser.value,
      focus
    })
  }

  function clearFocus() {
    const p = provider.value
    if (!p || !localUser.value) return
    p.awareness.setLocalState({
      user: localUser.value,
      focus: undefined
    })
  }

  watch(
    () => unref(databaseId),
    (newId, oldId) => {
      if (newId && newId !== oldId) {
        destroyProvider()
        initProvider()
      }
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    destroyProvider()
  })

  return {
    provider: readonly(provider),
    awarenessStates: readonly(awarenessStates),
    connected: readonly(connected),
    connecting: readonly(connecting),
    setFocus,
    clearFocus
  }
}
