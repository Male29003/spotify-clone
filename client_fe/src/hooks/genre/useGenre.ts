import { keepPreviousData, useQuery } from "@tanstack/react-query";
import genreApi from "../../api/genre/api";

export const useGetGenres = (search: string = '', page: number = 1, limit: number = 10) => {
    return useQuery({
        queryKey: ['genres', search, page, limit],
        queryFn: () => genreApi.get({ search, page, limit }),
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

export const useRandomGenreMix = () => {
    return useQuery({
        queryKey: ['random_genre_mix'],
        queryFn: () => genreApi.getRandomMix()
    })
}