import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser, logout as logoutApi } from "@/lib/auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export function useAuth() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const logoutMutation = useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      queryClient.clear();
      setLocation("/login");
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      });
    },
    onError: () => {
      // Even if the API call fails, clear local state
      queryClient.clear();
      setLocation("/login");
    },
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user: user?.user,
    profile: user?.profile,
    isLoading,
    error,
    logout,
    isLoggedIn: !!user?.user,
  };
}
