"use client"

import { useState, useEffect, useMemo, memo, useRef } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Badge } from '@/components/ui/badge'
import {
  Target, Zap, Shield, BarChart3, Users,
  CheckCircle2, ArrowRight, Star, Globe,
  TrendingUp, Brain, MapPin,
  ChevronDown, Mail, Sparkles, Gift,
  Play, Award, TrendingDown
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { LearnMoreModal } from '@/components/LearnMoreModal'
import { motion } from 'framer-motion'
import { TypingAnimation } from '@/components/home/TypingAnimation'
import { FloatingParticles } from '@/components/home/FloatingParticles'
import { FloatingCar } from '@/components/home/FloatingCar'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// TypeScript interfaces for Hero Section
interface HeroSectionProps {
  t: (key: string) => string
  locale: string
  tCommon: (key: string) => string
  onLearnMoreClick: () => void
}

// Enhanced Hero Section Component
const HeroSection = memo(function HeroSection({ t, locale, tCommon, onLearnMoreClick }: HeroSectionProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [scrollY, setScrollY] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)
  const heroRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)

    // Mouse parallax effect
    const handleMouseMove = (e: MouseEvent) => {
      if (reducedMotion) return
      const rect = heroRef.current?.getBoundingClientRect()
      if (rect) {
        const x = (e.clientX - rect.left - rect.width / 2) * 0.02
        const y = (e.clientY - rect.top - rect.height / 2) * 0.02
        setMousePosition({ x, y })
      }
    }

    // Scroll parallax effect
    const handleScroll = () => {
      if (reducedMotion) return
      setScrollY(window.scrollY)
    }

    if (!reducedMotion) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true })
      window.addEventListener('scroll', handleScroll, { passive: true })
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
      mediaQuery.removeEventListener('change', handleChange)
    }
  }, [reducedMotion, heroRef])

  return (
    <section
      ref={heroRef}
      className="relative isolate min-h-[calc(100vh-80px)] flex flex-col items-center justify-center overflow-hidden py-12 sm:py-16 md:py-20 lg:py-32"
      aria-labelledby="hero-title"
    >
      {/* Cinematic Background with car-hero-5.jpg */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Desktop background image with parallax */}
        <div
          className="hidden md:block absolute inset-0"
          style={{
            transform: reducedMotion
              ? 'none'
              : `translate(${mousePosition.x}px, ${mousePosition.y + scrollY * 0.15}px) scale(1.1)`,
            transition: reducedMotion ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          <Image
            src="/images/hero/car-hero-5.jpg"
            alt=""
            fill
            className="object-cover object-center"
            priority
            quality={90}
            sizes="100vw"
            style={{
              opacity: 0.25,
              filter: 'blur(1.5px) brightness(0.85) contrast(1.2) saturate(1.0)',
            }}
            aria-hidden="true"
          />
        </div>
        {/* Mobile background image with parallax */}
        <div
          className="md:hidden absolute inset-0"
          style={{
            transform: reducedMotion
              ? 'none'
              : `translateY(${Math.min(scrollY * 0.15, 25)}px)`,
            transition: reducedMotion ? 'none' : 'transform 0.1s ease-out',
          }}
        >
          <Image
            src="/images/hero/car-hero-5.jpg"
            alt=""
            fill
            className="object-cover object-center"
            priority
            quality={90}
            sizes="100vw"
            style={{
              opacity: 0.2,
              filter: 'blur(2px) brightness(0.85) contrast(1.2) saturate(1.0)',
            }}
            aria-hidden="true"
          />
        </div>

        {/* Dark gradient overlay from top to bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/50"></div>

        {/* Edge vignette overlay */}
        <div className="absolute inset-0 heroVignette"></div>
      </div>

      {/* Subtle Floating Light Orbs - Very Slow Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
        {[...Array(4)].map((_, i) => {
          const positions = [
            { left: '15%', top: '25%' },
            { left: '85%', top: '30%' },
            { left: '50%', top: '60%' },
            { left: '25%', top: '70%' },
          ]
          const delays = [0, 2, 4, 6]
          const durations = [20, 25, 18, 22]

          return (
            <motion.div
              key={i}
              className="absolute w-32 h-32 rounded-full opacity-[0.055]"
              style={{
                background: 'radial-gradient(circle, rgba(99,102,241,0.4), transparent 70%)',
                left: positions[i].left,
                top: positions[i].top,
                filter: 'blur(40px)',
              }}
              animate={{
                x: [0, 30, -20, 0],
                y: [0, -25, 15, 0],
                scale: [1, 1.2, 0.9, 1],
              }}
              transition={{
                duration: durations[i],
                repeat: Infinity,
                delay: delays[i],
                ease: 'easeInOut',
              }}
              aria-hidden="true"
            />
          )
        })}
      </div>

      {/* Floating Particles - Disabled (too noisy) */}
      {/* <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1] opacity-0">
        <ErrorBoundary>
          <FloatingParticles />
        </ErrorBoundary>
      </div> */}

      {/* Content Container with Glass Card */}
      <div className="relative z-10 container w-full">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-6 md:gap-8 text-center px-4 sm:px-6 lg:px-8">
          {/* Premium Glass Card with Glow and Gradient Border */}
          <div className="relative mx-auto w-[95%] max-w-2xl sm:max-w-3xl">
            {/* Soft glow behind card (indigo-500/10 blur-3xl) */}
            <div
              aria-hidden="true"
              className="absolute -inset-6 -z-10 rounded-[32px] blur-3xl"
              style={{
                background: "radial-gradient(circle at 50% 40%, rgba(99,102,241,0.10), transparent 60%)",
              }}
            />
            {/* Gradient border wrapper with pulse animation */}
            <motion.div
              className="rounded-2xl sm:rounded-3xl glassBorder hero-card-border"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
            >
              {/* Glass card inner */}
              <div className="rounded-2xl sm:rounded-3xl glassCard px-5 py-6 sm:px-8 sm:py-10">
                {/* Hero Heading - Pure White */}
                <motion.h1
                  id="hero-title"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  className="text-2xl sm:text-3xl lg:text-5xl font-extrabold leading-tight tracking-tight text-white"
                  style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}
                >
                  {t('title') || 'Car Price Predictor Pro'}
                </motion.h1>

                {/* Subtitle with Typing Animation */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
                  className="mt-4 max-w-[280px] sm:max-w-md mx-auto text-xs sm:text-sm lg:text-base min-h-[2rem] sm:min-h-[2.5rem] flex items-center justify-center text-slate-200/95 leading-relaxed"
                >
                  <ErrorBoundary>
                    <TypingAnimation
                      text={t('description') || 'Get accurate car price estimates using advanced machine learning'}
                      speed={30}
                      className="font-light"
                    />
                  </ErrorBoundary>
                </motion.div>

                {/* Key Stats Row */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.3, ease: 'easeOut' }}
                  className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-2"
                  role="list"
                  aria-label="Key statistics"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs lg:text-sm" role="listitem">
                    <Award className="w-4 h-4 sm:w-5 sm:h-5 text-[#5B7FFF]" aria-hidden="true" />
                    <span className="text-white font-semibold">99.96%</span>
                    <span className="text-[#94a3b8]">Accuracy</span>
                  </div>
                  <div className="hidden sm:block w-1 h-1 rounded-full bg-[#5B7FFF]/50" aria-hidden="true" />
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs lg:text-sm" role="listitem">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" aria-hidden="true" />
                    <span className="text-white font-semibold">&lt;1s</span>
                    <span className="text-[#94a3b8]">Predictions</span>
                  </div>
                  <div className="hidden sm:block w-1 h-1 rounded-full bg-[#5B7FFF]/50" aria-hidden="true" />
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs lg:text-sm" role="listitem">
                    <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" aria-hidden="true" />
                    <span className="text-white font-semibold">60K+</span>
                    <span className="text-[#94a3b8]">Cars Analyzed</span>
                  </div>
                </motion.div>

                {/* CTA Buttons with Enhanced Animations */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }}
                  className="mt-7 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-center"
                >
                  <Link
                    href={`/${locale}/predict`}
                    aria-label="Get started with predictions"
                    className="focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-lg w-full sm:w-auto"
                  >
                    <motion.div
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      <Button
                        size="lg"
                        className="bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg shadow-indigo-500/20 transition-all duration-300 px-5 min-h-[44px] py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold w-full sm:w-auto"
                      >
                        <Play className="h-4 w-4 sm:h-5 sm:w-5 mr-2" aria-hidden="true" />
                        {tCommon('getStarted') || 'Get Started'}
                      </Button>
                    </motion.div>
                  </Link>
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    className="w-full sm:w-auto"
                  >
                    <Button
                      variant="outline"
                      size="lg"
                      className="bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all duration-300 px-5 min-h-[44px] py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-slate-950"
                      onClick={onLearnMoreClick}
                      aria-label="Learn more about the application"
                    >
                      {tCommon('learnMore') || 'Learn More'}
                    </Button>
                  </motion.div>
                </motion.div>

              </div>
            </motion.div>
          </div>
          {/* End Glass Card */}
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-16 left-1/2 -translate-x-1/2 hidden md:block"
        aria-hidden="true"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-2 text-[#94a3b8]"
        >
          <motion.span
            className="text-xs"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            Scroll
          </motion.span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.1 }}
          >
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
})

// Memoized components for performance
const HowItWorksSection = memo(function HowItWorksSection({ t, locale }: { t: any, locale: string }) {
  const steps = [
    {
      icon: Target,
      title: t('howItWorks.step1.title'),
      description: t('howItWorks.step1.description')
    },
    {
      icon: Brain,
      title: t('howItWorks.step2.title'),
      description: t('howItWorks.step2.description')
    },
    {
      icon: Zap,
      title: t('howItWorks.step3.title'),
      description: t('howItWorks.step3.description')
    },
  ]

  return (
    <section className="w-full py-12 sm:py-16 lg:py-24" aria-labelledby="how-it-works-title">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 id="how-it-works-title" className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
            {t('howItWorks.title')}
          </h2>
          <p className="text-sm sm:text-base text-[#94a3b8] max-w-2xl mx-auto">
            {t('howItWorks.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative"
              >
                <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-xl hover:bg-white/[0.05] hover:border-white/20 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20 transition-all duration-300 h-full">
                  <CardHeader className="text-center">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-[#5B7FFF] to-purple-600 flex items-center justify-center">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <Badge className="bg-[#5B7FFF] text-white">Step {index + 1}</Badge>
                    </div>
                    <CardTitle className="text-xl font-bold mt-4">{step.title}</CardTitle>
                    <CardDescription className="text-[#94a3b8] mt-2">
                      {step.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 -translate-y-1/2 z-10">
                    <ArrowRight className="h-6 w-6 text-[#5B7FFF]" />
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
})

const ValuePropositionSection = memo(function ValuePropositionSection({ t, locale }: { t: any, locale: string }) {
  const features = [
    { icon: Gift, text: t('valueProposition.features.unlimited') },
    { icon: Users, text: t('valueProposition.features.noSignup') },
    { icon: Shield, text: t('valueProposition.features.noAds') },
    { icon: Sparkles, text: t('valueProposition.features.alwaysFree') },
  ]

  return (
    <section className="w-full py-12 sm:py-16 lg:py-24" aria-labelledby="value-prop-title">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto"
        >
          <h2 id="value-prop-title" className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-white">
            {t('valueProposition.subtitle')}
          </h2>
          <p className="text-sm sm:text-base text-[#94a3b8] mb-8">
            {t('valueProposition.description')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex flex-col items-center p-4 bg-white/[0.03] backdrop-blur-xl rounded-lg border border-white/10 hover:bg-white/[0.05] hover:border-white/20 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20 transition-all duration-300"
                >
                  <Icon className="h-8 w-8 text-[#5B7FFF] mb-2" />
                  <span className="text-sm text-center text-[#e2e8f0]">{feature.text}</span>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </section>
  )
})

const SocialProofSection = memo(function SocialProofSection({ t, locale }: { t: any, locale: string }) {
  const testimonials = [
    {
      name: t('socialProof.testimonial1.name'),
      location: t('socialProof.testimonial1.location'),
      text: t('socialProof.testimonial1.text'),
      rating: 5
    },
    {
      name: t('socialProof.testimonial2.name'),
      location: t('socialProof.testimonial2.location'),
      text: t('socialProof.testimonial2.text'),
      rating: 5
    },
    {
      name: t('socialProof.testimonial3.name'),
      location: t('socialProof.testimonial3.location'),
      text: t('socialProof.testimonial3.text'),
      rating: 5
    },
  ]

  return (
    <section className="w-full py-12 sm:py-16 lg:py-24" aria-labelledby="social-proof-title">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 id="social-proof-title" className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-white">
            {t('socialProof.title')}
          </h2>
          <p className="text-sm sm:text-base text-[#94a3b8]">
            {t('socialProof.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-xl hover:bg-white/[0.05] hover:border-white/20 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20 transition-all duration-300 h-full">
                <CardHeader>
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <CardDescription className="text-[#94a3b8] italic">
                    "{testimonial.text}"
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mt-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5B7FFF] to-purple-600 flex items-center justify-center">
                      <span className="text-white font-bold">{testimonial.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">{testimonial.name}</p>
                      <p className="text-sm text-[#94a3b8]">{testimonial.location}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
})

const RegionalIntelligenceSection = memo(function RegionalIntelligenceSection({ t, locale }: { t: any, locale: string }) {
  const features = [
    { icon: MapPin, text: t('regionalIntelligence.features.localData') },
    { icon: TrendingUp, text: t('regionalIntelligence.features.regionalPricing') },
    { icon: Globe, text: t('regionalIntelligence.features.currencySupport') },
    { icon: BarChart3, text: t('regionalIntelligence.features.localMakes') },
  ]

  return (
    <section className="w-full py-12 sm:py-16 lg:py-24" aria-labelledby="regional-intel-title">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12 items-center max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="mb-4 bg-purple-600/20 text-purple-400 border-purple-600/50 text-xs sm:text-sm">
              {t('regionalIntelligence.subtitle')}
            </Badge>
            <h2 id="regional-intel-title" className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-white">
              {t('regionalIntelligence.title')}
            </h2>
            <p className="text-sm sm:text-base text-[#94a3b8] mb-8">
              {t('regionalIntelligence.description')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className="flex items-center gap-3 p-4 bg-white/[0.03] backdrop-blur-xl rounded-lg border border-white/10 hover:bg-white/[0.05] hover:border-white/20 hover:scale-[1.02] hover:shadow-lg hover:shadow-black/10 transition-all duration-300"
                  >
                    <Icon className="h-6 w-6 text-purple-400" />
                    <span className="text-sm text-[#e2e8f0]">{feature.text}</span>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 hover:bg-white/[0.05] hover:border-white/20 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20 transition-all duration-300">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-purple-600/10 rounded-lg">
                  <span className="text-[#94a3b8]">Market Coverage</span>
                  <span className="text-2xl font-bold text-purple-400">Iraq & Kurdistan</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-purple-600/10 rounded-lg">
                  <span className="text-[#94a3b8]">Regional Data Points</span>
                  <span className="text-2xl font-bold text-purple-400">60,000+</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-purple-600/10 rounded-lg">
                  <span className="text-[#94a3b8]">Local Makes</span>
                  <span className="text-2xl font-bold text-purple-400">50+</span>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  )
})

const InteractiveDemoSection = memo(function InteractiveDemoSection({ t, locale }: { t: any, locale: string }) {
  return (
    <section className="w-full py-12 sm:py-16 lg:py-24" aria-labelledby="demo-title">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 id="demo-title" className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-white">
            {t('interactiveDemo.title')}
          </h2>
          <p className="text-sm sm:text-base text-[#94a3b8] mb-4">
            {t('interactiveDemo.subtitle')}
          </p>
          <p className="text-sm sm:text-base text-[#94a3b8] mb-8">
            {t('interactiveDemo.description')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/${locale}/predict`}>
              <Button
                size="lg"
                className="bg-gradient-to-r from-[#5B7FFF] to-purple-600 hover:from-[#4a6fe6] hover:to-purple-500 text-white shadow-lg shadow-[#5B7FFF]/50 hover:shadow-xl hover:shadow-purple-500/50 transition-all duration-300 px-8 py-6 text-lg font-semibold"
              >
                {t('interactiveDemo.tryDemo')}
              </Button>
            </Link>
            <span className="self-center text-[#94a3b8]">{t('interactiveDemo.or')}</span>
            <Link href={`/${locale}/predict`}>
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-white/10 bg-white/[0.03] backdrop-blur-md hover:bg-white/[0.05] hover:border-white/20 text-white transition-all duration-300 px-8 py-6 text-lg font-semibold"
              >
                {t('interactiveDemo.getStarted')}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
})

const ComparisonSection = memo(function ComparisonSection({ t, locale }: { t: any, locale: string }) {
  const features = [
    { key: 'free', us: true, others: false },
    { key: 'accuracy', us: true, others: 'partial' },
    { key: 'noSignup', us: true, others: false },
    { key: 'batch', us: true, others: false },
    { key: 'compare', us: true, others: 'partial' },
    { key: 'api', us: true, others: 'paid' },
    { key: 'support', us: true, others: false },
  ]

  return (
    <section className="w-full py-12 sm:py-16 lg:py-24" aria-labelledby="comparison-title">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 id="comparison-title" className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-white">
            {t('comparison.title')}
          </h2>
          <p className="text-sm sm:text-base text-[#94a3b8]">
            {t('comparison.subtitle')}
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-4 text-[#94a3b8] font-semibold">{t('comparison.features.free')}</th>
                    <th className="text-center p-4 text-white font-bold">{t('comparison.us')}</th>
                    <th className="text-center p-4 text-[#94a3b8] font-semibold">{t('comparison.others')}</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((feature, index) => (
                    <motion.tr
                      key={feature.key}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.05 }}
                      className="border-b border-white/10 hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="p-4 text-[#e2e8f0]">{t(`comparison.features.${feature.key}`)}</td>
                      <td className="p-4 text-center">
                        {feature.us === true ? (
                          <CheckCircle2 className="h-6 w-6 text-green-400 mx-auto" />
                        ) : (
                          <span className="text-[#94a3b8]">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {feature.others === true ? (
                          <CheckCircle2 className="h-6 w-6 text-green-400 mx-auto" />
                        ) : feature.others === 'partial' ? (
                          <span className="text-yellow-400">Partial</span>
                        ) : feature.others === 'paid' ? (
                          <span className="text-[#94a3b8]">Paid</span>
                        ) : (
                          <span className="text-red-400">✗</span>
                        )}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
})

const FAQSection = memo(function FAQSection({ t, locale }: { t: any, locale: string }) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const faqs = [
    { q: 'q1', question: t('faq.q1.question'), answer: t('faq.q1.answer') },
    { q: 'q2', question: t('faq.q2.question'), answer: t('faq.q2.answer') },
    { q: 'q3', question: t('faq.q3.question'), answer: t('faq.q3.answer') },
    { q: 'q4', question: t('faq.q4.question'), answer: t('faq.q4.answer') },
    { q: 'q5', question: t('faq.q5.question'), answer: t('faq.q5.answer') },
    { q: 'q6', question: t('faq.q6.question'), answer: t('faq.q6.answer') },
  ]

  const toggleItem = (q: string) => {
    setOpenItems(prev => {
      const next = new Set(prev)
      if (next.has(q)) {
        next.delete(q)
      } else {
        next.add(q)
      }
      return next
    })
  }

  return (
    <section className="w-full py-12 sm:py-16 lg:py-24" aria-labelledby="faq-title">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 id="faq-title" className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-white">
            {t('faq.title')}
          </h2>
          <p className="text-sm sm:text-base text-[#94a3b8]">
            {t('faq.subtitle')}
          </p>
        </motion.div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openItems.has(faq.q)
            return (
              <motion.div
                key={faq.q}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Collapsible open={isOpen} onOpenChange={() => toggleItem(faq.q)}>
                  <Card className="border border-white/10 bg-white/[0.03] backdrop-blur-xl hover:bg-white/[0.05] hover:border-white/20 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20 transition-all duration-300">
                    <CollapsibleTrigger className="w-full" aria-expanded={isOpen}>
                      <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-left text-white font-semibold pr-4">
                          {faq.question}
                        </CardTitle>
                        <ChevronDown
                          className={`h-5 w-5 text-[#94a3b8] transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
                          aria-hidden="true"
                        />
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                        <p className="text-[#94a3b8] leading-relaxed">
                          {faq.answer}
                        </p>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
})

const NewsletterSection = memo(function NewsletterSection({ t, locale }: { t: any, locale: string }) {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would call an API
    setSubscribed(true)
    setTimeout(() => setSubscribed(false), 3000)
  }

  return (
    <section className="w-full py-12 sm:py-16 lg:py-24" aria-labelledby="newsletter-title">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <Mail className="h-10 w-10 sm:h-12 sm:w-12 text-[#5B7FFF] mx-auto mb-4" />
          <h2 id="newsletter-title" className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-white">
            {t('newsletter.title')}
          </h2>
          <p className="text-sm sm:text-base text-[#94a3b8] mb-2">
            {t('newsletter.subtitle')}
          </p>
          <p className="text-sm sm:text-base text-[#94a3b8] mb-8">
            {t('newsletter.description')}
          </p>

          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input
              type="email"
              placeholder={t('newsletter.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-white/[0.03] backdrop-blur-sm border border-white/10 text-white placeholder:text-[#94a3b8]"
              required
              aria-label="Email address"
            />
            <Button
              type="submit"
              className="bg-gradient-to-r from-[#5B7FFF] to-purple-600 hover:from-[#4a6fe6] hover:to-purple-500 text-white"
              disabled={subscribed}
            >
              {subscribed ? '✓ Subscribed!' : t('newsletter.subscribe')}
            </Button>
          </form>
          <p className="text-xs text-[#94a3b8] mt-4">
            {t('newsletter.privacy')}
          </p>
        </motion.div>
      </div>
    </section>
  )
})

const FinalCTASection = memo(function FinalCTASection({ t, locale }: { t: any, locale: string }) {
  return (
    <section className="w-full py-12 sm:py-16 lg:py-24 relative overflow-hidden" aria-labelledby="final-cta-title">
      <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-6xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 id="final-cta-title" className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-white">
            {t('finalCta.title')}
          </h2>
          <p className="text-base sm:text-lg text-white/90 mb-2">
            {t('finalCta.subtitle')}
          </p>
          <p className="text-sm sm:text-base text-white/80 mb-8">
            {t('finalCta.description')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/${locale}/predict`}>
              <Button
                size="lg"
                className="bg-white text-[#5B7FFF] hover:bg-white/90 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-lg font-semibold"
              >
                {t('finalCta.ctaButton')}
              </Button>
            </Link>
            <Link href={`/${locale}/predict`}>
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-white/30 bg-white/10 backdrop-blur-md hover:bg-white/20 hover:border-white/50 text-white transition-all duration-300 px-8 py-6 text-lg font-semibold"
              >
                {t('finalCta.secondaryButton')}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
})

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const [learnMoreOpen, setLearnMoreOpen] = useState(false)

  // Ensure component only renders on client
  useEffect(() => {
    setMounted(true)
  }, [])

  // Hooks must be called unconditionally - handle errors in render
  const t = useTranslations('home')
  const locale = useLocale() || 'en'
  const tCommon = useTranslations('common')

  // Memoize translations to prevent re-renders
  const translations = useMemo(() => ({ t, locale }), [t, locale])

  // Don't render until mounted (prevents hydration mismatch)
  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-label="Loading">
        <div className="text-[#94a3b8]">Loading...</div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      {/* Global Page Background - Very Dark Ink with Subtle Glows */}
      <main className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
        {/* Two subtle fixed radial glows (indigo/violet at ~10% opacity, blur-3xl) */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative flex flex-col">
          {/* Enhanced Hero Section */}
          <HeroSection
            t={t}
            locale={locale}
            tCommon={tCommon}
            onLearnMoreClick={() => {
              try {
                setLearnMoreOpen(true)
              } catch (error) {
                console.error('Error opening learn more modal:', error)
              }
            }}
          />

          {/* Features Section with Glassmorphism */}
          <section className="w-full py-12 sm:py-16 lg:py-24" aria-labelledby="features-title">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12 max-w-6xl">
              <motion.h2
                id="features-title"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-12 text-white"
              >
                Key Features
              </motion.h2>
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={{
                  visible: {
                    transition: { staggerChildren: 0.15 }
                  }
                }}
                className="mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 items-start gap-4 sm:gap-6 max-w-7xl"
              >
                {/* AI Accuracy Card */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ y: -12, scale: 1.02 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="group"
                >
                  <Card className="relative border border-white/10 bg-white/[0.03] backdrop-blur-xl hover:bg-white/[0.05] hover:border-white/20 hover:shadow-2xl hover:shadow-[#5B7FFF]/20 transition-all duration-300 cursor-pointer overflow-hidden">
                    {/* Glowing border effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#5B7FFF]/20 via-purple-500/20 to-[#5B7FFF]/20 blur-xl"></div>
                    </div>
                    <CardHeader className="relative z-10">
                      <Target className="mb-4 h-10 w-10 text-[#5B7FFF] group-hover:scale-110 transition-transform duration-300" aria-hidden="true" />
                      <CardTitle className="text-xl font-bold">{t('features.accuracy.title')}</CardTitle>
                      <CardDescription className="text-[#94a3b8] text-base mt-2">
                        <span className="text-2xl font-bold text-[#5B7FFF]">99.96%</span>
                        <br />
                        {t('features.accuracy.description')}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>

                {/* Fast Predictions Card */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ y: -12, scale: 1.02 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="group"
                >
                  <Card className="relative border border-white/10 bg-white/[0.03] backdrop-blur-xl hover:bg-white/[0.05] hover:border-white/20 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 cursor-pointer overflow-hidden">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-[#5B7FFF]/20 to-purple-500/20 blur-xl"></div>
                    </div>
                    <CardHeader className="relative z-10">
                      <Zap className="mb-4 h-10 w-10 text-purple-400 group-hover:scale-110 transition-transform duration-300" aria-hidden="true" />
                      <CardTitle className="text-xl font-bold">{t('features.single.title')}</CardTitle>
                      <CardDescription className="text-[#94a3b8] text-base mt-2">
                        <span className="text-2xl font-bold text-purple-400">&lt; 1 second</span>
                        <br />
                        {t('features.single.description')}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>

                {/* Secure & Private Card */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ y: -12, scale: 1.02 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="group"
                >
                  <Card className="relative border border-white/10 bg-white/[0.03] backdrop-blur-xl hover:bg-white/[0.05] hover:border-white/20 hover:shadow-2xl hover:shadow-[#5B7FFF]/20 transition-all duration-300 cursor-pointer overflow-hidden">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#5B7FFF]/20 via-blue-500/20 to-[#5B7FFF]/20 blur-xl"></div>
                    </div>
                    <CardHeader className="relative z-10">
                      <Shield className="mb-4 h-10 w-10 text-[#5B7FFF] group-hover:scale-110 transition-transform duration-300" aria-hidden="true" />
                      <CardTitle className="text-xl font-bold">Secure & Private</CardTitle>
                      <CardDescription className="text-[#94a3b8] text-base mt-2">
                        Your data is encrypted and never shared. Enterprise-grade security
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>

                {/* Multi-car Comparison Card */}
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0 }
                  }}
                  whileHover={{ y: -12, scale: 1.02 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="group"
                >
                  <Card className="relative border border-white/10 bg-white/[0.03] backdrop-blur-xl hover:bg-white/[0.05] hover:border-white/20 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 cursor-pointer overflow-hidden">
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 blur-xl"></div>
                    </div>
                    <CardHeader className="relative z-10">
                      <BarChart3 className="mb-4 h-10 w-10 text-purple-400 group-hover:scale-110 transition-transform duration-300" aria-hidden="true" />
                      <CardTitle className="text-xl font-bold">{t('features.compare.title')}</CardTitle>
                      <CardDescription className="text-[#94a3b8] text-base mt-2">
                        {t('features.compare.description')}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </motion.div>
              </motion.div>
            </div>
          </section>

          {/* Value Proposition Section */}
          <ValuePropositionSection {...translations} />

          {/* How It Works Section */}
          <HowItWorksSection {...translations} />

          {/* Regional Intelligence Section */}
          <RegionalIntelligenceSection {...translations} />

          {/* Interactive Demo Section */}
          <InteractiveDemoSection {...translations} />

          {/* Comparison Section */}
          <ComparisonSection {...translations} />

          {/* FAQ Section */}
          <FAQSection {...translations} />

          {/* Newsletter Section */}
          <NewsletterSection {...translations} />

          {/* Final CTA Section */}
          <FinalCTASection {...translations} />

          {/* Learn More Modal */}
          <ErrorBoundary>
            <LearnMoreModal open={learnMoreOpen} onOpenChange={setLearnMoreOpen} />
          </ErrorBoundary>
        </div>
      </main>
    </ErrorBoundary>
  )
}
