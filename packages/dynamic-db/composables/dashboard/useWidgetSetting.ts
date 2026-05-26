import { ElMessageBox } from 'element-plus'

export function useWidgetSetting(emit: any) {
  const visible = ref(false)
  const loading = ref(false)
  const setting = ref<Record<string, any>>({})

  function handleOpen(newSetting: Record<string, any>) {
    visible.value = true
    setting.value = { ...newSetting }
  }

  function handleSubmit(newSetting: Record<string, any>) {
    emit('refresh', { ...setting.value, ...newSetting })
    visible.value = false
  }

  async function handleDelete() {
    const action = await ElMessageBox.confirm('Are you sure you want to delete this widget?').catch(() => 'cancel')
    if (action !== 'confirm') return
    emit('delete')
    visible.value = false
  }

  function handleClose() {
    visible.value = false
  }

  return {
    visible,
    loading,
    setting,
    handleOpen,
    handleSubmit,
    handleDelete,
    handleClose
  }
}
