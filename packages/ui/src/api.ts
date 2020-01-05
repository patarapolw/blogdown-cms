import axios from '@typed-rest/axios'
import { IMediaApi, IPostApi } from '@blogdown-cms/api'

const api = axios.create<IMediaApi & IPostApi>({
  baseURL: 'http://localhost:3000',
})

export default api
