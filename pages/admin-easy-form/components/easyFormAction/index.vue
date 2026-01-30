<template>
  <el-card style="--icon-size: 1.2rem">
    <h3 class="title">{{ $t('easyForm.actions') }}</h3>
    <div v-for="item in detail.formResult" :key="item.id" :class="['action', `action_${item.status}`]"
         @dblclick="handleAdd(item)">
      <div class="flex-x-start">
        <SvgIcon class="el-icon--left el-icon--right" :src="iconMap[item.actionType]" />
        {{ item.actionName }}
      </div>
      <el-dropdown @command="(command) => handleAction(command, item)">
        <SvgIcon src="/icons/dots.svg" @click.stop />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="edit"> {{ $t('easyForm_formActionsEdit') }}</el-dropdown-item>
            <el-dropdown-item command="delete"> {{ $t('easyForm_formActionsDelete') }}</el-dropdown-item>
            <el-dropdown-item v-if="item.status === 'D'" command="active">
              {{ $t('easyForm_formActionsActivate') }}
            </el-dropdown-item>
            <el-dropdown-item v-else command="inactive">
              {{ $t('easyForm_formActionsInactivate') }}
            </el-dropdown-item>
            <!-- <el-dropdown-item v-if="item.actionType === 'Email' && item.actionKey" command="configEmail"> {{ $t('actions.configEmail') }} </el-dropdown-item> -->
            <!-- <el-dropdown-item v-else-if="item.actionType === 'CaseType' && item.actionKey" command="configCase"> {{ $t('actions.configCase') }} </el-dropdown-item> -->
            <!-- <el-dropdown-item v-else-if="item.actionType === 'Workflow' && item.actionKey" command="configWorkflow"> {{ $t('actions.configEmail') }} </el-dropdown-item> -->
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <div style="text-align: center">
      <el-button id="EasyForm__Detail__FormActions__AddNewFormAction" text @click="handleAdd()">
        {{ $t('easyForm_addFormAction') }}
      </el-button>
    </div>
    <EasyFormActionDialog ref="dialogRef" :detail="detail" @refresh="(action) => emits('refresh', action)" />
  </el-card>
</template>
<script lang="ts" setup>
import { clientApi } from 'api'
import { ElMessageBox } from 'element-plus'
import type { EasyFormResult } from 'api/src/generate/admin'

const routerProvider = inject(MenuRouterKey)
const props = defineProps(['detail'])
const emits = defineEmits(['refresh', 'delete'])
const { t } = useI18n()
const iconMap = {
  Workflow: '/icons/easyForm/workflow.svg',
  CaseType: '/icons/menu/briefcase.svg',
  Email: '/icons/easyForm/email.svg'
}
const dialogRef = ref()

function handleAdd(row: EasyFormResult = {}) {
  dialogRef.value.handleOpen(row)
}

function handleAction(command: string, row: EasyFormResult) {
  switch (command) {
    case 'delete':
      handleDelete(row.id)
      break
    case 'edit':
      handleAdd(row)
      break
    case 'active':
    case 'inactive':
      handleActive(row)
      break
    // case 'configEmail':
    //   router.push(`/emailTemplate/${row.actionKey}`)
    //   break
    // case 'configWorkflow':
    //   router.push(`/workflowEditor/${row.actionKey}`)
    //   break
    // case 'configCase':
    //   router.push(`/caseManage/${row.actionKey}`)
    //   break
    default:
      break
  }
}

async function handleActive(row: EasyFormResult) {
  try {
    const action = await clientApi.admin
      .postAdmindmsEasyFormSaveFormresultAppend({
        id: props.detail.id,
        formResult: {
          ...row,
          status: row.status === 'D' ? 'A' : 'D'
        }
      })
      .then((res) => res.data)
    emits('refresh', action)
  } catch (error) {
    console.log(error)
  }
}

async function handleDelete(id: string) {
  try {
    const action = await ElMessageBox.confirm(`${t('easyForm_FormActionsDeleteMsg')}`, {
      confirmButtonClass: 'el-button el-button--warning',
      dangerouslyUseHTMLString: true,
      confirmButtonText: t('common_confirmDelete')
    })
    if (action !== 'confirm') return
    // const index = list.value.findIndex(item => item.id === id)
    // list.value.splice(index, 1)
    await clientApi.admin.deleteAdmindmsEasyFormDraftidFormresultFormresultid(props.detail.id, id)
    routerProvider?.message.success(t('tip_deleteSuccessMessage', { name: t('tip_SelectedMsg') + t('easyForm_formAction') }))
    emits('delete', id)
  } catch (error) {
    routerProvider?.message.success(t('dpMsg_success'))
  }
}
</script>
<style lang="scss" scoped>
.action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  // gap: var(--app-space-xs);
  padding: var(--app-space-xs);
  background-color: var(--app-grey-900);
  margin-bottom: var(--app-space-xs);
  border-radius: 4px;
}

.action_D {
  background-color: var(--app-grey-300);
}
</style>
