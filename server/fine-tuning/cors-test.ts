import { Router, Request, Response } from 'express';

const corsTestRouter = Router();

// Simple CORS test endpoint that returns JSON
corsTestRouter.get('/test', (req: Request, res: Response) => {
  res.json({
    message: 'CORS is working correctly!',
    timestamp: new Date().toISOString(),
    headers: {
      origin: req.headers.origin || 'none',
      referer: req.headers.referer || 'none',
      'user-agent': req.headers['user-agent'] || 'none'
    }
  });
});

// Test page that can be loaded to verify CORS
corsTestRouter.get('/test-page', (req: Request, res: Response) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CORS Test Page</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        pre {
          background-color: #f4f4f4;
          padding: 10px;
          border-radius: 4px;
          overflow-x: auto;
        }
        button {
          background-color: #4CAF50;
          border: none;
          color: white;
          padding: 10px 20px;
          text-align: center;
          text-decoration: none;
          display: inline-block;
          font-size: 16px;
          margin: 10px 2px;
          cursor: pointer;
          border-radius: 4px;
        }
        .card {
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .error {
          color: red;
          font-weight: bold;
        }
        .success {
          color: green;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <h1>CORS Test for Fine-tuning API</h1>
      <p>Use this page to verify that CORS is properly configured for the fine-tuning API endpoints.</p>
      
      <div class="card">
        <h2>1. Test CORS Configuration</h2>
        <p>Click the button below to test if CORS is properly configured:</p>
        <button id="testCorsBtn">Test CORS</button>
        <div id="corsResult"></div>
      </div>
      
      <div class="card">
        <h2>2. Test Admin Page Access</h2>
        <p>Click the button below to check if you can access the fine-tuning admin page:</p>
        <button id="testAdminBtn">Test Admin Page</button>
        <div id="adminResult"></div>
      </div>
      
      <div class="card">
        <h2>3. Test Upload Functionality</h2>
        <p>Select an image file and click upload to test the file upload functionality:</p>
        <input type="file" id="fileInput" accept="image/*">
        <button id="uploadBtn">Upload Image</button>
        <div id="uploadResult"></div>
      </div>
      
      <script>
        document.getElementById('testCorsBtn').addEventListener('click', async () => {
          const resultDiv = document.getElementById('corsResult');
          resultDiv.innerHTML = 'Testing CORS...';
          
          try {
            const response = await fetch('/api/fine-tuning/cors/test');
            const data = await response.json();
            
            resultDiv.innerHTML = '<p class="success">CORS is working! ✓</p>';
            resultDiv.innerHTML += '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
          } catch (error) {
            resultDiv.innerHTML = '<p class="error">CORS Error: ' + error.message + '</p>';
            resultDiv.innerHTML += '<p>This could be due to CORS not being properly configured.</p>';
          }
        });
        
        document.getElementById('testAdminBtn').addEventListener('click', async () => {
          const resultDiv = document.getElementById('adminResult');
          resultDiv.innerHTML = 'Testing admin page access...';
          
          try {
            const response = await fetch('/api/fine-tuning/admin-page');
            const text = await response.text();
            
            if (response.ok) {
              resultDiv.innerHTML = '<p class="success">Admin page is accessible! ✓</p>';
              resultDiv.innerHTML += '<p>Status: ' + response.status + '</p>';
            } else {
              resultDiv.innerHTML = '<p class="error">Error accessing admin page: ' + response.status + '</p>';
              resultDiv.innerHTML += '<pre>' + text + '</pre>';
            }
          } catch (error) {
            resultDiv.innerHTML = '<p class="error">Error: ' + error.message + '</p>';
          }
        });
        
        document.getElementById('uploadBtn').addEventListener('click', async () => {
          const resultDiv = document.getElementById('uploadResult');
          const fileInput = document.getElementById('fileInput');
          resultDiv.innerHTML = 'Uploading file...';
          
          if (!fileInput.files || fileInput.files.length === 0) {
            resultDiv.innerHTML = '<p class="error">Please select a file first.</p>';
            return;
          }
          
          const formData = new FormData();
          formData.append('images', fileInput.files[0]);
          
          try {
            const response = await fetch('/api/fine-tuning/upload-image', {
              method: 'POST',
              body: formData
            });
            
            const data = await response.json();
            
            if (response.ok) {
              resultDiv.innerHTML = '<p class="success">File uploaded successfully! ✓</p>';
              resultDiv.innerHTML += '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
            } else {
              resultDiv.innerHTML = '<p class="error">Error uploading file: ' + response.status + '</p>';
              resultDiv.innerHTML += '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
            }
          } catch (error) {
            resultDiv.innerHTML = '<p class="error">Error: ' + error.message + '</p>';
            resultDiv.innerHTML += '<p>This could be due to CORS, file size limits, or network issues.</p>';
          }
        });
      </script>
    </body>
    </html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

export default corsTestRouter;