import { prop, getModelForClass } from '@typegoose/typegoose'
import mongoose from 'mongoose'
import waitOn from 'wait-on'

export let cachedDb: mongoose.Mongoose | null = null

export class Post {
  @prop() _id!: string
  @prop({ unique: true }) slug!: string
  @prop({ index: true }) date?: Date
  @prop({ required: true, index: true }) title!: string
  @prop({ default: () => [] }) tag?: string[]
  @prop({ index: true }) category?: string
  @prop({ default: () => ({}) }) header?: Record<string, any>
  @prop({ required: true, index: true }) excerpt!: string
  @prop({ default: '' }) remaining?: string
  @prop({ required: true }) raw!: string
  @prop({ index: true }) type?: string
}

export const PostModel = getModelForClass(Post, { schemaOptions: { timestamps: true } })

export async function mongooseConnect () {
  if (!cachedDb && process.env.MONGO_URI) {
    if (!process.env.MONGO_URI.startsWith('mongodb+srv')) {
      await waitOn({
        resources: [
          'tcp:mongodb:27017'
        ],
        timeout: 30000
      })
    }

    cachedDb = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    })
  }
  return cachedDb
}
