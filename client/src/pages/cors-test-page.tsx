import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Link as LinkIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CorsTestPage() {
  const [corsUrl, setCorsUrl] = useState<string>("");
  const [corsResult, setCorsResult] = useState<any>(null);
  const [corsError, setCorsError] = useState<string | null>(null);
  const [isTestingCors, setIsTestingCors] = useState(false);
  
  const [adminResult, setAdminResult] = useState<any>(null);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [isTestingAdmin, setIsTestingAdmin] = useState(false);
  
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const testCors = async () => {
    setIsTestingCors(true);
    setCorsError(null);
    setCorsResult(null);
    
    try {
      const url = corsUrl || '/api/fine-tuning/cors/test';
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      setCorsResult(data);
    } catch (error: any) {
      setCorsError(error.message);
    } finally {
      setIsTestingCors(false);
    }
  };
  
  const testAdminAccess = async () => {
    setIsTestingAdmin(true);
    setAdminError(null);
    setAdminResult(null);
    
    try {
      const url = '/api/fine-tuning/admin-page';
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed with status: ${response.status}`);
      }
      
      setAdminResult({ status: response.status, statusText: response.statusText });
    } catch (error: any) {
      setAdminError(error.message);
    } finally {
      setIsTestingAdmin(false);
    }
  };
  
  const uploadImage = async () => {
    if (!uploadFile) {
      setUploadError("Please select a file first");
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);
    setUploadResult(null);
    
    try {
      const formData = new FormData();
      formData.append('images', uploadFile);
      
      const response = await fetch('/api/fine-tuning/upload-image', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      setUploadResult(data);
    } catch (error: any) {
      setUploadError(error.message);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">CORS Testing Suite</h1>
      <p className="text-muted-foreground mb-8">
        This page helps you verify that the CORS configuration is working correctly for the fine-tuning API.
      </p>
      
      <Tabs defaultValue="local" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="local">Local Testing</TabsTrigger>
          <TabsTrigger value="remote">Remote Testing</TabsTrigger>
          <TabsTrigger value="upload">File Upload Testing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="local">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Test Local CORS Configuration</CardTitle>
                <CardDescription>
                  This test verifies that the basic CORS endpoint is accessible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={testCors} 
                  disabled={isTestingCors}
                  className="mb-4"
                >
                  {isTestingCors ? "Testing..." : "Test Local CORS"}
                </Button>
                
                {corsResult && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-600">Success!</AlertTitle>
                    <AlertDescription>
                      <pre className="mt-2 bg-black/5 p-4 rounded-md overflow-auto">
                        {JSON.stringify(corsResult, null, 2)}
                      </pre>
                    </AlertDescription>
                  </Alert>
                )}
                
                {corsError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{corsError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Test Admin Page Access</CardTitle>
                <CardDescription>
                  This test verifies that the fine-tuning admin page is accessible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={testAdminAccess} 
                  disabled={isTestingAdmin}
                  className="mb-4"
                >
                  {isTestingAdmin ? "Testing..." : "Test Admin Page"}
                </Button>
                
                {adminResult && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-600">Success!</AlertTitle>
                    <AlertDescription>
                      <p>Admin page is accessible. Status: {adminResult.status}</p>
                      <Button asChild className="mt-2">
                        <a href="/api/fine-tuning/admin-page" target="_blank" rel="noopener noreferrer">
                          <LinkIcon className="mr-2 h-4 w-4" /> Open Admin Page
                        </a>
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                
                {adminError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{adminError}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="remote">
          <Card>
            <CardHeader>
              <CardTitle>Test Remote CORS Access</CardTitle>
              <CardDescription>
                Test CORS from a different domain or server by entering the full URL to the CORS test endpoint.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="corsUrl">Remote CORS Test URL</Label>
                  <Input
                    id="corsUrl"
                    placeholder="https://your-server.com/api/fine-tuning/cors/test"
                    value={corsUrl}
                    onChange={(e) => setCorsUrl(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={testCors} 
                  disabled={isTestingCors || !corsUrl}
                  className="w-fit"
                >
                  {isTestingCors ? "Testing..." : "Test Remote CORS"}
                </Button>
                
                {corsResult && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-600">Success!</AlertTitle>
                    <AlertDescription>
                      <pre className="mt-2 bg-black/5 p-4 rounded-md overflow-auto">
                        {JSON.stringify(corsResult, null, 2)}
                      </pre>
                    </AlertDescription>
                  </Alert>
                )}
                
                {corsError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      {corsError}
                      <p className="mt-2">
                        This error could be due to CORS restrictions or the server not being accessible.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm text-muted-foreground">
              <p>How to run the CORS test from another system:</p>
              <ol className="list-decimal pl-6 space-y-1">
                <li>Copy the <code>scripts/test-cors.js</code> file to the other system</li>
                <li>Run <code>node test-cors.js https://your-server-url.com</code></li>
              </ol>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Test File Upload</CardTitle>
              <CardDescription>
                Test file upload functionality for the fine-tuning API.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="fileUpload">Select Image File</Label>
                  <Input
                    id="fileUpload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  />
                </div>
                
                <Button 
                  onClick={uploadImage} 
                  disabled={isUploading || !uploadFile}
                  className="w-fit"
                >
                  {isUploading ? "Uploading..." : "Upload Image"}
                </Button>
                
                {uploadResult && (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle className="text-green-600">Success!</AlertTitle>
                    <AlertDescription>
                      <pre className="mt-2 bg-black/5 p-4 rounded-md overflow-auto">
                        {JSON.stringify(uploadResult, null, 2)}
                      </pre>
                    </AlertDescription>
                  </Alert>
                )}
                
                {uploadError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      {uploadError}
                      <p className="mt-2">
                        This error could be due to file size limits, CORS restrictions, or server configuration issues.
                      </p>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-12 p-6 border rounded-lg bg-muted/20">
        <h2 className="text-xl font-semibold mb-4">Additional Testing Resources</h2>
        <ul className="space-y-2">
          <li>
            <a 
              href="/api/fine-tuning/cors/test-page" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary flex items-center hover:underline"
            >
              <LinkIcon className="mr-2 h-4 w-4" /> CORS Test Page
            </a>
          </li>
          <li>
            <a 
              href="/api/fine-tuning/admin-page" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary flex items-center hover:underline"
            >
              <LinkIcon className="mr-2 h-4 w-4" /> Fine-tuning Admin Page
            </a>
          </li>
          <li>
            <a 
              href="/api/fine-tuning/test-page" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary flex items-center hover:underline"
            >
              <LinkIcon className="mr-2 h-4 w-4" /> Fine-tuning Test Page
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}