"use client"


export const runtime = 'edge';
import { useState, useCallback } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  MessageCircle,
  Mail,
  Phone,
  Search,
  Clock,
  MapPin,
  Send,
  CheckCircle2,
} from "lucide-react"

const EMAIL = "carwise15@gmail.com"
const PHONE1 = "07774472106"
const PHONE2_DISPLAY = "0770 450 1030"
const TEL1 = "tel:+9647774472106"
const TEL2 = "tel:+9647704501030"
const WA1 = "https://wa.me/9647774472106"
const WA2 = "https://wa.me/9647704501030"

const SUBJECT_KEYS = [
  "generalInquiry",
  "pricePrediction",
  "sellingCar",
  "buyingCar",
  "technicalIssue",
  "partnership",
  "other",
] as const

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export default function SupportPage() {
  const locale = useLocale()
  const t = useTranslations("support")
  const tCommon = useTranslations("common")
  const isRTL = locale === "ar" || locale === "ku"

  const [searchQuery, setSearchQuery] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const scrollToFaq = useCallback(() => {
    document.getElementById("faq-section")?.scrollIntoView({ behavior: "smooth" })
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    scrollToFaq()
  }

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    // Simulate form submission (replace with your API/backend)
    await new Promise((r) => setTimeout(r, 800))
    setSubmitted(true)
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" })
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-[calc(100vh-12rem)] pb-4" dir={isRTL ? "rtl" : "ltr"}>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 bg-mesh-deep px-4 py-12 sm:px-6 sm:py-16 md:py-20">
        <div className="relative z-10 mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-lg text-slate-400 sm:text-xl">
            {t("subtitle")}
          </p>
          <form onSubmit={handleSearch} className="mt-6 sm:mt-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
              <div className="relative flex-1">
                <Search className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 ${isRTL ? "right-4 left-auto" : "left-4"}`} />
                <input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`h-12 w-full rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${isRTL ? "pr-11 pl-4" : "pl-11 pr-4"}`}
                />
              </div>
              <Button type="submit" size="lg" className="min-h-[48px] shrink-0 sm:min-h-0">
                {tCommon("search")}
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Quick Contact Cards */}
      <section className="mt-8 sm:mt-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Live Chat */}
          <a
            href={WA1}
            target="_blank"
            rel="noopener noreferrer"
            className="group"
          >
            <Card className="glass-card h-full border-white/10 transition-all duration-300 hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.12)]">
              <CardContent className="flex flex-col items-start p-6">
                <div className="mb-4 rounded-xl bg-indigo-500/15 p-3 text-indigo-400 transition-colors group-hover:bg-indigo-500/25">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">{t("liveChat.title")}</h3>
                <p className="mt-1 text-sm text-slate-400">{t("liveChat.description")}</p>
                <Button variant="outline" size="sm" className="mt-4 border-white/20 text-indigo-300 hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-indigo-200">
                  {t("liveChat.button")}
                </Button>
              </CardContent>
            </Card>
          </a>

          {/* Email */}
          <a href={`mailto:${EMAIL}`} className="group">
            <Card className="glass-card h-full border-white/10 transition-all duration-300 hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.12)]">
              <CardContent className="flex flex-col items-start p-6">
                <div className="mb-4 rounded-xl bg-violet-500/15 p-3 text-violet-400 transition-colors group-hover:bg-violet-500/25">
                  <Mail className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-white">{t("emailSupport.title")}</h3>
                <p className="mt-1 break-all text-sm text-slate-400">{EMAIL}</p>
                <span className="mt-4 text-sm font-medium text-indigo-400 group-hover:underline">{t("emailSupport.sendLink")}</span>
              </CardContent>
            </Card>
          </a>

          {/* WhatsApp */}
          <Card className="glass-card h-full border-white/10 transition-all duration-300 hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.12)]">
            <CardContent className="flex flex-col items-start p-6">
              <div className="mb-4 rounded-xl bg-emerald-500/15 p-3 text-[#25D366] transition-colors hover:bg-emerald-500/25">
                <WhatsAppIcon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">{t("whatsappSupport.title")}</h3>
              <p className="mt-1 text-sm text-slate-400">{t("whatsappSupport.description")}</p>
              <div className="mt-4 flex flex-col gap-2">
                <a
                  href={WA1}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-emerald-400 hover:underline"
                >
                  {PHONE1}
                </a>
                <a
                  href={WA2}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-emerald-400 hover:underline"
                >
                  {PHONE2_DISPLAY}
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Phone */}
          <Card className="glass-card h-full border-white/10 transition-all duration-300 hover:border-indigo-500/40 hover:shadow-[0_0_30px_rgba(99,102,241,0.12)]">
            <CardContent className="flex flex-col items-start p-6">
              <div className="mb-4 rounded-xl bg-blue-500/15 p-3 text-blue-400 transition-colors hover:bg-blue-500/25">
                <Phone className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">{t("phoneSupport.title")}</h3>
              <p className="mt-1 text-sm text-slate-400">{t("phoneSupport.description")}</p>
              <div className="mt-4 flex flex-col gap-2">
                <a href={TEL1} className="text-sm font-medium text-blue-400 hover:underline">
                  {PHONE1}
                </a>
                <a href={TEL2} className="text-sm font-medium text-blue-400 hover:underline">
                  {PHONE2_DISPLAY}
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact-form" className="mt-10 sm:mt-14">
        <Card className="glass-card overflow-hidden border-white/10">
          <CardHeader>
            <CardTitle className="text-xl text-white sm:text-2xl">{t("contactForm.title")}</CardTitle>
            <p className="text-slate-400">{t("contactForm.subtitle")}</p>
          </CardHeader>
          <CardContent>
            {submitted ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                <h3 className="mt-4 text-lg font-semibold text-white">{t("contactForm.successTitle")}</h3>
                <p className="mt-2 text-slate-400">{t("contactForm.successMessage")}</p>
                <Button
                  variant="outline"
                  className="mt-6 border-white/20"
                  onClick={() => setSubmitted(false)}
                >
                  {t("contactForm.sendAnother")}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-300">{t("contactForm.name")}</Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => handleFormChange("name", e.target.value)}
                      placeholder={t("contactForm.namePlaceholder")}
                      className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">{t("contactForm.email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleFormChange("email", e.target.value)}
                      placeholder={t("contactForm.emailPlaceholder")}
                      className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                    />
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-slate-300">{t("contactForm.phone")}</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleFormChange("phone", e.target.value)}
                      placeholder={t("contactForm.phonePlaceholder")}
                      className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-slate-300">{t("contactForm.subject")}</Label>
                    <Select
                      value={formData.subject}
                      onValueChange={(v) => handleFormChange("subject", v)}
                    >
                      <SelectTrigger className="border-white/10 bg-white/5 text-white placeholder:text-slate-500">
                        <SelectValue placeholder={t("contactForm.subjectPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECT_KEYS.map((key) => (
                          <SelectItem key={key} value={key}>
                            {t(`subjectOptions.${key}`)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-slate-300">{t("contactForm.message")}</Label>
                  <Textarea
                    id="message"
                    required
                    value={formData.message}
                    onChange={(e) => handleFormChange("message", e.target.value)}
                    placeholder={t("contactForm.messagePlaceholder")}
                    rows={5}
                    className="min-h-[120px] border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                  />
                </div>
                <Button type="submit" disabled={isSubmitting} size="lg" className="min-h-[48px]">
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      {t("contactForm.sending")}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Send className="h-4 w-4" />
                      {t("contactForm.submit")}
                    </span>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </section>

      {/* FAQ */}
      <section id="faq-section" className="mt-10 sm:mt-14">
        <Card className="glass-card overflow-hidden border-white/10">
          <CardHeader>
            <CardTitle className="text-xl text-white sm:text-2xl">{t("faq.title")}</CardTitle>
            <p className="text-slate-400">{t("faq.subtitle")}</p>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {([1, 2, 3, 4, 5] as const).map((i) => (
                <AccordionItem
                  key={i}
                  value={`faq-${i}`}
                  className="border-white/10"
                >
                  <AccordionTrigger className="text-start text-white hover:text-indigo-400 [&[data-state=open]]:text-indigo-400">
                    {t(`faq.q${i}`)}
                  </AccordionTrigger>
                  <AccordionContent className="text-slate-400">
                    {t(`faq.a${i}`)}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </section>

      {/* Support Hours & Location */}
      <section className="mt-10 sm:mt-14">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="glass-card border-white/10">
            <CardContent className="flex items-start gap-4 p-6">
              <div className="rounded-xl bg-amber-500/15 p-3 text-amber-400">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{t("hours.title")}</h3>
                <p className="mt-2 text-slate-400">{t("hours.schedule")}</p>
                <p className="mt-1 text-sm text-slate-500">{t("hours.note")}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card border-white/10">
            <CardContent className="flex items-start gap-4 p-6">
              <div className="rounded-xl bg-rose-500/15 p-3 text-rose-400">
                <MapPin className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{t("location.title")}</h3>
                <p className="mt-2 text-slate-400">{t("location.region")}</p>
                <p className="mt-1 text-sm text-slate-400">{t("location.cities")}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
