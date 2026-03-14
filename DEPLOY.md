# Deploy

## Architecture

- `Vercel`: static frontend built from Vite
- `Railway`: Node/Express backend, local auth, tRPC API, database access

## Required environment variables

### Railway

- `DATABASE_URL`
- `JWT_SECRET`
- `APP_ID` (`norte-vivo-local` works)
- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`
- `R2_PUBLIC_URL`
- `R2_ENDPOINT` (optional)
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER` (optional)
- `BUILT_IN_FORGE_API_URL`
- `BUILT_IN_FORGE_API_KEY`
- `FRONTEND_URL`
- `PUBLIC_API_URL`
- `PORT`

### Vercel

- `VITE_API_BASE_URL`
- `VITE_FRONTEND_FORGE_API_KEY`
- `VITE_FRONTEND_FORGE_API_URL`
- `VITE_ANALYTICS_ENDPOINT`
- `VITE_ANALYTICS_WEBSITE_ID`

## Database

Run the schema migration first, then seed the base catalog data.

```bash
pnpm db:push
pnpm db:seed
```

If your production database was created before `viewCount` was added to `categories`, make sure this SQL has been applied:

```sql
ALTER TABLE `categories`
ADD `viewCount` int DEFAULT 0;
```

## Railway

1. Create a new Railway service from this repository.
2. Set the Railway environment variables.
3. Deploy using the included `railway.toml`.
4. Confirm the health endpoint:

```bash
GET /api/health
```

## Vercel

1. Import the same repository into Vercel.
2. Set the Vercel environment variables.
3. Set `VITE_API_BASE_URL` to the public Railway URL.
4. Deploy using the included `vercel.json`.

## Recommended order

1. Provision the Railway database.
2. Deploy Railway backend.
3. Run `pnpm db:push`.
4. Run `pnpm db:seed`.
5. Deploy Vercel frontend.
6. Test signup/login, search, category, listing details and new listing flows.

## Cloudinary

1. Create a Cloudinary product environment.
2. Copy `Cloud name`, `API Key`, and `API Secret`.
3. Add `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` to Railway.
4. Optionally add `CLOUDINARY_FOLDER` (for example `norte-vivo`).
5. Redeploy Railway and test image upload from the advertiser panel.

## Cloudflare R2

1. Create an R2 bucket.
2. Create an API token/key pair with object read/write access for that bucket.
3. Add the R2 variables to Railway.
4. Set `R2_PUBLIC_URL` to a public bucket domain, custom domain, or `r2.dev` URL.
5. Redeploy Railway and test image upload from the advertiser panel.
