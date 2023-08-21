import * as child_process from 'child_process'
import * as fs from 'fs/promises'
import { allureReport } from './report_allure.js'
import { isFileExist } from './isFileExists.js'

export const writeExecutorJson = async (
    sourceReportDir: string,
    {
        buildUrl,
        buildOrder,
        reportUrl,
        runUniqueId,
    }: {
        buildUrl: string
        runUniqueId: string
        buildOrder: number
        reportUrl: string
    }
) => {
    const dataFile = `${sourceReportDir}/executor.json`
    const dataJson: AllureExecutor = {
        // type is required, otherwise allure fails with java.lang.NullPointerException
        type: 'github',
        // adds link to GitHub Actions Run
        name: 'GitHub Actions',
        buildName: `Run ${runUniqueId}`,
        buildUrl,
        // required to open previous report in TREND
        reportUrl,
        buildOrder,
    }
    await fs.writeFile(dataFile, JSON.stringify(dataJson, null, 2))
}

export const spawnAllure = async (allureResultsDir: string, allureReportDir: string) => {
    const allureChildProcess = child_process.spawn(
        '/allure-commandline/bin/allure',
        ['generate', '--clean', allureResultsDir, '-o', allureReportDir],
        { stdio: 'inherit' }
    )
    const generation = new Promise<void>((resolve, reject) => {
        allureChildProcess.once('error', reject)
        allureChildProcess.once('exit', (code: unknown) => (code === 0 ? resolve() : reject(code)))
    })

    return generation
}

export const getLastRunId = async (reportBaseDir: string) => {
    const dataFile = `${reportBaseDir}/lastRun.json`

    if (await isFileExist(dataFile)) {
        const lastRun: LastRunJson = JSON.parse((await fs.readFile(dataFile)).toString('utf-8'))
        return `${lastRun.runId}_${lastRun.runTimestamp}`
    } else {
        return null
    }
}

export const writeLastRunId = async (reportBaseDir: string, runId: number, runTimestamp: number) => {
    const dataFile = `${reportBaseDir}/lastRun.json`

    const dataJson: LastRunJson = { runId, runTimestamp }

    await fs.writeFile(dataFile, JSON.stringify(dataJson, null, 2))
}

export const updateDataJson = async (reportBaseDir: string, reportDir: string, runId: number, runUniqueId: string) => {
    const summaryJson: AllureSummaryJson = JSON.parse((await fs.readFile(`${reportDir}/widgets/summary.json`)).toString('utf-8'))
    const dataFile = `${reportBaseDir}/data.json`
    let dataJson: AllureRecord[]

    if (await isFileExist(dataFile)) {
        dataJson = JSON.parse((await fs.readFile(dataFile)).toString('utf-8'))
    } else {
        dataJson = []
    }

    const testResult: AllureRecordTestResult =
        summaryJson.statistic.broken + summaryJson.statistic.failed > 0 ? 'FAIL' : summaryJson.statistic.passed > 0 ? 'PASS' : 'UNKNOWN'
    const record: AllureRecord = {
        runId,
        runUniqueId,
        testResult,
        timestamp: summaryJson.time.start,
        summary: {
            statistic: summaryJson.statistic,
            time: summaryJson.time,
        },
    }
    dataJson.unshift(record)
    await fs.writeFile(dataFile, JSON.stringify(dataJson, null, 2))
}

export const writeAllureListing = async (reportBaseDir: string) => fs.writeFile(`${reportBaseDir}/index.html`, allureReport)
