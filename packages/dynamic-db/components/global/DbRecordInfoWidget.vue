<template>
  <DashboardCard :title="displayLabel" :hide-setting="hideSetting" :setting="setting" @delete="handleDelete">
    <div class="db-record-info-widget">
      <div class="record-id">
        <span class="record-id__label">{{ t('dashboard.recordId') }}:</span>
        <span class="record-id__value">{{ recordId }}</span>
      </div>
    </div>
  </DashboardCard>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    setting?: Record<string, any>
    hideSetting?: boolean
  }>(),
  {
    setting: () => ({}),
    hideSetting: false
  }
)

const emit = defineEmits(['delete'])

const { t } = useI18n()

const displayLabel = computed(() => props.setting?.label || t('dashboard.DbRecordInfo'))
const recordId = computed(() => props.setting?.recordId || '-')

function handleDelete() {
  emit('delete')
}

defineExpose({
  resize: () => {}
})
</script>

<style scoped lang="scss">
.db-record-info-widget {
  padding: var(--app-space-xs);
}

.record-id {
  font-size: var(--app-font-size-m);

  &__label {
    color: var(--app-text-color-secondary);
    margin-right: var(--app-space-xxs);
  }

  &__value {
    font-weight: 600;
  }
}
</style>
