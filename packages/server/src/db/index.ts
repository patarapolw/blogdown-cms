import { prop, getModelForClass } from '@typegoose/typegoose'
import mongoose from 'mongoose'
import { config } from '../config'

let cachedDb: mongoose.Mongoose | null = null

export class Post {
  @prop() _id!: string
  @prop() slug!: string
  @prop() date?: Date
  @prop({ required: true }) title!: string
  @prop({ default: () => [] }) tag?: string[]
  @prop({ default: () => ({}) }) header?: Record<string, any>
  @prop({ required: true }) excerpt!: string
  @prop({ default: '' }) remaining?: string
  @prop({ required: true }) raw!: string
  @prop() type?: string
}

export const PostModel = getModelForClass(Post, { schemaOptions: { timestamps: true } })

export async function mongooseConnect () {
  if (!cachedDb) {
    cachedDb = await mongoose.connect(config.mongo.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    })
  }
}
