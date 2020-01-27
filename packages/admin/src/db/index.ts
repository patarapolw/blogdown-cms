import { prop, getModelForClass } from '@typegoose/typegoose'
import { GridFSBucket, Db } from 'mongodb'
import mongoose from 'mongoose'

import { IPostsFull } from '@blogdown-cms/admin-api/dist/posts'

export class Post implements Omit<IPostsFull, 'date'> {
  @prop() _id!: string
  @prop() date!: Date
  @prop() title!: string
  @prop() tag!: string[]
  @prop() header!: Record<string, any>
  @prop() excerpt!: string
  @prop() remaining!: string
}

export const PostModel = getModelForClass(Post)

export function getMediaBucket () {
  return new GridFSBucket(mongoose.connection.db)
}
