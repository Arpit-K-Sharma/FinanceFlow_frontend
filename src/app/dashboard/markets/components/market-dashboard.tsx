"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { marketService } from "@/app/services/market-service"
import StockMarket from "./stock-market"
import ForexMarket from "./forex-market"
import CryptoMarket from "./crypto-market"
import MarketOverview from "./market-overview"
import { Loader2, BarChart3, DollarSign, Bitcoin, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { StockData, ForexData, CryptoData } from "@/app/utils/market-types"

export default function MarketDashboard() {
  const [activeTab, setActiveTab] = useState("overview")
  const [isLoading, setIsLoading] = useState(true)
  const [marketData, setMarketData] = useState<{
    stocks: StockData[]
    forex: ForexData[]
    crypto: CryptoData[]
  }>({
    stocks: [],
    forex: [],
    crypto: [],
  })
  const [error, setError] = useState("")
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [isUsingRealData, setIsUsingRealData] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchMarketData = async (useRealData: boolean) => {
    try {
      setIsRefreshing(true)
      setError("")

      // Set whether to use real data or mock data
      marketService.setUseRealData(useRealData)
      setIsUsingRealData(useRealData)

      // Fetch data for all markets in parallel
      const [stocksData, forexData, cryptoData] = await Promise.all([
        marketService.getStocks(),
        marketService.getForex(),
        marketService.getCrypto(),
      ])

      setMarketData({
        stocks: stocksData,
        forex: forexData,
        crypto: cryptoData,
      })

      setLastUpdated(new Date())
    } catch (err) {
      console.error("Error fetching market data:", err)
      setError("Failed to load market data. Please try again.")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Initial load with mock data
  useEffect(() => {
    fetchMarketData(false)
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-primary" />
        <p className="text-sm sm:text-base text-muted-foreground animate-pulse">Loading market data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="pt-4 sm:pt-6">
          <div className="flex flex-col items-center text-center p-2 sm:p-4">
            <div className="rounded-full bg-red-100 p-2 sm:p-3 mb-3 sm:mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 sm:w-6 sm:h-6 text-red-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </div>
            <p className="text-red-600 font-medium text-base sm:text-lg">{error}</p>
            <div className="flex flex-col sm:flex-row gap-2 mt-4">
              <Button variant="outline" size="sm" className="sm:size-default" onClick={() => fetchMarketData(false)}>
                Try with Mock Data
              </Button>
              <Button variant="default" size="sm" className="sm:size-default" onClick={() => fetchMarketData(true)}>
                Try with Real Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-2 sm:mb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs sm:text-sm text-muted-foreground">Last updated: {lastUpdated.toLocaleTimeString()}</p>
            <Badge variant={isUsingRealData ? "default" : "outline"} className="text-xs">
              {isUsingRealData ? "Real API Data" : "Mock Data"}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-2 sm:mt-0">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 sm:h-9 px-2 sm:px-3"
            onClick={() => fetchMarketData(false)}
            disabled={isRefreshing || (!isUsingRealData && !isRefreshing)}
          >
            <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${isRefreshing && !isUsingRealData ? "animate-spin" : ""}`} />
            <span className="hidden xs:inline">Refresh</span> Mock Data
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            className="text-xs h-8 sm:h-9 px-2 sm:px-3"
            onClick={() => fetchMarketData(true)} 
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${isRefreshing && isUsingRealData ? "animate-spin" : ""}`} />
            <span className="hidden xs:inline">Fetch</span> Real Data
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 h-10 sm:h-14 p-1 bg-muted/50 rounded-xl">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg flex items-center gap-1 sm:gap-2 h-8 sm:h-12 text-xs sm:text-sm"
          >
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger
            value="stocks"
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg flex items-center gap-1 sm:gap-2 h-8 sm:h-12 text-xs sm:text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3 w-3 sm:h-4 sm:w-4"
            >
              <path d="M12 22V8" />
              <path d="m5 12 7-4 7 4" />
              <path d="M5 16l7-4 7 4" />
              <path d="M5 20l7-4 7 4" />
            </svg>
            <span>Stocks</span>
          </TabsTrigger>
          <TabsTrigger
            value="forex"
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg flex items-center gap-1 sm:gap-2 h-8 sm:h-12 text-xs sm:text-sm"
          >
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Forex</span>
          </TabsTrigger>
          <TabsTrigger
            value="crypto"
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg flex items-center gap-1 sm:gap-2 h-8 sm:h-12 text-xs sm:text-sm"
          >
            <Bitcoin className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Crypto</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          <MarketOverview stockData={marketData.stocks} forexData={marketData.forex} cryptoData={marketData.crypto} />
        </TabsContent>

        <TabsContent value="stocks" className="mt-4 sm:mt-6">
          <StockMarket data={marketData.stocks} />
        </TabsContent>

        <TabsContent value="forex" className="mt-4 sm:mt-6">
          <ForexMarket data={marketData.forex} />
        </TabsContent>

        <TabsContent value="crypto" className="mt-4 sm:mt-6">
          <CryptoMarket data={marketData.crypto} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
