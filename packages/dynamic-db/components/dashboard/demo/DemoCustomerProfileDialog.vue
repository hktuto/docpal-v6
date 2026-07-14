<template>
  <el-dialog
    :model-value="modelValue"
    :title="profile ? `${profile.companyName} — Customer Profile` : 'Customer Profile'"
    width="80%"
    top="5vh"
    append-to-body
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="profile" class="customer-profile">
      <div class="profile-header">
        <div class="profile-field"><label>Customer Group</label><span>{{ profile.customerGroup }}</span></div>
        <div class="profile-field"><label>Contact</label><span>{{ profile.contactName }}</span></div>
        <div class="profile-field"><label>Email</label><span>{{ profile.email }}</span></div>
        <div class="profile-field"><label>Phone</label><span>{{ profile.phone }}</span></div>
        <div class="profile-field">
          <label>Address</label><span>{{ [profile.address, profile.city, profile.country].filter(Boolean).join(', ') }}</span>
        </div>
        <div class="profile-field"><label>Tier</label><span>{{ profile.customerTier }}</span></div>
        <div class="profile-field"><label>Account Status</label><span>{{ profile.accountStatus }}</span></div>
        <div class="profile-field"><label>Credit Terms</label><span>{{ profile.creditTerms }}</span></div>
        <div class="profile-field"><label>Credit Limit</label><span>{{ formatCurrency(profile.creditLimit) }}</span></div>
        <div class="profile-field"><label>YTD Sales</label><span>{{ formatCurrency(profile.ytdSales) }}</span></div>
        <div class="profile-field"><label>Total Orders</label><span>{{ profile.totalOrders }}</span></div>
        <div class="profile-field"><label>Sales Rep</label><span>{{ profile.salesRep }}</span></div>
        <div class="profile-field"><label>Payment Method</label><span>{{ profile.paymentMethod }}</span></div>
        <div class="profile-field"><label>Registered</label><span>{{ profile.registrationDate }}</span></div>
        <div class="profile-field"><label>Last Order</label><span>{{ profile.lastOrderDate }}</span></div>
        <div class="profile-field"><label>Website</label><span>{{ profile.website }}</span></div>
        <div class="profile-field"><label>Tax ID</label><span>{{ profile.taxId }}</span></div>
      </div>

      <h4>Sales Orders</h4>
      <VxeGrid v-bind="gridOptions" :data="soRows" />
    </div>
    <el-empty v-else-if="!loading" description="Customer profile not available" />
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
  maxHeight: 300,
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
    font-size: 12px;
    color: var(--el-text-color-secondary, #909399);
  }
  span {
    font-size: 14px;
  }
}
h4 {
  margin: 12px 0 8px;
}
</style>
