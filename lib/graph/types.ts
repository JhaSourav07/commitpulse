export type RecommendationCategory = 'Frontend' | 'Backend' | 'Database' | 'Styling' | 'Tooling';

export type RecommendationStrength = 'strong' | 'moderate' | 'weak';

export interface GraphEdge {
  targetId: string;
  score: number; // probability score from 0.0 to 1.0
  strength: RecommendationStrength;
  category: RecommendationCategory;
  reasons: string[];
}

export interface GraphNode {
  id: string;
  edges: GraphEdge[];
}

export interface RecommendedTechnology {
  id: string;
  score: number; // aggregated percentage score (0 to 100)
  strength: RecommendationStrength;
  category: RecommendationCategory;
  reasons: string[];
}
