import React from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { AIInsight, AIRecommendation, FinancialAdvice as FinancialAdviceType } from '@/app/services/aiService';
import { ArrowRight, AlertTriangle, CheckCircle, Info, Maximize2 } from 'lucide-react';

interface FinancialAdviceProps {
  advice: FinancialAdviceType;
  isLoading?: boolean;
  onAskForMore?: () => void;
  compact?: boolean;
  onExpand?: () => void;
}

export function FinancialAdvice({ advice, isLoading = false, onAskForMore, compact = false, onExpand }: FinancialAdviceProps) {
  // Helper function to determine priority icon
  const renderPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'medium':
        return <Info className="h-5 w-5 text-amber-500" />;
      case 'low':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  // Helper function to determine category background color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'savings':
        return 'bg-green-100 text-green-800';
      case 'expenses':
        return 'bg-red-100 text-red-800';
      case 'investments':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className={compact ? "p-4 text-center text-gray-500" : "p-8 text-center text-gray-500"}>
        <div className="animate-spin h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p>Generating personalized financial advice...</p>
        {!compact && <p className="text-xs mt-2">This may take a moment as we analyze your financial data</p>}
      </div>
    );
  }

  // Compact view rendering
  if (compact) {
    return (
      <div className="space-y-3">
        {/* Compact Summary Card */}
        <Card className="p-3 bg-indigo-50 border-indigo-200">
          <div className="flex justify-between items-start">
            <h3 className="text-sm font-medium text-indigo-900 mb-1">Summary</h3>
            {onExpand && (
              <Button variant="ghost" size="sm" onClick={onExpand} className="h-6 w-6 p-0">
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-xs text-indigo-700">{advice.summary}</p>
        </Card>

        {/* Compact Top Insight */}
        {advice.insights.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-1">Key Insight</h3>
            <Card className="p-3">
              <div className="flex items-start gap-2">
                <div className="mt-0.5">
                  {renderPriorityIcon(advice.insights[0].priority)}
                </div>
                <div>
                  <h4 className="text-xs font-medium">{advice.insights[0].title}</h4>
                  <p className="text-gray-600 text-xs mt-0.5">{advice.insights[0].description}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Compact Top Recommendation */}
        {advice.recommendations.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-1">Recommendation</h3>
            <Card className="p-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getCategoryColor(advice.recommendations[0].category)}`}>
                    {advice.recommendations[0].category.charAt(0).toUpperCase() + advice.recommendations[0].category.slice(1)}
                  </span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <h4 className="text-xs font-medium">{advice.recommendations[0].action}</h4>
              </div>
            </Card>
          </div>
        )}

        {/* Expand Button */}
        {onExpand && (
          <Button 
            onClick={onExpand}
            className="w-full text-xs" 
            size="sm"
          >
            <span>View Full Analysis</span>
            <Maximize2 className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>
    );
  }

  // Full view rendering
  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="p-4 bg-indigo-50 border-indigo-200">
        <h3 className="text-lg font-medium text-indigo-900 mb-2">Summary</h3>
        <p className="text-indigo-700">{advice.summary}</p>
      </Card>

      {/* Insights Section */}
      <div>
        <h3 className="text-lg font-medium mb-3">Key Insights</h3>
        <div className="space-y-3">
          {advice.insights.map((insight: AIInsight, index: number) => (
            <Card key={index} className="p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {renderPriorityIcon(insight.priority)}
                </div>
                <div>
                  <h4 className="font-medium">{insight.title}</h4>
                  <p className="text-gray-600 text-sm mt-1">{insight.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recommendations Section */}
      <div>
        <h3 className="text-lg font-medium mb-3">Recommendations</h3>
        <div className="space-y-3">
          {advice.recommendations.map((recommendation: AIRecommendation, index: number) => (
            <Card key={index} className="p-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${getCategoryColor(recommendation.category)}`}>
                    {recommendation.category.charAt(0).toUpperCase() + recommendation.category.slice(1)}
                  </span>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <h4 className="font-medium">{recommendation.action}</h4>
                <p className="text-gray-600 text-sm">{recommendation.reasoning}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Market Context Section */}
      <div>
        <h3 className="text-lg font-medium mb-3">Market Context</h3>
        <Card className="p-4">
          <p className="text-gray-600">{advice.market_context}</p>
        </Card>
      </div>

      {/* Ask for More Button */}
      {onAskForMore && (
        <div className="pt-4">
          <Separator className="mb-6" />
          <Button 
            onClick={onAskForMore}
            className="w-full" 
            variant="outline"
          >
            <span>Ask for More Specific Advice</span>
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
} 