<script setup lang="ts">
import { clientApi } from 'api'
import type { TriggerSettingDTO } from 'api'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps<{
  masterTableId: string
}>()

const emit = defineEmits<{
  add: []
  edit: [trigger: TriggerSettingDTO]
  test: []
  delete: [trigger: TriggerSettingDTO]
}>()

const state = reactive({
  loading: false,
  triggers: [] as TriggerSettingDTO[]
})

const eventTypeLabel = computed(() => {
  const map: Record<string, string> = {
    record_created: 'Record Created',
    record_updated: 'Record Updated',
    record_deleted: 'Record Deleted',
    field_changed: 'Field Changed'
  }
  return (type?: string) => (type ? map[type] || type : '-')
})

async function handleLoadTriggers() {
  state.loading = true
  try {
    const { data } = await clientApi.api.postDynamicDbTableMastertableidTriggerSettingsPage(props.masterTableId, {
      pageNum: 0,
      pageSize: 200
    })
    state.triggers = data?.entryList || []
  } catch (error) {
    ElMessage.error('Failed to load triggers')
  } finally {
    state.loading = false
  }
}

function handleAdd() {
  emit('add')
}

function handleEdit(trigger: TriggerSettingDTO) {
  emit('edit', trigger)
}

function handleTest() {
  emit('test')
}

async function handleDelete(trigger: TriggerSettingDTO) {
  if (!trigger.id) return
  try {
    await ElMessageBox.confirm('Are you sure you want to delete this trigger?', 'Confirm', {
      type: 'warning'
    })
    const { data } = await clientApi.api.deleteDynamicDbTableMastertableidTriggerSettingsId(props.masterTableId, trigger.id)
    if (data?.result !== false) {
      ElMessage.success('Trigger deleted')
      await handleLoadTriggers()
      emit('delete', trigger)
    } else {
      ElMessage.error(data?.message || 'Delete failed')
    }
  } catch (error) {
    // cancelled
  }
}

onMounted(() => {
  handleLoadTriggers()
})

defineExpose({
  reload: handleLoadTriggers
})
</script>

<template>
  <div v-loading="state.loading">
    <div class="list-header">
      <h4>Triggers</h4>
      <div>
        <el-button type="success" size="small" @click="handleTest">Test</el-button>
        <el-button type="primary" size="small" @click="handleAdd">Add Trigger</el-button>
      </div>
    </div>

    <el-empty v-if="state.triggers.length === 0" description="No triggers configured" />

    <div v-else class="trigger-list">
      <div v-for="trigger in state.triggers" :key="trigger.id" class="trigger-item">
        <div class="trigger-info">
          <div class="trigger-main">
            <span class="trigger-name">{{ trigger.trigger_name }}</span>
          </div>
          <div class="trigger-meta">
            <el-tag size="small" :type="trigger.status === 'A' ? 'success' : 'info'">
              {{ trigger.status === 'A' ? 'Active' : 'Inactive' }}
            </el-tag>
          </div>
        </div>
        <div class="trigger-actions">
          <el-button size="small" @click="handleEdit(trigger)"> Edit </el-button>
          <el-button size="small" type="danger" plain @click="handleDelete(trigger)"> Delete </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--app-space-m);

  h4 {
    margin: 0;
    font-size: var(--app-font-size-m);
    font-weight: 600;
  }
}

.trigger-list {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
}

.trigger-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--app-space-m);
  border: 1px solid var(--app-grey-800);
  border-radius: var(--app-border-radius-s);
  transition: all 0.2s;

  &:hover {
    border-color: var(--app-primary-color);
    background: var(--app-grey-950);
  }

  .trigger-info {
    display: flex;
    flex-direction: column;
    gap: var(--app-space-xs);

    .trigger-main {
      display: flex;
      align-items: center;
      gap: var(--app-space-s);

      .trigger-name {
        font-weight: 500;
      }
    }

    .trigger-meta {
      font-size: var(--app-font-size-s);
      color: var(--app-grey-9500);
    }
  }

  .trigger-actions {
    display: flex;
    gap: var(--app-space-xs);
    flex-shrink: 0;
  }
}
</style>
