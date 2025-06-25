#!/bin/bash

# DermaScan Quick Deployment Script
# This script helps set up the DermaScan application on your Ubuntu server

# Exit on error
set -e

echo "===== DermaScan Quick Deployment Script ====="
echo ""

# Create directory structure
echo "Creating directory structure..."
mkdir -p ~/dermascan/uploads

# Install global dependencies if not installed
echo "Installing global dependencies..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Clone or copy files
echo "Please copy all application files to the ~/dermascan directory."
echo "You can do this using SCP, SFTP, or by downloading from Replit."
echo ""
read -p "Press Enter once you've copied the files to continue..."

# Navigate to application directory
cd ~/dermascan

# Create .env file
echo "Setting up environment variables..."
echo "PORT=5000" > .env
echo "NODE_ENV=production" >> .env

read -p "Enter your PostgreSQL username: " db_user
read -p "Enter your PostgreSQL password: " db_pass
read -p "Enter your PostgreSQL database name: " db_name
echo "DATABASE_URL=postgresql://$db_user:$db_pass@localhost:5432/$db_name" >> .env

read -p "Enter your OpenAI API key: " openai_key
echo "OPENAI_API_KEY=$openai_key" >> .env

echo "SESSION_SECRET=$(openssl rand -base64 32)" >> .env

echo ""
echo ".env file created successfully!"

# Install dependencies
echo "Installing application dependencies..."
npm install

# Create database if it doesn't exist
echo "Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE DATABASE $db_name;" || echo "Database may already exist, continuing..."
sudo -u postgres psql -c "CREATE USER $db_user WITH ENCRYPTED PASSWORD '$db_pass';" || echo "User may already exist, continuing..."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $db_name TO $db_user;" || echo "Permissions may already be set, continuing..."

# Push database schema
echo "Pushing database schema..."
npm run db:push

# Build the application
echo "Building the application..."
npm run build

# Start with PM2
echo "Starting the application with PM2..."
pm2 stop DermaScan 2>/dev/null || true
pm2 delete DermaScan 2>/dev/null || true
pm2 start npm --name "DermaScan" -- run start
pm2 save
pm2 startup | tail -n 1 > pm2_startup_command.txt
echo "Execute the command in pm2_startup_command.txt to enable PM2 on system boot"

# Nginx configuration
echo ""
echo "Would you like to configure Nginx as a reverse proxy? (y/n)"
read nginx_choice

if [[ $nginx_choice == "y" || $nginx_choice == "Y" ]]; then
    echo "Setting up Nginx..."
    
    # Create Nginx config
    nginx_config="server {
    listen 80;
    server_name $(hostname -I | awk '{print $1}');

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /uploads {
        alias $HOME/dermascan/uploads;
    }
}"

    echo "$nginx_config" | sudo tee /etc/nginx/sites-available/dermascan

    sudo ln -s /etc/nginx/sites-available/dermascan /etc/nginx/sites-enabled/ 2>/dev/null || true
    sudo nginx -t && sudo systemctl restart nginx
    
    echo "Nginx configured successfully!"
    echo "Your application should be accessible at: http://$(hostname -I | awk '{print $1}')"
    
    echo ""
    echo "Would you like to set up SSL with Let's Encrypt? (y/n)"
    read ssl_choice
    
    if [[ $ssl_choice == "y" || $ssl_choice == "Y" ]]; then
        read -p "Enter your domain name: " domain_name
        sudo apt install -y certbot python3-certbot-nginx
        sudo certbot --nginx -d $domain_name
        
        echo "SSL configured successfully!"
        echo "Your application should be accessible at: https://$domain_name"
    fi
else
    echo "Nginx setup skipped. Your application is accessible at: http://$(hostname -I | awk '{print $1}'):5000"
fi

echo ""
echo "===== DermaScan deployment completed! ====="
echo ""
echo "To view the application logs: pm2 logs DermaScan"
echo "To restart the application: pm2 restart DermaScan"
echo ""
echo "For more detailed instructions, refer to DEPLOY_GUIDE.md"