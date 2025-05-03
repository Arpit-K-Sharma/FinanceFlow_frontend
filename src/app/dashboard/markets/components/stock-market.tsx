"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowDown, ArrowUp, Search, SlidersHorizontal, Star } from "lucide-react"
import { formatCurrency, formatPercentage } from "@/app/utils/format-utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { StockMarketProps } from "@/app/utils/market-types"

export default function StockMarket({ data }: StockMarketProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState("symbol")
  const [sortDirection, setSortDirection] = useState("asc")

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const filteredData = data.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const sortedData = [...filteredData].sort((a, b) => {
    let comparison = 0

    if (sortField === "symbol") {
      comparison = a.symbol.localeCompare(b.symbol)
    } else if (sortField === "name") {
      comparison = a.name.localeCompare(b.name)
    } else if (sortField === "price") {
      comparison = a.price - b.price
    } else if (sortField === "change_percentage") {
      comparison = a.change_percentage - b.change_percentage
    } else if (sortField === "volume") {
      comparison = a.volume - b.volume
    }

    return sortDirection === "asc" ? comparison : -comparison
  })

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 sm:gap-4">
          <div>
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
              Stock Market
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">Real-time stock market data</CardDescription>
          </div>
          <div className="flex items-center gap-2 mt-2 md:mt-0">
            <div className="relative flex-1 min-w-0 md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search stocks..."
                className="pl-7 sm:pl-8 h-8 sm:h-9 text-xs sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setSearchTerm("")} 
              title="Clear search"
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
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
              <span className="sr-only">Clear</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8" title="Filter options">
                  <SlidersHorizontal className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="sr-only">Filter</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs sm:text-sm">
                <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleSort("symbol")}>Symbol</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort("name")}>Name</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort("price")}>Price</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort("change_percentage")}>Change</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort("volume")}>Volume</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-1 sm:px-3 md:px-6">
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead
                  className="cursor-pointer hover:text-primary transition-colors text-xs sm:text-sm py-1 sm:py-2 px-2 sm:px-4"
                  onClick={() => handleSort("symbol")}
                >
                  Symbol
                  {sortField === "symbol" &&
                    (sortDirection === "asc" ? (
                      <ArrowUp className="inline ml-1" size={12} />
                    ) : (
                      <ArrowDown className="inline ml-1" size={12} />
                    ))}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-primary transition-colors text-xs sm:text-sm py-1 sm:py-2 px-2 sm:px-4 hidden sm:table-cell"
                  onClick={() => handleSort("name")}
                >
                  Name
                  {sortField === "name" &&
                    (sortDirection === "asc" ? (
                      <ArrowUp className="inline ml-1" size={12} />
                    ) : (
                      <ArrowDown className="inline ml-1" size={12} />
                    ))}
                </TableHead>
                <TableHead
                  className="cursor-pointer text-right hover:text-primary transition-colors text-xs sm:text-sm py-1 sm:py-2 px-2 sm:px-4"
                  onClick={() => handleSort("price")}
                >
                  Price
                  {sortField === "price" &&
                    (sortDirection === "asc" ? (
                      <ArrowUp className="inline ml-1" size={12} />
                    ) : (
                      <ArrowDown className="inline ml-1" size={12} />
                    ))}
                </TableHead>
                <TableHead
                  className="cursor-pointer text-right hover:text-primary transition-colors text-xs sm:text-sm py-1 sm:py-2 px-2 sm:px-4"
                  onClick={() => handleSort("change_percentage")}
                >
                  Change
                  {sortField === "change_percentage" &&
                    (sortDirection === "asc" ? (
                      <ArrowUp className="inline ml-1" size={12} />
                    ) : (
                      <ArrowDown className="inline ml-1" size={12} />
                    ))}
                </TableHead>
                <TableHead
                  className="cursor-pointer text-right hover:text-primary transition-colors text-xs sm:text-sm py-1 sm:py-2 px-2 sm:px-4 hidden md:table-cell"
                  onClick={() => handleSort("volume")}
                >
                  Volume
                  {sortField === "volume" &&
                    (sortDirection === "asc" ? (
                      <ArrowUp className="inline ml-1" size={12} />
                    ) : (
                      <ArrowDown className="inline ml-1" size={12} />
                    ))}
                </TableHead>
                <TableHead className="w-[40px] sm:w-[50px] text-xs sm:text-sm py-1 sm:py-2 px-2 sm:px-4"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.length > 0 ? (
                sortedData.map((stock) => (
                  <TableRow key={stock.symbol} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium text-xs sm:text-sm py-1 sm:py-2 px-2 sm:px-4">{stock.symbol}</TableCell>
                    <TableCell className="text-xs sm:text-sm py-1 sm:py-2 px-2 sm:px-4 hidden sm:table-cell">{stock.name}</TableCell>
                    <TableCell className="text-right font-medium text-xs sm:text-sm py-1 sm:py-2 px-2 sm:px-4">{formatCurrency(stock.price)}</TableCell>
                    <TableCell
                      className={`text-right font-medium text-xs sm:text-sm py-1 sm:py-2 px-2 sm:px-4 ${
                        stock.change_percentage > 0
                          ? "text-green-500"
                          : stock.change_percentage < 0
                            ? "text-red-500"
                            : ""
                      }`}
                    >
                      <div className="flex items-center justify-end">
                        {stock.change_percentage > 0 ? (
                          <div className="bg-green-100 text-green-700 px-1 sm:px-2 py-0.5 sm:py-1 rounded-md flex items-center text-xs">
                            <ArrowUp className="mr-0.5 sm:mr-1" size={10} />
                            {formatPercentage(stock.change_percentage)}
                          </div>
                        ) : stock.change_percentage < 0 ? (
                          <div className="bg-red-100 text-red-700 px-1 sm:px-2 py-0.5 sm:py-1 rounded-md flex items-center text-xs">
                            <ArrowDown className="mr-0.5 sm:mr-1" size={10} />
                            {formatPercentage(stock.change_percentage)}
                          </div>
                        ) : (
                          <div className="bg-gray-100 text-gray-700 px-1 sm:px-2 py-0.5 sm:py-1 rounded-md text-xs">0.00%</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs py-1 sm:py-2 px-2 sm:px-4 hidden md:table-cell">{stock.volume.toLocaleString()}</TableCell>
                    <TableCell className="py-1 sm:py-2 px-2 sm:px-4">
                      <Button variant="ghost" size="icon" className="h-6 w-6 sm:h-8 sm:w-8">
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground hover:text-amber-500 transition-colors" />
                        <span className="sr-only">Add to watchlist</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 sm:py-8">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Search className="h-6 w-6 sm:h-8 sm:w-8 mb-2" />
                      <p className="text-xs sm:text-sm">No stocks found</p>
                      <p className="text-xs">Try adjusting your search</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
