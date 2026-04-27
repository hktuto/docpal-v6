<script setup lang="ts">
import { ElMessage } from 'element-plus'

const workflowState = reactive({
  loading: false,
  workflows: [] as any[]
})

function handleAddWorkflow() {
  ElMessage.info('Add workflow coming soon')
}

function handleRemoveWorkflow(workflow: any) {
  const index = workflowState.workflows.indexOf(workflow)
  if (index > -1) {
    workflowState.workflows.splice(index, 1)
  }
}

function handleOpenWorkflow(workflow: any) {
  ElMessage.info(`Open workflow: ${workflow.name}`)
}

onMounted(() => {
  // TODO: Load linked workflows from database
  workflowState.workflows = [
    { id: '1', name: 'Approval Workflow', status: 'active' },
    { id: '2', name: 'Notification Workflow', status: 'active' }
  ]
})
</script>

<template>
  <el-card class="setting-section" v-loading="workflowState.loading">
    <template #header>
      <div class="card-header">
        <h3>Automation</h3>
        <el-button type="primary" size="small" @click="handleAddWorkflow">
          Add Workflow
        </el-button>
      </div>
    </template>
    
    <div class="description">
      Manage workflows linked to this table
    </div>

    <div class="workflow-list">
      <el-empty v-if="workflowState.workflows.length === 0" description="No workflows linked" />
      <div v-else class="workflow-items">
        <div 
          v-for="workflow in workflowState.workflows" 
          :key="workflow.id"
          class="workflow-item"
        >
          <div class="workflow-info">
            <Icon name="lucide:workflow" />
            <div class="workflow-details">
              <span class="workflow-name">{{ workflow.name }}</span>
              <span class="workflow-status" :class="workflow.status">{{ workflow.status }}</span>
            </div>
          </div>
          <div class="workflow-actions">
            <el-button size="small" @click="handleOpenWorkflow(workflow)">
              Open
            </el-button>
            <el-button size="small" @click="handleRemoveWorkflow(workflow)">
              Remove
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<style lang="scss" scoped>
.setting-section {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    h3 {
      margin: 0;
      font-size: var(--app-font-size-l);
      font-weight: 600;
    }
  }

  .description {
    color: var(--app-grey-500);
    font-size: var(--app-font-size-s);
    margin-bottom: var(--app-space-m);
  }
}

.workflow-list {
  margin-top: var(--app-space-m);
}

.workflow-items {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
}

.workflow-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--app-space-m);
  border: 1px solid var(--app-grey-200);
  border-radius: var(--app-border-radius);
  transition: all 0.2s;

  &:hover {
    border-color: var(--app-primary-color);
    background: var(--app-grey-50);
  }

  .workflow-info {
    display: flex;
    align-items: center;
    gap: var(--app-space-m);

    .workflow-details {
      display: flex;
      flex-direction: column;
      gap: var(--app-space-xs);

      .workflow-name {
        font-weight: 500;
      }

      .workflow-status {
        font-size: var(--app-font-size-s);
        color: var(--app-grey-500);

        &.active {
          color: var(--el-color-success);
        }

        &.inactive {
          color: var(--app-grey-400);
        }
      }
    }
  }

  .workflow-actions {
    display: flex;
    gap: var(--app-space-xs);
  }
}
</style>
