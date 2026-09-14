<script setup lang="ts">
import { Paperclip } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'
import { SHIP_DATE_FORMAT, useShipVerifyInject } from '../../../composables/useShipVerify'

const { t } = useI18n()
const { selectedInvoice, updateInvoiceData, disabled } = useShipVerifyInject()
const selfDeliveryOptions = [
  { label: 'Y', value: 'Y' },
  { label: 'N', value: 'N' }
]

const list = ref([
  {
    label: t('workflowWarehouse.shipConfirmDate'),
    field: 'shipConfirmDate',
    type: 'date' as const,
    status: 'pass',
    required: true,
    format: SHIP_DATE_FORMAT
  },
  {
    label: t('workflowWarehouse.customerNo'),
    field: 'customerNo',
    type: 'text' as const,
    status: 'pass',
    required: true
  },
  {
    label: t('workflowWarehouse.piAmount'),
    field: 'piAmount',
    type: 'text' as const,
    status: 'pass',
    required: true
  },
  {
    label: t('workflowWarehouse.selfDelivery'),
    field: 'selfDelivery',
    type: 'select' as const,
    status: 'pass',
    required: true,
    options: selfDeliveryOptions
  }
])

async function handleSave(value: string, item: any) {
  item.status = 'loading'
  try {
    updateInvoiceData({ [item.field]: value || null })
    item.status = 'pass'
  } catch (error) {
    console.error(error)
    item.status = 'fail'
  }
}

async function validate() {
  const hasInvalid = list.value.some((item) => item.status === 'fail' || item.status === 'loading')
  if (!hasInvalid) return true
  try {
    return await ElMessageBox.confirm(t('workflowWarehouse.forceSubmitConfirm'), t('dpTip_warning'), {
      confirmButtonText: t('workflowWarehouse.forceSubmit'),
      cancelButtonText: t('common_cancel'),
      type: 'warning'
    })
  } catch {
    return 'cancel'
  }
}

watch(
  () => selectedInvoice.value?.id,
  () => {
    list.value.forEach((item) => {
      item.status = 'pass'
    })
  }
)

defineExpose({ validate })
</script>

<template>
  <div class="detail-card">
    <template v-if="selectedInvoice">
      <div class="detail-card-header">
        <h3 class="detail-card-title">
          {{ $t('workflowWarehouse.piInvoice') }} {{ selectedInvoice.invoiceNum || '—' }}
        </h3>
        <el-icon
          v-tooltip="selectedInvoice.fileName || $t('workflowWarehouse.fileName')"
          class="detail-card-attach"
          aria-hidden="true"
        >
          <Paperclip />
        </el-icon>
      </div>
      <div class="detail-card-body">
        <WHDetailItem
          v-for="item in list"
          :key="item.field"
          v-model:value="selectedInvoice[item.field]"
          :label="item.label"
          :type="item.type"
          :disabled="disabled"
          :status="item.status"
          :options="item.options ?? []"
          :format="item.format"
          :required="item.required"
          @save="(v) => handleSave(v, item)"
        />
      </div>
    </template>
    <el-empty v-else :description="$t('workflowWarehouse.selectSubInvoice')" :image-size="64" />
  </div>
</template>

<style scoped lang="scss">
.detail-card {
  width: 100%;
  padding: var(--app-space-m);
  border-radius: var(--app-border-radius-m);
  background-color: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
  overflow: visible;
}

.detail-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-s);
  margin-bottom: var(--app-space-m);
}

.detail-card-title {
  margin: 0;
  min-width: 0;
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.detail-card-attach {
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
  font-size: 1rem;
}

.detail-card-body {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
  overflow: visible;
}
</style>
