"use client";

import { QRCodeSVG } from "react-qr-code";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef } from "react";

interface QRCodeDisplayProps {
  url: string;
  title: string;
  size?: number;
}

export function QRCodeDisplay({ url, title, size = 200 }: QRCodeDisplayProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${title.toLowerCase().replace(/\s+/g, "-")}-qr-code.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 bg-slate-900/40 backdrop-blur-md rounded-lg border border-slate-700/50">
      <h3 className="font-semibold text-white text-sm">{title}</h3>
      <div ref={qrRef} className="p-3 bg-white rounded-lg">
        <QRCodeSVG
          value={url}
          size={size}
          level="H"
          includeMargin={true}
        />
      </div>
      <p className="text-xs text-slate-400 text-center max-w-[200px] break-all">
        {url}
      </p>
      <Button 
        onClick={handleDownload} 
        variant="outline" 
        size="sm"
        className="w-full bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 text-white"
      >
        <Download className="h-4 w-4 mr-2" />
        Download
      </Button>
    </div>
  );
}


