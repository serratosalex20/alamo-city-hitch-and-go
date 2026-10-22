import { bookableTrailers } from "@/lib/data/trailers";

/** Only public slugs belonging to the bookable fleet can skip selection. */
export function bookingTrailerFromQuery(value: string | string[] | undefined) {
  return typeof value === "string"
    ? bookableTrailers.find((trailer) => trailer.slug === value)
    : undefined;
}
