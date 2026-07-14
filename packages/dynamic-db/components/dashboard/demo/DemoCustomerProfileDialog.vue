<template>
  <el-dialog
    class="big"
    :model-value="modelValue"
    :title="profile ? `${profile.companyName} — 客户资料` : '客户资料'"
    width="90%"
    top="5vh"
    append-to-body
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="profile" class="customer-profile">
      <div class="profile-header">
        <div class="profile-field"><label>客户组</label><span>{{ profile.customerGroup }}</span></div>
        <div class="profile-field"><label>联络人</label><span>{{ profile.contactName }}</span></div>
        <div class="profile-field"><label>电邮</label><span>{{ profile.email }}</span></div>
        <div class="profile-field"><label>电话</label><span>{{ profile.phone }}</span></div>
        <div class="profile-field">
          <label>地址</label><span>{{ [profile.address, profile.city, profile.country].filter(Boolean).join(', ') }}</span>
        </div>
        <div class="profile-field"><label>级别</label><span>{{ profile.customerTier }}</span></div>
        <div class="profile-field"><label>账户状态</label><span>{{ profile.accountStatus }}</span></div>
        <div class="profile-field"><label>信贷条款</label><span>{{ profile.creditTerms }}</span></div>
        <div class="profile-field"><label>信贷额度</label><span>{{ formatCurrency(profile.creditLimit) }}</span></div>
        <div class="profile-field"><label>本年累计销售</label><span>{{ formatCurrency(profile.ytdSales) }}</span></div>
        <div class="profile-field"><label>订单总数</label><span>{{ profile.totalOrders }}</span></div>
        <div class="profile-field"><label>销售代表</label><span>{{ profile.salesRep }}</span></div>
        <div class="profile-field"><label>付款方式</label><span>{{ profile.paymentMethod }}</span></div>
        <div class="profile-field"><label>注冊日期</label><span>{{ profile.registrationDate }}</span></div>
        <div class="profile-field"><label>最近订单</label><span>{{ profile.lastOrderDate }}</span></div>
        <div class="profile-field"><label>网站</label><span>{{ profile.website }}</span></div>
        <div class="profile-field"><label>税务编号</label><span>{{ profile.taxId }}</span></div>
      </div>

      <h4>销售订单</h4>
      <VxeGrid v-bind="gridOptions" :data="soRows" />
    </div>
    <el-empty v-else-if="!loading" description="没有客户资料" />
  </el-dialog>
</template>

<script setup lang="ts">
import { soTableColumns } from '../../../composables/demo/soTableColumns'
import { loadCustomerProfiles, loadSalesOrders, formatCurrency } from '../../../composables/demo/useDemoData'

const props = defineProps<{
  modelValue: boolean
  customer: string | null
}>()

const emit = defineEmits(['update:modelValue'])

const profile = ref<any>(null)
const soRows = ref<any[]>([])
const loading = ref(false)

const gridOptions = computed(() => ({
  border: true,
  showOverflow: true,
  maxHeight: 400,
  columns: soTableColumns()
}))

watch(
  () => [props.modelValue, props.customer] as const,
  async ([visible, customer]) => {
    if (!visible || !customer) return
    loading.value = true
    try {
      const [profiles, orders] = await Promise.all([loadCustomerProfiles(), loadSalesOrders()])
      profile.value = profiles.find((p) => p.companyName === customer) || null
      soRows.value = orders.filter((r) => r.customer === customer)
    } catch (error) {
      console.error('Failed to load demo data:', error)
      profile.value = null
      soRows.value = []
    } finally {
      loading.value = false
    }
  },
  { immediate: true }
)
</script>

<style scoped lang="scss">
.profile-header {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px 16px;
  margin-bottom: 16px;
}
.profile-field {
  label {
    display: block;
    font-size: var(--app-font-size-s);
    color: var(--el-text-color-secondary, #909399);
  }
  span {
    font-size: var(--app-font-size-m);
  }
}
h4 {
  margin: 12px 0 8px;
}
:deep(.el-dialog__title) {
  font-size: 1.125rem;
}
:deep(.vxe-grid) {
  --vxe-ui-font-size-default: 0.875rem;
}
</style>
