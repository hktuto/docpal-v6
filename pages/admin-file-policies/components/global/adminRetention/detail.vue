<script lang="ts" setup>
import { clientApi } from 'api'
import formJson from '../../retention/addDialog.vform.json'

const routerProvider = inject(MenuRouterKey)
const emits = defineEmits(['update'])
const { id } = defineProps<{
  id: number
}>()
const { t } = useI18n()
const state = reactive<any>({
  setting: {},
  activeLoading: false,
  editLoading: false
})
const FormRendererRef = ref()

async function handleSubmit() {
  try {
    const data = await FormRendererRef.value.getFormData()
    const params = {
      ...state.setting,
      ...data,
      actionType: data.actionType ? 'D' : 'A',
      status: state.setting.status
    }
    state.loading = true
    await clientApi.admin.putAdmindmsPolicyRetention(params)
    routerProvider?.message.success(
      t('tip_updateSuccessMsg', {
        modelName: t('filePolicies_RetentionPolicy'),
        name: null
      })
    )
    emits('update')
  } catch (error) {
    init()
  } finally {
    state.loading = false
  }
}

async function handleSetStatus(isActive: 'A' | 'D') {
  if (!state.setting.id) return
  try {
    state.activeLoading = true
    const result = await clientApi.admin.patchAdmindmsPolicyHoldHoldpolicyidStatusStatus(id, isActive).then((res) => res.data)
    if (!!result) {
      state.setting.status = isActive
      routerProvider?.message.success(t('dpMsg_success'))
    }
  } catch (error) {
    state.setting.status = isActive === 'A' ? 'D' : 'A'
  } finally {
    state.activeLoading = false
  }
}

async function init() {
  try {
    state.loading = true
    let setting = await clientApi.admin.getAdmindmsPolicyRetentionRetentionpolicyid(id).then((res) => res.data)
    if (!setting) setting = {}
    setTimeout(async () => {
      state.setting = setting
      state.setting.actionType = setting?.actionType === 'D'
      await FormRendererRef.value.vFormRenderRef.setFormData({ ...state.setting })
    })
  } catch (error) {
  } finally {
    state.loading = false
  }
}

onMounted(async () => {
  await init()
})
</script>
<template>
  <div class="pageContainer--padding rd-container">
    <div class="rd-container--title flex-x-between">
      <div>
        {{ $t('user_active') }}
        <el-switch
          class="el-icon--right"
          v-model="state.setting.status"
          active-value="A"
          inactive-value="D"
          :loading="state.activeLoading"
          @change="handleSetStatus"
        />
      </div>
      <div>
        <!-- <el-button type="danger" @click="handleDelete">{{$t('common_delete')}}</el-button> -->
        <el-button :loading="state.loading" id="RetentionPolicySetting__EditRetentionPolicy__Submit" utton type="primary" @click="handleSubmit">
          {{ $t('common_submit') }}
        </el-button>
      </div>
    </div>
    <FormRenderer class="rd-container--main" ref="FormRendererRef" :form-json="formJson"></FormRenderer>
    <div class="rd-container--right"></div>
  </div>
</template>
<style lang="scss" scoped>
.rd-container {
  display: grid;
  grid-template-columns: 1fr min-content;
  grid-template-rows: min-content 1fr;
  grid-column-gap: var(--app-space-xs);
  grid-row-gap: var(--app-space-xs);
  height: 100%;
  overflow: auto;
}

.rd-container--title {
  grid-area: 1 / 1 / 2 / 2;
}

.rd-container--main {
  grid-area: 2 / 1 / 3 / 2;
  overflow-y: auto;
  overflow-x: hidden;
}

.rd-container--right {
  grid-area: 1 / 2 / 3 / 3;
}

.flex-x-between {
  display: flex;
  justify-content: space-between;
}
</style>
