import { mkdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs' // ← 这里！
import path from 'node:path'
import AdmZip from 'adm-zip'

const SOURCE_URL = `${process.env.VITE_API_URL}/api/ts.zip`
const GENERATE_PATH = 'src/__generated'
const TEMP_DIR = (await import('node:os')).tmpdir()

async function main() {
  try {
    const tmpFileName = `${crypto.randomUUID()}.zip`
    const tmpFilePath = path.join(TEMP_DIR, tmpFileName)

    console.log(`正在下载: ${SOURCE_URL}...`)
    const response = await fetch(SOURCE_URL)
    if (!response.ok) throw new Error(`下载失败: ${response.status}`)

    const arrayBuffer = await response.arrayBuffer()
    await Bun.write(tmpFilePath, arrayBuffer)

    console.log(`文件保存成功: ${tmpFilePath}`)

    if (existsSync(GENERATE_PATH)) {
      console.log('正在删除旧的 generate 目录...')
      await rm(GENERATE_PATH, { recursive: true, force: true })
      console.log('旧目录已删除。')
    }

    await mkdir(GENERATE_PATH, { recursive: true })

    console.log('正在解压...')
    const zip = new AdmZip(tmpFilePath)
    zip.extractAllTo(GENERATE_PATH, true)
    console.log('解压完成！')

    console.log('正在删除临时文件...')
    await rm(tmpFilePath)
    console.log('临时文件已删除。')

    console.log('全部完成 ✓')
  } catch (err) {
    console.error('发生错误：', err)
    process.exitCode = 1
  }
}

main()
