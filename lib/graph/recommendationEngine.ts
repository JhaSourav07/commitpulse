import { DEPENDENCY_GRAPH } from './dependencyGraph';
import type { RecommendedTechnology, GraphEdge, RecommendationStrength } from './types';

/**
 * Computes recommendations based on a set of selected technology IDs.
 * Uses the probabilistic aggregation formula:
 * score = 1 - product(1 - edge_score)
 *
 * @param selectedIds List of currently selected technology IDs
 * @returns Array of RecommendedTechnology sorted by score descending
 */
export function getRecommendations(selectedIds: string[]): RecommendedTechnology[] {
  if (!selectedIds || selectedIds.length === 0) {
    return [];
  }

  const selectedSet = new Set(selectedIds);
  const candidatesMap = new Map<string, { edges: GraphEdge[] }>();

  // Gather all outgoing edges from selected nodes pointing to non-selected candidates
  for (const selectedId of selectedIds) {
    const node = DEPENDENCY_GRAPH[selectedId];
    if (!node) {
      continue;
    }

    for (const edge of node.edges) {
      if (selectedSet.has(edge.targetId)) {
        continue; // Exclude already selected technologies
      }

      let candidate = candidatesMap.get(edge.targetId);
      if (!candidate) {
        candidate = { edges: [] };
        candidatesMap.set(edge.targetId, candidate);
      }
      candidate.edges.push(edge);
    }
  }

  const recommendations: RecommendedTechnology[] = [];

  const candidateEntries = Array.from(candidatesMap.entries());
  for (let i = 0; i < candidateEntries.length; i++) {
    const targetId = candidateEntries[i][0];
    const data = candidateEntries[i][1];
    const edges = data.edges;

    // Calculate aggregated score: 1 - product(1 - edge.score)
    let productOfOpposites = 1.0;
    for (let j = 0; j < edges.length; j++) {
      productOfOpposites *= 1.0 - edges[j].score;
    }
    const aggregatedScore = 1.0 - productOfOpposites;
    const roundedScore = Math.round(aggregatedScore * 100);

    // Determine strength based on aggregated score threshold
    let strength: RecommendationStrength = 'weak';
    if (aggregatedScore >= 0.8) {
      strength = 'strong';
    } else if (aggregatedScore >= 0.5) {
      strength = 'moderate';
    }

    // Determine category from the highest score edge
    let bestEdge = edges[0];
    for (let j = 0; j < edges.length; j++) {
      if (edges[j].score > bestEdge.score) {
        bestEdge = edges[j];
      }
    }
    const category = bestEdge.category;

    // Accumulate and deduplicate reasons
    const reasonsObj: Record<string, boolean> = {};
    for (let j = 0; j < edges.length; j++) {
      const edgeReasons = edges[j].reasons;
      for (let k = 0; k < edgeReasons.length; k++) {
        reasonsObj[edgeReasons[k]] = true;
      }
    }

    recommendations.push({
      id: targetId,
      score: roundedScore,
      strength,
      category,
      reasons: Object.keys(reasonsObj),
    });
  }

  // Rank by score descending, then by id alphabetically for stability
  const sorted = recommendations.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.id.localeCompare(b.id);
  });

  return sorted;
}
