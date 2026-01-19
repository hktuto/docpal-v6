import {nanoid} from 'nanoid'

export function createFieldId(length: number = 8): string {
  return nanoid(length)
}
