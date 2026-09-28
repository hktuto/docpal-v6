<script setup lang="ts">
type ReviewPayload = {
  office: string
  toPlannedDate: string | number
  commodityInspection: string
  remark: string
  dataList: any[]
}

const { t } = useI18n()
const visible = ref<boolean>(false)
const formModel = reactive({
  office: '',
  toPlannedDate: '' as string | number,
  commodityInspection: '',
  remark: ''
})
const dataList = ref<any[]>([])

const { tableConfig, tableEvent, tableRef, reload } = useVxeTable({
  id: 'tnApprovalReviewTable',
  api: () => dataList.value,
  columns: [
    {
      field: 'index',
      title: t('transferNoteApproval.index'),
      align: 'center',
      type: 'seq',
      fixed: 'left',
      minWidth: 100
    },
    {
      field: 'po_number',
      title: t('transferNoteApproval.poNumber'),
      minWidth: 240
    },
    {
      field: 'part_number',
      title: t('transferNoteApproval.partNumber'),
      minWidth: 240
    },
    {
      field: 'origin',
      title: t('transferNoteApproval.origin'),
      minWidth: 100
    },
    {
      field: 'sys_qty',
      title: t('transferNoteApproval.sysQty'),
      minWidth: 240
    },
    {
      field: 'product_name',
      title: t('transferNoteApproval.productName'),
      minWidth: 240
    },
    {
      field: 'from_sub_inventory',
      title: t('transferNoteApproval.fromSubInventory'),
      minWidth: 240
    },
    {
      field: 'sub_inventory',
      title: t('transferNoteApproval.toSubInventory'),
      minWidth: 240
    },
    {
      field: 'qty',
      title: t('transferNoteApproval.transferQty'),
      minWidth: 140
    },
    {
      field: 'unit_price',
      title: t('transferNoteApproval.unitPrice'),
      minWidth: 160
    },
    {
      field: 'amount',
      title: t('transferNoteApproval.amount'),
      minWidth: 150
    }
  ],
  zoom: false,
  refresh: false,
  customeToolBar: true,
  virtualScroll: true,
  remoteSort: false,
  remoteFilter: false,
  saveColumnOrder: false
})

function open(payload: ReviewPayload) {
  visible.value = true
  formModel.office = payload.office
  formModel.toPlannedDate = payload.toPlannedDate
  formModel.commodityInspection = payload.commodityInspection
  formModel.remark = payload.remark
  dataList.value = payload.dataList

  nextTick(() => reload())
}

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="visible" :title="t('transferNoteApproval.confirmTitle')" append-to-body class="big" destroy-on-close @close="visible = false">
    <div class="tn-review-table">
      <VxeGrid ref="tableRef" v-bind="tableConfig" v-on="tableEvent">
        <template #toolbar_buttons>
          <el-form :model="formModel" label-position="top" class="tn-review-form">
            <el-row :gutter="16">
              <el-col :span="8">
                <el-form-item :label="t('transferNoteApproval.office')">
                  <el-input :model-value="formModel.office" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item :label="t('transferNoteApproval.tnPlannedDate')">
                  <el-input :model-value="formModel.toPlannedDate" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item :label="t('transferNoteApproval.commodityInspection')">
                  <el-input :model-value="formModel.commodityInspection" disabled />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item :label="t('transferNoteApproval.remark')">
              <el-input :model-value="formModel.remark" disabled />
            </el-form-item>
          </el-form>
        </template>
      </VxeGrid>
    </div>
  </el-dialog>
</template>

<style scoped lang="scss">
.tn-review-form {
  width: 100%;
}

.tn-review-table {
  height: 50vh;
}
</style>
