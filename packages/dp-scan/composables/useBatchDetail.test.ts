import { describe, it, expect } from 'vitest'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

// Extend dayjs with customParseFormat plugin for strict date parsing
dayjs.extend(customParseFormat)

// Extract the family classification logic for testing
// This mirrors the logic in useBatchDetail.ts DocumentInitFunctionBackup

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
}

interface ApplicantInfo {
  ApplicantFemalePregnanted16week?: string
}

interface NewResultJson {
  PriorityScheme?: PriorityScheme
  SpecificField?: SpecificField
  ApplicantFamilyMemberList?: FamilyMember[]
  'Applicant Info'?: ApplicantInfo
}

interface Detail {
  formTypeCode: 'G' | 'W'
  newResultJson?: NewResultJson
}

interface ClassificationResult {
  familyCategory: string
  familyClass: string
  priorityIndicator: string
  formSource: string
  statePerson: string
}

// Helper functions (mirroring the implementation)
const isEfasAfterTargetDate = (dateStr: string | undefined): boolean => {
  if (!dateStr) return false
  const EFAS_date = dayjs(dateStr, 'DD/MM/YYYY', true)
  const Target_date = dayjs('14/04/2023', 'DD/MM/YYYY', true)
  if (!EFAS_date.isValid()) return false
  return EFAS_date.isAfter(Target_date)
}

const isCat = (cleareesCat: string | undefined, cat: string): boolean => {
  return cleareesCat === `Cat. ${cat}`
}

// Main classification function (extracted from DocumentInitFunctionBackup)
function calculateFamilyClassification(detail: Detail): ClassificationResult {
  const newResultJson = detail.newResultJson || {}
  const priorityScheme = newResultJson.PriorityScheme || {}
  const specificField = newResultJson.SpecificField || {}

  const { PrioritySchemeForElderly = 'N', PrioritySchemeForNewborns = 'N', YouthSchema = 'N' } = priorityScheme
  const { HKHS = 'N', HA = 'N', EFAS = 'N', CotForEfasApplication: EFAS_COT, CleareesCat } = specificField

  const familyMembers = newResultJson.ApplicantFamilyMemberList || []
  const pplCount = familyMembers.length + 1
  const hasFamilyMember = familyMembers.length > 0

  let babyCount = familyMembers.reduce((acc, curr) => {
    if (curr.FamilyMemberPregnanted16Week === 'Y') {
      return acc + 1
    }
    return acc
  }, 0)

  if (newResultJson['Applicant Info']?.ApplicantFemalePregnanted16week === 'Y') {
    babyCount++
  }

  let FamilyClass = ''
  let FamilyCategory = ''
  let PriorityIndicator = ''
  let FormSource = ''

  const elderly = PrioritySchemeForElderly === 'Y'
  const newborn = PrioritySchemeForNewborns === 'Y'
  const youth = YouthSchema === 'Y'

  if (detail.formTypeCode === 'G') {
    // Green Form logic
    if (hasFamilyMember) {
      // Family with members (pplCount > 1)
      if (HKHS === 'N') {
        if (HA === 'Y' && (!CleareesCat || CleareesCat === '')) {
          // HA Green Form Family (no CleareesCat)
          if (EFAS === 'Y' && isEfasAfterTargetDate(EFAS_COT)) {
            // EFAS with date after 14/4/2023
            if (elderly && newborn) {
              FamilyCategory = 'GF - Green Family'
              FamilyClass = '1S - GF EFAS Elderly & NB'
              PriorityIndicator = 'Elderly & Newborns'
            } else if (elderly) {
              FamilyCategory = 'GF - Green Family'
              FamilyClass = '1S - GF EFAS Elderly & NB'
              PriorityIndicator = 'Elderly'
            } else if (newborn) {
              FamilyCategory = 'GF - Green Family'
              FamilyClass = '1S - GF EFAS Elderly & NB'
              PriorityIndicator = 'Newborns'
            } else {
              FamilyCategory = 'GF - Green Family'
              FamilyClass = '3E - GF EFAS'
              PriorityIndicator = ''
            }
            FormSource = 'HA - HA Green'
          } else {
            // Regular HA
            if (elderly && newborn) {
              FamilyCategory = 'GF - Green Family'
              FamilyClass = '2N - GF HA Elderly & NB'
              PriorityIndicator = 'Elderly & Newborns'
            } else if (elderly) {
              FamilyCategory = 'GF - Green Family'
              FamilyClass = '2N - GF HA Elderly & NB'
              PriorityIndicator = 'Elderly'
            } else if (newborn) {
              FamilyCategory = 'GF - Green Family'
              FamilyClass = '2N - GF HA Elderly & NB'
              PriorityIndicator = 'Newborns'
            } else {
              FamilyCategory = 'GF - Green Family'
              FamilyClass = '8 - GF HA'
              PriorityIndicator = ''
            }
            FormSource = 'HA - HA Green'
          }
        } else if (HA === 'Y' && isCat(CleareesCat, '1')) {
          // HA with Cat. 1
          FamilyCategory = 'GF - Green Family'
          FamilyClass = '9 - GF 1st Absolute Priority'
          PriorityIndicator = ''
          FormSource = 'HS - HS Green'
        } else if (HA === 'Y' && isCat(CleareesCat, '2')) {
          // HA with Cat. 2
          FamilyCategory = 'GF - Green Family'
          FamilyClass = '11 - GF 2nd Absolute Priority'
          PriorityIndicator = ''
          FormSource = 'HS - HS Green'
        } else if (HA === 'Y' && isCat(CleareesCat, '3')) {
          // HA with Cat. 3
          FamilyCategory = 'GF - Green Family'
          FamilyClass = '11 - GF 2nd Absolute Priority'
          PriorityIndicator = ''
          FormSource = 'HS - HS Green'
        } else if ((HA === 'Y' && isCat(CleareesCat, '4')) || HA !== 'Y') {
          // HS Green Form: HA with Cat. 4, or not HA
          if (!CleareesCat || CleareesCat === '' || isCat(CleareesCat, '1')) {
            if (elderly && newborn) {
              FamilyCategory = 'GF - Green Family'
              FamilyClass = '4N - GF HS Elderly & NB'
              PriorityIndicator = 'Elderly & Newborns'
            } else if (elderly) {
              FamilyCategory = 'GF - Green Family'
              FamilyClass = '4N - GF HS Elderly & NB'
              PriorityIndicator = 'Elderly'
            } else if (newborn) {
              FamilyCategory = 'GF - Green Family'
              FamilyClass = '4N - GF HS Elderly & NB'
              PriorityIndicator = 'Newborns'
            } else {
              FamilyCategory = 'GF - Green Family'
              FamilyClass = '4 - GF HS'
              PriorityIndicator = ''
            }
            FormSource = 'HS - HS Green'
          } else if (isCat(CleareesCat, '2')) {
            FamilyCategory = 'GS - Green Single'
            FamilyClass = '10 - GS 1st Absolute Priority'
            PriorityIndicator = ''
            FormSource = 'HS - HS Green'
          } else if (isCat(CleareesCat, '3')) {
            FamilyCategory = 'GF - Green Family'
            FamilyClass = '11 - GF 2nd Absolute Priority'
            PriorityIndicator = ''
            FormSource = 'HS - HS Green'
          } else if (isCat(CleareesCat, '4')) {
            FamilyCategory = 'GS - Green Single'
            FamilyClass = '12 - GS 2nd Absolute Priority'
            PriorityIndicator = ''
            FormSource = 'HS - HS Green'
          }
        }
      } else {
        // HKHS === 'Y'
        if (!CleareesCat || CleareesCat === '') {
          if (elderly && newborn) {
            FamilyCategory = 'GF - Green Family'
            FamilyClass = '3N - GF Cert Elderly & NB'
            PriorityIndicator = 'Elderly & Newborns'
          } else if (elderly) {
            FamilyCategory = 'GF - Green Family'
            FamilyClass = '3N - GF Cert Elderly & NB'
            PriorityIndicator = 'Elderly'
          } else if (newborn) {
            FamilyCategory = 'GF - Green Family'
            FamilyClass = '3N - GF Cert Elderly & NB'
            PriorityIndicator = 'Newborns'
          } else {
            FamilyCategory = 'GF - Green Family'
            FamilyClass = '3 - GF Cert'
            PriorityIndicator = ''
          }
          FormSource = 'GC - GCert'
        } else if (isCat(CleareesCat, '1')) {
          FamilyCategory = 'GF - Green Family'
          FamilyClass = '9 - GF 1st Absolute Priority'
          PriorityIndicator = ''
          FormSource = 'HS - HS Green'
        } else if (isCat(CleareesCat, '2')) {
          FamilyCategory = 'GS - Green Single'
          FamilyClass = '10 - GS 1st Absolute Priority'
          PriorityIndicator = ''
          FormSource = 'HS - HS Green'
        } else if (isCat(CleareesCat, '3')) {
          FamilyCategory = 'GF - Green Family'
          FamilyClass = '11 - GF 2nd Absolute Priority'
          PriorityIndicator = ''
          FormSource = 'HS - HS Green'
        } else if (isCat(CleareesCat, '4')) {
          FamilyCategory = 'GS - Green Single'
          FamilyClass = '12 - GS 2nd Absolute Priority'
          PriorityIndicator = ''
          FormSource = 'HS - HS Green'
        }
      }
    } else {
      // Single person (pplCount === 1)
      if (HKHS === 'N') {
        if (HA === 'Y') {
          if (!CleareesCat || CleareesCat === '') {
            if (EFAS === 'Y' && isEfasAfterTargetDate(EFAS_COT)) {
              FamilyCategory = 'WS - White Single'
              FamilyClass = '5E - GS EFAS'
              PriorityIndicator = ''
              FormSource = 'HA - HA Green'
            } else {
              FamilyCategory = 'GS - Green Single'
              FamilyClass = '6 - GS HA'
              PriorityIndicator = ''
              FormSource = 'HA - HA Green'
            }
          }
        } else {
          // Not HA - check Clearees category
          if (!CleareesCat || CleareesCat === '') {
            FamilyCategory = 'GS - Green Single'
            FamilyClass = '7 - GS Cert'
            PriorityIndicator = ''
            FormSource = 'HS - HS Green'
          } else if (isCat(CleareesCat, '1')) {
            FamilyCategory = 'GF - Green Family'
            FamilyClass = '9 - GF 1st Absolute Priority'
            PriorityIndicator = ''
            FormSource = 'HS - HS Green'
          } else if (isCat(CleareesCat, '2')) {
            FamilyCategory = 'GS - Green Single'
            FamilyClass = '10 - GS 1st Absolute Priority'
            PriorityIndicator = ''
            FormSource = 'HS - HS Green'
          } else if (isCat(CleareesCat, '3')) {
            FamilyCategory = 'GF - Green Family'
            FamilyClass = '11 - GF 2nd Absolute Priority'
            PriorityIndicator = ''
            FormSource = 'HS - HS Green'
          } else if (isCat(CleareesCat, '4')) {
            FamilyCategory = 'GS - Green Single'
            FamilyClass = '12 - GS 2nd Absolute Priority'
            PriorityIndicator = ''
            FormSource = 'HS - HS Green'
          }
        }
      } else {
        // HKHS === 'Y'
        if (!CleareesCat || CleareesCat === '') {
          FamilyCategory = 'GS - Green Single'
          FamilyClass = '8 - GS HS'
          PriorityIndicator = ''
          FormSource = 'HS - HS Green'
        } else if (isCat(CleareesCat, '1')) {
          FamilyCategory = 'GF - Green Family'
          FamilyClass = '9 - GF 1st Absolute Priority'
          PriorityIndicator = ''
          FormSource = 'HS - HS Green'
        } else if (isCat(CleareesCat, '2')) {
          FamilyCategory = 'GS - Green Single'
          FamilyClass = '10 - GS 1st Absolute Priority'
          PriorityIndicator = ''
          FormSource = 'HS - HS Green'
        } else if (isCat(CleareesCat, '3')) {
          FamilyCategory = 'GF - Green Family'
          FamilyClass = '11 - GF 2nd Absolute Priority'
          PriorityIndicator = ''
          FormSource = 'HS - HS Green'
        } else if (isCat(CleareesCat, '4')) {
          FamilyCategory = 'GS - Green Single'
          FamilyClass = '12 - GS 2nd Absolute Priority'
          PriorityIndicator = ''
          FormSource = 'HS - HS Green'
        }
      }
    }
  }

  if (detail.formTypeCode === 'W') {
    // White Form logic
    if (hasFamilyMember) {
      // Family with members
      if (elderly && newborn) {
        FamilyCategory = 'WF- White Family'
        FamilyClass = '1N -WF Elderly & NB'
        PriorityIndicator = 'Elderly & Newborns'
      } else if (elderly) {
        FamilyCategory = 'WF- White Family'
        FamilyClass = '1N -WF Elderly & NB'
        PriorityIndicator = 'Elderly'
      } else if (newborn) {
        FamilyCategory = 'WF- White Family'
        FamilyClass = '1N -WF Elderly & NB'
        PriorityIndicator = 'Newborns'
      } else if (youth) {
        FamilyCategory = 'WF- White Family'
        FamilyClass = '1Y - WF Youth'
        PriorityIndicator = ''
      } else {
        FamilyCategory = 'WF- White Family'
        FamilyClass = '1 - WF'
        PriorityIndicator = ''
      }
    } else {
      // Single person
      if (youth) {
        FamilyCategory = 'WS - White Single'
        FamilyClass = '5Y - WS Youth'
        PriorityIndicator = ''
      } else {
        FamilyCategory = 'WS - White Single'
        FamilyClass = '5 - WS'
        PriorityIndicator = ''
      }
    }
    FormSource = '-'
  }

  const Person = pplCount + ' + ' + babyCount

  return {
    familyCategory: FamilyCategory,
    familyClass: FamilyClass,
    priorityIndicator: PriorityIndicator,
    formSource: FormSource,
    statePerson: Person
  }
}

// Test suite
describe('Family Classification Logic', () => {
  // Helper to create detail object
  const createDetail = (
    formTypeCode: 'G' | 'W',
    overrides: Partial<Detail> = {},
    priorityScheme: Partial<PriorityScheme> = {},
    specificField: Partial<SpecificField> = {},
    familyMembers: FamilyMember[] = [],
    applicantInfo: Partial<ApplicantInfo> = {}
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
      'Applicant Info': applicantInfo
    },
    ...overrides
  })

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
    // These tests verify specific scenarios from the Excel matrix
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

// Run tests with: pnpm vitest run packages/dp-scan/composables/useBatchDetail.test.ts
