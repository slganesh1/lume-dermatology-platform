import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Apple, Smartphone, QrCode, Download } from "lucide-react";

interface AppDownloadLinksProps {
  variant?: "default" | "minimal" | "banner";
  showTitle?: boolean;
}

export function AppDownloadLinks({ variant = "default", showTitle = true }: AppDownloadLinksProps) {
  const [open, setOpen] = useState(false);
  
  const renderMinimal = () => (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="flex items-center gap-1">
        <Apple className="h-4 w-4" />
        iOS
      </Button>
      <Button variant="outline" size="sm" className="flex items-center gap-1">
        <Smartphone className="h-4 w-4" />
        Android
      </Button>
    </div>
  );
  
  const renderDefault = () => (
    <div className="space-y-4">
      {showTitle && (
        <h3 className="text-base font-medium">Get the LUME app on your device</h3>
      )}
      <div className="flex flex-wrap gap-3">
        <Button 
          variant="outline" 
          className="flex items-center gap-2 py-6 px-4 h-auto border-2"
          onClick={() => window.open("#", "_blank")}
        >
          <Apple className="h-5 w-5" />
          <div className="flex flex-col items-start">
            <span className="text-xs">Download on the</span>
            <span className="text-base font-medium">App Store</span>
          </div>
        </Button>
        
        <Button 
          variant="outline" 
          className="flex items-center gap-2 py-6 px-4 h-auto border-2"
          onClick={() => window.open("#", "_blank")}
        >
          <Smartphone className="h-5 w-5" />
          <div className="flex flex-col items-start">
            <span className="text-xs">GET IT ON</span>
            <span className="text-base font-medium">Google Play</span>
          </div>
        </Button>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 py-6 px-4 h-auto border-2"
            >
              <QrCode className="h-5 w-5" />
              <div className="flex flex-col items-start">
                <span className="text-xs">Scan with</span>
                <span className="text-base font-medium">QR Code</span>
              </div>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Download LUME App</DialogTitle>
              <DialogDescription>
                Scan the QR code with your phone camera to download the app
              </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="ios" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="ios">iOS</TabsTrigger>
                <TabsTrigger value="android">Android</TabsTrigger>
              </TabsList>
              <TabsContent value="ios" className="flex justify-center">
                <div className="bg-primary/5 p-10 rounded-lg border">
                  {/* Placeholder for QR code */}
                  <div className="w-48 h-48 bg-primary/10 border-2 border-primary flex items-center justify-center">
                    <span className="text-sm text-center px-4">QR code for iOS app download<br/>(Demo)</span>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="android" className="flex justify-center">
                <div className="bg-primary/5 p-10 rounded-lg border">
                  {/* Placeholder for QR code */}
                  <div className="w-48 h-48 bg-primary/10 border-2 border-primary flex items-center justify-center">
                    <span className="text-sm text-center px-4">QR code for Android app download<br/>(Demo)</span>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
  
  const renderBanner = () => (
    <div className="bg-gradient-to-r from-primary/20 to-primary/5 rounded-lg p-5 shadow-sm">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Download className="h-8 w-8 text-primary" />
          <div>
            <h3 className="text-lg font-medium">Get the LUME Mobile App</h3>
            <p className="text-sm text-muted-foreground">Access your healthcare on the go</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button 
            className="bg-black text-white hover:bg-black/90 flex items-center gap-2"
            onClick={() => window.open("#", "_blank")}
          >
            <Apple className="h-4 w-4" />
            App Store
          </Button>
          <Button 
            className="bg-black text-white hover:bg-black/90 flex items-center gap-2"
            onClick={() => window.open("#", "_blank")}
          >
            <Smartphone className="h-4 w-4" />
            Google Play
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <QrCode className="h-4 w-4" />
                QR Code
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Download LUME App</DialogTitle>
                <DialogDescription>
                  Scan the QR code with your phone camera to download the app
                </DialogDescription>
              </DialogHeader>
              <Tabs defaultValue="ios" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="ios">iOS</TabsTrigger>
                  <TabsTrigger value="android">Android</TabsTrigger>
                </TabsList>
                <TabsContent value="ios" className="flex justify-center">
                  <div className="bg-primary/5 p-10 rounded-lg border">
                    {/* Placeholder for QR code */}
                    <div className="w-48 h-48 bg-primary/10 border-2 border-primary flex items-center justify-center">
                      <span className="text-sm text-center px-4">QR code for iOS app download<br/>(Demo)</span>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="android" className="flex justify-center">
                  <div className="bg-primary/5 p-10 rounded-lg border">
                    {/* Placeholder for QR code */}
                    <div className="w-48 h-48 bg-primary/10 border-2 border-primary flex items-center justify-center">
                      <span className="text-sm text-center px-4">QR code for Android app download<br/>(Demo)</span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
  
  switch (variant) {
    case "minimal":
      return renderMinimal();
    case "banner":
      return renderBanner();
    default:
      return renderDefault();
  }
}