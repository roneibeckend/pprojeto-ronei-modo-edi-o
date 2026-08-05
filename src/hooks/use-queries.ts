import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export const useProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
        
      if (error) throw error;
      return data;
    },
  });
};

export const useCourses = () => {
  return useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("courses")
        .select(`
          *,
          modules (
            *,
            lessons (*)
          )
        `)
        .order('order_index', { foreignTable: 'modules' })
        .order('order_index', { foreignTable: 'modules.lessons' });
        
      if (error) throw error;
      return data;
    },
  });
};

export const useEbooks = () => {
  return useQuery({
    queryKey: ["ebooks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ebooks").select("*");
      if (error) throw error;
      return data;
    },
  });
};

export const useRecipes = () => {
  return useQuery({
    queryKey: ["recipes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("recipes").select("*");
      if (error) throw error;
      return data;
    },
  });
};
