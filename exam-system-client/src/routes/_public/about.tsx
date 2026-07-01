import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_public/about')({
  component: About,
})

function About() {
  return (
    <main className="page-wrap px-4 py-12">
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
    </>
  )
}
