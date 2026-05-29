<script setup lang="ts">
import { clientApi } from 'api'
import { getUserSelectOption, workflowResponseHelper } from '#imports'

const routerProvider = inject(MenuRouterKey)
if (!routerProvider) {
  throw new Error('MenuRouterKey is not provided')
}
const { t } = useI18n()
const showDialog = ref(false)
const taskId = ref<string>('')
const userList = ref<any[]>([])
const user = useUserState().value
const formRef = ref()
const form = reactive({
  newAssignee: ''
})
const emits = defineEmits(['reload'])
const rules = {
  newAssignee: [{
    required: true,
    message: t('render.hint.fieldRequired', { name: 'New Task Assignee' }),
    trigger: 'change'
  }]
}

function open(row: any) {
  showDialog.value = true
  form.newAssignee = ''
  taskId.value = row.db_id
  nextTick(() => formRef.value?.clearValidate())
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    const params = {
      task_id: taskId.value,
      assignee: form.newAssignee,
      assign_by: user.userId
    }
    await clientApi.instance
      .post(`/oniflow/api/v1/task/overview/assignee`, params)
      .then((r: any) => workflowResponseHelper(r))
    showDialog.value = false
    emits('reload')
  } catch (e) {
    console.log(e)
    routerProvider?.message?.error(e.message)
  }
}

onMounted(async () => {
  userList.value = await getUserSelectOption()
})

defineExpose({ open })
</script>

<template>
  <el-dialog v-model="showDialog" title="Reallocate Task">
    <el-form ref="formRef" :model="form" label-position="top" :rules="rules">
      <el-form-item label="New Task Assignee" prop="newAssignee">
        <el-select v-model="form.newAssignee" filterable>
          <el-option v-for="item in userList" :key="item.id" :label="item.label" :value="item.id" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button type="primary" @click="handleSubmit">Submit</el-button>
    </template>
  </el-dialog>
</template>

<style scoped lang="scss"></style>
