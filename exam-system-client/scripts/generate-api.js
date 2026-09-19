import { mkdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs' // ← 这里！
import path from 'node:path'
import AdmZip from 'adm-zip'

const SOURCE_URL = `http://localhost:8101/api/ts.zip`
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

    // 补丁：后端 UserController.confirmUser 返回 ResponseEntity，Jimmer 会为 Spring 的
    // HttpStatusCode 生成 model/static/HttpStatusCode.ts，而它的属性名以数字开头
    // （readonly 1xxInformational: boolean; …）—— 非法 TS。
    // 这个文件被 model/static/index.ts 导出，只要它在程序里，`tsc` 就只报这十几条语法错、
    // 把所有语义错误吞掉（整个类型检查形同虚设）。这里给这些属性加 `_` 前缀；
    // 业务代码不引用它们，ResponseEntity.ts 只把 HttpStatusCode 当类型用。
    // 根治办法是后端别在 API 表面暴露 ResponseEntity（见 FRONTEND-PLAN.md §5-5）。
    // const httpStatusCodePath = path.join(
    //   GENERATE_PATH,
    //   'model',
    //   'static',
    //   'HttpStatusCode.ts',
    // )
    // if (existsSync(httpStatusCodePath)) {
    //   const src = await Bun.file(httpStatusCodePath).text()
    //   const patched = src.replace(/readonly ([1-5]xx)/g, 'readonly _$1')
    //   if (patched !== src) {
    //     await Bun.write(httpStatusCodePath, patched)
    //     console.log('已修正 HttpStatusCode.ts 里数字开头的非法属性名。')
    //   }
    // }

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
