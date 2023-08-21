import type { context } from '@actions/github'
import { isFileExist } from './isFileExists.js'

export const getBranchName = (gitRef: string, pull_request?: (typeof context)['payload']) => {
    const branchName: string = pull_request ? pull_request.head.ref : gitRef.replace('refs/heads/', '')

    return branchName.replaceAll('/', '_').replaceAll('.', '_')
}

export const shouldWriteRootHtml = async (ghPagesPath: string) => {
    // do noot overwrite index.html in the folder root to avoid conflicts
    const isRootHtmlExisting = await isFileExist(`${ghPagesPath}/index.html`)
    return !isRootHtmlExisting
}
