import { MakeHtml } from '@patarapolw/make-html-frontend-functions'
import dayjs from 'dayjs'
import Loki, { Collection } from 'lokijs'
import Slugify from 'seo-friendly-slugify'
import * as z from 'zod'

import { contentPath } from '../config'
import { Matter } from '../util'

export let db: Loki

export const zDate = z.string().refine((d) => dayjs(d).isValid())

export const zPost = z.object({
  slug: z.string(),
  date: zDate.nullable().optional(),
  title: z.string(),
  tag: z.array(z.string()),
  header: z.record(z.any()),
  excerpt: z.string(),
  excerptHtml: z.string(),
  remaining: z.string(),
  remainingHtml: z.string(),
})

export type IPost = z.infer<typeof zPost>

export let PostModel: Collection<IPost>

export async function initDb(dbPath = contentPath('db.loki')) {
  await new Promise((resolve) => {
    db = new Loki(dbPath, {
      autoload: true,
      autoloadCallback: () => {
        PostModel = db.getCollection('post')
        if (!PostModel) {
          PostModel = db.addCollection('post', {
            unique: ['slug'],
          })
        }

        resolve()
      },
      autosave: true,
      autosaveInterval: 4000,
    })
  })
}

export function makePost(raw: string, oldSlug?: string) {
  const matter = new Matter()
  const {
    header: { slug: newSlug, title, tag, date, ...header },
    content,
  } = matter.parse(raw)

  const [excerpt, remaining] = content.split(/<!-- excerpt(?:_separator)? -->/)
  const jsdomCleanup = require('global-jsdom')()

  const makeHtml = new MakeHtml(oldSlug || newSlug)
  const excerptHtml = makeHtml.render(excerpt)
  const remainingHtml = makeHtml.render(remaining)

  jsdomCleanup()

  let validator: typeof zPost | ReturnType<typeof zPost.partial> = zPost

  let generatedSlug = ''
  if (oldSlug) {
    validator = validator.partial()
  } else if (!newSlug) {
    const slugify = new Slugify()
    generatedSlug = slugify.slugify(z.string().nonempty().parse(title))
  }

  return validator.parse(
    JSON.parse(
      JSON.stringify({
        slug: newSlug || generatedSlug,
        title,
        tag,
        date,
        header,
        excerpt,
        excerptHtml,
        remaining,
        remainingHtml,
      })
    )
  )
}
