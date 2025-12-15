import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface WatchlistItem {
  id: string;
  trader_address: string;
  trader_name: string | null;
  notes: string | null;
  created_at: string;
}

export function useWatchlist() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWatchlist = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('watchlist')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching watchlist:', error);
    } else {
      setWatchlist(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWatchlist();
  }, [user]);

  const addToWatchlist = async (traderAddress: string, traderName?: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please sign in to add traders to your watchlist",
        variant: "destructive"
      });
      return false;
    }

    const { error } = await supabase
      .from('watchlist')
      .insert({
        user_id: user.id,
        trader_address: traderAddress,
        trader_name: traderName || null
      });

    if (error) {
      if (error.code === '23505') {
        toast({
          title: "Already Watching",
          description: "This trader is already in your watchlist",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add to watchlist",
          variant: "destructive"
        });
      }
      return false;
    }

    toast({
      title: "Added to Watchlist",
      description: "Trader added to your watchlist",
    });
    fetchWatchlist();
    return true;
  };

  const removeFromWatchlist = async (traderAddress: string) => {
    if (!user) return false;

    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('trader_address', traderAddress);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove from watchlist",
        variant: "destructive"
      });
      return false;
    }

    toast({
      title: "Removed",
      description: "Trader removed from watchlist",
    });
    fetchWatchlist();
    return true;
  };

  const isWatching = (traderAddress: string) => {
    return watchlist.some(item => item.trader_address === traderAddress);
  };

  return {
    watchlist,
    loading,
    addToWatchlist,
    removeFromWatchlist,
    isWatching,
    refetch: fetchWatchlist
  };
}
