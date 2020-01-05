import axios from 'axios'
import { createConsumer } from 'rest-ts-axios'
import { mediaApiDef, postApiDef } from '@blogdown-cms/api'

const driver = axios.create({
  baseURL: 'http://localhost:3000',
})

export const mediaApi = createConsumer(mediaApiDef, driver)
export const postApi = createConsumer(postApiDef, driver)
