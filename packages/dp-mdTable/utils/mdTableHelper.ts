import {nanoid} from 'nanoid'

export function createFieldId(length: number = 8): string {
  return nanoid(length)
}
export const timezoneOptions = [
  { label: 'UTC', value: 'UTC', offset: 0, }, 
  { label: 'Asia/Shanghai', value: 'Asia/Shanghai', offset: -8 }, 
  { label: 'America/New_York', value: 'America/New_York', offset: 5 },
  { label: 'Europe/London', value: 'Europe/London', offset: -1 }
]
