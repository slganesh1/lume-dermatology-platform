# DermaScan Deployment Guide

This document provides step-by-step instructions to deploy the DermaScan application on your Ubuntu server.

## Prerequisites

- Ubuntu server with Node.js v16+ installed
- PostgreSQL database installed and running
- npm installed
- PM2 installed globally (`npm install -g pm2`)
- Nginx installed (optional but recommended)

## Step 1: Prepare Your Server

1. Create a directory for the application:

```bash
mkdir -p ~/dermascan
cd ~/dermascan
```

## Step 2: Transfer Files to Your Server

You have two options:

### Option A: Clone or Download from Replit

1. In Replit, click on the three dots (...) in the file explorer and select "Download as zip"
2. Upload the ZIP file to your server and extract it:

```bash
unzip downloaded-file.zip -d ~/dermascan
cd ~/dermascan
```

### Option B: Manual Transfer

Transfer all essential files to your server using SCP or SFTP:

Essential files to transfer:
- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `tailwind.config.ts`
- `postcss.config.js`
- `drizzle.config.ts`
- `theme.json`
- `server/` directory
- `shared/` directory
- `client/` directory
- Create an empty `uploads/` directory

## Step 3: Configure Environment Variables

1. Create a `.env` file:

```bash
cd ~/dermascan
touch .env
nano .env
```

2. Add the following environment variables:

```
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
OPENAI_API_KEY=your_openai_api_key
SESSION_SECRET=a_random_string_for_session_security
```

Replace the placeholders with your actual values:
- Replace `username`, `password`, and `database_name` with your PostgreSQL credentials
- Add your actual OpenAI API key
- Create a random string for the SESSION_SECRET

## Step 4: Install Dependencies

```bash
cd ~/dermascan
npm install
```

## Step 5: Setup the Database

1. Create the PostgreSQL database (if not already created):

```bash
sudo -u postgres psql
```

In the PostgreSQL prompt:
```sql
CREATE DATABASE dermascan;
CREATE USER dermascan_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE dermascan TO dermascan_user;
\q
```

2. Update your DATABASE_URL in the .env file to match these credentials.

3. Push the database schema:

```bash
npm run db:push
```

## Step 6: Build the Application

```bash
npm run build
```

## Step 7: Start the Application with PM2

```bash
pm2 start npm --name "DermaScan" -- run start
pm2 save
pm2 startup
```

Follow the instructions from the `pm2 startup` command to ensure PM2 starts on system boot.

## Step 8: Configure Nginx as a Reverse Proxy (Recommended)

1. Create a Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/dermascan
```

2. Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-server-ip-or-domain;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads {
        alias /home/your-username/dermascan/uploads;
    }
}
```

Replace `your-server-ip-or-domain` with your actual server IP or domain name.
Replace `your-username` with your actual username.

3. Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/dermascan /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Step 9: Set Up SSL with Let's Encrypt (Optional)

If you have a domain name:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## Step 10: Verify the Deployment

1. Check if the application is running:

```bash
pm2 status
```

2. View the logs if needed:

```bash
pm2 logs DermaScan
```

3. Access your application in a web browser:
   - If using Nginx: `http://your-server-ip` or `https://yourdomain.com`
   - If not using Nginx: `http://your-server-ip:5000`

## Troubleshooting

### Application doesn't start:
1. Check the logs: `pm2 logs DermaScan`
2. Verify your .env file has the correct variables
3. Ensure your DATABASE_URL is correct
4. Check if the OPENAI_API_KEY is valid

### Database connection issues:
1. Verify your PostgreSQL service is running: `sudo systemctl status postgresql`
2. Check the database credentials in your .env file
3. Ensure the database and user exist in PostgreSQL

### Nginx issues:
1. Check for syntax errors: `sudo nginx -t`
2. Check Nginx logs: `sudo cat /var/log/nginx/error.log`
3. Ensure the correct paths are set in the Nginx configuration

## Maintenance

### Updating the Application

When you need to update the application:

1. Stop the application:
```bash
pm2 stop DermaScan
```

2. Pull or upload the new code to the server

3. Install dependencies if needed:
```bash
npm install
```

4. Rebuild the application:
```bash
npm run build
```

5. Restart the application:
```bash
pm2 restart DermaScan
```

### Database Backups

Set up regular PostgreSQL backups:

```bash
sudo -u postgres pg_dump dermascan > /path/to/backup/dermascan_$(date +%Y%m%d).sql
```

Consider adding this to a cron job for automated backups.

## Security Considerations

1. Always keep your server updated:
```bash
sudo apt update && sudo apt upgrade
```

2. Set up a firewall:
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

3. Regularly rotate your API keys and database credentials

4. Use HTTPS instead of HTTP in production

5. Consider setting up rate limiting in Nginx for additional protection