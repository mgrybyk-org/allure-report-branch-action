import { isFileExist } from './isFileExists.js'

export const getBranchName = (gitRef: string) => gitRef.replace('refs/heads/', '')

export const shouldWriteRootHtml = async (ghPagesPath: string) => {
    // do noot overwrite index.html in the folder root to avoid conflicts
    const isRootHtmlExisting = await isFileExist(`${ghPagesPath}/index.html`)
    return !isRootHtmlExisting
}
