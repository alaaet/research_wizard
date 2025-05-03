import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatCurrency, formatDate, formatPercent } from '@/utils/crm-operations';
import { CircleCheckBig, TrendingDown, TrendingUp } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  change?: number;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  description,
  change,
  icon,
  onClick
}) => {
  const renderChangeIndicator = () => {
    if (change === undefined) return null;
    
    if (change > 0) {
      return (
        <div className="flex items-center text-sm text-green-600">
          <TrendingUp className="mr-1 h-4 w-4" />
          <span>+{formatPercent(change)}</span>
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center text-sm text-red-600">
          <TrendingDown className="mr-1 h-4 w-4" />
          <span>{formatPercent(change)}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-sm text-gray-600">
          <CircleCheckBig className="mr-1 h-4 w-4" />
          <span>Stable</span>
        </div>
      );
    }
  };
  
  return (
    <Card className={onClick ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''} onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center justify-between mt-1">
          {description && <CardDescription>{description}</CardDescription>}
          {renderChangeIndicator()}
        </div>
      </CardContent>
    </Card>
  );
};

interface ProgressCardProps {
  title: string;
  value: number;
  max: number;
  description?: string;
  unit?: string;
  icon?: React.ReactNode;
}

export const ProgressCard: React.FC<ProgressCardProps> = ({
  title,
  value,
  max,
  description,
  unit = '',
  icon
}) => {
  const percentage = (value / max) * 100;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <span>
            {value}{unit} / {max}{unit}
          </span>
          <span className="text-sm text-muted-foreground">
            {Math.round(percentage)}%
          </span>
        </div>
        <Progress value={percentage} className="h-2" />
        {description && (
          <CardDescription className="pt-1">{description}</CardDescription>
        )}
      </CardContent>
    </Card>
  );
};

interface TabsChartProps {
  title: string;
  description?: string;
  tabs: {
    key: string;
    label: string;
    chart: React.ReactNode;
  }[];
  defaultTab?: string;
}

export const TabsChart: React.FC<TabsChartProps> = ({
  title,
  description,
  tabs,
  defaultTab
}) => {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultTab || tabs[0]?.key} className="w-full">
          <TabsList className="mb-4">
            {tabs.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map((tab) => (
            <TabsContent key={tab.key} value={tab.key} className="h-[300px]">
              {tab.chart}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
};

interface SimpleStatsProps {
  title: string;
  stats: Array<{
    label: string;
    value: string | number;
  }>;
}

export const SimpleStats: React.FC<SimpleStatsProps> = ({ title, stats }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2">
          {stats.map((stat, index) => (
            <div key={index} className="flex justify-between">
              <dt className="text-sm font-medium text-muted-foreground">{stat.label}</dt>
              <dd className="text-sm font-semibold">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
};

export const ReusableDashboard = {
  KpiCard,
  ProgressCard,
  TabsChart,
  SimpleStats
};

export default ReusableDashboard;
