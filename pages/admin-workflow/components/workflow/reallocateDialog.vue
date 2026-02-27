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
          <el-option v-for="item in userList" :key="item.value" :label="item.label" :value="item.value" />
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
import { newAdminApi } from 'api'
import { getUserSelectOption } from '#imports'

const { t } = useI18n()
const emit = defineEmits(['success'])
const userList = ref([])
const dialogVisible = ref(false)

async function handleOpen(row: any) {
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
  const list = await getUserSelectOption()
  userList.value = list.filter((item: any) => item.value !== row.assignee)
}

const formRef = ref<FormInstance>()
const form = reactive({
  oldAssignee: '',
  assignee: '',
  id: ''
})

async function handleSubmit() {
  try {
    const valid = await formRef.value.validate((valid, fields) => valid)
    if (!valid) return
    if (!form.assignee) return
    if (form.oldAssignee) {
      await newAdminApi.postDocpalWorkflowTaskUnclaim({
        taskId: form.id
      })
    }
    await newAdminApi.postDocpalWorkflowTaskClaim({
      taskId: form.id,
      userId: form.assignee
    })

    ElMessage.success(t('workflow_ManageReallocateAssigneeSuccessMsg'))
    emit('success')
  } catch (error) {
    console.log(error)
  } finally {
    dialogVisible.value = false
  }
}

// #endregion
defineExpose({ handleOpen })
</script>

<style scoped lang="scss"></style>
