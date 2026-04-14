export type Feed = {
  id: string
  url: string
  title: string | null
  site_name: string | null
  active: boolean
  last_fetched_at: string | null
  etag: string | null
  last_modified: string | null
}

export type IngestResult = {
  feedId: string
  feedUrl: string
  itemsInserted: number
  skipped: boolean // true if 304 Not Modified
  error: string | null
}

export type IngestSummary = {
  feedsProcessed: number
  totalItemsInserted: number
  results: IngestResult[]
  durationMs: number
}
