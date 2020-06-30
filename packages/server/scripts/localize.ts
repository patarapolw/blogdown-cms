// import mongoose from 'mongoose'
// import { MakeHtml } from '@patarapolw/make-html-frontend-functions'

// import { mongooseConnect, DbPostModel } from '../src/db'
// import { PostModel, initDb, db } from '../src/db/local'
// import { Matter } from '../src/util'

// async function main () {
//   await mongooseConnect()
//   await initDb()

//   // console.log(await DbPostModel.aggregate([
//   //   {
//   //     $group: {
//   //       _id: '$category',
//   //       count: { $sum: 1 }
//   //     }
//   //   }
//   // ]))

//   const rs = await DbPostModel.find({ category: { $exists: false } })
//   console.log(rs)

//   require('global-jsdom')()
//   const matter = new Matter()

//   PostModel.insert(rs.map(({ slug, title, date, tag = [], raw }) => {
//     const { header: { slug: _slug, title: _title, date: _date, tag: _tag, ...header }, content } = matter.parse(raw)

//     const [excerpt, remaining] = content.split(/<!-- excerpt(?:_separator)? -->/)
//     const makeHtml = new MakeHtml(slug)

//     return {
//       slug,
//       title,
//       date: date ? date.toISOString() : undefined,
//       tag,
//       header,
//       excerpt,
//       excerptHtml: makeHtml.render(excerpt),
//       remaining,
//       remainingHtml: makeHtml.render(remaining)
//     }
//   }))

//   await mongoose.disconnect()

//   console.log('done')
//   db.close()
// }

// if (require.main === module) {
//   main().catch(console.error)
// }
