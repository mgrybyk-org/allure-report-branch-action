import * as path from 'path'
import * as fs from 'fs/promises'
import { spawnProcess } from './spawnProcess.js'
import { normalizeBranchName } from './helpers.js'
import { Context } from '@actions/github/lib/context.js'

export const cleanupOutdatedBranches = async (ghPagesBaseDir: string, repo: Context['repo']) => {
    try {
        const prefix = 'refs/heads/'
        // for some reason git won't pick up config, using url for now
        const lsRemote = await spawnProcess(
            'git',
            ['ls-remote', '--heads', `https://github.com/${repo.owner}/${repo.repo}.git`],
            process.env.GITHUB_WORKSPACE
        )
        const remoteBranches = lsRemote
            .split('\n')
            .filter((l) => l.includes(prefix))
            .map((l) => normalizeBranchName(l.split(prefix)[1]))

        const localBranches = (await fs.readdir(ghPagesBaseDir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name)

        for (const localBranch of localBranches) {
            if (!remoteBranches.includes(localBranch)) {
                await fs.rm(path.join(ghPagesBaseDir, localBranch), { recursive: true, force: true })
            }
        }
    } catch (err) {
        console.error('cleanup outdated branches failed.', err)
    }
}

const sortRuns = (a: string, b: string) => {
    const tsA = a.split('_')[1]
    const tsb = b.split('_')[1]
    if (tsA < tsb) {
        return -1
    }
    if (tsA > tsb) {
        return 1
    }

    return 0
}

export const cleanupOutdatedReports = async (ghPagesBaseDir: string, maxReports: number) => {
    try {
        const localBranches = (await fs.readdir(ghPagesBaseDir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name)

        // branches
        for (const localBranch of localBranches) {
            const reports = (await fs.readdir(path.join(ghPagesBaseDir, localBranch), { withFileTypes: true }))
                .filter((d) => d.isDirectory())
                .map((d) => d.name)

            // report per branch
            for (const reportName of reports) {
                const runs = (await fs.readdir(path.join(ghPagesBaseDir, localBranch, reportName), { withFileTypes: true }))
                    .filter((d) => d.isDirectory())
                    .map((d) => d.name)

                // run per report
                if (runs.length > maxReports) {
                    runs.sort(sortRuns)
                    while (runs.length > maxReports) {
                        await fs.rm(path.join(ghPagesBaseDir, localBranch, reportName, runs.shift() as string), {
                            recursive: true,
                            force: true,
                        })
                    }
                }
            }
        }
    } catch (err) {
        console.error('cleanup outdated reports failed.', err)
    }
}
