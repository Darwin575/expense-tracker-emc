import { useQuery } from "@tanstack/react-query";
import type { DashboardStats } from "@/lib/types";
import apiClient from "@/lib/api";

// Fetch dashboard statistics
export const useDashboardStats = () => {
    return useQuery({
        queryKey: ["dashboard-stats"],
        queryFn: async () => {


            // Real API call
            const { data } = await apiClient.get<DashboardStats>(
                "/dashboard/summary/"
            );
            return data;
        },
        staleTime: 60000, // 1 minute
    });
};
