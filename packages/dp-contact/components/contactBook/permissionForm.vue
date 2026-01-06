<template>
  <FormRenderer ref="FormRendererRef" :form-json="formJson" @form-change="handleFormChange"></FormRenderer>
</template>
<script lang="ts" setup>
import formJson from './permission.vform.json'
import {
  convertPermissionObjectByPermissions,
  getPermissionSelectOption,
  convertPermissionsByPermissionObject,
  convertSelectOptions
} from '#imports'

const { t } = useI18n()
const emits = defineEmits(['refresh', 'vFormChange'])

const FormRendererRef = ref()

async function getFormData() {
  const data: any = await FormRendererRef.value.getFormData()

  // TODO delete
  const permissions = {
    Read: getPermissionData(data.read),
    Create: getPermissionData(data.create),
    Delete: getPermissionData(data.delete),
    Manage: getPermissionData(data.manage),
    Edit: getPermissionData(data.edit)
  }

  // new Api
  // const permissions = {
  //   Read: convertPermissionObjectByPermissions(data.read),
  //   Create: convertPermissionObjectByPermissions(data.create),
  //   Delete: convertPermissionObjectByPermissions(data.delete),
  //   Manage: convertPermissionObjectByPermissions(data.manage),
  //   Edit: convertPermissionObjectByPermissions(data.edit)
  // }
  return { name: data.name, permissions }
}

function getPermissionData(permissions: any) {
  if (!permissions) return {}
  const item: Record<string, string[]> = {}
  permissions.forEach((key: string) => {
    const segments = key.split('_')

    if (segments.length < 1) {
      return item
    }
    if (!item[`${segments[0]}s`]) {
      item[`${segments[0]}s`] = []
    }
    item[`${segments[0]}s`].push(segments.slice(1).join('_'))
  })
  return item
}

function setFormData(data: any) {
  // TODO: Delete
  const params = {
    name: data.name,
    read: convertSelectOptions(data.permissions.Read),
    create: convertSelectOptions(data.permissions.Create),
    delete: convertSelectOptions(data.permissions.Delete),
    manage: convertSelectOptions(data.permissions.Manage),
    edit: convertSelectOptions(data.permissions.Edit)
  }

  // new Api
  // const params = {
  //   name: data.name,
  //   read: convertPermissionsByPermissionObject(data.permissions.Read),
  //   create: convertPermissionsByPermissionObject(data.permissions.Read),
  //   delete: convertPermissionsByPermissionObject(data.permissions.Read),
  //   manage: convertPermissionsByPermissionObject(data.permissions.Read),
  //   edit: convertPermissionsByPermissionObject(data.permissions.Read)
  // }

  FormRendererRef.value.vFormRenderRef.setFormData(params)
}

function setFieldValue(fieldName: string, data: any) {
  const widgetRef = FormRendererRef.value.vFormRenderRef.getWidgetRef(fieldName)
  if (!widgetRef) return
  widgetRef.setValue(data)
}

function getFieldValue(fieldName: string) {
  const widgetRef = FormRendererRef.value.vFormRenderRef.getWidgetRef(fieldName)
  if (!widgetRef) return
  return widgetRef.getValue()
}

function setDisabledForm(disabled: boolean = true) {
  if (disabled) FormRendererRef.value.vFormRenderRef.disableForm()
  else FormRendererRef.value.vFormRenderRef.enableForm()
}

function handleFormChange({ fieldName, newValue, oldValue, formModel }: any) {
  // TODO:delete
  emits('vFormChange', { fieldName, newValue, oldValue, formModel })

  // new Api
  // const permissions = {
  //   Read: convertPermissionObjectByPermissions(formModel.read),
  //   Create: convertPermissionObjectByPermissions(formModel.create),
  //   Delete: convertPermissionObjectByPermissions(formModel.delete),
  //   Manage: convertPermissionObjectByPermissions(formModel.manage),
  //   Edit: convertPermissionObjectByPermissions(formModel.edit)
  // }
  // emits('vFormChange', { name: formModel.name, permissions })
}

async function setPermissionsOption() {
  const permissionOptionList = await getPermissionSelectOption()

  const list = ['read', 'create', 'delete', 'edit', 'manage']
  list.forEach((key: string) => {
    try {
      const widgetRef = FormRendererRef.value.vFormRenderRef.getWidgetRef(key)
      widgetRef.loadOptions(permissionOptionList)
    } catch (e) {
      console.log('setPermissionsOption', e)
    }
  })
}

onMounted(async () => {
  await setPermissionsOption()
})
defineExpose({ getFormData, setFormData, setFieldValue, getFieldValue, setDisabledForm })
</script>
<style lang="scss" scoped>

</style>
