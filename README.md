# Image API

REST API for uploading, processing, and managing images. Built with NestJS, PostgreSQL, and Cloudflare R2 (S3 compatible).

## Setup

### Spin docker

```bash
docker compose up -d
```

## API Documentation

Swagger UI is available at [http://localhost:3000/api](http://localhost:3000/api) when the application is running.

## Storage panel

MiniIO GUI is available at [http://localhost:9001](http://localhost:9001) when the application is running.

## API Endpoints

### POST /images

Upload and process an image.

- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `file` (required) — Image file (JPEG, PNG, WebP). Max 10 MB.
  - `title` (required) — Image title
  - `width` (optional) — Target output width in pixels
  - `height` (optional) — Target output height in pixels

All images are converted to WebP format at quality 85. (sharp's default) When `width` and/or `height` are provided, the image is scaled to fit within those dimensions while preserving the aspect ratio (`fit: inside`). If omitted, the original dimensions are kept.

### GET /images

List images with optional filtering and pagination.

- **Query parameters:**
  - `title` (optional) — Filter by title (case-insensitive contains)
  - `page` (optional, default: 1) — Page number
  - `limit` (optional, default: 20, max: 100) — Items per page

### GET /images/:id

Get a single image by UUID.

## Tech Stack

- **Runtime:** Node.js + NestJS
- **Database:** PostgreSQL (via TypeORM)
- **Storage:** Cloudflare R2 (S3-compatible)
- **Image Processing:** Sharp
- **API Docs:** OpenAPI v3 (Swagger)
