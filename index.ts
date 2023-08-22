import * as core from '@actions/core'
import * as github from '@actions/github'
import * as io from '@actions/io'
import { writeFolderListing, shouldWriteRootHtml } from './src/writeFolderListing.js'
import {
    getLastRunId,
    writeExecutorJson,
    spawnAllure,
    writeLastRunId,
    updateDataJson,
    writeAllureListing,
    getTestResultIcon,
    isAllureResultsOk,
} from './src/allure.js'
import { getBranchName } from './src/helpers.js'

const baseDir = 'allure-action'

try {
    const runTimestamp = Date.now()

    // vars
    const sourceReportDir = core.getInput('report_dir')
    const ghPagesPath = core.getInput('gh_pages')
    const reportId = core.getInput('report_id')
    const listDirs = core.getInput('list_dirs') == 'true'
    const branchName = getBranchName(github.context.ref, github.context.payload.pull_request)
    const reportBaseDir = `${ghPagesPath}/${baseDir}/${branchName}/${reportId}`

    /**
     * `runId` is unique but won't change on job re-run
     * `runNumber` is not unique and resets from time to time
     * that's why the `runTimestamp` is used to guarantee uniqueness
     */
    const runUniqueId = `${github.context.runId}_${runTimestamp}`
    const reportDir = `${reportBaseDir}/${runUniqueId}`

    // urls
    const githubActionRunUrl = `https://github.com/${github.context.repo.owner}/${github.context.repo.repo}/actions/runs/${github.context.runId}`
    const ghPagesUrl = `https://${github.context.repo.owner}.github.io/${github.context.repo.repo}`
    const ghPagesBaseDir = `${ghPagesUrl}/${baseDir}/${branchName}/${reportId}`
    const ghPagesReportDir = `${ghPagesBaseDir}/${runUniqueId}`

    // log
    console.log({
        report_dir: sourceReportDir,
        gh_pages: ghPagesPath,
        report_id: reportId,
        runUniqueId,
        ref: github.context.ref,
        repo: github.context.repo,
        branchName,
        reportBaseDir,
        reportDir,
        report_url: ghPagesReportDir,
    })

    if (!(await isAllureResultsOk(sourceReportDir))) {
        throw new Error('There were issues with the allure-results, see error above.')
    }

    // action
    await io.mkdirP(reportBaseDir)

    // folder listing
    if (listDirs) {
        if (await shouldWriteRootHtml(ghPagesPath)) {
            await writeFolderListing(ghPagesPath, '.')
        }
        await writeFolderListing(ghPagesPath, baseDir)
        await writeFolderListing(ghPagesPath, `${baseDir}/${branchName}`)
    }

    // process allure report
    const lastRunId = await getLastRunId(reportBaseDir)
    if (lastRunId) {
        await io.cp(`${reportBaseDir}/${lastRunId}/history`, sourceReportDir, { recursive: true })
    }
    await writeExecutorJson(sourceReportDir, {
        runUniqueId,
        buildOrder: github.context.runId,
        buildUrl: githubActionRunUrl,
        reportUrl: ghPagesReportDir,
    })
    await spawnAllure(sourceReportDir, reportDir)
    const results = await updateDataJson(reportBaseDir, reportDir, github.context.runId, runUniqueId)
    await writeAllureListing(reportBaseDir)
    await writeLastRunId(reportBaseDir, github.context.runId, runTimestamp)

    // outputs
    core.setOutput('report_url', ghPagesReportDir)
    core.setOutput('report_history_url', ghPagesBaseDir)
    core.setOutput('test_result', results.testResult)
    core.setOutput('test_result_icon', getTestResultIcon(results.testResult))
    core.setOutput('test_result_passed', results.passed)
    core.setOutput('test_result_failed', results.failed)
    core.setOutput('test_result_total', results.total)
} catch (error) {
    core.setFailed(error.message)
}
