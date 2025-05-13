import { useState, useMemo } from 'react';
import { AggregatedResult } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type MetricKey = 'latency' | 'cost' | 'llmCritic';
type CategoryKey = 'model' | 'prompt' | 'embedding' | 'rag' | 'transcriptName';

interface DataVisualizationProps {
  data: AggregatedResult[];
}

export function DataVisualization({ data }: DataVisualizationProps) {
  const [xAxis, setXAxis] = useState<MetricKey>('latency');
  const [yAxis, setYAxis] = useState<MetricKey>('cost');
  const [colorBy, setColorBy] = useState<CategoryKey>('model');

  const metricOptions = [
    { value: 'latency', label: 'Latency (ms)' },
    { value: 'cost', label: 'Cost ($)' },
    { value: 'llmCritic', label: 'LLM Critic Score' },
  ];

  const categoryOptions = [
    { value: 'model', label: 'Model' },
    { value: 'prompt', label: 'Prompt' },
    { value: 'embedding', label: 'Embedding' },
    { value: 'rag', label: 'RAG' },
    { value: 'transcriptName', label: 'Transcript' },
  ];

  // Define a color palette
  const COLORS = [
    "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088FE",
    "#00C49F", "#FFBB28", "#FF8042", "#A28FD0", "#FF6699"
  ];

  // Group data by the selected colorBy category
  const groupedData = useMemo(() => {
    const groups: Record<string, AggregatedResult[]> = {};
    data.forEach(item => {
      const key = item[colorBy];
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return groups;
  }, [data, colorBy]);

  // Get unique group keys for legend and coloring
  const groupKeys = Object.keys(groupedData);

  return (
    <div className="mb-8">
      <div className="flex gap-4 mb-4">
        <div className="w-48">
          <label className="block text-sm font-medium mb-1">X Axis</label>
          <Select value={xAxis} onValueChange={(value) => setXAxis(value as MetricKey)}>
            <SelectTrigger>
              <SelectValue placeholder="Select X axis" />
            </SelectTrigger>
            <SelectContent>
              {metricOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-48">
          <label className="block text-sm font-medium mb-1">Y Axis</label>
          <Select value={yAxis} onValueChange={(value) => setYAxis(value as MetricKey)}>
            <SelectTrigger>
              <SelectValue placeholder="Select Y axis" />
            </SelectTrigger>
            <SelectContent>
              {metricOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-48">
          <label className="block text-sm font-medium mb-1">Color By</label>
          <Select value={colorBy} onValueChange={(value) => setColorBy(value as CategoryKey)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="h-[400px] border rounded-lg bg-white">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart>
            <XAxis
              type="number"
              dataKey={`${xAxis}.mean`}
              name={metricOptions.find(opt => opt.value === xAxis)?.label}
            />
            <YAxis
              type="number"
              dataKey={`${yAxis}.mean`}
              name={metricOptions.find(opt => opt.value === yAxis)?.label}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              formatter={(value: any, name: string) => [value, name]}
            />
            <Legend />
            {groupKeys.map((group, idx) => (
              <Scatter
                key={group}
                name={group}
                data={groupedData[group]}
                fill={COLORS[idx % COLORS.length]}
                shape="circle"
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}