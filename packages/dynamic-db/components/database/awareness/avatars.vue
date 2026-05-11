<script setup lang="ts">
import { useSingleDatabaseContext } from '../../../composables/useSignleDatabase'
import type { AwarenessState } from '../../../composables/useHocuspocusManager'

interface HocuspocusInject {
  awarenessStates: ComputedRef<AwarenessState[]>
  localAwareness?: ComputedRef<any>
}

const { databaseMenuRouteParams } = useSingleDatabaseContext()
const hocuspocus = inject<HocuspocusInject>('databaseHocuspocus', {
  awarenessStates: computed(() => [])
})

const filteredStates = computed(() => {
  const detailId = databaseMenuRouteParams.value.detailId
  if (!hocuspocus.awarenessStates.value) return []
  if(!detailId) return hocuspocus.awarenessStates.value.filter(
    (s) => s.focus?.menuId
  )
  return hocuspocus.awarenessStates.value.filter(
    (s) => s.focus?.menuId === detailId
  )
})
</script>

<template>
  <div v-if="filteredStates.length > 0" class="awareness-avatars">
    <el-tooltip
      v-for="(state, idx) in filteredStates.slice(0, 5)"
      :key="state.user?.id || idx"
      :content="state.user?.name || 'Unknown'"
      placement="bottom"
    >
      <div
        class="awareness-avatar"
        :style="{ backgroundColor: state.user?.color || '#999' }"
      >
        {{ (state.user?.name || '?').charAt(0).toUpperCase() }}
      </div>
    </el-tooltip>
    <div v-if="filteredStates.length > 5" class="awareness-avatar awareness-avatar--more">
      +{{ filteredStates.length - 5 }}
    </div>
  </div>
  <div v-else>
      {{hocuspocus.awarenessStates.value}}
  </div>
</template>

<style scoped lang="scss">
.awareness-avatars {
  display: flex;
  align-items: center;
  gap: var(--app-space-xxs);
  margin-right: var(--app-space-s);
}

.awareness-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: white;
  border: 2px solid var(--app-paper);
  margin-left: -6px;

  &:first-child {
    margin-left: 0;
  }

  &--more {
    background-color: var(--app-grey-600);
  }
}
</style>
