<template>
  <div class="info" v-if="taskDetail">
    <div class="infoContainer">
      <div class="label">{{ $t('workflow_jobName') }}</div>
      <div class="value">
        {{ taskDetail.businessKey || taskDetail.processDefinitionName }}
      </div>
    </div>

    <div class="infoContainer">
      <div class="label">{{ $t('workflow_taskName') }}</div>
      <div class="value">
        {{ taskDetail.processDefinitionName }}
      </div>
    </div>

    <div class="infoContainer">
      <div class="label">{{ $t('workflow_startTime') }}</div>
      <div class="value">
        {{ formatDate(taskDetail.startTime) }}
      </div>
    </div>
    <div class="infoContainer" v-if="state === 'completeTask'">
      <div class="label">{{ $t('tableHeader_completeDate') }}</div>
      <div class="value">
        {{ formatDate(taskDetail.endTime) }}
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
const props = defineProps<{
  taskDetail: any,
  state: string
}>()
</script>
<style lang="scss" scoped>
.info {
  display: flex;
  flex-flow: column nowrap;
  min-width: 180px;
  height: 100%;
  justify-content: flex-start;
  align-items: flex-start;
  align-content: flex-start;
  @media (max-width: 640px) {
    flex-flow: row wrap;
    gap: calc(var(--app-space-xs) * 2);
    .f-g {
      flex: 1 0 100%;
    }
  }
}

.infoContainer {
  margin-bottom: var(--app-space-xs);
}

.label {
  line-height: 1.5rem;
  font-size: 0.7rem;
  color: var(--app-grey-400);
}

.value {
  font-size: 1rem;
}
</style>
