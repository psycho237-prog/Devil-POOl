"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Download, Calendar, MapPin, Clock, User, Phone, CreditCard, Hash } from "lucide-react"
import QRCode from "qrcode"

interface BookingData {
  id: string
  fullName: string
  phone: string
  passType: "ONE MAN" | "ONE LADY" | "FIVE QUEENS"
  price: string
  qrCode: string
  qrCodeData: string // The actual data embedded in QR
  bookingDate: string
  eventDate: string
  eventLocation: string
  eventTime: string
}

export default function ConfirmationPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [bookingData, setBookingData] = useState<BookingData | null>(null)
  const [qrCodeImage, setQrCodeImage] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadBookingData = async () => {
      try {
        // Get booking details from URL params
        const fullName = searchParams.get("name")
        const phone = searchParams.get("phone")
        const passType = searchParams.get("passType") as "ONE MAN" | "ONE LADY" | "FIVE QUEENS"
        const price = searchParams.get("price")
        const bookingId = searchParams.get("bookingId")

        // If no data in URL, try to get from sessionStorage
        let data: BookingData

        if (bookingId) {
          // In production, fetch from API: GET /api/bookings/${bookingId}
          const storedBooking = sessionStorage.getItem(`booking_${bookingId}`)
          
          if (storedBooking) {
            data = JSON.parse(storedBooking)
          } else if (fullName && phone && passType && price) {
            // Create new booking data
            const newBookingId = generateBookingId()
            data = {
              id: newBookingId,
              fullName,
              phone,
              passType,
              price,
              qrCodeData: `DT-${newBookingId}`, // Data embedded in QR code
              qrCode: "", // Will be generated
              bookingDate: new Date().toISOString(),
              eventDate: "30 Novembre 2025",
              eventLocation: "Pool Paradise, Douala",
              eventTime: "20h00 - 04h00"
            }
            
            // Store in sessionStorage (in production, this comes from your database)
            sessionStorage.setItem(`booking_${newBookingId}`, JSON.stringify(data))
          } else {
            // No booking data found
            router.push("/passes")
            return
          }
        } else if (fullName && phone && passType && price) {
          // Create new booking
          const newBookingId = generateBookingId()
          data = {
            id: newBookingId,
            fullName,
            phone,
            passType,
            price,
            qrCodeData: `DT-${newBookingId}`,
            qrCode: "",
            bookingDate: new Date().toISOString(),
            eventDate: "30 Novembre 2025",
            eventLocation: "Pool Paradise, Douala",
            eventTime: "20h00 - 04h00"
          }
          
          sessionStorage.setItem(`booking_${newBookingId}`, JSON.stringify(data))
        } else {
          // No data available
          router.push("/passes")
          return
        }

        // Generate QR code with embedded booking ID
        const qrDataString = JSON.stringify({
          bookingId: data.id,
          name: data.fullName,
          passType: data.passType,
          phone: data.phone,
          timestamp: data.bookingDate
        })

        const qrImage = await QRCode.toDataURL(qrDataString, {
          width: 300,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF"
          }
        })

        data.qrCode = qrImage
        setQrCodeImage(qrImage)
        setBookingData(data)
        setLoading(false)

      } catch (error) {
        console.error("Error loading booking data:", error)
        setLoading(false)
      }
    }

    loadBookingData()
  }, [searchParams, router])

  // Generate unique booking ID
  const generateBookingId = (): string => {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substr(2, 5).toUpperCase()
    return `2025-${timestamp}-${random}`
  }

  // Download QR code
  const handleDownload = () => {
    if (!qrCodeImage || !bookingData) return

    const link = document.createElement("a")
    link.href = qrCodeImage
    link.download = `DemonTime-Ticket-${bookingData.id}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Get pass color based on type
  const getPassColor = (passType: string) => {
    switch (passType) {
      case "ONE MAN":
        return "from-blue-600 to-blue-800"
      case "ONE LADY":
        return "from-pink-600 to-pink-800"
      case "FIVE QUEENS":
        return "from-purple-600 to-purple-800"
      default:
        return "from-red-600 to-red-800"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#FF0000] mx-auto mb-4"></div>
          <p className="text-white text-lg">Génération de votre billet...</p>
        </div>
      </div>
    )
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="max-w-md w-full bg-gray-900 border-red-600">
          <CardHeader>
            <CardTitle className="text-red-600">Erreur</CardTitle>
            <CardDescription className="text-gray-400">
              Impossible de charger les détails de votre réservation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => router.push("/passes")}
              className="w-full bg-[#FF0000] hover:bg-red-700"
            >
              Retour aux billets
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-600 rounded-full mb-4">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: "var(--font-cinzel)" }}>
            Réservation Confirmée!
          </h1>
          <p className="text-gray-400 text-lg">
            Votre billet a été généré avec succès
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* QR Code Card */}
          <Card className="bg-gray-900 border-2 border-[#FFD700]">
            <CardHeader>
              <CardTitle className="text-[#FFD700] flex items-center gap-2">
                <Hash className="w-5 h-5" />
                QR Code d'Entrée
              </CardTitle>
              <CardDescription className="text-gray-400">
                Présentez ce code à l'entrée
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* QR Code */}
              <div className="bg-white p-4 rounded-lg">
                {qrCodeImage && (
                  <img 
                    src={qrCodeImage} 
                    alt="QR Code" 
                    className="w-full h-auto"
                  />
                )}
              </div>

              {/* Booking ID */}
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">ID de Réservation</p>
                <p className="text-sm font-mono text-[#FFD700] font-bold">
                  {bookingData.id}
                </p>
              </div>

              {/* Download Button */}
              <Button 
                onClick={handleDownload}
                className="w-full bg-[#FF0000] hover:bg-red-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger le QR Code
              </Button>

              <p className="text-xs text-gray-500 text-center">
                ⚠️ Pas de QR Code = Pas d'entrée
              </p>
            </CardContent>
          </Card>

          {/* Booking Details Card */}
          <Card className="bg-gray-900 border-2 border-[#FFD700]">
            <CardHeader>
              <CardTitle className={`bg-gradient-to-r ${getPassColor(bookingData.passType)} text-transparent bg-clip-text`}>
                {bookingData.passType}
              </CardTitle>
              <CardDescription className="text-gray-400">
                Détails de votre réservation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Info */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-[#FFD700] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Nom Complet</p>
                    <p className="text-white font-medium">{bookingData.fullName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#FFD700] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Téléphone</p>
                    <p className="text-white font-medium">{bookingData.phone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-[#FFD700] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Prix</p>
                    <p className="text-white font-medium text-lg">{bookingData.price}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-[#FFD700] font-semibold mb-3">Détails de l'Événement</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="text-white">{bookingData.eventDate}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Heure</p>
                      <p className="text-white">{bookingData.eventTime}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-500">Lieu</p>
                      <p className="text-white">{bookingData.eventLocation}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Important Notice */}
        <Card className="mt-6 bg-gradient-to-r from-red-900/20 to-orange-900/20 border-2 border-[#FF0000]">
          <CardContent className="pt-6">
            <h3 className="text-[#FF0000] font-bold text-lg mb-3">
              ⚠️ Instructions Importantes
            </h3>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-[#FF0000] mt-1">•</span>
                <span>Téléchargez ou faites une capture d'écran de votre QR code</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FF0000] mt-1">•</span>
                <span>Présentez le QR code à l'entrée pour scanner</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FF0000] mt-1">•</span>
                <span>Chaque QR code est unique et ne peut être utilisé qu'une seule fois</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#FF0000] mt-1">•</span>
                <span>Conservez votre ID de réservation: <span className="font-mono text-[#FFD700]">{bookingData.id}</span></span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button
            onClick={() => router.push("/")}
            variant="outline"
            className="flex-1 border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-black"
          >
            Retour à l'Accueil
          </Button>
          <Button
            onClick={() => router.push("/passes")}
            className="flex-1 bg-[#FF0000] hover:bg-red-700 text-white"
          >
            Réserver un Autre Billet
          </Button>
        </div>
      </div>
    </div>
  )
}
