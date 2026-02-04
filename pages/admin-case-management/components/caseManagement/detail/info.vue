<template>
  <el-card>
    <template #header>
      <div class="card-header">
        <h4 >{{ t('caseManagement_detailBasicInfo') }}</h4>
      </div>
    </template>
    <el-row v-if="!!detail" :gutter="10">
      <el-col :xs="12" :sm="6">
        <div class="title">{{ t('caseManagement_name') }}</div>
        <el-input v-model="detail.name" @blur="handleBlur" @focus="handleFocus" />
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="title">{{ t('caseManagement.prefix') }}</div>
        <el-input v-model="detail.caseIdPrefix" disabled />
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="title">{{ t('caseManagement.digit') }}</div>
        <el-input v-model="detail.caseIdDigit" disabled />
      </el-col>
      <el-col :xs="12" :sm="6">
        <div class="title">{{ t('caseManagement.startNumber') }}</div>
        <el-input v-model="detail.startNumber" disabled />
      </el-col>
    </el-row>
    <div class="actions">
      <slot />
    </div>
    <!-- <el-button :loading="state.publishLoading" type="primary" @click="handlePublish">{{$t('button.publish')}}</el-button> -->
  </el-card>
</template>
<script lang="ts" setup>
import { newAdminApi } from 'api'
const routerProvider = inject(MenuRouterKey)

const caseDetailProvider = inject(CaseManagementDetailProviderKey)
if (!caseDetailProvider) {
  throw new Error('CaseManagementDetailProviderKey not found')
}
const props = defineProps<{
  detail: any,
}>()
const state = reactive<any>({
  initValue: '',
  publishLoading: false
})

const { t } = useI18n()

// async function handlePublish() {
//   try {
//     const action = await ElMessageBox.confirm(`${t('msg.confirmWhetherToPublish')}`)
//     if(action !== 'confirm') throw new Error("");
//     state.publishLoading = true
//     await clientApi.api.postCaseTypesIdPublish(caseDetailProvider?.caseInfo.value.id,{});
//     routerProvider?.message.success(t('dpMsg_success'))
//   } catch (error) {

//   } finally {
//     setTimeout(() => {
//       state.publishLoading = false
//     }, 100);
//   }
// }
async function handleBlur(e) {
  try {
    const value = e.target.value
    if (value === state.initValue) throw new Error('')

    // const action = await ElMessageBox.confirm(`${t('msg_confirmWhetherToSave')}`)
    // if(action !== 'confirm') throw new Error("");
    await newAdminApi.putCaseTypes({
      ...props.detail,
      name: value
    }).then(r => r.data)
    routerProvider?.message.success(t('dpMsg_success'))
  } catch (error) {

  }
}

function handleFocus(e) {
  state.initValue = e.target.value
}
</script>
<style lang="scss" scoped>
.title {
  line-height: 32px;
}

.el-button {
  width: 100%;
  margin-top: var(--app-space-xs);
}

.actions {
  padding-block: var(--app-space-s);
  display: flex;
  flex-flow: row wrap;
  justify-content: flex-start;
  align-items: flex-start;
  gap: var(--app-space-xxs);

}
</style>
