<script setup lang="ts">
import { clientApi } from 'api'

const props = defineProps<{
  emailTemplateList: any[]
}>()

function handleEditEmailTemplate(item: any) {
  console.log('item', item)
}

type emailTemplateItem = {
  oldId: string,
  newId: string
}

const emailTemplateList = ref<emailTemplateItem[]>([])

async function handleCreateEmailTemplate() {
  const list: any[] = []

  for (const item of Object.values(props.emailTemplateList)) {
    try {
      const res = await clientApi.api.postDmsTemplateEmailTemplate({
        label: item.label,
        subject: item.subject,
        body: item.body,
        emailLayoutId: item.emailLayoutId,
        emailTemplateJson: item.emailTemplateJson,
        emailTemplateVariable: item.emailTemplateVariable
      }).then(res => res.data)

      emailTemplateList.value.push({
        oldId: item.id,
        newId: res.id
      })
    } catch (e) {
      list.push(item.name)
      throw new Error(list.join(', '))
    }
  }
  return emailTemplateList.value
}

defineExpose({
  handleCreateEmailTemplate
})
</script>

<template>
  <el-row :gutter="10">
    <template v-for="item in props.emailTemplateList" :key="item.key">
      <el-col :span="4">
        <el-card style="max-height: 100px;">
          <div class="card-header" @dblclick="handleEditEmailTemplate(item)">
            <h4>{{ item.id }}</h4>
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
