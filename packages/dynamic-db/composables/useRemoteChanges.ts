import { computed } from 'vue'
import type { AwarenessChange } from './useHocuspocusManager'
import { useHocuspocusManager } from './useHocuspocusManager'

export interface RemoteChangeEvent {
  change: AwarenessChange
  userName: string
  userColor: string
}

export function useRemoteChanges(roomName: string) {
  const manager = useHocuspocusManager()
  const processedIds = new Set<string>()

  const remoteChanges = computed<RemoteChangeEvent[]>(() => {
    const room = manager.getRoomState(roomName)
    if (!room) return []

    const events: RemoteChangeEvent[] = []
    for (const state of room.awarenessStates) {
      for (const change of state.changes || []) {
        if (processedIds.has(change.id)) continue
        processedIds.add(change.id)
        events.push({
          change,
          userName: state.user?.name || 'Unknown',
          userColor: state.user?.color || '#999'
        })
      }
    }
    return events
  })

  return { remoteChanges }
}
