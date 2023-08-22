import * as child_process from 'child_process'
import type { context } from '@actions/github'

export const getBranchName = (gitRef: string, pull_request?: (typeof context)['payload']) => {
    const branchName: string = pull_request ? pull_request.head.ref : gitRef.replace('refs/heads/', '')

    return branchName.replaceAll('/', '_').replaceAll('.', '_')
}

/**
 * run `git pull` before writing potentially conflicting files
 * like `data.json`
 */
export const gitPull = async (gitPull: string) => {
    const gitChildProcess = child_process.spawn('git', ['pull'], { stdio: 'inherit', cwd: gitPull })

    await new Promise<void>((resolve, reject) => {
        gitChildProcess.once('error', reject)
        gitChildProcess.once('exit', (code: unknown) => (code === 0 ? resolve() : reject(code)))
    })
}
