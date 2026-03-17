import { describe, it, expect, vi, beforeAll } from 'vitest'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

// Extend dayjs with customParseFormat plugin for strict date parsing
dayjs.extend(customParseFormat)

// Mock the api module before importing the functions
vi.mock('api', () => ({
  clientApi: {
    api: {
      getCaptureBatchBatchidDetail: vi.fn(),
      postCaptureBatchBatchidOpen: vi.fn(),
      getCaptureBatchBatchidDocDocidDetail: vi.fn(),
      getCaptureProjformsettingId: vi.fn(),
      postCaptureFileQuerycapturefilebypath: vi.fn(),
      postCaptureBatchBatchidDocDocidSaveDraft: vi.fn(),
      postCaptureBatchBatchidDocDocidConfirm: vi.fn(),
      postCaptureBatchBatchidRelease: vi.fn()
    }
  }
}))

// Mock element-plus composable
vi.mock('element-plus/es/components/time-picker/src/composables/use-time-picker.mjs', () => ({
  useOldValue: vi.fn()
}))

// Import the functions after mocking
const { 
  normalizeDocumentData, 
  calculateFamilyClassification, 
  updateDocumentValues 
} = await import('./useBatchDetail')

// Type definitions for test data
interface PriorityScheme {
  PrioritySchemeForElderly?: string
  PrioritySchemeForNewborns?: string
  YouthSchema?: string
}

interface SpecificField {
  HKHS?: string
  HA?: string
  EFAS?: string
  CotForEfasApplication?: string
  CleareesCat?: string
}

interface FamilyMember {
  FamilyMemberPregnanted16Week?: string
  FamilyMemberHKID?: string
}

interface ApplicantInfo {
  ApplicantFemalePregnanted16week?: string
  ApplicantHKID?: string
}

interface Payment {
  PaymentReference?: string
}

interface NewResultJson {
  PriorityScheme?: PriorityScheme
  SpecificField?: SpecificField
  ApplicantFamilyMemberList?: FamilyMember[]
  'Applicant Info'?: ApplicantInfo
  Payment?: Payment
}

interface Detail {
  formTypeCode: 'G' | 'W'
  newResultJson?: NewResultJson
  oldResultJson?: any
  zoneResizeConfig?: any
  applicantNum?: string
  oldValue?: string
  newValue?: string
  formSource?: string
  familyCategory?: string
  familyClass?: string
  priorityIndicator?: string
  statePerson?: string
}

// Helper to create detail object
const createDetail = (
  formTypeCode: 'G' | 'W',
  overrides: Partial<Detail> = {},
  priorityScheme: Partial<PriorityScheme> = {},
  specificField: Partial<SpecificField> = {},
  familyMembers: FamilyMember[] = [],
  applicantInfo: Partial<ApplicantInfo> = {},
  payment: Partial<Payment> = {}
): Detail => ({
  formTypeCode,
  newResultJson: {
    PriorityScheme: {
      PrioritySchemeForElderly: 'N',
      PrioritySchemeForNewborns: 'N',
      YouthSchema: 'N',
      ...priorityScheme
    },
    SpecificField: {
      HKHS: 'N',
      HA: 'N',
      EFAS: 'N',
      ...specificField
    },
    ApplicantFamilyMemberList: familyMembers,
    'Applicant Info': applicantInfo,
    Payment: payment
  },
  applicantNum: '200045',
  oldValue: '',
  newValue: '',
  ...overrides
})

// Helper to create mock setting
const createMockSetting = () => ({
  fieldsSetting: {
    section: [
      { section_id: 'section1', zone: null },
      { section_id: 'section2', zone: null }
    ]
  }
})

describe('Part 1: normalizeDocumentData', () => {
  it('should remove parentheses from HKID fields in newResultJson', () => {
    const detail: any = {
      newResultJson: {
        'Applicant Info': {
          ApplicantHKID: '(A123456)7',
          OtherField: 'value'
        }
      }
    }
    const setting = createMockSetting()

    normalizeDocumentData(detail, setting)

    expect(detail.newResultJson['Applicant Info'].ApplicantHKID).toBe('A1234567')
  })

  it('should remove parentheses from ApplicantChineseName in newResultJson', () => {
    const detail: any = {
      newResultJson: {
        'Applicant Info': {
          ApplicantChineseName: '(陳大文)',
          ApplicantHKID: 'A1234567'
        }
      }
    }
    const setting = createMockSetting()

    normalizeDocumentData(detail, setting)

    expect(detail.newResultJson['Applicant Info'].ApplicantChineseName).toBe('陳大文')
  })

  it('should remove parentheses from oldResultJson', () => {
    const detail: any = {
      oldResultJson: {
        Section1: {
          FamilyMemberHKID: '(B987654)3',
          Name: 'Test'
        }
      }
    }
    const setting = createMockSetting()

    normalizeDocumentData(detail, setting)

    expect(detail.oldResultJson.Section1.FamilyMemberHKID).toBe('B9876543')
  })

  it('should apply zoneResizeConfig to settings sections', () => {
    const detail: any = {
      zoneResizeConfig: {
        section1: { page: 1, zone: '100,200,300,400' }
      }
    }
    const setting = createMockSetting()

    normalizeDocumentData(detail, setting)

    expect(setting.fieldsSetting.section[0].zone).toEqual({ page: 1, zone: '100,200,300,400' })
  })

  it('should handle missing zoneResizeConfig gracefully', () => {
    const detail: any = {}
    const setting = createMockSetting()

    expect(() => normalizeDocumentData(detail, setting)).not.toThrow()
  })

  it('should handle missing newResultJson gracefully', () => {
    const detail: any = {}
    const setting = createMockSetting()

    expect(() => normalizeDocumentData(detail, setting)).not.toThrow()
  })
})

describe('Part 2: calculateFamilyClassification', () => {
  describe('Green Form (G) - Single Person', () => {
    it('should classify as 5E - GS EFAS when HA=Y, EFAS date > 14/04/2023', () => {
      const detail = createDetail('G', {}, {}, {
        HA: 'Y',
        EFAS: 'Y',
        CotForEfasApplication: '15/04/2023'
      })
      const result = calculateFamilyClassification(detail)
      expect(result.familyCategory).toBe('WS - White Single')
      expect(result.familyClass).toBe('5E - GS EFAS')
      expect(result.formSource).toBe('HA - HA Green')
    })

    it('should classify as 6 - GS HA when HA=Y, no EFAS', () => {
      const detail = createDetail('G', {}, {}, {
        HA: 'Y',
        EFAS: 'N'
      })
      const result = calculateFamilyClassification(detail)
      expect(result.familyCategory).toBe('GS - Green Single')
      expect(result.familyClass).toBe('6 - GS HA')
      expect(result.formSource).toBe('HA - HA Green')
    })

    it('should classify as 7 - GS Cert when not HA, not HKHS', () => {
      const detail = createDetail('G', {}, {}, {
        HA: 'N',
        HKHS: 'N'
      })
      const result = calculateFamilyClassification(detail)
      expect(result.familyCategory).toBe('GS - Green Single')
      expect(result.familyClass).toBe('7 - GS Cert')
      expect(result.formSource).toBe('HS - HS Green')
    })

    it('should classify as 8 - GS HS when HKHS=Y', () => {
      const detail = createDetail('G', {}, {}, {
        HKHS: 'Y'
      })
      const result = calculateFamilyClassification(detail)
      expect(result.familyCategory).toBe('GS - Green Single')
      expect(result.familyClass).toBe('8 - GS HS')
      expect(result.formSource).toBe('HS - HS Green')
    })

    it('should classify as 10 - GS 1st Absolute Priority with Cat. 2', () => {
      const detail = createDetail('G', {}, {}, {
        CleareesCat: 'Cat. 2'
      })
      const result = calculateFamilyClassification(detail)
      expect(result.familyCategory).toBe('GS - Green Single')
      expect(result.familyClass).toBe('10 - GS 1st Absolute Priority')
      expect(result.formSource).toBe('HS - HS Green')
    })

    it('should classify as 12 - GS 2nd Absolute Priority with Cat. 4', () => {
      const detail = createDetail('G', {}, {}, {
        CleareesCat: 'Cat. 4'
      })
      const result = calculateFamilyClassification(detail)
      expect(result.familyCategory).toBe('GS - Green Single')
      expect(result.familyClass).toBe('12 - GS 2nd Absolute Priority')
      expect(result.formSource).toBe('HS - HS Green')
    })
  })

  describe('Green Form (G) - Family with Members', () => {
    const familyMember = { FamilyMemberPregnanted16Week: 'N' }

    it('should classify as 1S - GF EFAS Elderly & NB when HA=Y, EFAS valid, elderly+newborn', () => {
      const detail = createDetail('G', {}, {
        PrioritySchemeForElderly: 'Y',
        PrioritySchemeForNewborns: 'Y'
      }, {
        HA: 'Y',
        EFAS: 'Y',
        CotForEfasApplication: '15/04/2023'
      }, [familyMember])
      const result = calculateFamilyClassification(detail)
      expect(result.familyCategory).toBe('GF - Green Family')
      expect(result.familyClass).toBe('1S - GF EFAS Elderly & NB')
      expect(result.priorityIndicator).toBe('Elderly & Newborns')
      expect(result.formSource).toBe('HA - HA Green')
    })

    it('should classify as 2N - GF HA Elderly & NB when HA=Y, no EFAS, elderly only', () => {
      const detail = createDetail('G', {}, {
        PrioritySchemeForElderly: 'Y',
        PrioritySchemeForNewborns: 'N'
      }, {
        HA: 'Y',
        EFAS: 'N'
      }, [familyMember])
      const result = calculateFamilyClassification(detail)
      expect(result.familyCategory).toBe('GF - Green Family')
      expect(result.familyClass).toBe('2N - GF HA Elderly & NB')
      expect(result.priorityIndicator).toBe('Elderly')
      expect(result.formSource).toBe('HA - HA Green')
    })

    it('should classify as 8 - GF HA when HA=Y, no priority schemes', () => {
      const detail = createDetail('G', {}, {}, {
        HA: 'Y',
        EFAS: 'N'
      }, [familyMember])
      const result = calculateFamilyClassification(detail)
      expect(result.familyCategory).toBe('GF - Green Family')
      expect(result.familyClass).toBe('8 - GF HA')
      expect(result.formSource).toBe('HA - HA Green')
    })

    it('should classify as 4N - GF HS Elderly & NB when not HA, elderly+newborn', () => {
      const detail = createDetail('G', {}, {
        PrioritySchemeForElderly: 'Y',
        PrioritySchemeForNewborns: 'Y'
      }, {
        HA: 'N',
        HKHS: 'N'
      }, [familyMember])
      const result = calculateFamilyClassification(detail)
      expect(result.familyCategory).toBe('GF - Green Family')
      expect(result.familyClass).toBe('4N - GF HS Elderly & NB')
      expect(result.priorityIndicator).toBe('Elderly & Newborns')
      expect(result.formSource).toBe('HS - HS Green')
    })

    it('should classify as 4 - GF HS when not HA, no priority', () => {
      const detail = createDetail('G', {}, {}, {
        HA: 'N',
        HKHS: 'N'
      }, [familyMember])
      const result = calculateFamilyClassification(detail)
      expect(result.familyCategory).toBe('GF - Green Family')
      expect(result.familyClass).toBe('4 - GF HS')
      expect(result.formSource).toBe('HS - HS Green')
    })

    it('should classify as 9 - GF 1st Absolute Priority with Cat. 1', () => {
      const detail = createDetail('G', {}, {}, {
        HA: 'Y',
        CleareesCat: 'Cat. 1'
      }, [familyMember])
      const result = calculateFamilyClassification(detail)
      expect(result.familyCategory).toBe('GF - Green Family')
      expect(result.familyClass).toBe('9 - GF 1st Absolute Priority')
      expect(result.formSource).toBe('HS - HS Green')
    })

    it('should classify as 11 - GF 2nd Absolute Priority with Cat. 2', () => {
      const detail = createDetail('G', {}, {}, {
        HA: 'Y',
        CleareesCat: 'Cat. 2'
      }, [familyMember])
      const result = calculateFamilyClassification(detail)
      expect(result.familyCategory).toBe('GF - Green Family')
      expect(result.familyClass).toBe('11 - GF 2nd Absolute Priority')
      expect(result.formSource).toBe('HS - HS Green')
    })

    it('should classify as 10 - GS 1st Absolute Priority (Cat. 2, HA=N)', () => {
      const detail = createDetail('G', {}, {}, {
        HA: 'N',
        CleareesCat: 'Cat. 2'
      }, [familyMember])
      const result = calculateFamilyClassification(detail)
      expect(result.familyCategory).toBe('GS - Green Single')
      expect(result.familyClass).toBe('10 - GS 1st Absolute Priority')
    })

    it('should classify as 3N - GF Cert Elderly & NB when HKHS=Y, elderly+newborn', () => {
      const detail = createDetail('G', {}, {
        PrioritySchemeForElderly: 'Y',
        PrioritySchemeForNewborns: 'Y'
      }, {
        HKHS: 'Y'
      }, [familyMember])
      const result = calculateFamilyClassification(detail)
      expect(result.familyCategory).toBe('GF - Green Family')
      expect(result.familyClass).toBe('3N - GF Cert Elderly & NB')
      expect(result.formSource).toBe('GC - GCert')
    })

    it('should classify as 3 - GF Cert when HKHS=Y, no priority', () => {
      const detail = createDetail('G', {}, {}, {
        HKHS: 'Y'
      }, [familyMember])
      const result = calculateFamilyClassification(detail)
      expect(result.familyCategory).toBe('GF - Green Family')
      expect(result.familyClass).toBe('3 - GF Cert')
      expect(result.formSource).toBe('GC - GCert')
    })
  })

  describe('White Form (W) - Single Person', () => {
    it('should classify as 5Y - WS Youth when youth=Y', () => {
      const detail = createDetail('W', {}, {
        YouthSchema: 'Y'
      })
      const result = calculateFamilyClassification(detail)
      expect(result.familyCategory).toBe('WS - White Single')
      expect(result.familyClass).toBe('5Y - WS Youth')
      expect(result.formSource).toBe('-')
    })

    it('should classify as 5 - WS when no youth', () => {
      const detail = createDetail('W', {}, {
        YouthSchema: 'N'
      })
      const result = calculateFamilyClassification(detail)
      expect(result.familyCategory).toBe('WS - White Single')
      expect(result.familyClass).toBe('5 - WS')
      expect(result.formSource).toBe('-')
    })
  })

  describe('White Form (W) - Family with Members', () => {
    const familyMember = { FamilyMemberPregnanted16Week: 'N' }

    it('should classify as 1N -WF Elderly & NB when elderly+newborn', () => {
      const detail = createDetail('W', {}, {
        PrioritySchemeForElderly: 'Y',
        PrioritySchemeForNewborns: 'Y'
      }, {}, [familyMember])
      const result = calculateFamilyClassification(detail)
      expect(result.familyCategory).toBe('WF- White Family')
      expect(result.familyClass).toBe('1N -WF Elderly & NB')
      expect(result.priorityIndicator).toBe('Elderly & Newborns')
      expect(result.formSource).toBe('-')
    })

    it('should classify as 1N -WF Elderly & NB when elderly only', () => {
      const detail = createDetail('W', {}, {
        PrioritySchemeForElderly: 'Y',
        PrioritySchemeForNewborns: 'N'
      }, {}, [familyMember])
      const result = calculateFamilyClassification(detail)
      expect(result.familyCategory).toBe('WF- White Family')
      expect(result.familyClass).toBe('1N -WF Elderly & NB')
      expect(result.priorityIndicator).toBe('Elderly')
    })

    it('should classify as 1N -WF Elderly & NB when newborn only', () => {
      const detail = createDetail('W', {}, {
        PrioritySchemeForElderly: 'N',
        PrioritySchemeForNewborns: 'Y'
      }, {}, [familyMember])
      const result = calculateFamilyClassification(detail)
      expect(result.familyCategory).toBe('WF- White Family')
      expect(result.familyClass).toBe('1N -WF Elderly & NB')
      expect(result.priorityIndicator).toBe('Newborns')
    })

    it('should classify as 1Y - WF Youth when youth=Y', () => {
      const detail = createDetail('W', {}, {
        YouthSchema: 'Y'
      }, {}, [familyMember])
      const result = calculateFamilyClassification(detail)
      expect(result.familyCategory).toBe('WF- White Family')
      expect(result.familyClass).toBe('1Y - WF Youth')
    })

    it('should classify as 1 - WF when no priority', () => {
      const detail = createDetail('W', {}, {}, {}, [familyMember])
      const result = calculateFamilyClassification(detail)
      expect(result.familyCategory).toBe('WF- White Family')
      expect(result.familyClass).toBe('1 - WF')
    })
  })

  describe('Baby Count Calculation', () => {
    it('should count pregnant family members', () => {
      const detail = createDetail('W', {}, {}, {}, [
        { FamilyMemberPregnanted16Week: 'Y' },
        { FamilyMemberPregnanted16Week: 'N' },
        { FamilyMemberPregnanted16Week: 'Y' }
      ])
      const result = calculateFamilyClassification(detail)
      expect(result.statePerson).toBe('4 + 2') // 3 members + 1 applicant + 2 babies
    })

    it('should count applicant pregnancy', () => {
      const detail = createDetail('W', {}, {}, {}, [], {
        ApplicantFemalePregnanted16week: 'Y'
      })
      const result = calculateFamilyClassification(detail)
      expect(result.statePerson).toBe('1 + 1')
    })

    it('should count both applicant and family member pregnancies', () => {
      const detail = createDetail('W', {}, {}, {}, [
        { FamilyMemberPregnanted16Week: 'Y' }
      ], {
        ApplicantFemalePregnanted16week: 'Y'
      })
      const result = calculateFamilyClassification(detail)
      expect(result.statePerson).toBe('2 + 2')
    })
  })

  describe('EFAS Date Edge Cases', () => {
    const familyMember = { FamilyMemberPregnanted16Week: 'N' }

    it('should return false for date exactly on 14/04/2023', () => {
      const detail = createDetail('G', {}, {}, {
        HA: 'Y',
        EFAS: 'Y',
        CotForEfasApplication: '14/04/2023'
      })
      const result = calculateFamilyClassification(detail)
      // Should NOT trigger EFAS path, should go to regular HA
      expect(result.familyClass).toBe('6 - GS HA')
    })

    it('should return true for date after 14/04/2023', () => {
      const detail = createDetail('G', {}, {}, {
        HA: 'Y',
        EFAS: 'Y',
        CotForEfasApplication: '15/04/2023'
      })
      const result = calculateFamilyClassification(detail)
      expect(result.familyClass).toBe('5E - GS EFAS')
    })

    it('should return false for date before 14/04/2023', () => {
      const detail = createDetail('G', {}, {}, {
        HA: 'Y',
        EFAS: 'Y',
        CotForEfasApplication: '13/04/2023'
      })
      const result = calculateFamilyClassification(detail)
      expect(result.familyClass).toBe('6 - GS HA')
    })

    it('should handle empty EFAS date', () => {
      const detail = createDetail('G', {}, {}, {
        HA: 'Y',
        EFAS: 'Y',
        CotForEfasApplication: ''
      })
      const result = calculateFamilyClassification(detail)
      expect(result.familyClass).toBe('6 - GS HA')
    })

    it('should handle undefined EFAS date', () => {
      const detail = createDetail('G', {}, {}, {
        HA: 'Y',
        EFAS: 'Y'
      })
      const result = calculateFamilyClassification(detail)
      expect(result.familyClass).toBe('6 - GS HA')
    })
  })

  describe('Complete Matrix Test Cases', () => {
    const familyMember = { FamilyMemberPregnanted16Week: 'N' }

    it('Green-0: Family, HA, EFAS>14/4/2023, Elderly+Newborn', () => {
      const detail = createDetail('G', {}, {
        PrioritySchemeForElderly: 'Y',
        PrioritySchemeForNewborns: 'Y'
      }, {
        HA: 'Y',
        EFAS: 'Y',
        CotForEfasApplication: '15/04/2023'
      }, [familyMember])
      const result = calculateFamilyClassification(detail)
      expect(result.familyCategory).toBe('GF - Green Family')
      expect(result.familyClass).toBe('1S - GF EFAS Elderly & NB')
      expect(result.priorityIndicator).toBe('Elderly & Newborns')
    })

    it('Green-5: Family, HA, No EFAS, Elderly+Newborn', () => {
      const detail = createDetail('G', {}, {
        PrioritySchemeForElderly: 'Y',
        PrioritySchemeForNewborns: 'Y'
      }, {
        HA: 'Y',
        EFAS: 'N'
      }, [familyMember])
      const result = calculateFamilyClassification(detail)
      expect(result.familyCategory).toBe('GF - Green Family')
      expect(result.familyClass).toBe('2N - GF HA Elderly & NB')
      expect(result.priorityIndicator).toBe('Elderly & Newborns')
    })

    it('Green-9: Single, HA, EFAS>14/4/2023', () => {
      const detail = createDetail('G', {}, {}, {
        HA: 'Y',
        EFAS: 'Y',
        CotForEfasApplication: '15/04/2023'
      })
      const result = calculateFamilyClassification(detail)
      expect(result.familyCategory).toBe('WS - White Single')
      expect(result.familyClass).toBe('5E - GS EFAS')
    })

    it('White-0: Family, Elderly+Newborn', () => {
      const detail = createDetail('W', {}, {
        PrioritySchemeForElderly: 'Y',
        PrioritySchemeForNewborns: 'Y'
      }, {}, [familyMember])
      const result = calculateFamilyClassification(detail)
      expect(result.familyCategory).toBe('WF- White Family')
      expect(result.familyClass).toBe('1N -WF Elderly & NB')
      expect(result.priorityIndicator).toBe('Elderly & Newborns')
    })

    it('White-3: Family, Youth only', () => {
      const detail = createDetail('W', {}, {
        YouthSchema: 'Y'
      }, {}, [familyMember])
      const result = calculateFamilyClassification(detail)
      expect(result.familyCategory).toBe('WF- White Family')
      expect(result.familyClass).toBe('1Y - WF Youth')
    })

    it('White-5: Single, Youth', () => {
      const detail = createDetail('W', {}, {
        YouthSchema: 'Y'
      })
      const result = calculateFamilyClassification(detail)
      expect(result.familyCategory).toBe('WS - White Single')
      expect(result.familyClass).toBe('5Y - WS Youth')
    })
  })
})

describe('Part 3: updateDocumentValues', () => {
  it('should replace [formClass] placeholder in oldValue', () => {
    const detail: any = {
      oldValue: 'Some text [formClass] more text',
      newResultJson: {
        'Applicant Info': { ApplicantHKID: 'A1234567' },
        ApplicantFamilyMemberList: [],
        Payment: { PaymentReference: 'REF123' }
      },
      applicantNum: '200045'
    }

    updateDocumentValues(detail, '1S - GF EFAS Elderly & NB')

    expect(detail.oldValue).toBe('Some text 1S - GF EFAS Elderly & NB more text')
  })

  it('should not modify oldValue if no [formClass] placeholder', () => {
    const detail: any = {
      oldValue: 'Some text without placeholder',
      newResultJson: {
        'Applicant Info': { ApplicantHKID: 'A1234567' },
        ApplicantFamilyMemberList: [],
        Payment: { PaymentReference: 'REF123' }
      },
      applicantNum: '200045'
    }

    updateDocumentValues(detail, '1S - GF EFAS Elderly & NB')

    expect(detail.oldValue).toBe('Some text without placeholder')
  })

  it('should handle undefined oldValue', () => {
    const detail: any = {
      newResultJson: {
        'Applicant Info': { ApplicantHKID: 'A1234567' },
        ApplicantFamilyMemberList: [],
        Payment: { PaymentReference: 'REF123' }
      },
      applicantNum: '200045'
    }

    expect(() => updateDocumentValues(detail, '1S - GF EFAS Elderly & NB')).not.toThrow()
  })

  it('should build newValue with correct format', () => {
    const detail: any = {
      newResultJson: {
        'Applicant Info': { ApplicantHKID: 'A1234567' },
        ApplicantFamilyMemberList: [],
        Payment: { PaymentReference: 'REF123' }
      },
      applicantNum: '200045'
    }

    updateDocumentValues(detail, '1S - GF EFAS Elderly & NB')

    // Format: <appln no>&<family class>&<ahkid>&<hkics>&<PaymentReference>&<family class>
    expect(detail.newValue).toBe('200045&1S - GF EFAS Elderly & NB&A1234567&&REF123&1S - GF EFAS Elderly & NB')
  })

  it('should include family member HKIDs in newValue', () => {
    const detail: any = {
      newResultJson: {
        'Applicant Info': { ApplicantHKID: 'A1234567' },
        ApplicantFamilyMemberList: [
          { FamilyMemberHKID: 'B7654321' },
          { FamilyMemberHKID: 'C1234567' }
        ],
        Payment: { PaymentReference: 'REF456' }
      },
      applicantNum: '200046'
    }

    updateDocumentValues(detail, '2N - GF HA Elderly & NB')

    expect(detail.newValue).toBe('200046&2N - GF HA Elderly & NB&A1234567&B7654321&C1234567&REF456&2N - GF HA Elderly & NB')
  })

  it('should handle empty FamilyMemberHKID', () => {
    const detail: any = {
      newResultJson: {
        'Applicant Info': { ApplicantHKID: 'A1234567' },
        ApplicantFamilyMemberList: [
          { FamilyMemberHKID: undefined },
          { FamilyMemberHKID: 'C1234567' }
        ],
        Payment: { PaymentReference: 'REF789' }
      },
      applicantNum: '200047'
    }

    updateDocumentValues(detail, '8 - GF HA')

    expect(detail.newValue).toBe('200047&8 - GF HA&A1234567&&C1234567&REF789&8 - GF HA')
  })

  it('should handle missing PaymentReference', () => {
    const detail: any = {
      newResultJson: {
        'Applicant Info': { ApplicantHKID: 'A1234567' },
        ApplicantFamilyMemberList: []
      },
      applicantNum: '200048'
    }

    updateDocumentValues(detail, '5 - WS')

    expect(detail.newValue).toBe('200048&5 - WS&A1234567&&undefined&5 - WS')
  })
})

// Run tests with: pnpm vitest run packages/dp-scan/composables/useBatchDetail.test.ts
