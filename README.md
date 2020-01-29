# Blogdown-CMS

Content Management System, to provide API endpoints for Static Site Generators or JAMStacks

![App preview](/docs/preview.gif)

## How it works

This project uses the following endpoints

- MongoDB for storing text-based contents
- Now.sh to provide public API endpoints to MongoDB
  - For example, try sending POST requests to `https://*.now.sh/api/posts`
    - This might be required for Search API in Static Site Generators.
    - Search engine is better backend than frontend, as client doesn't have to download the whole indexes.
- GitHub Pages to store media (e.g. images) at no cost
  - For example, try sending GET requests to `https://*.github.io/blogdown-cms/media/*.png`
- If media is large than 10 MB, or total more than 1 GB, Cloudinary is set up.
  - Just provide `CLOUDINARY_URL` in `.env`
- Editing is only enabled offline (by running `yarn dev` or `yarn build && yarn start`)
  - So, it is safer than exposing every endpoints online, only what is needed.

## Plan

- Create commenting engine, at `https://*.now.sh/api/comments`
- Create admin panel for comments
