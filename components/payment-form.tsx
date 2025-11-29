 "use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, CreditCard } from "lucide-react"

interface PaymentFormProps {
  passName: string
  passPrice: string
}

export default function PaymentForm({ passName, passPrice }: PaymentFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
  })
  const [selectedOperator, setSelectedOperator] = useState<"orange" | "mtn" | null>(null)
  const [errors, setErrors] = useState({
    fullName: "",
    phone: "",
    operator: "",
  })

  // Validate form fields
  const validateForm = (): boolean => {
    const newErrors = {
      fullName: "",
      phone: "",
      operator: "",
    }

    // Validate full name
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Le nom complet est requis"
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = "Le nom doit contenir au moins 3 caractères"
    }

    // Validate phone number (Cameroon format)
    const phoneRegex = /^(\+237|237)?[26]\d{8}$/
    if (!formData.phone.trim()) {
      newErrors.phone = "Le numéro de téléphone est requis"
    } else if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Numéro invalide (ex: 6XXXXXXXX ou 237XXXXXXXXX)"
    }

    // Validate operator selection
    if (!selectedOperator) {
      newErrors.operator = "Veuillez sélectionner un opérateur"
    }

    setErrors(newErrors)
    return !newErrors.fullName && !newErrors.phone && !newErrors.operator
  }

  // Format phone number for storage
  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\s/g, "")
    if (cleaned.startsWith("+237")) {
      return cleaned
    } else if (cleaned.startsWith("237")) {
      return "+" + cleaned
    } else {
      return "+237" + cleaned
    }
  }

  // Generate unique booking ID
  const generateBookingId = (): string => {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substr(2, 5).toUpperCase()
    return `2025-${timestamp}-${random}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Generate unique booking ID
      const bookingId = generateBookingId()
      const formattedPhone = formatPhoneNumber(formData.phone)

      // Prepare booking data
      const bookingData = {
        id: bookingId,
        fullName: formData.fullName.trim(),
        phone: formattedPhone,
        passType: passName,
        price: passPrice,
        paymentOperator: selectedOperator,
        bookingDate: new Date().toISOString(),
        eventDate: "30 Novembre 2025",
        eventLocation: "Pool Paradise, Douala",
        eventTime: "20h00 - 04h00",
      }

      // 🔴 BACKEND INTEGRATION POINT:
      // Replace this section with actual API call to your backend
      // Example:
      /*
      const response = await fetch("/api/bookings/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: bookingData.fullName,
          phone: bookingData.phone,
          passType: bookingData.passType,
          price: bookingData.price,
          paymentOperator: bookingData.paymentOperator,
        }),
      })

      if (!response.ok) {
        throw new Error("Payment failed")
      }

      const result = await response.json()
      const bookingId = result.bookingId
      */

      // Simulate API call delay (remove this in production)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Store booking data in sessionStorage for confirmation page
      // In production, this data should come from your database via the confirmation page
      sessionStorage.setItem(`booking_${bookingId}`, JSON.stringify(bookingData))

      // Log payment data for debugging (remove in production)
      console.log("Payment data:", {
        ...bookingData,
        operator: selectedOperator,
      })

      // Redirect to confirmation page with booking ID
      router.push(`/confirmation?bookingId=${bookingId}&name=${encodeURIComponent(bookingData.fullName)}&phone=${encodeURIComponent(bookingData.phone)}&passType=${encodeURIComponent(bookingData.passType)}&price=${encodeURIComponent(bookingData.price)}`)

    } catch (error) {
      console.error("Payment error:", error)
      alert("Une erreur est survenue lors du paiement. Veuillez réessayer.")
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const handleOperatorSelect = (operator: "orange" | "mtn") => {
    setSelectedOperator(operator)
    if (errors.operator) {
      setErrors((prev) => ({ ...prev, operator: "" }))
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Full Name Input */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-white">
            Nom Complet <span className="text-red-500">*</span>
          </Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="Jean Dupont"
            value={formData.fullName}
            onChange={handleInputChange}
            className={`bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 ${
              errors.fullName ? "border-red-500" : ""
            }`}
            disabled={isLoading}
            required
          />
          {errors.fullName && (
            <p className="text-red-500 text-sm">{errors.fullName}</p>
          )}
        </div>

        {/* Phone Number Input */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-white">
            Numéro de Téléphone <span className="text-red-500">*</span>
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="+237 6XX XXX XXX"
            value={formData.phone}
            onChange={handleInputChange}
            className={`bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 ${
              errors.phone ? "border-red-500" : ""
            }`}
            disabled={isLoading}
            required
          />
          {errors.phone && (
            <p className="text-red-500 text-sm">{errors.phone}</p>
          )}
        </div>

        {/* Payment Operator Selection */}
        <div className="space-y-3">
          <Label className="text-white">
            Mode de Paiement <span className="text-red-500">*</span>
          </Label>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Orange Money */}
            <Card
              className={`cursor-pointer transition-all ${
                selectedOperator === "orange"
                  ? "border-2 border-orange-500 bg-orange-500/10"
                  : "border-gray-700 hover:border-orange-500/50 bg-gray-800"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => !isLoading && handleOperatorSelect("orange")}
            >
              <CardContent className="p-4 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-white font-semibold">Orange Money</span>
                </div>
              </CardContent>
            </Card>

            {/* MTN MoMo */}
            <Card
              className={`cursor-pointer transition-all ${
                selectedOperator === "mtn"
                  ? "border-2 border-yellow-500 bg-yellow-500/10"
                  : "border-gray-700 hover:border-yellow-500/50 bg-gray-800"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              onClick={() => !isLoading && handleOperatorSelect("mtn")}
            >
              <CardContent className="p-4 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-black" />
                  </div>
                  <span className="text-white font-semibold">MTN MoMo</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {errors.operator && (
            <p className="text-red-500 text-sm">{errors.operator}</p>
          )}
        </div>

        {/* Price Display */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Montant Total:</span>
            <span className="text-2xl font-bold text-[#FFD700]">{passPrice}</span>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-[#FF0000] hover:bg-red-700 text-white text-lg py-6"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Traitement en cours...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-5 w-5" />
              Procéder au Paiement
            </>
          )}
        </Button>

        {/* Security Notice */}
        <p className="text-xs text-gray-500 text-center">
          🔒 Paiement sécurisé. Vos informations sont protégées.
        </p>
      </form>
    </div>
  )
}
