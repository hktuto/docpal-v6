<template>
  <div class="git-status-card">
    <div class="git-status-card-header">
      <h3 class="git-status-card-title">{{ $t('workflowWarehouse.gitStatus') }}</h3>
      <p v-if="selectedInvoice?.gitStatus || selectedInvoice?.git_status" class="git-status-card-badge">
        {{ selectedInvoice.gitStatus || selectedInvoice.git_status }}
      </p>
    </div>

    <div class="git-status-card-row">
      <span class="git-status-card-label">{{ $t('workflowWarehouse.groupId') }}</span>
      <div class="git-status-card-value">
        <span :title="groupIdText || '—'">{{ groupIdText || '—' }}</span>
        <el-button
          v-if="groupIdText"
          link
          type="primary"
          :icon="CopyDocument"
          :aria-label="$t('common_copy')"
          @click="handleCopy"
        />
      </div>
    </div>

    <el-button
      class="git-status-card-action"
      type="primary"
      plain
      :loading="loading"
      :disabled="disabled || !selectedInvoice || !allMatched"
      :aria-label="$t('workflowWarehouse.getGroupId')"
      @click="handleGetGroupId"
    >
      {{ $t('workflowWarehouse.getGroupId') }}
    </el-button>
  </div>
</template>

<script setup lang="ts">
import { CopyDocument } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useInvoiceVerifyInject } from '../../../composables/useInvoiceVerify'
import { useInvoiceVerifyTableInject } from '../../../composables/useInvoiceVerifyTable'

const { t } = useI18n()
const { selectedInvoice, disabled } = useInvoiceVerifyInject()
const { fetchGroupId, statusCounts, tableData } = useInvoiceVerifyTableInject()
const loading = ref(false)

const allMatched = computed(() => tableData.value.length > 0 && statusCounts.value.ok === statusCounts.value.all)
const groupIdText = computed(() => selectedInvoice.value?.groupId || selectedInvoice.value?.group_id || '')

async function handleGetGroupId() {
  if (!selectedInvoice.value) return
  if (!allMatched.value) {
    ElMessage.warning(
      t('workflowWarehouse.pleaseMatchAllLines', {
        name: selectedInvoice.value.invoiceNum || selectedInvoice.value.invoice_num || ''
      })
    )
    return
  }
  loading.value = true
  try {
    const groupId = await fetchGroupId()
    if (groupId) {
      ElMessage.success(t('workflowWarehouse.getGroupIdSuccess'))
    }
  } catch (error) {
    console.error(error)
    ElMessage.error(String((error as any)?.message || t('common_fetchFail')))
  } finally {
    loading.value = false
  }
}

async function handleCopy() {
  if (!groupIdText.value) return
  try {
    await navigator.clipboard.writeText(String(groupIdText.value))
    ElMessage.success(t('common_copySuccess'))
  } catch (error) {
    console.error(error)
  }
}
</script>

<style scoped lang="scss">
.git-status-card {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-m);
  width: 100%;
  padding: var(--app-space-m);
  border-radius: var(--app-border-radius-m);
  background-color: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
}

.git-status-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-s);
}

.git-status-card-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}

.git-status-card-badge {
  margin: 0;
  padding: 2px 8px;
  border-radius: var(--app-border-radius-s);
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 0.75rem;
  font-weight: 700;
}

.git-status-card-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-s);
}

.git-status-card-label {
  color: var(--el-text-color-secondary);
  font-size: 0.875rem;
}

.git-status-card-value {
  display: inline-flex;
  align-items: center;
  gap: var(--app-space-xxs);
  min-width: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--el-text-color-primary);

  span {
    max-width: 8rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.git-status-card-action {
  width: 100%;
}
</style>
