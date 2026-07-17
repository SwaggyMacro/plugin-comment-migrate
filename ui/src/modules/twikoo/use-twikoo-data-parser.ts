import type { MigrateData } from '@/types'
import { parseTwikooComments } from './parse-twikoo-comments'
import type { Data } from './types'

interface UseTwikooDataParserReturn {
  parse: () => Promise<MigrateData>
}

export function useTwikooDataParser(file: File): UseTwikooDataParserReturn {
  const parse = (): Promise<MigrateData> => {
    return new Promise<MigrateData>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const twikooRawData = JSON.parse(event.target?.result as string) as Data[]
          if (!Array.isArray(twikooRawData)) {
            throw new Error('No data found')
          }

          resolve({
            comments: parseTwikooComments(twikooRawData),
          })
        } catch (error) {
          reject('Failed to parse data. error -> ' + error)
        }
      }
      reader.onerror = () => {
        reject('Failed to fetch data')
      }
      reader.readAsText(file)
    })
  }

  return { parse }
}
