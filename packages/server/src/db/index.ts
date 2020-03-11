import { prop, getModelForClass } from '@typegoose/typegoose'
import mongoose from 'mongoose'
let cachedDb: mongoose.Mongoose | null = null

export class Post {
  @prop({ required: true, unique: true }) slug!: string
  @prop() date?: Date
  @prop({ required: true }) title!: string
  @prop({ default: () => [] }) tag?: string[]
  @prop({ default: () => ({}) }) header?: Record<string, any>
  @prop({ required: true }) excerpt!: string
  @prop({ default: '' }) remaining?: string
  @prop({ required: true }) raw!: string
}

export const PostModel = getModelForClass(Post, { schemaOptions: { timestamps: true } })

export class Comment {
  @prop({ required: true }) content!: string
  @prop({ required: true }) user!: {
    name: string
    email: string
  }

  @prop({
    default: () => ({
      thumbUp: []
    })
  }) like?: {
    thumbUp: string[]
  }

  @prop({ required: true }) replyTo!: string
  @prop({ required: true }) path!: string
}

export const CommentModel = getModelForClass(Comment, { schemaOptions: { timestamps: true } })

export async function mongooseConnect () {
  if (!cachedDb) {
    cachedDb = await mongoose.connect(process.env.MONGO_URI!, { useNewUrlParser: true, useUnifiedTopology: true })
  }
}
