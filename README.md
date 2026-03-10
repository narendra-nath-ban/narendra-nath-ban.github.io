# Narendra Nath Banerjee — Full-Stack Blog + Portfolio

A fully functioning website with a readable cyber-noir design, dynamic blog, and editable backend.

## Included pages

- `/` (`index.html`) – homepage + featured writing feed
- `/work.html` – projects/work highlights
- `/writings.html` – full backend-driven writing archive
- `/post.html?id=<post-id>` – single post view
- `/about.html` – about page
- `/contact.html` – contact page
- `/admin` or `/admin.html` – post management dashboard

## Backend

`server.js` runs a dependency-free Node.js HTTP server with JSON persistence in `data/posts.json`.

### API routes

- `GET /api/health`
- `GET /api/posts`
- `GET /api/posts?all=1`
- `GET /api/posts/:id`
- `POST /api/posts` (requires `x-admin-token`)
- `PUT /api/posts/:id` (requires `x-admin-token`)
- `DELETE /api/posts/:id` (requires `x-admin-token`)

## Run locally

```bash
npm start
```

Visit `http://localhost:3000`.

Set a custom admin token:

```bash
ADMIN_TOKEN=my-secret npm start
```
