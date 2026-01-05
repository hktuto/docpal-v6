<script lang="ts" setup>
import { clientApi } from 'api'

const loading = ref(false);
const form = reactive({
      username: '',
      password: '',
    })
const usernameEl = ref();
const errorMessage = ref('');
const rules = {
    username: [
        { required: true, message: 'Please input Username', trigger: 'blur' },
    ],
    password: [
        { required: true, message: 'Please input Password', trigger: 'blur' },
    ],
}

async function submit() {
  try {
    loading.value = true
    errorMessage.value = ''
    const { data } = await clientApi.instance.post('/api/auth/login', {
      username: form.username,
      password: form.password
    }).then(res => res.data)
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    const token = useToken()
    token.value = data.access_token
    // console.log(data)
    //    const {isRequired2FA} = await userStore.login(form.username, form.password);
        form.username = "";
        form.password = "";
        verifly();
        const route = useRoute()
        let url
        if(route.query.redirect && route.query.redirect !== '/login'){
            url = route.query.redirect as string
            if(route.query){
              url += `?${Object.keys(route.query).map(key => `${key}=${route.query[key]}`).join('&')}`
            }
        }else{
          url = '/'
        }
        window.location.href = url
    } catch (error) {
        errorMessage.value = 'Username or password is incorrect';
    }finally{
        loading.value = false;
    }
}

function forgetPassword(){
    const router = useRouter()
    router.push('/forgetPassword')
}
const languageReady = ref(false)
onMounted(async() => {
    await getLocale()
    languageReady.value = true
    nextTick(()=>{
        if(usernameEl.value) usernameEl.value.focus()
    })
});
</script>

<template>
    <div class="login-page">
        <Transition name="fade">
            <div v-if=languageReady class="fromContainer card glass">
                <AppBigLogo class="logo" mode="withName"/>
                <ElForm
                    :model="form"
                    :rules="rules"
                    label-position="top">
                    <ElFormItem label="Username" :rules="rules.username">
                        <ElInput
                            ref="usernameEl"
                            v-model="form.username"
                            type="text" />
                    </ElFormItem>
                    <ElFormItem label="Password" :rules="rules.password">
                        <ElInput
                            v-model="form.password"
                            type="password"
                            @keyup.enter.native="submit"
                            show-password/>
                    </ElFormItem>
                    <ElFormItem>
                        <ElAlert v-if="errorMessage" :title="errorMessage" type="error" />
                    </ElFormItem>
                    <ElFormItem>
                        <ElButton class="fullSize"  size="large"  type="primary" @click="submit" :loading="loading">Submit</ElButton>
                    </ElFormItem>
                </ElForm>
                <el-button  @click="forgetPassword" link>
                    {{ $t('login_forgetPassword') }}
                </el-button>
            </div>
        </Transition>
    <LoadingBg />
    </div>
</template>

<style lang="scss" scoped>
.login-page{
    width:100vw;
    height: 100vh;
    display: grid;
    place-items: center;
}
.fromContainer{
    
    width: clamp(300px, calc(100vw - 4rem), 600px);
    display: flex;
    flex-flow: column nowrap;
    justify-content: flex-start;
    align-items: stretch;
}
.logo{
    --icon-size: clamp(100px, 80%, 200px);
    max-width: 200px;
    margin: 0 auto var(--app-space-s) auto;
}


.card{
    padding: var(--el-component-size-small);
    border-radius: var(--el-border-radius-round);
}
</style>
