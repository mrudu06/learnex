#!/bin/bash
set -e

# 1. Update System
echo "Updating system..."
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install Dependencies
echo "Installing dependencies..."
sudo apt-get install -u python3-pip python3-venv nodejs npm nginx git acl -y

# 3. Setup Backend
echo "Setting up Backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install gunicorn
pip install -r requirements.txt
deactivate
cd ..

# 4. Setup Frontend
echo "Building Frontend..."
cd frontend
npm install
npm run build
cd ..

# 5. Configure Nginx
echo "Configuring Nginx..."
sudo cp deploy/nginx.conf /etc/nginx/sites-available/learnex
sudo ln -sf /etc/nginx/sites-available/learnex /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# 6. Configure Systemd
echo "Configuring Systemd..."
sudo cp deploy/learnex.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable learnex
sudo systemctl start learnex

echo "Deployment Complete! Visit your VM IP."
