"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimelineData {
  date: string;
  opens: number;
  clicks: number;
}

interface AnalyticsChartProps {
  timeline: TimelineData[];
}

const chartConfig = {
  opens: {
    label: "Opens",
    color: "hsl(var(--chart-1))",
  },
  clicks: {
    label: "Clicks",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function AnalyticsChart({ timeline }: AnalyticsChartProps) {
  const [timeRange, setTimeRange] = React.useState("30d");

  const filteredData = React.useMemo(() => {
    if (!timeline || timeline.length === 0) return [];

    const now = new Date();
    let daysToSubtract = 30;

    if (timeRange === "7d") {
      daysToSubtract = 7;
    } else if (timeRange === "90d") {
      daysToSubtract = 90;
    }

    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysToSubtract);

    return timeline.filter((item) => {
      const date = new Date(item.date);
      return date >= startDate;
    });
  }, [timeline, timeRange]);

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Opens & Clicks Timeline</CardTitle>
          <p className="text-sm text-muted-foreground">
            Track email engagement over time
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto"
            aria-label="Select time range"
          >
            <SelectValue placeholder="Last 30 days" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="90d" className="rounded-lg">
              Last 90 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillOpens" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-opens)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-opens)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillClicks" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-clicks)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-clicks)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="opens"
              type="natural"
              fill="url(#fillOpens)"
              stroke="var(--color-opens)"
              stackId="a"
            />
            <Area
              dataKey="clicks"
              type="natural"
              fill="url(#fillClicks)"
              stroke="var(--color-clicks)"
              stackId="a"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
