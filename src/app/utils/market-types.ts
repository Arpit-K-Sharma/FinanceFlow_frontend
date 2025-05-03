// Define types for market data
export interface StockData {
  symbol: string
  name: string
  price: number
  change_percentage: number
  volume: number
  history?: Array<{
    time: string
    price: number
  }>
}

export interface ForexData {
  pair: string
  name: string
  rate: number
  change_percentage: number
  history?: Array<{
    time: string
    rate: number
  }>
}

export interface CryptoData {
  symbol: string
  name: string
  price: number
  change_percentage: number
  market_cap: number
  volume: number
  history?: Array<{
    time: string
    price: number
  }>
}

// Component props interfaces
export interface StockMarketProps {
  data: StockData[]
}

export interface ForexMarketProps {
  data: ForexData[]
}

export interface CryptoMarketProps {
  data: CryptoData[]
}

export interface MarketOverviewProps {
  stockData: StockData[]
  forexData: ForexData[]
  cryptoData: CryptoData[]
}
