import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api";

export const useCategoryBreakdown = () => {
    return useQuery({
        queryKey: ["analytics", "category-breakdown"],
        queryFn: async () => {
            const { data } = await apiClient.get("/analytics/category-breakdown/");
            return data;
        },
        staleTime: 60000,
    });
};