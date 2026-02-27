<template>
  <el-card>
    <h3 class="title">{{ $t('master.setting.name') }}</h3>
    <div class="description">{{ $t('master.setting.nameDescription') }}</div>
    <el-input v-model="state.name" clearable :maxlength="61" />
    <el-button id="MasterTable__Tables__Detail__Setting__Name__Save" :loading="state.loading" type="primary" @click="handleSave">
      {{ $t('common_save') }}
    </el-button>
  </el-card>
</template>
<script setup lang="ts">
import { newAdminApi } from 'api'
const routerProvider = inject(MenuRouterKey)
const props = defineProps(['table', 'tableId'])
const state = reactive<{ name: string; loading: boolean }>({
  name: '',
  loading: false
})
const { t } = useI18n()

async function handleSave() {
  state.name = state.name.trim()
  if (!state.name) {
    routerProvider?.message.error(t('master.setting.name') + t('render.hint.fieldRequired'))
    return
  }
  try {
    state.loading = true
    await newAdminApi.putDmsMasterTable({
      id: props.tableId,
      name: state.name
    }).then(r => r.data)
    routerProvider?.message.success(t('dpMsg_success'))
  } catch (error) {
    //     routerProvider?.message.error($i18n.t('dpMsg_error'))
  } finally {
    state.loading = false
  }
}

watch(
  () => props.table,
  () => {
    if (props.table?.name) {
      state.name = props.table?.name
    }
  },
  {
    immediate: true
  }
)
</script>
<style lang="scss" scoped>
.el-input {
  width: 100%;
  padding: var(--app-space-xs) 0;
}
</style>
