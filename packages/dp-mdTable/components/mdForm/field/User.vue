<template>
  <MdFormItem v-if="formData && column[fieldName]" v-bind="props" :rules="rules">
    <el-select
      v-model="formData[column[fieldName]]"
      :multiple="isMultiple"
      :placeholder="column.placeholder || '请选择成员'"
      clearable
      filterable
      :disabled="disabled"
      :loading="loading"
      style="width: 100%"
    >
      <el-option v-for="user in userList" :key="user.value" :label="user.label" :value="user.value">
        <div class="flex items-center">
          <span>{{ user.label }}</span>
          <span v-if="user.email" class="text-gray-400 ml-2 text-xs">({{ user.email }})</span>
        </div>
      </el-option>
    </el-select>
  </MdFormItem>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { clientApi } from 'api'

const props = defineProps<{
  formData: any
  column: any
  fieldName: string
  disabled: boolean
}>()

const loading = ref(false)
const userList = ref<Array<{ value: string; label: string; email?: string }>>([])

// 判断是否多选
const isMultiple = computed(() => {
  return props.column?.display_structure?.allowMulti === true
})

// 验证规则
const rules = computed(() => {
  if (!props.column) {
    return []
  }
  const rules: any[] = []
  if (props.column.required) {
    rules.push({
      required: true,
      message: '请选择成员',
      trigger: 'change',
      validator: (rule: any, value: any, callback: any) => {
        if (isMultiple.value) {
          if (!value || (Array.isArray(value) && value.length === 0)) {
            callback(new Error('请至少选择一个成员'))
          } else {
            callback()
          }
        } else {
          if (!value) {
            callback(new Error('请选择成员'))
          } else {
            callback()
          }
        }
      }
    })
  }
  return rules
})

// 获取用户列表
const fetchUserList = async () => {
  try {
    loading.value = true
    const response: any = await clientApi.api.postNuxeoIdentityUsers()
    const users = response.data || []

    userList.value = users
      .filter((user: any) => user.userId) // 过滤掉没有 userId 的用户
      .map((user: any) => ({
        value: user.userId,
        label: user.username || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.userId,
        email: user.email
      }))
  } catch (error) {
    console.error('获取用户列表失败:', error)
    userList.value = []
  } finally {
    loading.value = false
  }
}

// 初始化数据
onMounted(() => {
  fetchUserList()

  // 如果是多选且初始值为空，初始化为空数组
  if (isMultiple.value && !props.formData[props.column[props.fieldName]]) {
    props.formData[props.column[props.fieldName]] = []
  }
})
</script>

<style lang="scss" scoped></style>
