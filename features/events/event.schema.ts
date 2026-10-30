import { z } from "zod";
import type { EventFilters } from "./event.service";

export const eventQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  category: z.string().trim().max(60).optional(),
  city: z.string().trim().max(60).optional(),
  dateFrom: z.string().trim().optional(),
  dateTo: z.string().trim().optional(),
  /** Prices are supplied in major units (rupees) and converted to minor units. */
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(["date_asc", "date_desc", "price_asc", "price_desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(48).optional(),
  includePast: z.coerce.boolean().optional(),
});

export type EventQuery = z.infer<typeof eventQuerySchema>;

function readParam(params: URLSearchParams, key: string) {
  const value = params.get(key);
  return value === null || value === "" ? undefined : value;
}

export function parseEventQuery(params: URLSearchParams): EventFilters {
  const raw = eventQuerySchema.parse({
    search: readParam(params, "search"),
    category: readParam(params, "category"),
    city: readParam(params, "city"),
    dateFrom: readParam(params, "dateFrom"),
    dateTo: readParam(params, "dateTo"),
    minPrice: readParam(params, "minPrice"),
    maxPrice: readParam(params, "maxPrice"),
    sort: readParam(params, "sort"),
    page: readParam(params, "page"),
    pageSize: readParam(params, "pageSize"),
    includePast: readParam(params, "includePast"),
  });

  return {
    search: raw.search,
    category: raw.category,
    city: raw.city,
    dateFrom: raw.dateFrom,
    dateTo: raw.dateTo,
    minPrice: raw.minPrice === undefined ? undefined : raw.minPrice * 100,
    maxPrice: raw.maxPrice === undefined ? undefined : raw.maxPrice * 100,
    sort: raw.sort,
    page: raw.page,
    pageSize: raw.pageSize,
    includePast: raw.includePast,
  };
}
