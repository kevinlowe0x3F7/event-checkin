"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export default function QRCodeDisplay({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        url,
        {
          width: 256,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        },
        (error) => {
          if (error) console.error("Error generating QR code:", error);
        }
      );
    }
  }, [url]);

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} className="mb-4" />
      <p className="text-xs text-gray-600 text-center break-all">
        {url}
      </p>
    </div>
  );
}
