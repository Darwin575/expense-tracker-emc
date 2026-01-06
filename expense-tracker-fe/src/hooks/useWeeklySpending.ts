import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api";

export const useWeeklySpending = () => {
    return useQuery({
        queryKey: ["analytics", "weekly-spending"],
        queryFn: async () => {
            const { data } = await apiClient.get("/analytics/weekly-spending/");
            return data;
        },
        staleTime: 60000,
    });
};