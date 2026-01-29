// create nuxt app config
import { defineAppConfig } from '#imports'

export default defineAppConfig({
  menu: {
    'admin-setting': {
      id: 'admin-setting',
      name: 'admin-setting',
      label: 'admin.setting.title',
      icon: 'lucide:settings',
      hoverIcon: 'lucide:settings',
      component: 'LazySettingPage',
      props: {}
    },
    'admin-profile-setting': {
      id: 'admin-profile-setting',
      name: 'admin-profile-setting',
      icon: 'dp-icon:user',
      hoverIcon: 'dp-icon:user',
      label: 'user.setting.userProfile',
      component: 'SettingUserSetting',
      props: {}
    }
  }
})
