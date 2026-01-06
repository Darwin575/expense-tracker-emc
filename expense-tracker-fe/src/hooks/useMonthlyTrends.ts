import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api";

export const useMonthlyTrend = () => {
    return useQuery({
        queryKey: ["analytics", "monthly-trend"],
        queryFn: async () => {
            const { data } = await apiClient.get("/analytics/monthly-trend/");
            return data;
        },
        staleTime: 60000,
    });
};