import { useQuery } from "@tanstack/react-query";
import { httpClient } from "./utils";

export default function useGetAllCategories() {
  return useQuery({
    queryKey: ["getAllCategories"],
    queryFn: async () => {
      const result =
        await httpClient.get<GetAllCategoriesRequest>("/categories");
      return result.data;
    },
  });
}

export type CategoryItem = { id: number; name: string };

export type GetAllCategoriesRequest = { allCategories: CategoryItem[] };
