<script lang="ts" setup>
import { clientApi } from 'api'

const props = defineProps<{
  allPermission: any[]
}>()

const form = ref({
    attr_name: "",
    attr_accesstype : "start"
})
const formEl = ref(null)
const accesstypeOptions = [
    {label: 'Start', value:'start'},
    { label:'View', value: 'view'}
]
const userGroups = ref([]);
const validationRules = {
    attr_name: [
        { required: true, message: 'Please select user group', trigger: 'change' },
    ],
    attr_accesstype: [
        { required: true, message: 'Please select right', trigger: 'change' },
    ]
}
async function gertUserGroupList() {
  const response = await clientApi.api.postUcenterGroups().then(r => r.data)
    if(!response.data){
        throw new Error("获取用户组列表失败")
    }
    userGroups.value = response.data 
}

const displayUserList = computed(() => {
  if(!props.allPermission || !form.attr_accesstype) return userGroups.value
  // const accesstypeList = props.allPermission.find(oldItem => oldItem.attr_name === item.id)
  const hideList = props.allPermission.filter(oldItem =>  oldItem.attr_accesstype === form.value.attr_accesstype)

  return userGroups.value.filter(item => !hideList.find(oldItem => oldItem.attr_name === item.id))
})


const emits = defineEmits(['submit','cancel'])
function submit(){
    // validate
    formEl.value.validate((valid) => {
        if (valid) {
            emits('submit',form.value)
        }
    })
}

function setForm(permission){
    console.log("edit permission", permission)
    form.value = permission
}

onMounted(() => {
    gertUserGroupList()
})

defineExpose({ setForm })

</script>


<template>
     <ElForm ref="formEl"  :model="form" :rules="validationRules" label-position="top">
        <ElFormItem prop="attr_name"  label="User Group" required>
            <ElSelect v-model="form.attr_name" filterable>
                <ElOption v-for="item in displayUserList" :key="item.id" :label="item.name" :value="item.id" />
            </ElSelect>
        </ElFormItem>
        <ElFormItem prop="attr_accesstype" label="Right" required>
            <ElSelect v-model="form.attr_accesstype" >
                <ElOption v-for="option in accesstypeOptions" :key="option.value" :label="option.label" :value="option.value" />
            </ElSelect>
        </ElFormItem>
        <ElFormItem>
            <ElButton type="primary" @click="submit">Save</ElButton>
        </ElFormItem>
    </ElForm>
</template>
