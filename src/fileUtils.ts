import * as path from 'path'
import * as fs from 'fs/promises'

const ROOT = process.cwd()
console.log('log', ROOT, __dirname) // TODO DELETE

export const checkRealPath = async (filePath: string) => {
    filePath = await fs.realpath(path.join(ROOT, filePath))
    if (!filePath.startsWith(ROOT)) {
        throw new Error(`CodeQL: js/path-injection. Not allowed path provided: ${filePath}`)
    }
}

export const isFileExist = async (filePath: string) => {
    await checkRealPath(filePath)
    try {
        await fs.access(filePath, 0)
        return true
    } catch (err) {
        return false
    }
}
