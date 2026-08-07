<script setup lang="ts">
const visible = ref(false)
const rowData = ref<any>({})

function open(row: any) {
  rowData.value = row
  visible.value = true
}

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="visible" title="零件詳情 Part Details" append-to-body class="big" destroy-on-close align-center>
    <el-form :model="rowData" label-position="top" class="all-input-style" disabled>
      <el-row>
        <el-col :span="6">
          <el-form-item label="退貨數量 Quantity Return">
            <el-input-number v-model="rowData.quantity_return" />
          </el-form-item>
          <el-form-item label="行號 Line Number">
            <el-input-number v-model="rowData.line_number" />
          </el-form-item>
          <el-form-item label="訂貨數量 Quantity Ordered">
            <el-input-number v-model="rowData.quantity_ordered" />
          </el-form-item>
          <el-form-item label="稅率 Tax Code">
            <el-input v-model="rowData.tax_code" style="width: 90%" />
          </el-form-item>
          <el-form-item label="申請日期 Request Date">
            <el-date-picker v-model="rowData.request_date" type="date" format="YYYY/MM/DD" value-format="x" style="width: 90%" />
          </el-form-item>
          <el-form-item label="取消數量 Quantity Cancelled">
            <el-input-number v-model="rowData.quantity_cancelled" />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="出貨單號 Shipment Number">
            <el-input v-model="rowData.shipment_number" style="width: 90%" />
          </el-form-item>
          <el-form-item label="客戶採購訂單行 Customer PO Line">
            <el-input-number v-model="rowData.customer_po_line" />
          </el-form-item>
          <el-form-item label="計量單位 UOM">
            <el-input v-model="rowData.uom" style="width: 90%" />
          </el-form-item>
          <el-form-item label="稅額 Tax Amount">
            <el-input-number v-model="rowData.tax_amount" />
          </el-form-item>
          <el-form-item label="承諾日期 Promise Date">
            <el-date-picker v-model="rowData.promise_date" type="date" format="YYYY/MM/DD" value-format="x" style="width: 90%" />
          </el-form-item>
          <el-form-item label="出貨數量 Quantity Shipped">
            <el-input-number v-model="rowData.quantity_shipped" />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="客戶零件編編號 Customer Item">
            <el-input v-model="rowData.customer_item" style="width: 90%" />
          </el-form-item>
          <el-form-item label="客戶單價 Customer Unit Price">
            <el-input-number v-model="rowData.customer_unit_price" />
          </el-form-item>
          <el-form-item label="交貨週期（天）Lead Time(Days)">
            <el-input-number v-model="rowData.lead_time" />
          </el-form-item>
          <el-form-item label="預定出貨日期 Schedule Ship Date">
            <el-date-picker v-model="rowData.schedule_ship_date" type="date" format="YYYY/MM/DD" value-format="x" style="width: 90%" />
          </el-form-item>
          <el-form-item label="PI 備註 PI Remarks">
            <el-input v-model="rowData.po_remarks" style="width: 90%" />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="訂單零件編號 Ordered Item">
            <el-input v-model="rowData.ordered_item" style="width: 90%" />
          </el-form-item>
          <el-form-item label="單價 Unit Price">
            <el-input-number v-model="rowData.unit_price" />
          </el-form-item>
          <el-form-item label="參考 Reference">
            <el-input v-model="rowData.reference" style="width: 90%" />
          </el-form-item>
          <el-form-item label="預定到貨日期 Schedule Arrival Date">
            <el-date-picker v-model="rowData.schedule_arrival_date" type="date" format="YYYY/MM/DD" value-format="x" style="width: 90%" />
          </el-form-item>
          <el-form-item label="子庫存 Sub-Inventory">
            <el-input v-model="rowData.sub_inventory" style="width: 90%" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </el-dialog>
</template>

<style scoped lang="scss">
.all-input-style {
  ::v-deep(.el-input-number) {
    width: 90%;
  }
}
</style>
