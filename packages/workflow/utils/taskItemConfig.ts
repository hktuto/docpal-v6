export const getTaskItemConfig = {
  UserTask: {
    human_task: {
      assignee: '${__system__user_creator_id}',
      candidate_users: [],
      candidate_roles: [],
      candidate_groups: [],
      due_date: '',
      priority: 5,
      escalation: {
        //   escalation_time: '',
        //   escalation_action: '',
        //   escalation_target: ''
      },
      form_key: '',
      form_title: '',
      form_fields: [],
      ui_schema: {}
    },
    input_mapping: {},
    output_mapping: {}
  },
  ConditionTask: {
    condition: {
      relation: 'AND',
      conditions: []
    },
    input_mapping: {},
    output_mapping: {}
  },
  TransformTask: {
    mappings: {},
    operations: [],
    input_mapping: {},
    output_mapping: {}
  },
  SubProcess: {
    processDefinitionId: '',
    variables: {}
  },
  ValidateTask: {
    rules: [],
    input_mapping: {},
    output_mapping: {}
  },
  MessageTask: {
    email: {
      method: 'POST',
      url: `${getUrlOrigin()}/api/dms/facade/email/send`,
      headers: generatorHTTPRequestTaskHeaders(),
      to: [],
      cc: [],
      subject: '',
      body: ''
    },
    input_mapping: {},
    output_mapping: {}
  },
  ScriptTask: {
    script: {
      language: 'javascript',
      script: ''
    },
    input_mapping: {},
    output_mapping: {}
  },
  // http task
  UploadFile: {
    http_request: {
      method: 'POST',
      url: `${getUrlOrigin()}/api/dms/facade/document/creation`,
      headers: generatorHTTPRequestTaskHeaders(),
      body: {
        parentPath: '',
        name: '',
        type: 'File',
        fileContentId: '',
        creator: '',
        properties: {}
      }
    },
    input_mapping: {},
    output_mapping: {}
  },
  UniqueIdGenerator: {
    http_request: {
      method: 'POST',
      url: `${getUrlOrigin()}/api/dms/facade/id-template/generate`,
      headers: generatorHTTPRequestTaskHeaders(),
      body: {
        templateId: '',
        variables: {}
      }
    },
    input_mapping: {},
    output_mapping: {}
  },
  FilingDocuments: {
    http_request: {
      method: 'POST',
      url: `${getUrlOrigin()}/api/dms/facade/filing-document`,
      headers: generatorHTTPRequestTaskHeaders(),
      body: {
        folderCabinetId: '',
        folderCabinet: []
      },
      timeout: 5000
    },
    input_mapping: {},
    output_mapping: {}
  },
  DocumentGenerationTask: {
    http_request: {
      method: 'POST',
      url: `${getUrlOrigin()}/api/dms/facade/document/template/generate`,
      headers: generatorHTTPRequestTaskHeaders(),
      body: {
        templateId: '',
        parentPath: '',
        name: '',
        type: 'File',
        creator: '',
        variables: {}
      }
    },
    input_mapping: {},
    output_mapping: {}
  },
  HTTPTask: {
    http_request: {
      method: 'GET',
      url: '',
      headers: {},
      body: {}
    },
    input_mapping: {},
    output_mapping: {}
  },
  InsertDynamicDatabase: {
    http_request: {
      method: 'POST',
      url: `${getUrlOrigin()}/apis/v1/dynamic-db/table//record`,
      headers: generatorHTTPRequestTaskHeaders(),
      body: {}
    },
    input_mapping: {},
    output_mapping: {}
  },
  BatchInsertDynamicDatabase: {
    http_request: {
      method: 'POST',
      url: `${getUrlOrigin()}/apis/v1/dynamic-db/table//record/batch-transactional`,
      headers: generatorHTTPRequestTaskHeaders(),
      body: {
        data: '',
        mapping: {}
      }
    },
    input_mapping: {},
    output_mapping: {}
  },
  UpdateDynamicDatabase: {
    http_request: {
      method: 'PUT',
      url: `${getUrlOrigin()}/apis/v1/dynamic-db/table//record/`,
      headers: generatorHTTPRequestTaskHeaders(),
      body: {}
    },
    input_mapping: {},
    output_mapping: {}
  },
  BatchUpdateDynamicDatabase: {
    http_request: {
      method: 'POST',
      url: `${getUrlOrigin()}/apis/v1/dynamic-db/table//record/batch-update`,
      headers: generatorHTTPRequestTaskHeaders(),
      body: {
        data: '',
        mapping: {}
      }
    },
    input_mapping: {},
    output_mapping: {}
  },
  EmailTask: {
    http_request: {
      method: 'POST',
      url: `${getUrlOrigin()}/api/dms/facade/email/send`,
      headers: generatorHTTPRequestTaskHeaders(),
      body: {
        tos: [],
        ccs: [],
        bcc: [],
        templateId: '',
        attachmentsFilePath: '',
        variables: {}
      }
    },
    input_mapping: {},
    output_mapping: {}
  }
}

export function getUrlOrigin() {
  const {
    public: {
      endPoint: { clientUrl }
    }
  } = useRuntimeConfig()
  return clientUrl
}

export function generatorHTTPRequestTaskHeaders() {
  // 從authApp的nuxt.config中獲取
  const {
    public: { serverName, serverKey, xApiKey, xTenantId }
  } = useRuntimeConfig()

  return {
    'Content-Type': 'application/json',
    ServerName: serverName,
    ServerKey: serverKey,
    'x-api-key': xApiKey,
    'x-tenant-id': xTenantId
  }
}
