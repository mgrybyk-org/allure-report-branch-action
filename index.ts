import * as core from '@actions/core'
import * as github from '@actions/github'
import * as io from '@actions/io'
import * as child_process from 'child_process'
import { isFileExist } from './src/isFileExists.js'
import { writeFolderListing } from './src/writeFolderListing.js'

const baseDir = 'allure-action'
const getBranchName = (gitRef: string) => gitRef.replace('refs/heads/', '')

const spawnAllure = async (allureResultsDir: string, allureReportDir: string) => {
    const allureChildProcess = child_process.spawn('/allure-commandline/bin/allure', [
        'generate',
        '--clean',
        allureResultsDir,
        '-o',
        allureReportDir,
    ])
    const generation = new Promise<void>((resolve, reject) => {
        allureChildProcess.once('error', reject)
        allureChildProcess.once('exit', (code: unknown) => (code === 0 ? resolve() : reject(code)))
    })

    return generation
}

try {
    // vars
    const sourceReportDir = core.getInput('report_dir')
    const ghPagesPath = core.getInput('gh_pages')
    const reportId = core.getInput('report_id')
    const branchName = getBranchName(github.context.ref)
    const reportBaseDir = `${ghPagesPath}/${baseDir}/${branchName}/${reportId}`
    const reportDir = `${reportBaseDir}/${github.context.runId}`

    // log
    console.table({ ghPagesPath, sourceReportDir, reportId, branchName, reportBaseDir, reportDir, gitref: github.context.ref })
    // context
    const toLog = { ...github.context } as Record<string, unknown>
    delete toLog.payload
    console.log('toLog', toLog)

    // action
    await io.mkdirP(reportBaseDir)

    // folder listing
    // do noot overwrite index.html in the folder root to avoid conflicts
    if (!(await isFileExist(`${ghPagesPath}/index.html`))) {
        await writeFolderListing(ghPagesPath, '.')
    }
    await writeFolderListing(ghPagesPath, baseDir)

    // process report
    await spawnAllure(sourceReportDir, reportDir)
    // generate index.html and data
    await writeFolderListing(ghPagesPath, `${baseDir}/${branchName}`)
} catch (error) {
    core.setFailed(error.message)
}
