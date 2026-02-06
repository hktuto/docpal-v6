<template>
  <div class="chart-container" v-loading="loading">
    <template v-if="roleData.length === 0">
      <el-empty :description="$t('orgChart.noData')"></el-empty>
      <div class="flex-x-center">
        <el-button v-if="platform === 'admin'" type="primary" @click="openCreateDialog">{{ $t('orgChart.add') }}</el-button>
      </div>
      <RbacCreateDialog ref="createDialogRef" :roleOptions="flatRole" @success="initData" />
    </template>
    <RbacOrgChartX6
      v-else
      :data="roleData"
      :node-style="defaultNodeStyle"
      @node-click="handleNodeClick"
      @delete="handleDelete"
      @add="handleAdd"
      @edit="handleEdit"
      @update:data="handleDataUpdate"
      @reload="initData"
      @setStatus="setStatus"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, provide } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElNotification } from 'element-plus'
import type { OrgNode } from './X6/types'
import { newAdminApi } from 'api'
import { useRBAC } from '../../../composables/useRBAC'

interface Props {
  roleId?: string
}
const platform = useAppPlatform()
const props = defineProps<Props>()

const { t } = useI18n()

const createDialogRef = ref()
function openCreateDialog() {
  createDialogRef.value?.open()
}

const defaultNodeStyle = {
  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
}

const sidebarVisible = ref(false)
const roleData = ref<OrgNode[]>([])
const loading = ref(false)
const flapRoleList = ref<any[]>([])

function sidebarVisibleChange(visible: boolean) {
  sidebarVisible.value = visible
  if (!visible) {
    initData()
  }
}

function findNodeById(nodes: OrgNode[], targetId: string): OrgNode | null {
  for (const node of nodes) {
    if (node.id === targetId) {
      return node
    }
    if (node.children) {
      const found = findNodeById(node.children, targetId)
      if (found) {
        return found
      }
    }
  }
  return null
}

async function handleDelete(selectedNode: any) {
  try {
    await newAdminApi.putDocpalAclRole({
      id: selectedNode.value.id,
      status: 3 // status:3-逻辑删除
    })
    
    ElNotification({
      title: t('commons_success'),
      message: t('common_deleteSuccess'),
      type: 'success'
    })
    initData()
  } catch (error) {
    console.error('Failed to delete role:', error)
    ElNotification({
      title: t('commons_error'),
      message: t('common_deleteFail'),
      type: 'error'
    })
  }
}

async function handleEdit(formData: OrgNode, selectedNodeId: string) {
  try {
    const dataNode = findNodeById(roleData.value, selectedNodeId)
    if (!dataNode) {
      throw new Error('Node not found: ' + selectedNodeId)
    }

    await newAdminApi.putDocpalAclRole({
      ...formData,
      id: selectedNodeId
    })
    
    Object.assign(dataNode, formData)
    ElNotification({
      title: t('commons_success'),
      message: t('dpMsg_success'),
      type: 'success'
    })
  } catch (error) {
    console.error('Failed to update role:', error)
    ElNotification({
      title: t('commons_error'),
      message: t('common_updateFail'),
      type: 'error'
    })
  }
}

async function handleAdd(formData: OrgNode, selectedNodeId?: string) {
  try {
    const newNode: OrgNode = {
      id: '', // Will be set by the server
      name: formData.name || ''
    }

    const roleData = {
      ...newNode,
      type: (formData as any).type || 1
    }

    if (selectedNodeId) {
      await newAdminApi.postDocpalAclRole({
        ...roleData,
        parentId: selectedNodeId
      })
    } else {
      await newAdminApi.postDocpalAclRole(roleData)
    }

    await initData()
    sidebarVisible.value = false
    ElNotification({
      title: t('commons_success'),
      message: t('common_addSuccess'),
      type: 'success'
    })
  } catch (error) {
    console.error('Failed to add role:', error)
    ElNotification({
      title: t('commons_error'),
      message: t('common_addFail'),
      type: 'error'
    })
  }
}
async function setStatus(selectedNode: string, status: number) {
  try {
    await newAdminApi.putDocpalAclRole({
      id: selectedNode.value.id,
      status: status 
    })

    initData()
  } catch (error) {
    console.error('Failed to delete role:', error)
  }
  console.log('setStatus', selectedNode.value, status)
}
function handleNodeClick(node: OrgNode) {
  console.log('Clicked node:', node)
}

function handleDataUpdate(newData: OrgNode[]) {
  roleData.value = newData
}
const { getRoleTree, roleTree, flatRole } = useRBAC(props.roleId)
async function initData() {
  try {
    loading.value = true
    await getRoleTree()
    roleData.value = roleTree.value || []
    flapRoleList.value = flatRole.value
  } catch (error) {
    console.error('Failed to initialize data on RBAC org chart:', error)
    ElNotification({
      title: t('commons_error'),
      type: 'error'
    })
    throw error;
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  initData()
})

provide('roleEditor', {
  flapRoleList
})
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.flex-x-center {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}
</style>
