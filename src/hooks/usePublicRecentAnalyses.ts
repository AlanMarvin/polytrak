import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PublicAnalysis {
  id: string;
  address: string;
  username: string | null;
  profileImage: string | null;
  smartScore: number;
  sharpeRatio: number;
  copySuitability: 'Low' | 'Medium' | 'High';
  analyzedAt: string;
}

const MAX_ENTRIES = 20;

export const usePublicRecentAnalyses = () => {
  const [analyses, setAnalyses] = useState<PublicAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyses = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('public_recent_analyses')
        .select('*')
        .order('analyzed_at', { ascending: false })
        .limit(MAX_ENTRIES);

      if (fetchError) throw fetchError;

      const mapped: PublicAnalysis[] = (data || []).map((row: any) => ({
        id: row.id,
        address: row.address,
        username: row.username,
        profileImage: row.profile_image,
        smartScore: row.smart_score,
        sharpeRatio: parseFloat(row.sharpe_ratio),
        copySuitability: row.copy_suitability as 'Low' | 'Medium' | 'High',
        analyzedAt: row.analyzed_at,
      }));

      setAnalyses(mapped);
      setError(null);
    } catch (e) {
      console.error('Failed to fetch public analyses:', e);
      setError('Failed to load recent analyses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  return { analyses, loading, error, refetch: fetchAnalyses };
};

// Standalone function to save analysis
export const savePublicAnalysis = async (analysis: {
  address: string;
  username: string | null;
  profileImage: string | null;
  smartScore: number;
  sharpeRatio: number;
  copySuitability: 'Low' | 'Medium' | 'High';
}) => {
  try {
    // Upsert - insert or update if address exists
    const { error } = await supabase
      .from('public_recent_analyses')
      .upsert(
        {
          address: analysis.address.toLowerCase(),
          username: analysis.username,
          profile_image: analysis.profileImage,
          smart_score: analysis.smartScore,
          sharpe_ratio: analysis.sharpeRatio,
          copy_suitability: analysis.copySuitability,
          analyzed_at: new Date().toISOString(),
        },
        { onConflict: 'address' }
      );

    if (error) throw error;
    
    // Clean up old entries - keep only most recent 20
    const { data: allEntries } = await supabase
      .from('public_recent_analyses')
      .select('id, analyzed_at')
      .order('analyzed_at', { ascending: false });

    if (allEntries && allEntries.length > MAX_ENTRIES) {
      const idsToDelete = allEntries.slice(MAX_ENTRIES).map((e: any) => e.id);
      await supabase
        .from('public_recent_analyses')
        .delete()
        .in('id', idsToDelete);
    }
  } catch (e) {
    console.error('Failed to save public analysis:', e);
  }
};
