<script setup lang="ts">
import { clientApi } from 'api'

const props = defineProps<{
  userGroupList: any[]
}>()

type userGroupItem = {
  oldId: string,
  newId: string
}

const userGroupList = ref<userGroupItem[]>([])

async function handleCreateUserGroup() {
  for (const group of Object.values(props.userGroupList)) {
    const params = {
      groupId: group.id,
      groupName: group.name
    }
    try {
      const newVar = await clientApi.admin.postAdminucenterGroup(params).then(r => r.data)
      userGroupList.value.push({
        oldId: group.id,
        newId: newVar.id
      })
    } catch (e) {
      throw new Error('Create UserGroup Error')
    }
  }
  return userGroupList.value
}

defineExpose({
  handleCreateUserGroup
})
</script>

<template>
  <el-row :gutter="10">
    <template v-for="item in props.userGroupList" :key="item.key">
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
