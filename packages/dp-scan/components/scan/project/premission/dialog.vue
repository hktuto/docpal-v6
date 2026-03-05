<script lang="ts" setup>
import { clientApi } from 'api'
const props = defineProps<{
  projectId: string
}>()
const btnEl = ref()
const dialogEl = ref()
const loading = ref(false)
type PermissionResponse = {
  permission: { user: string[]; group: string[] }
  projectId: string
  roleName: 'Creator' | 'Exporter' | 'Verifier' | 'Admin'
}
const defaultPermission = {
  Creator: { permission: [], projectId: props.projectId, roleName: 'Creator' },
  Exporter: { permission: [], projectId: props.projectId, roleName: 'Exporter' },
  Verifier: { permission: [], projectId: props.projectId, roleName: 'Verifier' },
  Admin: { permission: [], projectId: props.projectId, roleName: 'Admin' }
}
const permissionData = ref({
  Creator: { permission: [], projectId: props.projectId, roleName: 'Creator' },
  Exporter: { permission: [], projectId: props.projectId, roleName: 'Exporter' },
  Verifier: { permission: [], projectId: props.projectId, roleName: 'Verifier' },
  Admin: { permission: [], projectId: props.projectId, roleName: 'Admin' }
})

const dropdownOptions = ref([])
const useOptions = ref<any[]>([])
const groupOptions = ref<any[]>([])
async function getUserAndUserGroup() {
  const { data: userData } = await clientApi.admin.postUcenterGetAllUsers({})
  const { data: groupData } = await clientApi.admin.postUcenterGroups({})
  useOptions.value = userData.page.entryList.map((u) => ({ label: u.username, value: `user:${u.userId}` }))
  groupOptions.value = groupData.map((g) => ({ label: g.name, value: `group:${g.id}` }))
}

async function getPremission() {
  loading.value = true
  try {
    const { data } = await clientApi.api.getCaptureProjpermissionsettingListProjid(props.projectId)
    // reset to default before get updated data
    permissionData.value = { ...defaultPermission }
    for (const item of data) {
      const convertedItem = {
        ...item,
        permission: [...(item.permission.user || []).map((u) => `user:${u}`), ...(item?.permission?.group || []).map((g) => `group:${g}`)]
      }
      console.log(convertedItem)
      permissionData.value[item.roleName] = convertedItem
    }
  } finally {
    loading.value = false
  }
}

function handleCancel() {
  dialogEl.value?.close()
}

const convertStateToSubmitData = (data) => {
  return {
    roleName: data.roleName,
    projectId: props.projectId,
    permission: {
      user: data.permission.filter((p) => p.startsWith('user:')).map((p) => p.replace('user:', '')),
      group: data.permission.filter((p) => p.startsWith('group:')).map((p) => p.replace('group:', ''))
    }
  }
}
async function handleSave() {
  // submit permission data
  const creatorData = convertStateToSubmitData(permissionData.value.Creator)
  await clientApi.api.postCaptureProjpermissionsetting(creatorData)
  const verifierData = convertStateToSubmitData(permissionData.value.Verifier)
  await clientApi.api.postCaptureProjpermissionsetting(verifierData)
  const exporterData = convertStateToSubmitData(permissionData.value.Exporter)
  await clientApi.api.postCaptureProjpermissionsetting(exporterData)
  const adminData = convertStateToSubmitData(permissionData.value.Admin)
  await clientApi.api.postCaptureProjpermissionsetting(adminData)
  dialogEl.value?.close()
}

async function open() {
  await getUserAndUserGroup()
  await getPremission()
  const el = btnEl.value?.$el
  dialogEl.value?.open(el)
}
</script>

<template>
  <ElButton ref="btnEl" type="info" :loading="loading" @click="open">Permission</ElButton>
  <UiPopoverDialog ref="dialogEl">
    <div class="title">Premission</div>
    <ElForm label-position="top">
      <ElFormItem label="Creator (User / User Group)">
        <ElSelect v-model="permissionData.Creator.permission" placeholder="Select Creator" multiple cleanable>
          <ElOptionGroup label="Users">
            <ElOption v-for="option in useOptions" :key="option.value" :label="option.label" :value="option.value"></ElOption>
          </ElOptionGroup>
          <ElOptionGroup label="Groups">
            <ElOption v-for="option in groupOptions" :key="option.value" :label="option.label" :value="option.value"></ElOption>
          </ElOptionGroup>
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="Verifier (User / User Group)">
        <ElSelect v-model="permissionData.Verifier.permission" placeholder="Select Creator" multiple cleanable>
          <ElOptionGroup label="Users">
            <ElOption v-for="option in useOptions" :key="option.value" :label="option.label" :value="option.value"></ElOption>
          </ElOptionGroup>
          <ElOptionGroup label="Groups">
            <ElOption v-for="option in groupOptions" :key="option.value" :label="option.label" :value="option.value"></ElOption>
          </ElOptionGroup>
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="Exporter (User / User Group)">
        <ElSelect v-model="permissionData.Exporter.permission" placeholder="Select Creator" multiple cleanable>
          <ElOptionGroup label="Users">
            <ElOption v-for="option in useOptions" :key="option.value" :label="option.label" :value="option.value"></ElOption>
          </ElOptionGroup>
          <ElOptionGroup label="Groups">
            <ElOption v-for="option in groupOptions" :key="option.value" :label="option.label" :value="option.value"></ElOption>
          </ElOptionGroup>
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="Admin (User / User Group)">
        <ElSelect v-model="permissionData.Admin.permission" placeholder="Select Creator" multiple cleanable>
          <ElOptionGroup label="Users">
            <ElOption v-for="option in useOptions" :key="option.value" :label="option.label" :value="option.value"></ElOption>
          </ElOptionGroup>
          <ElOptionGroup label="Groups">
            <ElOption v-for="option in groupOptions" :key="option.value" :label="option.label" :value="option.value"></ElOption>
          </ElOptionGroup>
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="">
        <ElButton type="info" @click="handleCancel">Cancel</ElButton>
        <ElButton type="primary" @click="handleSave">Save</ElButton>
      </ElFormItem>
    </ElForm>
  </UiPopoverDialog>
</template>

<style lang="scss" scoped></style>
