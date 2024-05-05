import * as path from 'path'
import * as fs from 'fs/promises'
import { latestReport } from './report_latest.js'
import { checkRealPath } from './fileUtils.js'

export const writeLatestReport = async (relPath: string) => {
    const filePath = path.join(relPath, 'latest.html')
    await checkRealPath(filePath)
    await fs.writeFile(filePath, latestReport)
}
