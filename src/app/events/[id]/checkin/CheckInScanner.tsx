"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";

interface CheckInResult {
  success: boolean;
  alreadyCheckedIn?: boolean;
  attendee?: {
    name: string;
    email: string;
    checkedInAt?: Date | null;
  };
  error?: string;
}

export default function CheckInScanner({
  eventId,
  checkInAction,
}: {
  eventId: string;
  checkInAction: (
    attendeeId: string,
    eventId: string,
  ) => Promise<CheckInResult>;
}) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrCodeRegionId = "qr-reader";

  const startScanner = async () => {
    try {
      setScanning(true);
      setError(null);
      setResult(null);

      const html5QrCode = new Html5Qrcode(qrCodeRegionId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          // Stop scanning when we get a result
          void html5QrCode.stop().then(() => {
            setScanning(false);

            // Parse the URL to extract attendeeId
            try {
              const url = new URL(decodedText);
              const attendeeId = url.searchParams.get("attendeeId");

              if (!attendeeId) {
                setError("Invalid QR code: No attendee ID found");
                return;
              }

              // Call the check-in action
              void checkInAction(attendeeId, eventId).then((checkInResult) => {
                setResult(checkInResult);
              });
            } catch (e) {
              setError("Invalid QR code format");
              console.error(e);
            }
          });
        },
        (errorMessage) => {
          // Ignore scanning errors (they happen constantly while searching)
          console.debug(errorMessage);
        },
      );
    } catch (err) {
      setScanning(false);
      setError("Failed to start camera. Please check permissions.");
      console.error(err);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white/10 p-6 backdrop-blur-sm">
        <div
          id={qrCodeRegionId}
          className="mx-auto w-full"
          style={{ minHeight: scanning ? "300px" : "0px" }}
        />

        {!scanning && !result && (
          <div className="py-8 text-center">
            <p className="mb-4 text-white/80">
              Click the button below to start scanning QR codes
            </p>
            <button
              onClick={startScanner}
              className="rounded-lg bg-white px-8 py-4 text-lg font-semibold text-purple-700 transition-colors hover:bg-gray-100"
            >
              Start Scanner
            </button>
          </div>
        )}

        {scanning && (
          <div className="mt-4 text-center">
            <p className="mb-4 text-white/80">
              Point your camera at a QR code to check in
            </p>
            <button
              onClick={stopScanner}
              className="rounded-lg bg-red-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-600"
            >
              Stop Scanner
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500 bg-red-500/20 p-4 text-center">
            <p className="font-semibold text-red-200">Error</p>
            <p className="mt-1 text-sm text-red-300">{error}</p>
            <button
              onClick={() => {
                setError(null);
                void startScanner();
              }}
              className="mt-4 rounded-lg bg-white px-6 py-2 font-semibold text-purple-700 transition-colors hover:bg-gray-100"
            >
              Try Again
            </button>
          </div>
        )}

        {result && (
          <div
            className={`rounded-lg border p-6 text-center ${
              result.success
                ? "border-green-500 bg-green-500/20"
                : "border-red-500 bg-red-500/20"
            }`}
          >
            <div className="mb-4 text-6xl">
              {result.success ? (result.alreadyCheckedIn ? "ℹ️" : "✅") : "❌"}
            </div>

            {result.success ? (
              <>
                <h3 className="mb-2 text-2xl font-bold text-green-200">
                  {result.alreadyCheckedIn
                    ? "Already Checked In"
                    : "Check-In Successful!"}
                </h3>
                {result.attendee && (
                  <div className="mb-4 rounded-lg bg-white/10 p-4">
                    <p className="text-xl font-semibold text-white">
                      {result.attendee.name}
                    </p>
                    <p className="text-sm text-white/80">
                      {result.attendee.email}
                    </p>
                    {result.attendee.checkedInAt && (
                      <p className="mt-2 text-xs text-white/60">
                        Checked in at:{" "}
                        {new Date(result.attendee.checkedInAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <h3 className="mb-2 text-2xl font-bold text-red-200">
                  Check-In Failed
                </h3>
                <p className="text-red-300">{result.error}</p>
              </>
            )}

            <button
              onClick={() => {
                setResult(null);
                void startScanner();
              }}
              className="mt-4 rounded-lg bg-white px-6 py-3 font-semibold text-purple-700 transition-colors hover:bg-gray-100"
            >
              Scan Next Attendee
            </button>
          </div>
        )}
      </div>

      <div className="rounded-lg bg-white/10 p-4 text-sm text-white/80">
        <h3 className="mb-2 font-semibold">Instructions:</h3>
        <ol className="list-inside list-decimal space-y-1">
          <li>Click &ldquo;Start Scanner&rdquo; to activate your camera</li>
          <li>Point your camera at an attendee&apos;s QR code</li>
          <li>The system will automatically check them in</li>
          <li>Scan the next attendee&apos;s QR code to continue</li>
        </ol>
      </div>
    </div>
  );
}
