# Employee Manager — 3-tier AWS CRUD project

## Architecture
- EC2 1 (public): React static build served by Nginx; Nginx reverse-proxies `/api/*` to the private backend.
- EC2 2 (private): Express API on TCP 5000; connects to MongoDB and S3.
- EC2 3 (private): MongoDB on TCP 27017; accepts connections only from the backend security group.
- S3: private object storage. Backend uploads objects using its EC2 IAM role. MongoDB stores the S3 object key, not the image bytes.

## Local development
### Backend
1. `cd backend`
2. `npm install`
3. Copy `.env.example` to `.env` and set `MONGODB_URI`, `AWS_REGION`, and `S3_BUCKET_NAME`.
4. For local S3 testing, configure AWS credentials with `aws configure` or use an appropriate local AWS profile. Never commit credentials.
5. `npm run dev`

### Frontend
1. In another terminal: `cd frontend`
2. `npm install`
3. `npm run dev`
4. For local development, configure a Vite proxy in `vite.config.js` if desired, or use the deployed Nginx setup for same-origin `/api` requests. (The production deployment uses Nginx.)

## AWS deployment outline
1. Create one VPC and place the three EC2 instances in it. Frontend gets a public IP; backend and database should have private IPs only.
2. Create security groups:
   - `frontend-sg`: inbound TCP 80/443 from the internet; SSH only from your trusted IP if needed.
   - `backend-sg`: inbound TCP 5000 only from `frontend-sg`.
   - `database-sg`: inbound TCP 27017 only from `backend-sg`.
3. Install MongoDB on the database instance. Bind MongoDB to its private IP (or 0.0.0.0 with the database security group tightly restricting access); enable authentication for a non-demo deployment.
4. Set the backend `MONGODB_URI` to `mongodb://DB_PRIVATE_IP:27017/employee_crud` (include authentication if enabled).
5. Attach an IAM role to the backend EC2 instance with only `s3:PutObject`, `s3:GetObject`, and `s3:DeleteObject` permissions on `arn:aws:s3:::YOUR_BUCKET/employee-photos/*`.
6. Create a private S3 bucket with Block Public Access enabled. Set bucket name and region in backend environment.
7. Deploy backend on EC2 2 and run it with a process manager such as systemd or PM2.
8. Build frontend using `npm run build`; copy `frontend/dist` to `/var/www/employee-crud` on EC2 1.
9. Copy `deploy/nginx.conf` to Nginx site config and replace `BACKEND_PRIVATE_IP` with the backend private IP. Test and reload Nginx.
10. Open the frontend public address in a browser and test create, read, update, delete and photo upload.

## Important
- Do not expose ports 5000 or 27017 to `0.0.0.0/0`.
- Do not put AWS access keys in React, frontend environment variables, GitHub, or source code.
- S3 objects stay private; API returns short-lived presigned image URLs.
- Add HTTPS, authentication, input validation, backups, and monitoring before production use.
