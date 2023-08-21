import * as core from '@actions/core'
import * as github from '@actions/github'
import * as io from '@actions/io'
import { writeFolderListing } from './src/writeFolderListing.js'
import { getLastRunId, writeExecutorJson, spawnAllure, writeLastRunId, updateDataJson, writeAllureListing } from './src/allure.js'
import { getBranchName, shouldWriteRootHtml } from './src/helpers.js'

const baseDir = 'allure-action'

try {
    const runTimestamp = Date.now()

    // vars
    const sourceReportDir = core.getInput('report_dir')
    const ghPagesPath = core.getInput('gh_pages')
    const reportId = core.getInput('report_id')
    const branchName = getBranchName(github.context.ref)
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
        repo: github.context.repo,
        branchName,
        reportBaseDir,
        reportDir,
        report_url: ghPagesReportDir,
    })

    // action
    core.setOutput('report_url', ghPagesReportDir)

    await io.mkdirP(reportBaseDir)

    // folder listing
    if (await shouldWriteRootHtml(ghPagesPath)) {
        await writeFolderListing(ghPagesPath, '.')
    }
    await writeFolderListing(ghPagesPath, baseDir)

    // process report
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
    await updateDataJson(reportBaseDir, reportDir, github.context.runId, runUniqueId)
    await writeAllureListing(reportBaseDir)
    await writeLastRunId(reportBaseDir, github.context.runId, runTimestamp)
} catch (error) {
    core.setFailed(error.message)
}
