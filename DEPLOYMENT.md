# Deployment Guide - Coolify on Contabo

This guide explains how to deploy the Mail Checker application on Coolify (self-hosted on Contabo) with support for large file uploads (up to 100 MB).

## Prerequisites

- Coolify instance running on Contabo VPS
- Git repository access
- Domain name (optional, but recommended)

## Configuration Overview

The application has been configured to handle large file uploads (100 MB) and process up to 30,000+ emails efficiently:

- **Next.js**: Configured for 100 MB body size limit
- **Nginx**: Configured for 100 MB client body size and 10-minute timeouts
- **Node.js**: Allocated 4 GB memory for processing large datasets
- **Docker**: Optimized build with standalone output

## Deployment Steps

### 1. Push Code to Repository

Ensure all configuration files are committed:

```bash
git add .
git commit -m "Add Coolify deployment configuration for large file uploads"
git push
```

### 2. Create New Project in Coolify

1. Log into your Coolify dashboard
2. Click "New Resource" → "Application"
3. Select "Public Repository" or connect your Git provider
4. Enter repository URL
5. Select the `main` branch

### 3. Configure Build Settings

In Coolify's application settings:

**Build Pack**: Docker (it will auto-detect the Dockerfile)

**Port**: 3000

**Health Check Path**: `/` (optional)

### 4. Configure Environment Variables

Add the following environment variables in Coolify:

```env
NODE_ENV=production
NODE_OPTIONS=--max-old-space-size=4096
PORT=3000
```

### 5. Configure Nginx Reverse Proxy

Coolify uses nginx as a reverse proxy. You need to configure it for large file uploads:

#### Option A: Coolify Custom Nginx Configuration

1. In your Coolify application settings, go to "Advanced" → "Custom Nginx Configuration"
2. Add the following configuration:

```nginx
client_max_body_size 100M;
client_body_buffer_size 10M;
client_body_timeout 600s;
client_header_timeout 600s;

proxy_connect_timeout 600s;
proxy_send_timeout 600s;
proxy_read_timeout 600s;
send_timeout 600s;

proxy_buffering on;
proxy_buffer_size 4k;
proxy_buffers 8 4k;
proxy_busy_buffers_size 8k;
proxy_request_buffering off;
```

#### Option B: Server-Level Nginx Configuration

If you have SSH access to your Contabo server, edit the main nginx config:

```bash
sudo nano /etc/nginx/nginx.conf
```

Add inside the `http` block:

```nginx
client_max_body_size 100M;
client_body_buffer_size 10M;
client_body_timeout 600s;
proxy_connect_timeout 600s;
proxy_read_timeout 600s;
proxy_send_timeout 600s;
```

Then reload nginx:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 6. Deploy the Application

1. Click "Deploy" in Coolify
2. Monitor the build logs
3. Wait for deployment to complete (usually 3-5 minutes)

### 7. Verify Deployment

1. Access your application URL
2. Test with a small file first (< 1 MB)
3. Test with a larger file (10-20 MB)
4. Finally test with your 80 MB file

## Troubleshooting

### 500 Error on Large File Upload

**Symptom**: Files over 80 MB fail with HTTP 500 error

**Solutions**:

1. **Check Coolify Nginx Config**: Ensure `client_max_body_size 100M;` is set
2. **Check Server Resources**: Verify your Contabo VPS has enough RAM (recommend 4 GB+)
3. **Check Logs**: View application logs in Coolify dashboard
4. **Check Disk Space**: Ensure `/tmp` has enough space for file processing

```bash
df -h /tmp
```

### Timeout During Processing

**Symptom**: Request times out after 60 seconds

**Solution**: Increase proxy timeouts in nginx configuration (see step 5 above)

### Out of Memory Errors

**Symptom**: Application crashes during large file processing

**Solutions**:

1. Increase `NODE_OPTIONS` memory limit:
   ```env
   NODE_OPTIONS=--max-old-space-size=8192
   ```

2. Upgrade your Contabo VPS plan to include more RAM

### Build Fails

**Symptom**: Docker build fails in Coolify

**Solutions**:

1. Check build logs in Coolify
2. Verify all dependencies are in package.json
3. Ensure Dockerfile is at repository root
4. Try manual build locally:
   ```bash
   docker build -t mail-checker .
   docker run -p 3000:3000 mail-checker
   ```

## Performance Optimization

### For Very Large Files (50+ MB, 30k+ emails)

The application is already optimized with:

- **Virtual Scrolling**: Only renders visible rows in UI (~60 rows)
- **Batch Processing**: Processes emails in chunks of 25 with 10ms delay
- **Download URLs**: Excel files served via separate endpoint (not embedded in JSON)
- **DNS Caching**: 5-minute cache for domain lookups

Expected processing time for 30,000 emails: **5-6 minutes**

### Monitoring

Monitor your application performance:

1. **CPU Usage**: Should stay under 80% during processing
2. **Memory Usage**: Should not exceed 3.5 GB
3. **Disk I/O**: Temp files are auto-cleaned after processing
4. **Network**: Upload speed depends on your Contabo connection

## File Structure

```
mail-checker/
├── Dockerfile              # Docker build configuration
├── .dockerignore          # Files to exclude from Docker build
├── nginx.conf             # Nginx configuration template
├── next.config.ts         # Next.js configuration (100 MB limit)
├── DEPLOYMENT.md          # This file
└── src/
    ├── app/
    │   └── api/v1/emails/
    │       └── batch/
    │           ├── route.ts           # Main batch API
    │           └── download/route.ts   # Excel download endpoint
    └── lib/
        └── constants/index.ts  # File size limits (MAX_FILE_SIZE_MB: 100)
```

## Security Considerations

1. **File Validation**: Application validates file types (xlsx, csv only)
2. **Size Limits**: Hard-coded 100 MB limit prevents abuse
3. **Temp File Cleanup**: Excel files auto-deleted after download
4. **Path Traversal Protection**: File IDs sanitized in download endpoint
5. **Rate Limiting**: Consider adding rate limiting at nginx level for production

Example nginx rate limiting:

```nginx
limit_req_zone $binary_remote_addr zone=upload_limit:10m rate=10r/m;

location /api/v1/emails/batch {
    limit_req zone=upload_limit burst=5 nodelay;
}
```

## Support

If you encounter issues:

1. Check Coolify application logs
2. Check server system logs: `journalctl -u docker`
3. Verify nginx logs: `tail -f /var/log/nginx/error.log`
4. Test locally with Docker first

## Updates

To deploy updates:

1. Push changes to Git repository
2. Coolify will auto-deploy (if auto-deploy enabled)
3. Or manually click "Redeploy" in Coolify dashboard

---

**Last Updated**: 2025-11-24
**Application Version**: 0.1.0
**Deployment Platform**: Coolify on Contabo VPS
