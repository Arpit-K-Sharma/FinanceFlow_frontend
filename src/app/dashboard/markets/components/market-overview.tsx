"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, ArrowUp, TrendingUp, Sparkles, Zap, AlertTriangle } from "lucide-react"
import { formatCurrency, formatPercentage } from "@/app/utils/format-utils"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Area, AreaChart } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bitcoin } from "@/app/components/icons"
import type { MarketOverviewProps, StockData, ForexData, CryptoData } from "@/app/utils/market-types"

export default function MarketOverview({ stockData, forexData, cryptoData }: MarketOverviewProps) {
  // Get top performers and worst performers from each market
  const topStocks = [...stockData].sort((a, b) => b.change_percentage - a.change_percentage).slice(0, 3)
  const worstStocks = [...stockData].sort((a, b) => a.change_percentage - b.change_percentage).slice(0, 3)

  const topForex = [...forexData].sort((a, b) => b.change_percentage - a.change_percentage).slice(0, 3)
  const topCrypto = [...cryptoData].sort((a, b) => b.change_percentage - a.change_percentage).slice(0, 3)

  // Calculate market sentiment (simple average of change percentages)
  const stockSentiment = stockData.reduce((acc, stock) => acc + stock.change_percentage, 0) / stockData.length
  const forexSentiment = forexData.reduce((acc, pair) => acc + pair.change_percentage, 0) / forexData.length
  const cryptoSentiment = cryptoData.reduce((acc, crypto) => acc + crypto.change_percentage, 0) / cryptoData.length
  const overallSentiment = (stockSentiment + forexSentiment + cryptoSentiment) / 3

  // Generate chart data from history
  const generateStockChartData = (data: StockData[]) => {
    // Log the incoming data to debug
    console.log("Stock data for chart:", data);
    
    // If data is empty or missing history, generate dummy data
    if (data.length === 0 || !data[0].history || data[0].history.length === 0) {
      console.log("Generating dummy stock data for chart");
      return Array.from({ length: 24 }, (_, i) => ({
        time: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
        value: 150 + Math.sin(i / 3) * 10 + Math.random() * 5,
      }));
    }
    
    return data[0].history.map((point) => ({
      time: point.time,
      value: point.price,
    }));
  }

  const generateForexChartData = (data: ForexData[]) => {
    // If data is empty or missing history, generate dummy data
    if (data.length === 0 || !data[0].history || data[0].history.length === 0) {
      return Array.from({ length: 24 }, (_, i) => ({
        time: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
        value: 1.08 + Math.sin(i / 4) * 0.02 + Math.random() * 0.005,
      }));
    }
    
    return data[0].history.map((point) => ({
      time: point.time,
      value: point.rate,
    }));
  }

  const generateCryptoChartData = (data: CryptoData[]) => {
    // Log the incoming data to debug
    console.log("Crypto data for chart:", data);
    
    // If data is empty or missing history, generate dummy data
    if (data.length === 0 || !data[0].history || data[0].history.length === 0) {
      console.log("Generating dummy crypto data for chart");
      return Array.from({ length: 24 }, (_, i) => ({
        time: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
        value: 35000 + Math.sin(i / 2) * 1000 + Math.random() * 500,
      }));
    }
    
    return data[0].history.map((point) => ({
      time: point.time,
      value: point.price,
    }));
  }

  const stockChartData = generateStockChartData(stockData)
  const forexChartData = generateForexChartData(forexData)
  const cryptoChartData = generateCryptoChartData(cryptoData)

  // Debug logs to check data
  console.log("Stock Chart Data:", stockChartData)
  console.log("Crypto Chart Data:", cryptoChartData)

  // Helper function to determine sentiment badge
  const getSentimentBadge = (sentiment: number) => {
    if (sentiment > 0.02) return { label: "Bullish", variant: "default", icon: <Zap className="h-3 w-3" /> }
    if (sentiment > 0) return { label: "Slightly Bullish", variant: "outline", icon: <ArrowUp className="h-3 w-3" /> }
    if (sentiment > -0.02)
      return { label: "Slightly Bearish", variant: "outline", icon: <ArrowDown className="h-3 w-3" /> }
    return { label: "Bearish", variant: "destructive", icon: <AlertTriangle className="h-3 w-3" /> }
  }

  const stockBadge = getSentimentBadge(stockSentiment)
  const forexBadge = getSentimentBadge(forexSentiment)
  const cryptoBadge = getSentimentBadge(cryptoSentiment)
  const overallBadge = getSentimentBadge(overallSentiment)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Market Sentiment Section */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <Card className="bg-gradient-to-br from-slate-50 to-white border">
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-4 pt-2 sm:pt-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Overall Market</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-2 sm:pb-3">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1 sm:gap-2">
                <span className="text-lg sm:text-2xl font-bold">{formatPercentage(overallSentiment)}</span>
                <Badge variant={overallBadge.variant as any} className="flex items-center gap-1 text-xs">
                  {overallBadge.icon} {overallBadge.label}
                </Badge>
              </div>
              <div className="mt-2 sm:mt-4 h-8 sm:h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stockChartData.slice(-10)}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={overallSentiment > 0 ? "#10b981" : "#ef4444"}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white border">
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-4 pt-2 sm:pt-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Stock Markets</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-2 sm:pb-3">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1 sm:gap-2">
                <span className="text-lg sm:text-2xl font-bold">{formatPercentage(stockSentiment)}</span>
                <Badge variant={stockBadge.variant as any} className="flex items-center gap-1 text-xs">
                  {stockBadge.icon} {stockBadge.label}
                </Badge>
              </div>
              <div className="mt-2 sm:mt-4 h-8 sm:h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stockChartData.slice(-10)}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={stockSentiment > 0 ? "#10b981" : "#ef4444"}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white border">
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-4 pt-2 sm:pt-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Forex Markets</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-2 sm:pb-3">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1 sm:gap-2">
                <span className="text-lg sm:text-2xl font-bold">{formatPercentage(forexSentiment)}</span>
                <Badge variant={forexBadge.variant as any} className="flex items-center gap-1 text-xs">
                  {forexBadge.icon} {forexBadge.label}
                </Badge>
              </div>
              <div className="mt-2 sm:mt-4 h-8 sm:h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={forexChartData.slice(-10)}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={forexSentiment > 0 ? "#10b981" : "#ef4444"}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-white border">
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-4 pt-2 sm:pt-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Crypto Markets</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-2 sm:pb-3">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1 sm:gap-2">
                <span className="text-lg sm:text-2xl font-bold">{formatPercentage(cryptoSentiment)}</span>
                <Badge variant={cryptoBadge.variant as any} className="flex items-center gap-1 text-xs">
                  {cryptoBadge.icon} {cryptoBadge.label}
                </Badge>
              </div>
              <div className="mt-2 sm:mt-4 h-8 sm:h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={cryptoChartData.slice(-10)}>
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={cryptoSentiment > 0 ? "#10b981" : "#ef4444"}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2 sm:pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                  Top Performers
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Best performing assets today</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 sm:space-y-6">
              {topStocks.length > 0 && (
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3 flex items-center gap-2">
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
                    Stocks
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    {topStocks.map((stock) => (
                      <div
                        key={stock.symbol}
                        className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-sm sm:text-base">{stock.symbol}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">{stock.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm sm:text-base">{formatCurrency(stock.price)}</p>
                          <p className="text-xs sm:text-sm text-green-500 flex items-center justify-end">
                            <TrendingUp className="inline mr-1" size={12} />
                            {formatPercentage(stock.change_percentage)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {topCrypto.length > 0 && (
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3 flex items-center gap-2">
                    <Bitcoin className="h-3 w-3 sm:h-4 sm:w-4" />
                    Crypto
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    {topCrypto.map((crypto) => (
                      <div
                        key={crypto.symbol}
                        className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-sm sm:text-base">{crypto.symbol}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">{crypto.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm sm:text-base">{formatCurrency(crypto.price)}</p>
                          <p className="text-xs sm:text-sm text-green-500 flex items-center justify-end">
                            <TrendingUp className="inline mr-1" size={12} />
                            {formatPercentage(crypto.change_percentage)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2 sm:pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
                  Worst Performers
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Poorest performing assets today</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 sm:space-y-6">
              {worstStocks.length > 0 && (
                <div>
                  <h3 className="text-xs sm:text-sm font-medium text-muted-foreground mb-2 sm:mb-3 flex items-center gap-2">
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
                    Stocks
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    {worstStocks.map((stock) => (
                      <div
                        key={stock.symbol}
                        className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-sm sm:text-base">{stock.symbol}</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">{stock.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm sm:text-base">{formatCurrency(stock.price)}</p>
                          <p className="text-xs sm:text-sm text-red-500 flex items-center justify-end">
                            <ArrowDown className="inline mr-1" size={12} />
                            {formatPercentage(stock.change_percentage)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add more worst performers sections as needed */}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market Trends Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card className="border shadow-sm">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500"
              >
                <path d="M12 22V8" />
                <path d="m5 12 7-4 7 4" />
                <path d="M5 16l7-4 7 4" />
                <path d="M5 20l7-4 7 4" />
              </svg>
              S&P 500 Trend
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Performance over the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] sm:h-[250px] md:h-[300px]">
              {stockChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stockChartData}>
                    <defs>
                      <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="time"
                      tickFormatter={(time) => new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      fillOpacity={1}
                      fill="url(#colorStock)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground text-sm">No chart data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Bitcoin className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
              Bitcoin Trend
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Performance over the last 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] sm:h-[250px] md:h-[300px]">
              {cryptoChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cryptoChartData}>
                    <defs>
                      <linearGradient id="colorCrypto" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="time"
                      tickFormatter={(time) => new Date(time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#f59e0b"
                      fillOpacity={1}
                      fill="url(#colorCrypto)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground text-sm">No chart data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
