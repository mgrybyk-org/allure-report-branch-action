import * as fs from 'fs/promises'
import { listingReport } from './report_listing.js'

export const writeFolderListing = async (ghPagesPath: string, relPath: string) => {
    const isRoot = relPath === '.'
    const fullPath = isRoot ? ghPagesPath : `${ghPagesPath}/${relPath}`

    const links: string[] = []
    if (!isRoot) {
        links.push('..')
    }
    const listdir = (await fs.readdir(fullPath, { withFileTypes: true }))
        .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
        .map((d) => d.name)
    links.push(...listdir)

    const data: Record<string, string | string[]> = {
        links,
    }
    if (!isRoot) {
        data.date = new Date().toISOString()
    }

    await fs.writeFile(`${fullPath}/data.json`, JSON.stringify(data, null, 2))
    await fs.writeFile(`${fullPath}/index.html`, listingReport)
}
