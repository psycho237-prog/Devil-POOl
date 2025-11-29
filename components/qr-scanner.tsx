 "use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, X, AlertCircle } from "lucide-react"

interface QRScannerProps {
  onScan: (data: string) => void
  onClose?: () => void
}

interface ScannedQRData {
  bookingId: string
  name: string
  passType: string
  phone: string
  timestamp: string
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string>("")
  const [hasPermission, setHasPermission] = useState<boolean>(false)
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    startCamera()

    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    try {
      setError("")
      
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera on mobile
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setHasPermission(true)
        setIsScanning(true)

        // Start scanning after video loads
        videoRef.current.onloadedmetadata = () => {
          startScanning()
        }
      }
    } catch (err) {
      console.error("Camera access error:", err)
      setError("Impossible d'accéder à la caméra. Veuillez autoriser l'accès à la caméra.")
      setHasPermission(false)
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach((track) => track.stop())
      videoRef.current.srcObject = null
    }

    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    setIsScanning(false)
  }

  const startScanning = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context) return

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Scan every 300ms
    scanIntervalRef.current = setInterval(() => {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

        // Use jsQR library (loaded via script tag in admin layout)
        // @ts-ignore - jsQR is loaded globally
        if (typeof jsQR !== "undefined") {
          // @ts-ignore
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          })

          if (code && code.data) {
            handleQRCodeDetected(code.data)
          }
        }
      }
    }, 300)
  }

  const handleQRCodeDetected = (qrContent: string) => {
    console.log("QR Code détecté:", qrContent)

    // Stop scanning to prevent multiple scans
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current)
      scanIntervalRef.current = null
    }

    try {
      // Try to parse as JSON (our format)
      const parsedData: ScannedQRData = JSON.parse(qrContent)
      
      // Validate the structure
      if (parsedData.bookingId && parsedData.name && parsedData.passType) {
        console.log("QR Code valide:", parsedData)
        
        // Send the booking ID to parent component
        onScan(parsedData.bookingId)
      } else {
        // If JSON but missing required fields
        console.warn("QR Code JSON invalide:", parsedData)
        onScan(qrContent) // Send raw content anyway
      }
    } catch (error) {
      // Not JSON format, might be old format or invalid
      console.log("QR Code non-JSON, envoi du contenu brut:", qrContent)
      
      // Check if it's an old format (e.g., "DT-2025-ABC123")
      if (qrContent.startsWith("DT-")) {
        onScan(qrContent)
      } else {
        // Unknown format
        onScan(qrContent)
      }
    }

    // Resume scanning after 2 seconds
    setTimeout(() => {
      if (isScanning) {
        startScanning()
      }
    }, 2000)
  }

  const handleClose = () => {
    stopCamera()
    onClose?.()
  }

  const retryCamera = () => {
    stopCamera()
    startCamera()
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-gray-900 border-[#FFD700]">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Camera className="w-6 h-6 text-[#FFD700]" />
              Scanner QR Code
            </h3>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </Button>
            )}
          </div>

          {/* Camera View */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-square mb-4">
            {hasPermission ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-4 border-[#FFD700] rounded-lg w-64 h-64 relative">
                    {/* Corner decorations */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#FF0000]"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#FF0000]"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#FF0000]"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#FF0000]"></div>

                    {/* Scanning line animation */}
                    {isScanning && (
                      <div className="absolute inset-x-0 top-0 h-1 bg-[#FF0000] animate-scan"></div>
                    )}
                  </div>
                </div>

                {/* Status indicator */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 px-4 py-2 rounded-full">
                  <p className="text-white text-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    En cours de scan...
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <p className="text-white mb-4">{error || "Accès à la caméra requis"}</p>
                <Button
                  onClick={retryCamera}
                  className="bg-[#FF0000] hover:bg-red-700 text-white"
                >
                  Réessayer
                </Button>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-gray-800 rounded-lg p-4">
            <p className="text-gray-300 text-sm text-center">
              Placez le QR code dans le cadre pour le scanner automatiquement
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Custom animation styles */}
      <style jsx>{`
        @keyframes scan {
          0% {
            top: 0;
          }
          50% {
            top: 100%;
          }
          100% {
            top: 0;
          }
        }

        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  )
}
