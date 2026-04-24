<script lang="ts" setup>
import type { Database } from '../../../types/database'
import DatabaseList from '../../database/DatabaseList.vue'
import DatabaseDetail from '../../database/DatabaseDetail.vue'

// Props passed from menu router
defineProps<{
  id?: string
}>()

// Current view state
const currentView = ref<'list' | 'detail'>('list')
const selectedDatabase = ref<Database | null>(null)

function handleSelectDatabase(db: Database) {
  selectedDatabase.value = db
  currentView.value = 'detail'
}

function handleBack() {
  currentView.value = 'list'
  selectedDatabase.value = null
}
</script>

<template>
  <div class="database-page">
    <Transition name="fade" mode="out-in">
      <DatabaseList
        v-if="currentView === 'list'"
        key="list"
        @select="handleSelectDatabase"
      />
      <DatabaseDetail
        v-else-if="currentView === 'detail' && selectedDatabase"
        key="detail"
        :database="selectedDatabase"
        @back="handleBack"
      />
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.database-page {
  height: 100%;
  width: 100%;
  background: var(--app-bg-color-page);
  overflow: hidden;
}

// Transition styles
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
