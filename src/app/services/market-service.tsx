import type { StockData, ForexData, CryptoData } from "../utils/market-types"

// Create a service for market data
class MarketService {
  private apiKey: string
  private baseUrl: string
  private useRealData = false // Default to mock data

  constructor() {
    // For Alpha Vantage API
    this.apiKey = process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || ""
    this.baseUrl = "https://www.alphavantage.co/query"
  }

  // Toggle between real and mock data
  setUseRealData(useReal: boolean) {
    this.useRealData = useReal
  }

  // Get stock market data
  async getStocks(): Promise<StockData[]> {
    // If not using real data, return mock data immediately
    if (!this.useRealData) {
      console.log("Using mock stock data")
      return this.getMockStockData()
    }

    try {
      console.log("Fetching real stock data from API...")
      // Define popular stock symbols to track
      const symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "META", "NVDA", "NFLX"]

      // Check if API key is available
      if (!this.apiKey || this.apiKey === "") {
        console.warn("No API key found, using mock data")
        return this.getMockStockData()
      }

      // Fetch data for each symbol (with rate limiting to avoid API limits)
      const stocksData: StockData[] = []

      for (const symbol of symbols) {
        try {
          const response = await fetch(`${this.baseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.apiKey}`)

          if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`)
          }

          const data = await response.json()

          // Check if we got valid data
          if (data["Global Quote"] && Object.keys(data["Global Quote"]).length > 0) {
            const quote = data["Global Quote"]

            stocksData.push({
              symbol: quote["01. symbol"],
              name: this.getStockName(quote["01. symbol"]),
              price: Number.parseFloat(quote["05. price"]),
              change_percentage: Number.parseFloat(quote["10. change percent"].replace("%", "")) / 100,
              volume: Number.parseInt(quote["06. volume"]),
              // We'll keep the mock history data for now
              history: this.generateStockHistory(Number.parseFloat(quote["05. price"])),
            })
          }

          // Add a small delay to avoid hitting API rate limits
          await new Promise((resolve) => setTimeout(resolve, 250))
        } catch (error) {
          console.error(`Error fetching data for ${symbol}:`, error)
        }
      }

      // If we couldn't get any real data, fall back to mock data
      if (stocksData.length === 0) {
        console.warn("Failed to fetch any stock data, using mock data")
        return this.getMockStockData()
      }

      return stocksData
    } catch (error) {
      console.error("Error in getStocks:", error)
      return this.getMockStockData()
    }
  }

  // Get forex market data
  async getForex(): Promise<ForexData[]> {
    // If not using real data, return mock data immediately
    if (!this.useRealData) {
      console.log("Using mock forex data")
      return this.getMockForexData()
    }

    try {
      console.log("Fetching real forex data from API...")
      // Define popular forex pairs
      const pairs = [
        { from: "EUR", to: "USD" },
        { from: "USD", to: "JPY" },
        { from: "GBP", to: "USD" },
        { from: "USD", to: "CAD" },
        { from: "AUD", to: "USD" },
      ]

      if (!this.apiKey || this.apiKey === "") {
        return this.getMockForexData()
      }

      const forexData: ForexData[] = []

      for (const pair of pairs) {
        try {
          const response = await fetch(
            `${this.baseUrl}?function=CURRENCY_EXCHANGE_RATE&from_currency=${pair.from}&to_currency=${pair.to}&apikey=${this.apiKey}`,
          )

          if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`)
          }

          const data = await response.json()

          if (data["Realtime Currency Exchange Rate"]) {
            const exchangeData = data["Realtime Currency Exchange Rate"]
            const rate = Number.parseFloat(exchangeData["5. Exchange Rate"])

            forexData.push({
              pair: `${pair.from}/${pair.to}`,
              name: `${this.getCurrencyName(pair.from)} / ${this.getCurrencyName(pair.to)}`,
              rate: rate,
              // For demo purposes, generate a random change percentage
              change_percentage: (Math.random() * 2 - 1) * 0.01,
              history: this.generateForexHistory(rate),
            })
          }

          await new Promise((resolve) => setTimeout(resolve, 250))
        } catch (error) {
          console.error(`Error fetching forex data for ${pair.from}/${pair.to}:`, error)
        }
      }

      if (forexData.length === 0) {
        return this.getMockForexData()
      }

      return forexData
    } catch (error) {
      console.error("Error in getForex:", error)
      return this.getMockForexData()
    }
  }

  // Get cryptocurrency market data
  async getCrypto(): Promise<CryptoData[]> {
    // If not using real data, return mock data immediately
    if (!this.useRealData) {
      console.log("Using mock crypto data")
      return this.getMockCryptoData()
    }

    try {
      console.log("Fetching real crypto data from API...")
      // Define popular cryptocurrencies
      const cryptos = ["BTC", "ETH", "BNB", "SOL", "XRP"]

      if (!this.apiKey || this.apiKey === "") {
        return this.getMockCryptoData()
      }

      const cryptoData: CryptoData[] = []

      for (const crypto of cryptos) {
        try {
          const response = await fetch(
            `${this.baseUrl}?function=CURRENCY_EXCHANGE_RATE&from_currency=${crypto}&to_currency=USD&apikey=${this.apiKey}`,
          )

          if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`)
          }

          const data = await response.json()

          if (data["Realtime Currency Exchange Rate"]) {
            const exchangeData = data["Realtime Currency Exchange Rate"]
            const price = Number.parseFloat(exchangeData["5. Exchange Rate"])

            // For market cap and volume, we'll use mock data since they're not in the basic API response
            const marketCap = this.getCryptoMarketCap(crypto)
            const volume = marketCap * (0.05 + Math.random() * 0.1) // 5-15% of market cap

            cryptoData.push({
              symbol: crypto,
              name: this.getCryptoName(crypto),
              price: price,
              // For demo purposes, generate a random change percentage
              change_percentage: (Math.random() * 6 - 2) * 0.01, // -2% to +4%
              market_cap: marketCap,
              volume: volume,
              history: this.generateStockHistory(price),
            })
          }

          await new Promise((resolve) => setTimeout(resolve, 250))
        } catch (error) {
          console.error(`Error fetching crypto data for ${crypto}:`, error)
        }
      }

      if (cryptoData.length === 0) {
        return this.getMockCryptoData()
      }

      return cryptoData
    } catch (error) {
      console.error("Error in getCrypto:", error)
      return this.getMockCryptoData()
    }
  }

  // Helper method to get company names
  private getStockName(symbol: string): string {
    const stockNames: Record<string, string> = {
      AAPL: "Apple Inc.",
      MSFT: "Microsoft Corporation",
      GOOGL: "Alphabet Inc.",
      AMZN: "Amazon.com Inc.",
      TSLA: "Tesla, Inc.",
      META: "Meta Platforms, Inc.",
      NVDA: "NVIDIA Corporation",
      NFLX: "Netflix, Inc.",
    }

    return stockNames[symbol] || symbol
  }

  // Helper method for currency names
  private getCurrencyName(code: string): string {
    const currencyNames: Record<string, string> = {
      USD: "US Dollar",
      EUR: "Euro",
      JPY: "Japanese Yen",
      GBP: "British Pound",
      AUD: "Australian Dollar",
      CAD: "Canadian Dollar",
      CHF: "Swiss Franc",
      NZD: "New Zealand Dollar",
    }

    return currencyNames[code] || code
  }

  // Helper methods for crypto data
  private getCryptoName(symbol: string): string {
    const cryptoNames: Record<string, string> = {
      BTC: "Bitcoin",
      ETH: "Ethereum",
      BNB: "Binance Coin",
      SOL: "Solana",
      XRP: "Ripple",
      ADA: "Cardano",
      DOGE: "Dogecoin",
      DOT: "Polkadot",
    }

    return cryptoNames[symbol] || symbol
  }

  private getCryptoMarketCap(symbol: string): number {
    // Approximate market caps (these would normally come from the API)
    const marketCaps: Record<string, number> = {
      BTC: 686500000000,
      ETH: 225400000000,
      BNB: 48200000000,
      SOL: 41500000000,
      XRP: 29300000000,
      ADA: 13700000000,
      DOGE: 12400000000,
      DOT: 7600000000,
    }

    return marketCaps[symbol] || 1000000000
  }

  // Helper method to generate mock history data for stocks and crypto (with price)
  private generateStockHistory(currentPrice: number): Array<{ time: string; price: number }> {
    const now = new Date()
    return Array.from({ length: 24 }, (_, i) => {
      const time = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).toISOString()
      // Generate somewhat realistic price movements around the current price
      const price = currentPrice * (0.95 + 0.1 * Math.random()) + Math.sin(i / 3) * (currentPrice * 0.02)
      return {
        time,
        price,
      }
    })
  }

  // Helper method to generate mock history data for forex (with rate)
  private generateForexHistory(currentRate: number): Array<{ time: string; rate: number }> {
    const now = new Date()
    return Array.from({ length: 24 }, (_, i) => {
      const time = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).toISOString()
      // Generate somewhat realistic rate movements around the current rate
      const rate = currentRate * (0.995 + 0.01 * Math.random()) + Math.sin(i / 3) * (currentRate * 0.005)
      return {
        time,
        rate,
      }
    })
  }

  // Mock data generators (kept as fallback)
  private getMockStockData(): StockData[] {
    const now = new Date()
    const history = Array.from({ length: 24 }, (_, i) => {
      const time = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).toISOString()
      return {
        time,
        price: 150 + Math.sin(i / 3) * 10 + Math.random() * 5,
      }
    })

    return [
      {
        symbol: "AAPL",
        name: "Apple Inc.",
        price: 182.52,
        change_percentage: 1.25,
        volume: 58762145,
        history,
      },
      {
        symbol: "MSFT",
        name: "Microsoft Corporation",
        price: 337.94,
        change_percentage: 0.87,
        volume: 23145678,
      },
      {
        symbol: "GOOGL",
        name: "Alphabet Inc.",
        price: 131.86,
        change_percentage: -0.32,
        volume: 18234567,
      },
      {
        symbol: "AMZN",
        name: "Amazon.com Inc.",
        price: 127.74,
        change_percentage: 0.54,
        volume: 32145678,
      },
      {
        symbol: "TSLA",
        name: "Tesla, Inc.",
        price: 237.49,
        change_percentage: -1.87,
        volume: 98765432,
      },
      {
        symbol: "META",
        name: "Meta Platforms, Inc.",
        price: 301.41,
        change_percentage: 2.14,
        volume: 28765432,
      },
      {
        symbol: "NFLX",
        name: "Netflix, Inc.",
        price: 398.75,
        change_percentage: 0.92,
        volume: 12345678,
      },
      {
        symbol: "NVDA",
        name: "NVIDIA Corporation",
        price: 437.53,
        change_percentage: 3.45,
        volume: 45678901,
      },
    ]
  }

  private getMockForexData(): ForexData[] {
    const now = new Date()
    const history = Array.from({ length: 24 }, (_, i) => {
      const time = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).toISOString()
      return {
        time,
        rate: 1.08 + Math.sin(i / 4) * 0.02 + Math.random() * 0.005,
      }
    })

    return [
      {
        pair: "EUR/USD",
        name: "Euro / US Dollar",
        rate: 1.0876,
        change_percentage: 0.12,
        history,
      },
      {
        pair: "USD/JPY",
        name: "US Dollar / Japanese Yen",
        rate: 149.62,
        change_percentage: -0.25,
      },
      {
        pair: "GBP/USD",
        name: "British Pound / US Dollar",
        rate: 1.2534,
        change_percentage: 0.34,
      },
      {
        pair: "USD/CHF",
        name: "US Dollar / Swiss Franc",
        rate: 0.9012,
        change_percentage: -0.18,
      },
      {
        pair: "AUD/USD",
        name: "Australian Dollar / US Dollar",
        rate: 0.6578,
        change_percentage: 0.45,
      },
      {
        pair: "USD/CAD",
        name: "US Dollar / Canadian Dollar",
        rate: 1.3654,
        change_percentage: -0.08,
      },
      {
        pair: "NZD/USD",
        name: "New Zealand Dollar / US Dollar",
        rate: 0.6123,
        change_percentage: 0.22,
      },
    ]
  }

  private getMockCryptoData(): CryptoData[] {
    const now = new Date()
    const history = Array.from({ length: 24 }, (_, i) => {
      const time = new Date(now.getTime() - (23 - i) * 60 * 60 * 1000).toISOString()
      return {
        time,
        price: 35000 + Math.sin(i / 2) * 1000 + Math.random() * 500,
      }
    })

    return [
      {
        symbol: "BTC",
        name: "Bitcoin",
        price: 35241.87,
        change_percentage: 2.34,
        market_cap: 686500000000,
        volume: 28765432100,
        history,
      },
      {
        symbol: "ETH",
        name: "Ethereum",
        price: 1876.42,
        change_percentage: 1.56,
        market_cap: 225400000000,
        volume: 15432678900,
      },
      {
        symbol: "BNB",
        name: "Binance Coin",
        price: 312.75,
        change_percentage: -0.87,
        market_cap: 48200000000,
        volume: 1876543200,
      },
      {
        symbol: "SOL",
        name: "Solana",
        price: 98.32,
        change_percentage: 5.67,
        market_cap: 41500000000,
        volume: 3456789000,
      },
      {
        symbol: "XRP",
        name: "Ripple",
        price: 0.5423,
        change_percentage: -1.23,
        market_cap: 29300000000,
        volume: 1987654300,
      },
      {
        symbol: "ADA",
        name: "Cardano",
        price: 0.3876,
        change_percentage: 0.45,
        market_cap: 13700000000,
        volume: 876543200,
      },
      {
        symbol: "DOGE",
        name: "Dogecoin",
        price: 0.0876,
        change_percentage: 3.21,
        market_cap: 12400000000,
        volume: 2345678900,
      },
      {
        symbol: "DOT",
        name: "Polkadot",
        price: 5.87,
        change_percentage: -0.54,
        market_cap: 7600000000,
        volume: 543210000,
      },
    ]
  }
}

export const marketService = new MarketService()
