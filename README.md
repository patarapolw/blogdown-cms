# Blogdown-CMS

Content Management System, to provide API endpoints for Static Site Generators or JAMStacks

![App preview](/docs/preview.gif)

## How it works

This project uses the following endpoints

- MongoDB for storing text-based contents
- Heroku to provide public API endpoints to MongoDB
- Cloudinary is used to store media (e.g. images)
- Editing is only enabled offline
  - via `npm run dev`
  - or `NODE_ENV=development`

## Admin mode

- Run the server in `NODE_ENV=development`, by `cd packages/server && npm run dev`
- In another terminal, run `cd packages/admin-web && npm run dev`
