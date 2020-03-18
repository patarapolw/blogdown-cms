# Blogdown-CMS

Content Management System, to provide API endpoints for Static Site Generators or JAMStacks

![App preview](/docs/preview.gif)

## How it works

This project uses the following endpoints

- MongoDB for storing text-based contents
- Heroku to provide public API endpoints to MongoDB
- _Cloudinary (optional) is used to store media (e.g. images)_
- Editing is only enabled offline
  - via `npm run dev`
  - or `ADMIN=1`

## Environmental variables

- All the following environmental variables are optional. If `MONGO_URI` is not provided, it will attempt to use [Docker](https://www.docker.com/), which automatically download [mongo](https://hub.docker.com/_/mongo) image.

```dotenv
PORT=
MONGO_URI=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_CLOUD_NAME=
```

## Running the app

- Development mode -- `npm run dev`
- Admin mode -- `npm run admin`
- Local mode -- `npm run local`
- Deploy to Heroku -- `npm run deploy` (Don't forget to `heroku create` first)
