export default defineAppConfig({
  appMenu: [
    {
      name: 'client-work-panel',
      children: [
        {
          name: 'client-home-sub-list'
        }
      ]
    },

    // browse
    {
      name: 'client-browse',
      icon: 'dp-icon:browse-outline',
      hoverIcon: 'dp-icon:browse-fill',
      children: [
        {
          name: 'client-browse'
        },
        {
          name: 'client-collections'
        },
        {
          name: 'client-ai-upload'
        },
        {
          name: 'client-fileRequest'
        },

        {
          name: 'client-folder-cabinet'
        }
      ]
    },
    {
      name: 'client-search'
    },
    {
      label: 'share.share',
      icon: 'lucide:share-2',
      children: [
        {
          name: 'client-share'
        },
        {
          name: 'client-share-me'
        },
        {
          name: 'client-share-other'
        }
      ]
    },
    {
      name: 'client-trash'
    },
    // {
    //     name: "client-smartFolder"
    // },

    // {
    //   name: 'client-workflow'
    // },
    {
      name: 'client-new-workflow'
    },
    {
      label: 'client_retention_item',
      icon: 'ic:outline-lock-clock',
      children: [
        {
          name: 'client-retention'
        },
        {
          name: 'client-holdPolicies'
        }
      ]
    },

    {
      name: 'client-master-table'
    },
    // {
    //   name: 'client-dashboard'
    // },

    {
      name: 'client-easy-form'
    },
    {
      name: 'user-role-file-action'
    },
    {
      name: 'RBAC-client-page'
    },
    {
      name: 'contact-book'
    },
    {
      name: 'client-scan'
    },
    {
      name:"dynamic-db"
    }
  ],
  adminMenu: [
    {
      name: '',
      icon: 'tabler:align-box-right-bottom',
      hoverIcon: 'tabler:align-box-right-bottom-filled',
      label: 'User',
      children: [
        {
          name: 'admin-user'
        },
        {
          name: 'admin-group'
        },
        {
          name: 'RBAC-editor'
        },
        {
          name: 'RBAC-page'
        },
        {
          name: 'admin-profile-setting'
        },
        {
          name: 'admin-setting'
        },
        {
          name: 'admin-company-profile'
        },
        {
          name: 'contact-book'
        }
      ]
    },
    {
      label: 'adminMenu.browse',
      icon: 'ri:folder-5-line',
      hoverIcon: 'ri:folder-5-line',
      children: [
        {
          name: 'admin-smart-folder'
        },
        {
          name: 'admin-document-type'
        },
        {
          name: 'admin-metadata-list'
        },
        {
          name: 'admin-folder-cabinet'
        },
        {
          name: 'admin-dam'
        },
        {
          name: 'admin-watermark'
        },
        {
          name: 'admin-work-panel'
        },
        {
          name: 'admin-master-table'
        }
      ]
    },
    {
      label: 'adminMenu.shareModule',
      icon: 'lucide:share-2',
      hoverIcon: 'lucide:share-2',
      children: [
        {
          name: 'admin-internal-share'
        },
        {
          name: 'admin-external-share'
        }
        // {
        //     name: 'admin-share-list'
        // }
      ]
    },
    // {
    //   label: 'adminMenu.workflow',
    //   icon: 'dp-icon:flow-outline',
    //   children: [
    //     {
    //       name: 'admin-workflow-manage'
    //     },
    //     {
    //       name: 'admin-workflow-retry'
    //     },
    //     {
    //       name: 'admin-workflow-editor'
    //     }
    //     // {
    //     //     name: "super-workflow-form"
    //     // }
    //   ]
    // },
    {
      label: 'adminMenu.workflow',
      icon: 'dp-icon:flow-outline',
      children: [
        { name: 'admin-new-workflow-manage' },
        { name: 'admin-new-workflow-edit-manage' }
      ]
    },
    {
      label: 'adminMenu.templateManagement',
      icon: 'lucide:layout-template',
      children: [
        {
          name: 'admin-document-template'
        },
        {
          name: 'admin-email-template'
        },
        {
          name: 'admin-message-template'
        }
      ]
    },

    {
      label: 'client_retention_item',
      icon: 'lucide:book-lock',
      children: [
        {
          name: 'admin-hold-policies'
        },
        {
          name: 'admin-retention-policies'
        }
      ]
    },
    {
      label: 'adminMenu.system',
      icon: 'lucide:server',
      children: [
        {
          name: 'admin-acl'
        },
        {
          name: 'admin-external-connection'
        },
        {
          name: 'admin-password-policy'
        },
        // {
        //   name: 'admin-log-manage'
        // },
        {
          name: 'admin-audit'
        },
        {
          name: 'admin-message-queue'
        },
        {
          name: 'admin-mail-config'
        }
      ]
    },
    {
      name: 'admin-unique-id-generator'
    },

    {
      name: 'admin-external-storage'
    },
    {
      name: 'admin-import-jobs'
    },

    {
      name: 'admin-azure'
    },

    {
      name: 'admin-easy-form'
    },
    // {
    //   name: 'admin-calendar-setting'
    // },
    {
      name: 'admin-scan'
    }
  ]
})
