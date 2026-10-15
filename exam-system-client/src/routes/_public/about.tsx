import { createFileRoute } from '@tanstack/react-router'
import {GameButton} from "#/components/pockmmo-ui/button.tsx";
import {GameInput} from "#/components/pockmmo-ui/input.tsx";
import {ChevronDown} from "lucide-react";

export const Route = createFileRoute('/_public/about')({
  component: About,
})

function About() {
  return (
    <main className="page-wrap px-4 py-12 bg-[#393e42]">
      <section className="rounded-lg border p-6 sm:p-8">
        <p className="text-muted-foreground mb-2 text-sm font-medium">About</p>
        <h1 className="text-foreground mb-3 text-4xl font-bold sm:text-5xl">
          A small starter with room to grow.
        </h1>
        <p className="text-muted-foreground m-0 max-w-3xl text-base leading-8">
          TanStack Start gives you type-safe routing, server functions, and
          modern SSR defaults. Use this as a clean foundation, then layer in
          your own routes, styling, and add-ons.
        </p>
      </section>
      <ContactForm />
    </main>
  )
}

function ContactForm() {
  return (
    <>
      <button type="submit">Submit</button>
      <div className="flex">
        <GameButton>按钮</GameButton>
      </div>
      <div className="flex">
        <GameButton>按钮</GameButton>
        <div className="w-40">
          <div className="shadow-[0_0_1px_black] border border-[#292d2e] bg-linear-to-b from-[#466171] to-[#3f5260] text-sm h-10 flex justify-center items-center px-1">
            角色名称:
          </div>
        </div>
        <div>
          <GameInput type={'text'}></GameInput>
        </div>

      </div>
      <div className="group relative w-full">
        {/* 1. 基础背景层（含边框、阴影） */}
        <div
            className="
      absolute inset-0 rounded-xs border border-[#292d2e]
      bg-linear-to-b from-[#565d63] to-[#3c4247]
     shadow-[inset_1px_1px_1px_#ffffff26,inset_-1px_-1px_0_#ffffff26,0_1px_4px_#00000099]
      transition-colors duration-150
      group-focus-within:border-[#5db1ff]
    "
        />

        {/* 2. hover 高光层 */}
        <div
            className="
      pointer-events-none absolute inset-0  rounded-xs
      bg-linear-to-t from-[#4a6a80] to-transparent to-70%
      opacity-0 transition-opacity duration-150
      group-hover:opacity-100
    "
        />

        {/* 3. select：透明背景，只显示文字，在最上层 */}
        <select
            className="
      relative z-10
      w-full h-10 px-2
      text-sm text-white bg-transparent
      outline-none cursor-pointer appearance-none
    "
        >
          <option value="1">选项一</option>
          <option value="2">选项2</option>
          <option value="4">选项3</option>
        </select>

        {/* 4. 箭头：也在最上层 */}
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 z-10 size-4 -translate-y-1/2 text-white/60" />
      </div>

    </>
  )
}
