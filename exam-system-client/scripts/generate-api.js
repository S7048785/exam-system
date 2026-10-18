import { mkdir, readdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import AdmZip from 'adm-zip'

// 可用 `TS_ZIP_URL` 指向别的后端 / 本地 zip（调试用），默认本机 8101
const SOURCE_URL = process.env.TS_ZIP_URL ?? `http://localhost:8101/api/ts.zip`
const GENERATE_PATH = 'src/__generated'
const TEMP_DIR = (await import('node:os')).tmpdir()

/** 后端 controller 源码目录（同仓库，用来核对 ts.zip 有没有漏接口） */
const BACKEND_API_ROOT = path.resolve(
  import.meta.dir,
  '../../exam-system-java/server/src/main/java',
)

/**
 * 后端源码里的 controller 简单名（`XxxController`）。
 *
 * 🔴 为什么要核对：`ts.zip` 不是运行时反射出来的，而是读编译期产物
 * `server/target/classes/META-INF/jimmer/client`。一旦那份元数据残缺（构建被中断、
 * 或某次只有部分 controller 参与注解处理），ts.zip 会**静默**少掉一批服务，前端表现成
 * `api.xxxController is undefined`，报错位置离真因很远。
 */
async function expectedControllers(dir = BACKEND_API_ROOT) {
  if (!existsSync(dir)) return []
  const names = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      names.push(...(await expectedControllers(full)))
    } else if (entry.name.endsWith('Controller.java')) {
      names.push(entry.name.slice(0, -'.java'.length))
    }
  }
  return names
}

/** 下载后先校验，不合格就**不动**旧的 `src/__generated`（否则会把能用的类型也删掉） */
function assertServicesComplete(zip, expected) {
  const actual = new Set(
    zip
      .getEntries()
      .filter((e) => e.entryName.startsWith('services/'))
      .map((e) => path.basename(e.entryName, '.ts')),
  )
  const missing = expected.filter((name) => !actual.has(name))
  if (missing.length > 0) {
    throw new Error(
      `ts.zip 缺 ${missing.length}/${expected.length} 个 controller：${missing.join(', ')}\n` +
        `  原因：后端 API 元数据（META-INF/jimmer/client）残缺，接口本身没坏。\n` +
        `  处理：clean 构建后端 ——\n` +
        `    cd exam-system-java\n` +
        `    ./mvnw.cmd clean install -pl entity -am -DskipTests\n` +
        `    ./mvnw.cmd clean compile -pl server`,
    )
  }
}

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

    // 先校验再删：校验不过就保留旧的生成物，前端至少还能跑
    assertServicesComplete(new AdmZip(tmpFilePath), await expectedControllers())

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
