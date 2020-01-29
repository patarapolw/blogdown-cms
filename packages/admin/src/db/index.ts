import { prop, getModelForClass } from '@typegoose/typegoose'
import mongoose from 'mongoose'

import { IPostsFull, IMediaFull } from '@blogdown-cms/admin-api'

let cachedDb: mongoose.Mongoose | null = null

export class Post implements Omit<IPostsFull, 'date'> {
  @prop() _id!: string
  @prop() date!: Date
  @prop() title!: string
  @prop() tag!: string[]
  @prop() header!: Record<string, any>
  @prop() excerpt!: string
  @prop() remaining!: string
}

export const PostModel = getModelForClass(Post, { schemaOptions: { timestamps: true } })

export class Media implements IMediaFull {
  @prop() _id!: string
  @prop() filename!: string
  @prop() type?: string
}

export const MediaModel = getModelForClass(Media, { schemaOptions: { timestamps: true } })

export async function mongooseConnect () {
  if (!cachedDb) {
    cachedDb = await mongoose.connect(process.env.MONGO_URI!, { useNewUrlParser: true, useUnifiedTopology: true })
  }
}
