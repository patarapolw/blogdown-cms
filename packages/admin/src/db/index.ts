import { prop, getModelForClass } from '@typegoose/typegoose'

import { IEntryFull } from '../api-def/entry'
import { IMediaHeader } from '../api-def/media'

export class Post implements Omit<IEntryFull, 'date'> {
  @prop() date!: Date
  @prop() title!: string
  @prop() tag!: string[]
  @prop() header!: Record<string, any>
  @prop() excerpt!: string
  @prop() remaining!: string
}

export const PostModel = getModelForClass(Post)

export class Media implements IMediaHeader {
  @prop() _id!: string
  @prop() name!: string
  @prop() type?: 'clipboard'
  @prop() data!: ArrayBuffer
}

export const MediaModel = getModelForClass(Media)
