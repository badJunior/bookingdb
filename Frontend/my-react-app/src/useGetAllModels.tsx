import { useQuery } from "@tanstack/react-query";
import { httpClient } from "./utils";

export default function useGetAllModels() {
  return useQuery({
    queryKey: ["getAllModels"],
    queryFn: async () => {
      const result = await httpClient.get<GetAllModelsRequest>("/models");
      return result.data;
    },
  });
}
export type ModelItem = {
  id: number;
  power: number;
  startYear: number;
  endYear: number;
  name: string;
  categoryId: number;
  categoryName: string;
};
export type GetAllModelsRequest = {
  allModels: ModelItem[];
};
