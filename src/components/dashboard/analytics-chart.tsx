"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
import { TrendingUp, Calendar } from "lucide-react";

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
		color: "hsl(142, 76%, 36%)",
	},
	clicks: {
		label: "Clicks",
		color: "hsl(262, 83%, 58%)",
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

	const stats = React.useMemo(() => {
		if (filteredData.length === 0)
			return { totalOpens: 0, totalClicks: 0, trend: 0 };

		const totalOpens = filteredData.reduce((sum, item) => sum + item.opens, 0);
		const totalClicks = filteredData.reduce(
			(sum, item) => sum + item.clicks,
			0,
		);

		const midPoint = Math.floor(filteredData.length / 2);
		const firstHalf = filteredData.slice(0, midPoint);
		const secondHalf = filteredData.slice(midPoint);

		const firstHalfTotal = firstHalf.reduce(
			(sum, item) => sum + item.opens + item.clicks,
			0,
		);
		const secondHalfTotal = secondHalf.reduce(
			(sum, item) => sum + item.opens + item.clicks,
			0,
		);

		const trend =
			firstHalfTotal > 0
				? ((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100
				: 0;

		return { totalOpens, totalClicks, trend };
	}, [filteredData]);

	return (
		<Card className="hover:shadow-lg transition-shadow duration-300">
			<CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
				<div className="grid flex-1 gap-1">
					<div className="flex items-center gap-2">
						<div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
							<TrendingUp className="w-5 h-5 text-white" />
						</div>
						<div>
							<CardTitle className="text-xl">
								Email Engagement Timeline
							</CardTitle>
							<CardDescription className="flex items-center gap-1 mt-1">
								<Calendar className="w-3 h-3" />
								Track opens and clicks over time
							</CardDescription>
						</div>
					</div>
				</div>
				<Select value={timeRange} onValueChange={setTimeRange}>
					<SelectTrigger
						className="w-[160px] rounded-lg sm:ml-auto shadow-sm hover:shadow-md transition-shadow"
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
				<div className="grid grid-cols-3 gap-4 mb-6">
					<div className="text-center p-3 rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
						<p className="text-xs text-muted-foreground mb-1">Total Opens</p>
						<p className="text-2xl font-bold text-green-600 dark:text-green-400">
							{stats.totalOpens}
						</p>
					</div>
					<div className="text-center p-3 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
						<p className="text-xs text-muted-foreground mb-1">Total Clicks</p>
						<p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
							{stats.totalClicks}
						</p>
					</div>
					<div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
						<p className="text-xs text-muted-foreground mb-1">Trend</p>
						<p
							className={`text-2xl font-bold ${stats.trend >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
						>
							{stats.trend >= 0 ? "+" : ""}
							{stats.trend.toFixed(1)}%
						</p>
					</div>
				</div>

				<ChartContainer
					config={chartConfig}
					className="aspect-auto h-[300px] w-full"
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
						<CartesianGrid
							vertical={false}
							strokeDasharray="3 3"
							className="stroke-muted"
						/>
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
						<YAxis
							tickLine={false}
							axisLine={false}
							tickMargin={8}
							tickFormatter={(value) => value.toString()}
						/>
						<ChartTooltip
							cursor={{ strokeDasharray: "3 3" }}
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
							type="monotone"
							fill="url(#fillOpens)"
							stroke="var(--color-opens)"
							strokeWidth={2}
							animationDuration={1000}
						/>
						<Area
							dataKey="clicks"
							type="monotone"
							fill="url(#fillClicks)"
							stroke="var(--color-clicks)"
							strokeWidth={2}
							animationDuration={1000}
						/>
						<ChartLegend content={<ChartLegendContent />} />
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
