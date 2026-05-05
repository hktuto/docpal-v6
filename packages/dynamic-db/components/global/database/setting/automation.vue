<script setup lang="ts">
import type { TriggerSettingDTO } from 'api'
import TriggerList from './automation/TriggerList.vue'
import TriggerForm from './automation/TriggerForm.vue'
import TriggerTest from './automation/TriggerTest.vue'

const props = defineProps<{
  masterTableId: string
}>()

type DrawerMode = 'form' | 'test' | null

const drawerMode = ref<DrawerMode>(null)
const selectedTrigger = ref<TriggerSettingDTO | undefined>(undefined)
const listRef = ref<InstanceType<typeof TriggerList> | null>(null)

const drawerVisible = computed({
  get: () => drawerMode.value !== null,
  set: (val) => {
    if (!val) drawerMode.value = null
  }
})

const drawerTitle = computed(() => {
  if (drawerMode.value === 'form') {
    return selectedTrigger.value ? 'Edit Trigger' : 'Add Trigger'
  }
  if (drawerMode.value === 'test') {
    return 'Test Trigger'
  }
  return ''
})

function handleAdd() {
  selectedTrigger.value = undefined
  drawerMode.value = 'form'
}

function handleEdit(trigger: TriggerSettingDTO) {
  selectedTrigger.value = trigger
  drawerMode.value = 'form'
}

function handleTest(trigger: TriggerSettingDTO) {
  selectedTrigger.value = trigger
  drawerMode.value = 'test'
}

function handleSaved() {
  drawerVisible.value = false
  nextTick(() => {
    listRef.value?.reload()
  })
}

function handleCancel() {
  drawerVisible.value = false
}

function handleBack() {
  drawerVisible.value = false
}
</script>

<template>
  <div class="automation-root">
    <TriggerList
      ref="listRef"
      :master-table-id="masterTableId"
      @add="handleAdd"
      @edit="handleEdit"
      @test="handleTest"
    />

    <el-drawer
      v-model="drawerVisible"
      :title="drawerTitle"
      size="520px"
      :destroy-on-close="true"
      :append-to-body="true"
    >
      <TriggerForm
        v-if="drawerMode === 'form'"
        :master-table-id="masterTableId"
        :trigger="selectedTrigger"
        @saved="handleSaved"
        @cancel="handleCancel"
      />

      <TriggerTest
        v-else-if="drawerMode === 'test' && selectedTrigger"
        :master-table-id="masterTableId"
        :trigger="selectedTrigger"
        @back="handleBack"
      />
    </el-drawer>
  </div>
</template>

<style lang="scss" scoped>
.automation-root {
  height: 100%;
}
</style>
