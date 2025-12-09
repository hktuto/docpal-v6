<script setup lang="ts">
import { adminApi } from 'api'

const props = defineProps<{
  userRoleList: any[]
}>()

type userRoleItem = {
  oldId: string,
  newId: string
}

const userRoleList = ref<userRoleItem[]>([])

async function handleCreateUserRole() {
  for (const role of Object.values(props.userRoleList)) {
    const params = {
      name: role.name,
      status: role.status,
      type: role.status
    }
    try {
      const newVar = await adminApi.api.postAclRole(params).then(r => r.data)
      userRoleList.value.push({
        oldId: role.id,
        newId: newVar.id
      })
    } catch (e) {
      throw new Error('Create UserRole Error')
    }
  }
  return userRoleList.value
}

defineExpose({
  handleCreateUserRole
})
</script>

<template>
  <el-row :gutter="10">
    <template v-for="item in props.userRoleList" :key="item.key">
      <el-col :span="4">
        <el-card style="max-height: 100px;">
          <div class="card-header">
            <h4>{{ item.name }}</h4>
          </div>
        </el-card>
      </el-col>
    </template>
  </el-row>
</template>

<style scoped lang="scss">
.el-col {
  padding-block: 2px;
  padding-right: 5px;
  padding-left: 5px;
}
</style>
