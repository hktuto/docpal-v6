<template>
  <div v-if="!!data" class="permissionCard" >
    <template v-if="data.group">
      <el-row class="title">{{$t('user_groupName')}}</el-row>
      <el-row class="content">{{data.group}}</el-row>
    </template>
    <template v-if="data.role">
      <el-row class="title">{{$t('user_role')}}</el-row>
      <el-row class="content">{{ getRoleName(data.role) }}</el-row>
    </template>

    <template v-if="filedCondition.length > 0">
      <el-row class="title">{{$t('caseManage.recordPermission')}}</el-row>
      <el-table :data="filedCondition">
        <el-table-column prop="id" label="id"  />
        <el-table-column prop="condition" label="condition" />
        <el-table-column prop="__cdata" label="__cdata" >
          
          <template #default="{row}">
            {{ getI18n(row.__cdata)  }}
          </template>
        </el-table-column>
      </el-table>
    </template>
    <el-row class="title">{{$t('caseManage.fieldPermission')}}</el-row>
    <div  v-for="(item, key) in fieldList" :class="{fieldList:true, hidden:key === 'hidden' }" >
      <template v-if="key !== 'hidden'">
        <el-row class="title">{{key}}</el-row>
        <el-tag type="primary" effect="plain" v-for="(field,index) in item">{{field.name || field.id}}</el-tag>
      </template>
    </div>
    <el-icon class="absoluteTop" @click="handleEdit"><Setting /></el-icon>
    <CaseManagementDetailPermissionDialog ref="dialogRef" :caseInformation="caseInformation" :exitList="enableExitList" @refresh="handleRefresh" @delete="(data) => emits('delete', data)"/>
  </div>
</template>
<script lang="ts" setup>
import { Setting } from '@element-plus/icons-vue'
const props = defineProps(['data', 'caseInformation', 'roleList', 'exitList'])
const emits = defineEmits(['refresh', 'delete'])
const enableExitList = computed(() => {
  return props.exitList.filter((item: any) => item.role !== props.data.role || item.group !== props.data.group)
})
function getRoleName(roleId: string) {
  return props.roleList.find(item => item.id === roleId)?.name
}
const fieldList = computed(() => {
  try {
    const result = props.data.permission.field.reduce((prev,item) => {
      if(!prev[item.accesstype]) prev[item.accesstype] = []
      prev[item.accesstype].push(item)
      return prev
    }, {})
    return result
  } catch (error) {
    return {}
  }
})
const filedCondition = computed(() => {
  try {
    const result = props.data.filter.filed_condition.reduce((prev,item) => {
      prev.push(item)
      return prev
    }, [])
    return result
  } catch (error) {
    return []
  }
})
const dialogRef = ref()
function handleEdit() {
  dialogRef.value.handleOpen({...props.data, fieldList: fieldList.value})
}
function handleRefresh(data:any) {
  emits('refresh', data)
}
function getI18n(value: string) {
  if(value.includes('UserGroupId') || value.includes('UserId')) {
    const keys = value.split(':')
    keys[0] = $i18n.t('case.' + keys[0])
    return keys.join(':')
  }
  else {
    return value
  }
}
</script>
<style lang="scss" scoped>
.permissionCard {
  height: 100%;
  background: var(--app-grey-800);
  padding: var(--app-space-xs);
  color: #fff;
  border-radius: 5px;
  position: relative;
  .title {
    margin: var(--app-input-padding) 0;
    opacity: 0.9;
    font-size: 0.7rem;
    // color: #687A8F;
  }
  .content {
    font-size: 1rem;
    font-weight: 600;
    word-break: break-all;
  }
}
.fieldList {
  border-top: 1px solid var(--app-grey-800);
  padding-block : calc( var(--app-space-xs) / 2);
  &.hidden{
    border-top: none;
    display: none;
  }
  .title{
    margin:0;
  }
  .item+.item::before {
    content: ', '
  }
  .el-tag {
    margin: 2px;
  }
}
.absoluteTop {
  cursor: pointer;
  position: absolute;
  top: var(--app-space-xs);
  right: var(--app-space-xs);
}
</style>
