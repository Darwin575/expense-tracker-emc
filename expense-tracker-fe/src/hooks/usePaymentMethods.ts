import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api";

export const usePaymentBreakdown = () => {
    return useQuery({
        queryKey: ["analytics", "payment-breakdown"],
        queryFn: async () => {
            const { data } = await apiClient.get("/analytics/payment-breakdown/");
            return data;
        },
        staleTime: 60000,
    });
};