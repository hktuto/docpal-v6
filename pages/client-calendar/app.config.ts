import { defineAppConfig } from '#imports'

export default defineAppConfig({
  menu: {
    'client-calendar': {
      id: 'client-calendar',
      name: 'client-calendar',
      label: 'Calendar',
      icon: 'carbon:calendar',
      hoverIcon: 'carbon:calendar',
      component: 'LazyCalendarManagement',
      props: {
        activeTab: 'table'
      }
    }
  }
})
