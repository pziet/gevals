'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AggregatedResult } from '@/lib/types';

type SortKey = keyof AggregatedResult | 'latency' | 'cost' | 'llmCritic';
type SortOrder = 'asc' | 'desc';

export default function LeaderboardPage() {
  const [results, setResults] = useState<AggregatedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  useEffect(() => {
    fetch('/api/results')
      .then(res => res.json())
      .then(data => {
        setResults(data);
        setLoading(false);
      });
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const sortedResults = [...results].sort((a, b) => {
    let aValue: any = a[sortKey as keyof AggregatedResult];
    let bValue: any = b[sortKey as keyof AggregatedResult];

    // Special handling for nested objects
    if (sortKey === 'latency' || sortKey === 'cost' || sortKey === 'llmCritic') {
      aValue = a[sortKey].mean;
      bValue = b[sortKey].mean;
    }

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    return 0;
  });

  // Helper to render sort indicator
  const renderSortIndicator = (key: SortKey) => {
    if (sortKey !== key) return null;
    return (
      <span style={{ marginLeft: 4 }}>
        {sortOrder === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Evaluation Results Leaderboard</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>
              ID{renderSortIndicator('id')}
            </TableHead>
            <TableHead onClick={() => handleSort('model')} style={{ cursor: 'pointer' }}>
              Model{renderSortIndicator('model')}
            </TableHead>
            <TableHead onClick={() => handleSort('prompt')} style={{ cursor: 'pointer' }}>
              Prompt{renderSortIndicator('prompt')}
            </TableHead>
            <TableHead onClick={() => handleSort('embedding')} style={{ cursor: 'pointer' }}>
              Embedding{renderSortIndicator('embedding')}
            </TableHead>
            <TableHead onClick={() => handleSort('rag')} style={{ cursor: 'pointer' }}>
              RAG{renderSortIndicator('rag')}
            </TableHead>
            <TableHead onClick={() => handleSort('transcriptName')} style={{ cursor: 'pointer' }}>
              Transcript{renderSortIndicator('transcriptName')}
            </TableHead>
            <TableHead onClick={() => handleSort('latency')} style={{ cursor: 'pointer' }}>
              Latency (ms){renderSortIndicator('latency')}
            </TableHead>
            <TableHead onClick={() => handleSort('cost')} style={{ cursor: 'pointer' }}>
              Cost ($){renderSortIndicator('cost')}
            </TableHead>
            <TableHead onClick={() => handleSort('llmCritic')} style={{ cursor: 'pointer' }}>
              LLM Critic{renderSortIndicator('llmCritic')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedResults.map((result) => (
            <TableRow key={result.uniqueId}>
              <TableCell>{result.id}</TableCell>
              <TableCell>{result.model}</TableCell>
              <TableCell>{result.prompt}</TableCell>
              <TableCell>{result.embedding}</TableCell>
              <TableCell>{result.rag}</TableCell>
              <TableCell>{result.transcriptName}</TableCell>
              <TableCell>
                {result.latency.mean.toFixed(2)} ± {result.latency.std.toFixed(2)}
              </TableCell>
              <TableCell>
                {result.cost.mean.toFixed(6)} ± {result.cost.std.toFixed(6)}
              </TableCell>
              <TableCell>
                {result.llmCritic.mean.toFixed(2)} ± {result.llmCritic.std.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
