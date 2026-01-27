<template>
  <el-dialog v-model="dialogVisible" :title="$t('workflow_ManageReallocateTask')">
    <el-form ref="formRef" :model="form" label-width="120px" label-position="top" @submit.native.prevent>
      <el-form-item
        :label="$t('workflow_ManageReallocateAssignee')"
        prop="assignee"
        :rules="[{ required: true, message: $t('workflow_ManageReallocateAssignee') + $t('render.hint.fieldRequired'), trigger: 'change' }]"
      >
        <el-select v-model="form.assignee" filterable clearable :placeholder="t('common_selectedIsRequiredMsg')"
                   style="width: 100%">
          <el-option v-for="item in state.userList" :key="item.id" :label="item.userId"
                     :value="item.userId"></el-option>
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button id="ActiveWorkflowManagement__ReallocateTask__Submit" type="primary" @click="handleSubmit">
        {{ $t('submit') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ElMessage, type FormInstance } from 'element-plus'
import { adminApi,clientApi } from 'api'

const { t } = useI18n()
const emit = defineEmits(['success'])
const state = reactive({
  userList: []
})
// #region module: dialog
const dialogVisible = ref(false)

async function handleOpen(row) {
  dialogVisible.value = true
  if (row.assignee) {
    form.oldAssignee = row.assignee
    form.assignee = row.assignee
    form.id = row.id
  } else {
    form.oldAssignee = ''
    form.assignee = ''
    form.id = row.id
  }
  state.userList = await clientApi.api.postUcenterUsers({}).then((res) => res.data)
  state.userList = state.userList.filter((item) => item.userId !== row.assignee && item.userId)
}

// #endregion
// #region module: form
const formRef = ref<FormInstance>()
const form = reactive({
  oldAssignee: '',
  assignee: '',
  id: ''
})

async function handleSubmit() {
  if (form.oldAssignee && form.oldAssignee === form.assignee) {
    dialogVisible.value = false
    return
  }
  try {
    const valid = await formRef.value.validate((valid, fields) => valid)
    if (!valid) return
    if (!form.assignee) return
    if (form.oldAssignee) {
      const res = await adminApi.api.postWorkflowTaskUnclaim({
        taskId: form.id
      })
      if (!res) return
    }
    const res2 = await adminApi.api.postWorkflowTaskClaim({
      taskId: form.id,
      userId: form.assignee
    })
    if (!res2) return

    ElMessage.success(t('workflow_ManageReallocateAssigneeSuccessMsg'))
    emit('success')
    dialogVisible.value = false
  } catch (error) {
    console.log(error)
  } finally {
  }
}

// #endregion
defineExpose({ handleOpen })
</script>

<style scoped lang="scss"></style>
