# DermaScan Server Hosting Guide

This guide explains how to host the DermaScan application on your own server.

## Server Requirements

- **Operating System**: Linux (Ubuntu/Debian recommended)
- **Node.js**: v16.x or higher
- **PostgreSQL**: v12.x or higher
- **Memory**: Minimum 2GB RAM
- **Storage**: At least 1GB free space (more for database and uploads)
- **HTTPS**: Recommended for production use

## Deployment Steps

### 1. Prepare Your Server

1. Install Node.js and npm:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. Install PostgreSQL:
   ```bash
   sudo apt install postgresql postgresql-contrib
   ```

3. Configure PostgreSQL:
   ```bash
   sudo -u postgres psql
   ```

   Then in the PostgreSQL prompt:
   ```sql
   CREATE DATABASE dermascan;
   CREATE USER dermascan_user WITH ENCRYPTED PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE dermascan TO dermascan_user;
   \q
   ```

4. Install PM2 (process manager for Node.js):
   ```bash
   sudo npm install -g pm2
   ```

### 2. Deploy the Application

1. On your development machine (or Replit), run the deployment script:
   ```bash
   ./deploy.sh
   ```

2. Edit the `.env` file in the `deploy` directory with your production settings.

3. Transfer the `deploy` directory to your server using SFTP, SCP, or another file transfer method.

4. On your server, navigate to the deployed directory:
   ```bash
   cd /path/to/deploy
   ```

5. Install production dependencies:
   ```bash
   npm install --production
   ```

6. Start the application with PM2:
   ```bash
   pm2 start server/index.js --name dermascan
   ```

7. Configure PM2 to start on system boot:
   ```bash
   pm2 startup
   pm2 save
   ```

### 3. Configure Nginx (Recommended)

It's recommended to use Nginx as a reverse proxy in front of your Node.js application.

1. Install Nginx:
   ```bash
   sudo apt install nginx
   ```

2. Create an Nginx configuration:
   ```bash
   sudo nano /etc/nginx/sites-available/dermascan
   ```

3. Add this configuration (replace yourdomain.com with your actual domain):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;

       location / {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       location /uploads {
           alias /path/to/deploy/uploads;
       }
   }
   ```

4. Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/dermascan /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

5. Set up SSL with Let's Encrypt:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

### 4. Updating the Application

When you need to update the application:

1. Prepare a new deployment package using the deploy.sh script
2. Transfer the new files to your server
3. On your server:
   ```bash
   cd /path/to/deploy
   npm install --production
   pm2 restart dermascan
   ```

## Environment Variables

Make sure your `.env` file includes:

```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://dermascan_user:your_secure_password@localhost:5432/dermascan
OPENAI_API_KEY=your_openai_api_key
CORS_ORIGIN=https://yourdomain.com
SESSION_SECRET=your_secure_random_string
```

## Database Backups

Set up regular database backups:

```bash
# Create backup script
cat > /path/to/backup-script.sh << EOL
#!/bin/bash
TIMESTAMP=\$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/path/to/backups"
FILENAME="\$BACKUP_DIR/dermascan_\$TIMESTAMP.sql"
pg_dump -U dermascan_user -h localhost dermascan > \$FILENAME
gzip \$FILENAME
find \$BACKUP_DIR -name "dermascan_*.sql.gz" -mtime +7 -delete
EOL

# Make it executable
chmod +x /path/to/backup-script.sh

# Add crontab entry for daily backups at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /path/to/backup-script.sh") | crontab -
```

## Monitoring

Check application status:
```bash
pm2 status
pm2 logs dermascan
```

## Security Considerations

1. Only expose necessary ports (80, 443) using a firewall:
   ```bash
   sudo ufw allow 'Nginx Full'
   sudo ufw allow ssh
   sudo ufw enable
   ```

2. Keep your system updated:
   ```bash
   sudo apt update && sudo apt upgrade
   ```

3. Set up a firewall rule to prevent direct access to port 5000

4. Regularly rotate API keys and database credentials

5. Set up automated security updates:
   ```bash
   sudo apt install unattended-upgrades
   sudo dpkg-reconfigure -plow unattended-upgrades
   ```

## Common Issues

1. **Connection refused**: Check if the app is running using `pm2 status`
2. **Database errors**: Verify PostgreSQL is running and credentials are correct
3. **Permission issues**: Check file permissions for the uploads directory

For more assistance, consult the error logs in `/var/log/nginx/error.log` and through `pm2 logs dermascan`.