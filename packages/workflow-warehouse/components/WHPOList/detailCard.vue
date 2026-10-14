<template>
  <div class="detail-card">
    <template v-if="selectedPo">
      <div class="detail-card-header">
        <h3 class="detail-card-title">{{ $t('workflowWarehouse.customerPoDetails') }}</h3>
      </div>
      <div class="detail-card-body">
        <template v-for="item in list" :key="item.label || item.field">
          <WHDetailItem
            v-if="item.field"
            v-model:value="selectedPo[item.field]"
            :label="item.label"
            :type="item.type"
            :disabled="item.disabled || disabled"
            :status="item.status"
            :options="unref(item.options) ?? []"
            :required="item.required"
            @save="(v) => handleSave(v, item)"
          />
          <WHDetailItem v-else :label="item.label" :text-value="unref(item.value)" :type="item.type" :disabled="true" />
        </template>
      </div>
    </template>
    <el-empty v-else :description="$t('workflowWarehouse.selectPo')" :image-size="64" />
  </div>
</template>

<script setup lang="ts">
import { ElMessageBox } from 'element-plus'
import { useWHPOListInject } from '../../composables/useWHPOList'
import { useWHPOListTableInject } from '../../composables/useWHPOListTable'
import { CUST_PO, CUST_PO_CURRENCY_OPTIONS, CUST_PO_TAXED_OPTIONS } from '../../utils/custPo'
import { syncSelectField } from '../../utils/workflowHelper'

const { t } = useI18n()
const { selectedPo, updatePoData, disabled } = useWHPOListInject()
const { tableData } = useWHPOListTableInject()

const list = ref([
  {
    label: t('workflowWarehouse.customerPoNo'),
    field: CUST_PO.custPoNum,
    type: 'text',
    status: 'pass',
    required: true
  },
  {
    label: t('workflowWarehouse.customerNo'),
    field: CUST_PO.custNum,
    type: 'text',
    status: 'pass'
  },
  {
    label: t('workflowWarehouse.customer'),
    field: CUST_PO.custName,
    type: 'text',
    status: 'pass',
    required: true
  },
  {
    label: t('workflowWarehouse.currency'),
    field: CUST_PO.currency,
    type: 'select',
    status: 'pass',
    required: true,
    options: CUST_PO_CURRENCY_OPTIONS
  },
  {
    label: t('workflowWarehouse.taxedFlag'),
    field: CUST_PO.taxedFlag,
    type: 'select',
    status: 'pass',
    options: CUST_PO_TAXED_OPTIONS
  },
  {
    label: t('workflowWarehouse.lines'),
    value: computed(() => tableData.value.length),
    type: 'text'
  }
])

async function handleSave(value: string, item: any) {
  item.status = 'loading'
  if (!value) value = null as any
  try {
    const res = await updatePoData({ [item.field]: value })
    setTimeout(() => {
      item.status = res?.id ? 'pass' : 'fail'
    }, 400)
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
  [() => selectedPo.value?.id, () => selectedPo.value?.[CUST_PO.currency], () => selectedPo.value?.[CUST_PO.taxedFlag]],
  () => {
    const po = selectedPo.value
    if (!po) return
    if (po.currency) po.currency = syncSelectField(po.currency, CUST_PO_CURRENCY_OPTIONS) || po.currency
    if (po.taxed_flag) po.taxed_flag = syncSelectField(po.taxed_flag, CUST_PO_TAXED_OPTIONS) || po.taxed_flag
  },
  { immediate: true }
)

defineExpose({ validate })
</script>

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
  margin-bottom: var(--app-space-m);
}

.detail-card-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.3;
  color: var(--el-text-color-primary);
}

.detail-card-body {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-s);
  overflow: visible;
}
</style>
