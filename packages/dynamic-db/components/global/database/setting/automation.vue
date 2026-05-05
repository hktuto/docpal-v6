<script setup lang="ts">
import type { TriggerSettingDTO } from 'api'
import TriggerList from './automation/TriggerList.vue'
import TriggerForm from './automation/TriggerForm.vue'
import TriggerTest from './automation/TriggerTest.vue'

const props = defineProps<{
  masterTableId: string
}>()

type ViewMode = 'list' | 'form' | 'test'

const viewMode = ref<ViewMode>('list')
const selectedTrigger = ref<TriggerSettingDTO | undefined>(undefined)
const listRef = ref<InstanceType<typeof TriggerList> | null>(null)

function handleAdd() {
  selectedTrigger.value = undefined
  viewMode.value = 'form'
}

function handleEdit(trigger: TriggerSettingDTO) {
  selectedTrigger.value = trigger
  viewMode.value = 'form'
}

function handleTest(trigger: TriggerSettingDTO) {
  selectedTrigger.value = trigger
  viewMode.value = 'test'
}

function handleSaved() {
  viewMode.value = 'list'
  nextTick(() => {
    listRef.value?.reload()
  })
}

function handleCancel() {
  viewMode.value = 'list'
}

function handleBack() {
  viewMode.value = 'list'
}
</script>

<template>
  <div class="automation-root">
    <Transition name="fade" mode="out-in">
      <TriggerList
        v-if="viewMode === 'list'"
        ref="listRef"
        :master-table-id="masterTableId"
        @add="handleAdd"
        @edit="handleEdit"
        @test="handleTest"
      />

      <TriggerForm
        v-else-if="viewMode === 'form'"
        :master-table-id="masterTableId"
        :trigger="selectedTrigger"
        @saved="handleSaved"
        @cancel="handleCancel"
      />

      <TriggerTest
        v-else-if="viewMode === 'test' && selectedTrigger"
        :master-table-id="masterTableId"
        :trigger="selectedTrigger"
        @back="handleBack"
      />
    </Transition>
  </div>
</template>

<style lang="scss" scoped>
.automation-root {
  height: 100%;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
