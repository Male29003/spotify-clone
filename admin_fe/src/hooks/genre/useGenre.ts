import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminGenreApi as genreApi, genreApi as StudioGenreApi } from "../../api/genre/api";

export const useGetAllGenresForArtists = () => {
    return useQuery({
        queryKey: ['genres'],
        queryFn: () => StudioGenreApi.get(),
        placeholderData: keepPreviousData,
    })
}

export const useGetGenres = (params: {search?: string, page?: number, limit?: number, is_active?: boolean}) => {
    return useQuery({
        queryKey: ['genres', params],
        queryFn: () => genreApi.get(params),
        placeholderData: keepPreviousData,
    })
}

export const useGetGenreDetail = (slug: string) => {
    return useQuery({
        queryKey: ['genre_detail', slug],
        queryFn: () => genreApi.getDetail(slug),
        enabled: !!slug
    })
}

export const useCreateGenre = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data) => genreApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['genres']
            })
        },
        onError: (error: any) => {
            console.error("Error:", error.response?.data || error.message);
        }
    })
}

export const useUpdateGenre = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({slug, data} : {slug: string, data: any}) => genreApi.update(slug, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['genres']
            })
            queryClient.invalidateQueries({
                queryKey: ['genre_detail', variables.slug]
            })
        },
        onError: (error: any) => {
            console.error("Error:", error.response?.data || error.message);
        }
    }) 
}

export const useToggleActiveGenre = () => {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({slug, is_active} : {slug: string, is_active: boolean}) => genreApi.toggleActive(slug, is_active),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: ['genres']
            })
            queryClient.invalidateQueries({
                queryKey: ['genre_detail', variables.slug]
            })
        },
        onError: (error: any) => {
            console.error("Error:", error.response?.data || error.message);
        }
    })
}