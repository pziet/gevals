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

export default function LeaderboardPage() {
  const [results, setResults] = useState<AggregatedResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/results')
      .then(res => res.json())
      .then(data => {
        setResults(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Evaluation Results Leaderboard</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Model</TableHead>
            <TableHead>Prompt</TableHead>
            <TableHead>Embedding</TableHead>
            <TableHead>RAG</TableHead>
            <TableHead>Transcript</TableHead>
            <TableHead>Latency (ms)</TableHead>
            <TableHead>Cost ($)</TableHead>
            <TableHead>LLM Critic</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {results.map((result) => (
            <TableRow key={result.id}>
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
