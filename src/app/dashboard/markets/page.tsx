import type { Metadata } from "next"
import MarketDashboard from "./components/market-dashboard"

export const metadata: Metadata = {
  title: "Markets | FinanceFlow",
  description: "Track real-time stock, forex, and cryptocurrency markets",
}

export default function MarketsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Financial Markets</h1>
        <p className="text-muted-foreground mt-2">
          Track real-time data from global stock markets, forex, and cryptocurrencies
        </p>
      </div>
      <MarketDashboard />
    </div>
  )
}
