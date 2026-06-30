# Pioneer — Deployment Guide

## Stack
- **Framework:** Next.js 14 (App Router)
- **Database:** MongoDB Atlas (free tier)
- **Image Uploads:** Cloudinary
- **Hosting:** Vercel

---

## 1. MongoDB Atlas Setup

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user with read/write permissions
3. Whitelist `0.0.0.0/0` in Network Access (Vercel uses dynamic IPs)
4. Get your connection string:
   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/pioneer?retryWrites=true&w=majority
   ```

---

## 2. Cloudinary Setup

1. Create a free account at [cloudinary.com](https://cloudinary.com)
2. From your Dashboard, copy:
   - Cloud Name
   - API Key
   - API Secret

---

## 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
MONGODB_URI=mongodb+srv://...
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
JWT_SECRET=<run: openssl rand -base64 32>
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_CONTACT_PHONE=+91 98765 43210
```

---

## 4. Vercel Deployment

1. Push this repo to GitHub
2. Import the repo in [vercel.com](https://vercel.com)
3. Add all environment variables in Vercel → Settings → Environment Variables
4. Deploy

---

## 5. Seed Initial Data

After first deploy, seed sample buses by calling:

```bash
curl -X POST https://your-app.vercel.app/api/seed
```

Or visit `/api/seed` in a browser (GET) and then POST from Postman/curl.

---

## 6. Admin Access

- Visit: `https://your-app.vercel.app/admin/login`
- Use the `ADMIN_USERNAME` and `ADMIN_PASSWORD` from your env vars

---

## Local Development

```bash
cp .env.example .env.local
# fill in your values
npm install
npm run dev
```

Then seed: `curl -X POST http://localhost:3000/api/seed`
