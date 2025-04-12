"use client"

import Link from "next/link"
import { Logo } from "./components/Logo"
import { Button } from "@/components/ui/button"
import {
  LineChart,
  Wallet,
  PiggyBank,
  TrendingUp,
  BarChart4,
  Target,
  Shield,
  ChevronDown,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ChevronRight,
} from "lucide-react"
import { useEffect, useState } from "react"

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState("hero")

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
      
      // Determine which section is currently in view
      const sections = ["hero", "features", "stats", "testimonials", "cta"]
      const sectionElements = sections.map(id => document.getElementById(id))
      
      const currentPosition = window.scrollY + window.innerHeight / 3
      
      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const section = sectionElements[i]
        if (section) {
          const offsetTop = section.offsetTop
          if (currentPosition >= offsetTop) {
            setActiveSection(sections[i])
            break
          }
        }
      }
    }
    
    window.addEventListener("scroll", handleScroll)

    // Set initial visibility after a shorter delay
    setTimeout(() => {
      setIsVisible(true)
    }, 200)

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId)
    if (section) {
      window.scrollTo({
        top: section.offsetTop - 80, // Offset for navbar height
        behavior: "smooth"
      })
    }
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 hero-bg">
      {/* Navigation */}
      <nav
        className={`fixed w-full top-0 z-50 transition-all duration-500 ${
          isScrolled ? "bg-white/80 nav-blur shadow-lg" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 md:h-20">
            <div className="flex items-center">
              <Logo />
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('features')} 
                className={`text-gray-700 hover:text-indigo-600 transition-colors relative ${
                  activeSection === 'features' ? 'text-indigo-600 font-medium' : ''
                }`}
              >
                Features
                {activeSection === 'features' && (
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-indigo-600 rounded animate-fadeIn" />
                )}
              </button>
              <button 
                onClick={() => scrollToSection('stats')} 
                className={`text-gray-700 hover:text-indigo-600 transition-colors relative ${
                  activeSection === 'stats' ? 'text-indigo-600 font-medium' : ''
                }`}
              >
                Stats
                {activeSection === 'stats' && (
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-indigo-600 rounded animate-fadeIn" />
                )}
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')} 
                className={`text-gray-700 hover:text-indigo-600 transition-colors relative ${
                  activeSection === 'testimonials' ? 'text-indigo-600 font-medium' : ''
                }`}
              >
                Testimonials
                {activeSection === 'testimonials' && (
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-indigo-600 rounded animate-fadeIn" />
                )}
              </button>
              <button 
                onClick={() => scrollToSection('cta')} 
                className={`text-gray-700 hover:text-indigo-600 transition-colors relative ${
                  activeSection === 'cta' ? 'text-indigo-600 font-medium' : ''
                }`}
              >
                Contact
                {activeSection === 'cta' && (
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-indigo-600 rounded animate-fadeIn" />
                )}
              </button>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/login">
                <Button 
                  variant="outline" 
                  className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 text-base px-6 py-2 rounded-xl transition-all duration-300"
                >
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-indigo-600 hover:bg-indigo-500 text-white text-base px-6 py-2 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 button-glow">
                  Get Started
                </Button>
              </Link>
            </div>
            <div className="flex md:hidden items-center">
              <button
                className="text-gray-700 p-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-white shadow-lg rounded-b-lg py-3 px-4 mt-1">
              <div className="flex flex-col space-y-4">
                <button 
                  onClick={() => scrollToSection('features')}
                  className={`text-left py-2 transition-colors ${
                    activeSection === 'features' ? 'text-indigo-600 font-medium' : 'text-gray-700 hover:text-indigo-600'
                  }`}
                >
                  Features
                </button>
                <button 
                  onClick={() => scrollToSection('stats')}
                  className={`text-left py-2 transition-colors ${
                    activeSection === 'stats' ? 'text-indigo-600 font-medium' : 'text-gray-700 hover:text-indigo-600'
                  }`}
                >
                  Stats
                </button>
                <button 
                  onClick={() => scrollToSection('testimonials')}
                  className={`text-left py-2 transition-colors ${
                    activeSection === 'testimonials' ? 'text-indigo-600 font-medium' : 'text-gray-700 hover:text-indigo-600'
                  }`}
                >
                  Testimonials
                </button>
                <button 
                  onClick={() => scrollToSection('cta')}
                  className={`text-left py-2 transition-colors ${
                    activeSection === 'cta' ? 'text-indigo-600 font-medium' : 'text-gray-700 hover:text-indigo-600'
                  }`}
                >
                  Contact
                </button>
                <div className="flex flex-col space-y-3 pt-2 border-t border-gray-100">
                  <div className="flex justify-center mb-2">
                    <Link href="/login">
                      <Button 
                        variant="outline" 
                        className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 text-base px-6 py-2 rounded-xl transition-all duration-300"
                      >
                        Login
                      </Button>
                    </Link>
                  </div>
                  <Link href="/register">
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-base px-6 py-2 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 button-glow">
                      Get Started
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div id="hero" className="relative pt-24 md:pt-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center relative z-10">
            <div
              className={`inline-flex items-center px-3 md:px-4 py-1.5 md:py-2 bg-indigo-100 rounded-full mb-6 md:mb-8 transition-all duration-500 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"
              }`}
            >
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 mr-1.5 md:mr-2" />
              <span className="text-indigo-600 text-sm md:text-base font-medium">New: AI-Powered Investment Insights</span>
            </div>
            <h1
              className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 md:mb-8 transition-all duration-500 delay-50 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"
              }`}
            >
              <span className="block text-gradient animate-gradient">Transform Your Finances</span>
              <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
                With Smart AI
              </span>
            </h1>
            <p
              className={`mt-4 md:mt-6 text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed transition-all duration-500 delay-100 px-4 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"
              }`}
            >
              Experience the future of wealth management. Our AI-powered platform helps you make smarter financial
              decisions, automate your savings, and grow your wealth effortlessly.
            </p>
            <div
              className={`mt-8 sm:mt-10 flex flex-col sm:flex-row justify-center gap-4 sm:gap-6 items-center transition-all duration-500 delay-150 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"
              }`}
            >
              <Link href="/register" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-6 sm:px-8 py-4 sm:py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 button-glow group"
                >
                  <span>Start Your Journey</span>
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/demo" className="flex items-center text-indigo-600 hover:text-indigo-500 transition-colors mt-4 sm:mt-0">
                <span className="mr-2">Watch Demo</span>
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </Link>
            </div>

            <div
              className={`mt-10 sm:mt-12 flex flex-col sm:flex-row justify-center items-center gap-6 transition-all duration-500 delay-200 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-10"
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className="flex -space-x-2">
                  {[
                    "https://randomuser.me/api/portraits/women/68.jpg",
                    "https://randomuser.me/api/portraits/men/32.jpg",
                    "https://randomuser.me/api/portraits/women/44.jpg",
                  ].map((imageUrl, index) => (
                    <div
                      key={index}
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-lg border-2 border-white overflow-hidden"
                    >
                      <img
                        src={imageUrl || "/placeholder.svg"}
                        alt={`FinanceFlow User ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <span className="text-sm sm:text-base text-gray-600">
                  Join <span className="font-semibold text-indigo-600">50,000+</span> users
                </span>
              </div>
              <div className="flex items-center space-x-2 mt-4 sm:mt-0">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm sm:text-base text-gray-600">4.9/5 from 2,000+ reviews</span>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-1/2 -left-32 -translate-y-1/2 opacity-10 animate-float">
          <LineChart className="w-96 h-96 text-indigo-600" />
        </div>
        <div className="absolute top-1/4 -right-24 opacity-10 animate-float" style={{ animationDelay: "2s" }}>
          <PiggyBank className="w-72 h-72 text-purple-600" />
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-gray-400" />
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-20 sm:py-24 md:py-32 bg-white relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-100 rounded-full mb-3 sm:mb-4">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 mr-1.5 sm:mr-2" />
              <span className="text-indigo-600 text-sm sm:text-base font-medium">Powerful Features</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gradient mb-3 sm:mb-4">Revolutionary Features</h2>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Experience the most advanced wealth management tools powered by artificial intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                icon: <Wallet className="h-6 w-6 sm:h-8 sm:w-8" />,
                title: "AI-Powered Budgeting",
                description: "Our AI analyzes your spending patterns and automatically creates optimized budgets.",
              },
              {
                icon: <BarChart4 className="h-6 w-6 sm:h-8 sm:w-8" />,
                title: "Smart Portfolio Tracking",
                description: "Real-time analytics and AI-driven insights for your investments.",
              },
              {
                icon: <Target className="h-6 w-6 sm:h-8 sm:w-8" />,
                title: "Intelligent Goal Setting",
                description: "AI helps you set and achieve realistic financial goals based on your profile.",
              },
              {
                icon: <Shield className="h-6 w-6 sm:h-8 sm:w-8" />,
                title: "Advanced Security",
                description: "Military-grade encryption and AI-powered fraud detection.",
              },
              {
                icon: <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8" />,
                title: "Predictive Analytics",
                description: "AI forecasts market trends and provides personalized recommendations.",
              },
              {
                icon: <PiggyBank className="h-6 w-6 sm:h-8 sm:w-8" />,
                title: "Smart Automation",
                description: "AI optimizes your savings and investment strategies automatically.",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="feature-card glass-card rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-gray-100/20 group hover:border-indigo-200 transition-all duration-300 cursor-pointer"
              >
                <div className="text-indigo-600 mb-4 sm:mb-6 bg-indigo-50 w-12 h-12 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl flex items-center justify-center transform transition-transform group-hover:scale-110 group-hover:bg-indigo-100">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 group-hover:text-indigo-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div id="stats" className="py-16 sm:py-20 md:py-24 relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="absolute inset-0 grid-pattern opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">Our Impact in Numbers</h2>
            <div className="h-1 w-16 sm:w-20 bg-white/30 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                number: "50K+",
                label: "Active Users",
                subtext: "Growing daily",
                icon: <LineChart className="w-5 h-5 sm:w-6 sm:h-6" />,
                increment: "+2,500 this month",
              },
              {
                number: "$2M+",
                label: "Assets Managed",
                subtext: "Securely handled",
                icon: <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />,
                increment: "+$250K this month",
              },
              {
                number: "98%",
                label: "Success Rate",
                subtext: "Client satisfaction",
                icon: <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />,
                increment: "Industry average: 76%",
              },
            ].map((stat, index) => (
              <div
                key={index}
                className="relative overflow-hidden rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center group hover:transform hover:scale-105 transition-all duration-300 bg-white/10 backdrop-blur-sm border border-white/20 cursor-pointer"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>

                <div className="flex justify-center mb-4 sm:mb-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-white/20 flex items-center justify-center text-white shadow-lg transform group-hover:rotate-6 transition-transform duration-300">
                    {stat.icon}
                  </div>
                </div>

                <div className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-1 sm:mb-2 shine-effect tracking-tight">{stat.number}</div>
                <div className="text-base sm:text-lg md:text-xl text-indigo-100 font-medium mb-1 sm:mb-2">{stat.label}</div>
                <div className="text-xs sm:text-sm text-indigo-200 mb-3 sm:mb-4">{stat.subtext}</div>

                <div className="inline-flex items-center px-2 sm:px-3 py-1 bg-white/20 rounded-full text-xs font-medium text-white">
                  {stat.increment}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div id="testimonials" className="bg-white py-16 sm:py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12 sm:mb-16 md:mb-20">
            <div className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-100 rounded-full mb-3 sm:mb-4">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 mr-1.5 sm:mr-2" />
              <span className="text-indigo-600 text-sm sm:text-base font-medium">Success Stories</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gradient mb-3 sm:mb-4">What Our Users Say</h2>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
              Discover how FinanceFlow has transformed the financial lives of our users.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                quote:
                  "FinanceFlow completely changed how I manage my investments. The AI recommendations have increased my returns by 32%.",
                name: "Sarah Johnson",
                title: "Marketing Director",
                avatar: "https://randomuser.me/api/portraits/women/44.jpg",
              },
              {
                quote:
                  "The automated budgeting feature helped me save an extra $500 every month without even thinking about it.",
                name: "Michael Chen",
                title: "Software Engineer",
                avatar: "https://randomuser.me/api/portraits/men/32.jpg",
              },
              {
                quote:
                  "I've tried many financial apps, but FinanceFlow's AI insights are truly next level. It's like having a financial advisor in my pocket.",
                name: "Emma Rodriguez",
                title: "Small Business Owner",
                avatar: "https://randomuser.me/api/portraits/women/68.jpg",
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="glass-card rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col cursor-pointer"
              >
                <div className="flex items-center mb-3 sm:mb-4">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 mb-4 sm:mb-6 italic text-sm sm:text-base flex-grow">"{testimonial.quote}"</p>
                <div className="flex items-center mt-auto">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden mr-3 sm:mr-4">
                    <img
                      src={testimonial.avatar || "/placeholder.svg"}
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{testimonial.name}</h4>
                    <p className="text-gray-600 text-xs sm:text-sm">{testimonial.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div id="cta" className="bg-white py-16 sm:py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="cta-gradient rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 text-center relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 grid-pattern opacity-10"></div>
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 md:mb-8">Start Your Financial Journey Today</h2>
              <p className="text-indigo-100 text-base sm:text-lg md:text-xl mb-8 sm:mb-10 md:mb-12 max-w-2xl mx-auto">
                Join the thousands of successful investors who have transformed their financial future with our
                AI-powered platform.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6">
                <Link href="/register" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto bg-white text-indigo-600 hover:bg-gray-50 text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 md:py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 button-glow"
                  >
                    Get Started Now
                  </Button>
                </Link>
                <div className="flex items-center space-x-2 text-white mt-4 sm:mt-0">
                  <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span className="text-sm sm:text-base">30-day free trial</span>
                </div>
              </div>
            </div>

            {/* Floating Elements in CTA */}
            <div className="absolute -bottom-10 -left-10 opacity-20 animate-float" style={{ animationDelay: "1s" }}>
              <LineChart className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 text-white" />
            </div>
            <div className="absolute -top-10 -right-10 opacity-20 animate-float" style={{ animationDelay: "3s" }}>
              <PiggyBank className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto py-8 sm:py-10 md:py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            <div className="col-span-2 md:col-span-1">
              <Logo />
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-gray-600">Revolutionizing wealth management with AI technology.</p>
              <div className="mt-4 sm:mt-6 flex space-x-3 sm:space-x-4">
                {["twitter", "facebook", "instagram", "linkedin"].map((social) => (
                  <a
                    key={social}
                    href={`#${social}`}
                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 hover:bg-indigo-200 transition-colors"
                  >
                    <span className="sr-only">{social}</span>
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10c0-5.523-4.477-10-10-10z" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
            {[
              {
                title: "Product",
                links: ["Features", "Pricing", "Security", "Roadmap"],
              },
              {
                title: "Company",
                links: ["About", "Careers", "Blog", "Press"],
              },
              {
                title: "Legal",
                links: ["Privacy", "Terms", "Cookie Policy"],
              },
            ].map((section, index) => (
              <div key={index}>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base mb-2 sm:mb-4">{section.title}</h3>
                <ul className="space-y-2 sm:space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a href="#" className="text-xs sm:text-sm md:text-base text-gray-600 hover:text-indigo-600 transition-colors duration-200">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-8 sm:mt-10 md:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
            <p className="text-center text-xs sm:text-sm text-gray-600">© {new Date().getFullYear()} FinanceFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Mobile scroll indicator */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 md:hidden z-40">
        <div className="bg-white/90 backdrop-blur-sm px-3 py-2 rounded-full shadow-lg border border-gray-200 flex space-x-3">
          {[
            { id: 'hero', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
            { id: 'features', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
            { id: 'stats', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
            { id: 'testimonials', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> },
            { id: 'cta', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`flex items-center justify-center w-9 h-9 rounded-full transition-all ${
                activeSection === item.id
                  ? 'text-white bg-indigo-600 scale-110'
                  : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
              aria-label={`Scroll to ${item.id} section`}
            >
              {item.icon}
            </button>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .text-gradient {
          background: linear-gradient(to right, #6366f1, #a855f7);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 8s ease infinite;
        }
        
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        .nav-blur {
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        
        .hero-bg {
          background-image: 
            radial-gradient(circle at 60% 100%, rgba(99, 102, 241, 0.1) 0%, transparent 40%),
            radial-gradient(circle at 20% 20%, rgba(168, 85, 247, 0.1) 0%, transparent 40%);
        }
        
        .cta-gradient {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        }
        
        .glass-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          transition: all 0.3s ease;
        }
        
        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        
        .stat-card {
          background: rgba(79, 70, 229, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .button-glow {
          position: relative;
        }
        
        .button-glow::after {
          content: '';
          position: absolute;
          top: -15px;
          left: -15px;
          right: -15px;
          bottom: -15px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.8) 0%, rgba(99, 102, 241, 0) 70%);
          opacity: 0;
          z-index: -1;
          transition: opacity 0.3s ease;
        }
        
        .button-glow:hover::after {
          opacity: 0.3;
        }
        
        .shine-effect {
          position: relative;
          overflow: hidden;
        }
        
        .shine-effect::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 50%;
          height: 100%;
          background: linear-gradient(to right, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%);
          transform: skewX(-25deg);
          animation: shine 4s infinite;
        }
        
        @keyframes shine {
          0% {
            left: -100%;
          }
          20%, 100% {
            left: 150%;
          }
        }
        
        .grid-pattern {
          background-image: linear-gradient(rgba(99, 102, 241, 0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(99, 102, 241, 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
        
        /* Additional responsive styles */
        @media (max-width: 640px) {
          .animate-float {
            animation: none; /* Disable animation on smaller screens to save resources */
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            width: 0;
          }
          to {
            opacity: 1;
            width: 100%;
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  )
}
