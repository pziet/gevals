import { useState, useMemo } from 'react'; // import statement
import { AggregatedResult } from '@/lib/types'; // import statement
import { // import statement
  Select, // statement
  SelectContent, // statement
  SelectItem, // statement
  SelectTrigger, // statement
  SelectValue, // statement
} from "@/components/ui/select"; // close block
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'; // import statement

type MetricKey = 'latency' | 'cost' | 'llmCritic'; // type definition
type CategoryKey = 'model' | 'prompt' | 'embedding' | 'rag' | 'transcriptName'; // type definition

interface DataVisualizationProps { // interface definition
  data: AggregatedResult[]; // statement
} // close block

export function DataVisualization({ data }: DataVisualizationProps) { // exported component
  const [xAxis, setXAxis] = useState<MetricKey>('latency'); // constant declaration
  const [yAxis, setYAxis] = useState<MetricKey>('cost'); // constant declaration
  const [colorBy, setColorBy] = useState<CategoryKey>('model'); // constant declaration

  const metricOptions = [ // constant declaration
    { value: 'latency', label: 'Latency (ms)' }, // statement
    { value: 'cost', label: 'Cost ($)' }, // statement
    { value: 'llmCritic', label: 'LLM Critic Score' }, // statement
  ]; // statement

  const categoryOptions = [ // constant declaration
    { value: 'model', label: 'Model' }, // statement
    { value: 'prompt', label: 'Prompt' }, // statement
    { value: 'embedding', label: 'Embedding' }, // statement
    { value: 'rag', label: 'RAG' }, // statement
    { value: 'transcriptName', label: 'Transcript' }, // statement
  ]; // statement

  // Define a color palette // statement
  const COLORS = [ // constant declaration
    "#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#0088FE", // statement
    "#00C49F", "#FFBB28", "#FF8042", "#A28FD0", "#FF6699" // statement
  ]; // statement

  // Group data by the selected colorBy category // statement
  const groupedData = useMemo(() => { // constant declaration
    const groups: Record<string, AggregatedResult[]> = {}; // constant declaration
    data.forEach(item => { // statement
      const key = item[colorBy]; // constant declaration
      if (!groups[key]) groups[key] = []; // statement
      groups[key].push(item); // statement
    }); // close block
    return groups; // return JSX
  }, [data, colorBy]); // close block

  // Get unique group keys for legend and coloring // statement
  const groupKeys = Object.keys(groupedData); // constant declaration

  return ( // return JSX
    <div className="mb-8"> // JSX markup
      <div className="flex gap-4 mb-4"> // JSX markup
        <div className="w-48"> // JSX markup
          <label className="block text-sm font-medium mb-1">X Axis</label> // JSX markup
          <Select value={xAxis} onValueChange={(value) => setXAxis(value as MetricKey)}> // JSX markup
            <SelectTrigger> // JSX markup
              <SelectValue placeholder="Select X axis" /> // JSX markup
            </SelectTrigger> // JSX markup
            <SelectContent> // JSX markup
              {metricOptions.map((option) => ( // statement
                <SelectItem key={option.value} value={option.value}> // JSX markup
                  {option.label} // statement
                </SelectItem> // JSX markup
              ))} // statement
            </SelectContent> // JSX markup
          </Select> // JSX markup
        </div> // JSX markup

        <div className="w-48"> // JSX markup
          <label className="block text-sm font-medium mb-1">Y Axis</label> // JSX markup
          <Select value={yAxis} onValueChange={(value) => setYAxis(value as MetricKey)}> // JSX markup
            <SelectTrigger> // JSX markup
              <SelectValue placeholder="Select Y axis" /> // JSX markup
            </SelectTrigger> // JSX markup
            <SelectContent> // JSX markup
              {metricOptions.map((option) => ( // statement
                <SelectItem key={option.value} value={option.value}> // JSX markup
                  {option.label} // statement
                </SelectItem> // JSX markup
              ))} // statement
            </SelectContent> // JSX markup
          </Select> // JSX markup
        </div> // JSX markup

        <div className="w-48"> // JSX markup
          <label className="block text-sm font-medium mb-1">Color By</label> // JSX markup
          <Select value={colorBy} onValueChange={(value) => setColorBy(value as CategoryKey)}> // JSX markup
            <SelectTrigger> // JSX markup
              <SelectValue placeholder="Select category" /> // JSX markup
            </SelectTrigger> // JSX markup
            <SelectContent> // JSX markup
              {categoryOptions.map((option) => ( // statement
                <SelectItem key={option.value} value={option.value}> // JSX markup
                  {option.label} // statement
                </SelectItem> // JSX markup
              ))} // statement
            </SelectContent> // JSX markup
          </Select> // JSX markup
        </div> // JSX markup
      </div> // JSX markup

      <div className="h-[400px] border rounded-lg bg-white"> // JSX markup
        <ResponsiveContainer width="100%" height="100%"> // JSX markup
          <ScatterChart> // JSX markup
            <XAxis // JSX markup
              type="number" // type definition
              dataKey={`${xAxis}.mean`} // statement
              name={metricOptions.find(opt => opt.value === xAxis)?.label} // statement
            /> // statement
            <YAxis // JSX markup
              type="number" // type definition
              dataKey={`${yAxis}.mean`} // statement
              name={metricOptions.find(opt => opt.value === yAxis)?.label} // statement
            /> // statement
            <Tooltip // JSX markup
              cursor={{ strokeDasharray: '3 3' }} // statement
              formatter={(value: any, name: string) => [value, name]} // statement
            /> // statement
            <Legend /> // JSX markup
            {groupKeys.map((group, idx) => ( // statement
              <Scatter // JSX markup
                key={group} // statement
                name={group} // statement
                data={groupedData[group]} // statement
                fill={COLORS[idx % COLORS.length]} // statement
                shape="circle" // statement
              /> // statement
            ))} // statement
          </ScatterChart> // JSX markup
        </ResponsiveContainer> // JSX markup
      </div> // JSX markup
    </div> // JSX markup
  ); // statement
} // close block
