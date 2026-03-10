# Image API

REST API for uploading, processing, and managing images. Built with NestJS, PostgreSQL, and Cloudflare R2 (S3 compatible).

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Spin docker

```bash
docker compose up -d
```

## API Documentation

Swagger UI is available at [http://localhost:3000/api](http://localhost:3000/api) when the application is running.

## Storage panel

MiniIO Browser is available at [http://localhost:9001](http://localhost:9001) when the application is running.

## API Endpoints

### POST /images

Upload and process an image.

- **Content-Type:** `multipart/form-data`
- **Fields:**
  - `file` (required) — Image file (JPEG, PNG, WebP, GIF). Max 10 MB.
  - `title` (required) — Image title
  - `maxFileSize` (optional) — Target maximum file size in bytes

All images are converted to WebP format. When `maxFileSize` is provided, the service iteratively adjusts quality (85–30) and scales dimensions down until the output fits within the target size.

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
