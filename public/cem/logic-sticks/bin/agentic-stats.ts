#!/usr/bin/env npx ts-node
/**
 * Agentic Stats CLI
 *
 * Aggregate and analyze stats from all instances.
 *
 * Usage:
 *   npx ts-node bin/agentic-stats.ts aggregate <dir>
 *   npx ts-node bin/agentic-stats.ts report <dir>
 *   npx ts-node bin/agentic-stats.ts breakthroughs <dir>
 */

import * as fs from 'fs';
import * as path from 'path';
import { aggregateInsights } from '../src/agentic-stats/index.js';
import type { AgenticStat } from '../src/agentic-stats/index.js';

function loadAllStats(dir: string): AgenticStat[] {
  const stats: AgenticStat[] = [];
  const files = fs.readdirSync(dir).filter(f => f.startsWith('.agentic_stats_') && f.endsWith('.jsonl'));

  for (const file of files) {
    const content = fs.readFileSync(path.join(dir, file), 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        stats.push(JSON.parse(line));
      } catch {
        // Skip malformed
      }
    }
  }

  return stats;
}

function printReport(stats: AgenticStat[]): void {
  const insights = aggregateInsights(stats);

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('              AGENTIC STATS — FEDERATION REPORT');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log(`Total stats: ${stats.length}`);
  console.log(`Instances: ${[...new Set(stats.map(s => s.instance))].join(', ')}\n`);

  console.log('CATEGORY BREAKDOWN:');
  for (const [cat, count] of Object.entries(insights.categoryBreakdown)) {
    console.log(`  ${cat}: ${count}`);
  }

  console.log('\nTOP PATTERNS (by tag):');
  for (const pattern of insights.topPatterns.slice(0, 5)) {
    console.log(`  "${pattern.pattern}" — ${pattern.count} occurrences across ${pattern.instances.join(', ')}`);
  }

  if (insights.breakthroughs.length > 0) {
    console.log('\nBREAKTHROUGHS:');
    for (const b of insights.breakthroughs) {
      console.log(`  [${b.instance}] ${b.observation.slice(0, 80)}...`);
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

// Main
const [, , command, dir] = process.argv;

if (!command || !dir) {
  console.log('Usage: agentic-stats <aggregate|report|breakthroughs> <directory>');
  process.exit(1);
}

const stats = loadAllStats(dir);
console.log(`Loaded ${stats.length} stats from ${dir}`);

switch (command) {
  case 'aggregate':
  case 'report':
    printReport(stats);
    break;
  case 'breakthroughs':
    const breakthroughs = stats.filter(s => s.severity === 'breakthrough');
    console.log(`\nBreakthroughs (${breakthroughs.length}):\n`);
    for (const b of breakthroughs) {
      console.log(`[${b.id}] ${b.observation}`);
      console.log(`  → ${b.implication}\n`);
    }
    break;
  default:
    console.log(`Unknown command: ${command}`);
}
