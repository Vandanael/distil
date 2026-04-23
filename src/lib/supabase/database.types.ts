/**
 * Types Database generes manuellement a partir des migrations supabase/.
 * Source de verite : les fichiers supabase/migrations/*.sql.
 * A regenerer via `supabase gen types typescript --project-id <id>` quand
 * SUPABASE_ACCESS_TOKEN sera configure.
 *
 * Convention Supabase :
 * - Row : shape complet retourne par SELECT
 * - Insert : champs requis/optionnels pour INSERT (NOT NULL sans DEFAULT = requis)
 * - Update : tout optionnel (PATCH partiel)
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          profile_text: string | null
          profile_structured: Json | null
          sector: string | null
          interests: string[] | null
          pinned_sources: string[] | null
          daily_cap: number | null
          serendipity_quota: number | null
          show_scores: boolean | null
          dark_mode: boolean | null
          onboarding_completed: boolean | null
          onboarding_method: string | null
          embedding: number[] | null
          digest_email: boolean
          first_edition_empty: boolean
          discovery_mode: 'active' | 'sources_first'
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          profile_text?: string | null
          profile_structured?: Json | null
          sector?: string | null
          interests?: string[] | null
          pinned_sources?: string[] | null
          daily_cap?: number | null
          serendipity_quota?: number | null
          show_scores?: boolean | null
          dark_mode?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_method?: string | null
          embedding?: string | number[] | null
          digest_email?: boolean
          first_edition_empty?: boolean
          discovery_mode?: 'active' | 'sources_first'
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          profile_text?: string | null
          profile_structured?: Json | null
          sector?: string | null
          interests?: string[] | null
          pinned_sources?: string[] | null
          daily_cap?: number | null
          serendipity_quota?: number | null
          show_scores?: boolean | null
          dark_mode?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_method?: string | null
          embedding?: string | number[] | null
          digest_email?: boolean
          first_edition_empty?: boolean
          discovery_mode?: 'active' | 'sources_first'
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      articles: {
        Row: {
          id: string
          user_id: string
          item_id: string | null
          url: string
          title: string | null
          author: string | null
          site_name: string | null
          published_at: string | null
          content_html: string | null
          content_text: string | null
          excerpt: string | null
          word_count: number | null
          reading_time_minutes: number | null
          og_image_url: string | null
          score: number | null
          justification: string | null
          is_serendipity: boolean
          rejection_reason: string | null
          kept_anyway: boolean
          positive_signal: boolean
          origin: string
          status: string
          scored_at: string | null
          read_at: string | null
          archived_at: string | null
          digest_sent_at: string | null
          below_normal_threshold: boolean
          carry_over_count: number
          last_shown_in_edition_at: string | null
          embedding: number[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_id?: string | null
          url: string
          title?: string | null
          author?: string | null
          site_name?: string | null
          published_at?: string | null
          content_html?: string | null
          content_text?: string | null
          excerpt?: string | null
          word_count?: number | null
          reading_time_minutes?: number | null
          og_image_url?: string | null
          score?: number | null
          justification?: string | null
          is_serendipity?: boolean
          rejection_reason?: string | null
          kept_anyway?: boolean
          positive_signal?: boolean
          origin?: string
          status?: string
          scored_at?: string | null
          read_at?: string | null
          archived_at?: string | null
          digest_sent_at?: string | null
          below_normal_threshold?: boolean
          carry_over_count?: number
          last_shown_in_edition_at?: string | null
          embedding?: string | number[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_id?: string | null
          url?: string
          title?: string | null
          author?: string | null
          site_name?: string | null
          published_at?: string | null
          content_html?: string | null
          content_text?: string | null
          excerpt?: string | null
          word_count?: number | null
          reading_time_minutes?: number | null
          og_image_url?: string | null
          score?: number | null
          justification?: string | null
          is_serendipity?: boolean
          rejection_reason?: string | null
          kept_anyway?: boolean
          positive_signal?: boolean
          origin?: string
          status?: string
          scored_at?: string | null
          read_at?: string | null
          archived_at?: string | null
          digest_sent_at?: string | null
          below_normal_threshold?: boolean
          carry_over_count?: number
          last_shown_in_edition_at?: string | null
          embedding?: string | number[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      scoring_runs: {
        Row: {
          id: string
          user_id: string
          started_at: string
          completed_at: string | null
          articles_analyzed: number
          articles_accepted: number
          articles_rejected: number
          agent_type: string
          error: string | null
          duration_ms: number | null
          model_used: string | null
          prompt_version: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          started_at?: string
          completed_at?: string | null
          articles_analyzed?: number
          articles_accepted?: number
          articles_rejected?: number
          agent_type?: string
          error?: string | null
          duration_ms?: number | null
          model_used?: string | null
          prompt_version?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          started_at?: string
          completed_at?: string | null
          articles_analyzed?: number
          articles_accepted?: number
          articles_rejected?: number
          agent_type?: string
          error?: string | null
          duration_ms?: number | null
          model_used?: string | null
          prompt_version?: string | null
          created_at?: string
        }
        Relationships: []
      }
      highlights: {
        Row: {
          id: string
          article_id: string
          user_id: string
          text_content: string
          prefix_context: string | null
          suffix_context: string | null
          css_selector: string | null
          text_offset: number | null
          embedding: number[] | null
          created_at: string
        }
        Insert: {
          id?: string
          article_id: string
          user_id: string
          text_content: string
          prefix_context?: string | null
          suffix_context?: string | null
          css_selector?: string | null
          text_offset?: number | null
          embedding?: string | number[] | null
          created_at?: string
        }
        Update: {
          id?: string
          article_id?: string
          user_id?: string
          text_content?: string
          prefix_context?: string | null
          suffix_context?: string | null
          css_selector?: string | null
          text_offset?: number | null
          embedding?: string | number[] | null
          created_at?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          id: string
          article_id: string
          highlight_id: string | null
          user_id: string
          content: string
          embedding: number[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          article_id: string
          highlight_id?: string | null
          user_id: string
          content: string
          embedding?: string | number[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          article_id?: string
          highlight_id?: string | null
          user_id?: string
          content?: string
          embedding?: string | number[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          user_id: string
          name: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
        }
        Relationships: []
      }
      article_tags: {
        Row: {
          article_id: string
          tag_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          article_id: string
          tag_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          article_id?: string
          tag_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: []
      }
      api_tokens: {
        Row: {
          id: string
          user_id: string
          name: string
          token_hash: string
          last_used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          token_hash: string
          last_used_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          token_hash?: string
          last_used_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      feeds: {
        Row: {
          id: string
          url: string
          title: string | null
          site_name: string | null
          active: boolean
          language: string
          kind: 'rss' | 'agent'
          last_fetched_at: string | null
          etag: string | null
          last_modified: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          url: string
          title?: string | null
          site_name?: string | null
          active?: boolean
          language?: string
          kind?: 'rss' | 'agent'
          last_fetched_at?: string | null
          etag?: string | null
          last_modified?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          url?: string
          title?: string | null
          site_name?: string | null
          active?: boolean
          language?: string
          kind?: 'rss' | 'agent'
          last_fetched_at?: string | null
          etag?: string | null
          last_modified?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          id: string
          feed_id: string
          user_id: string | null
          guid: string | null
          url: string
          title: string | null
          author: string | null
          published_at: string | null
          content_text: string | null
          content_hash: string
          word_count: number | null
          fetched_at: string
          created_at: string
        }
        Insert: {
          id?: string
          feed_id: string
          user_id?: string | null
          guid?: string | null
          url: string
          title?: string | null
          author?: string | null
          published_at?: string | null
          content_text?: string | null
          content_hash: string
          word_count?: number | null
          fetched_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          feed_id?: string
          user_id?: string | null
          guid?: string | null
          url?: string
          title?: string | null
          author?: string | null
          published_at?: string | null
          content_text?: string | null
          content_hash?: string
          word_count?: number | null
          fetched_at?: string
          created_at?: string
        }
        Relationships: []
      }
      item_embeddings: {
        Row: {
          item_id: string
          embedding: string | number[]
          created_at: string
        }
        Insert: {
          item_id: string
          embedding: string | number[]
          created_at?: string
        }
        Update: {
          item_id?: string
          embedding?: string | number[]
          created_at?: string
        }
        Relationships: []
      }
      item_popularity: {
        Row: {
          item_id: string
          similar_count: number
          unpop_score: number
          computed_at: string
        }
        Insert: {
          item_id: string
          similar_count?: number
          unpop_score?: number
          computed_at?: string
        }
        Update: {
          item_id?: string
          similar_count?: number
          unpop_score?: number
          computed_at?: string
        }
        Relationships: []
      }
      user_profile_text: {
        Row: {
          id: string
          user_id: string
          static_profile: string | null
          long_term_profile: string | null
          short_term_profile: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          static_profile?: string | null
          long_term_profile?: string | null
          short_term_profile?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          static_profile?: string | null
          long_term_profile?: string | null
          short_term_profile?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_ranking: {
        Row: {
          id: string
          user_id: string
          date: string
          bucket: 'essential' | 'surprise'
          item_id: string
          rank: number
          justification: string | null
          q1_relevance: number | null
          q2_unexpected: number | null
          q3_discovery: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date?: string
          bucket: 'essential' | 'surprise'
          item_id: string
          rank: number
          justification?: string | null
          q1_relevance?: number | null
          q2_unexpected?: number | null
          q3_discovery?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          bucket?: 'essential' | 'surprise'
          item_id?: string
          rank?: number
          justification?: string | null
          q1_relevance?: number | null
          q2_unexpected?: number | null
          q3_discovery?: number | null
          created_at?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          id: string
          user_id: string
          article_id: string | null
          item_id: string | null
          action: 'skip' | 'saved'
          seconds_on_page: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          article_id?: string | null
          item_id?: string | null
          action: 'skip' | 'saved'
          seconds_on_page?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          article_id?: string | null
          item_id?: string | null
          action?: 'skip' | 'saved'
          seconds_on_page?: number | null
          created_at?: string
        }
        Relationships: []
      }
      ranking_runs: {
        Row: {
          id: string
          user_id: string
          date: string
          model_used: string | null
          fallback: boolean
          candidates_count: number
          essential_count: number
          surprise_count: number
          edition_size: number
          duration_ms: number
          error: string | null
          created_at: string
          keyword_hits_count: number
          keyword_hits_promoted: number
          keyword_hits_force_injected: number
          cosine_p25: number | null
          cosine_p50: number | null
          cosine_p75: number | null
          guard_downgrades_count: number | null
          diversity_cap_rejections: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          model_used?: string | null
          fallback?: boolean
          candidates_count?: number
          essential_count?: number
          surprise_count?: number
          edition_size?: number
          duration_ms?: number
          error?: string | null
          created_at?: string
          keyword_hits_count?: number
          keyword_hits_promoted?: number
          keyword_hits_force_injected?: number
          cosine_p25?: number | null
          cosine_p50?: number | null
          cosine_p75?: number | null
          guard_downgrades_count?: number | null
          diversity_cap_rejections?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          model_used?: string | null
          fallback?: boolean
          candidates_count?: number
          essential_count?: number
          surprise_count?: number
          edition_size?: number
          duration_ms?: number
          error?: string | null
          created_at?: string
          keyword_hits_count?: number
          keyword_hits_promoted?: number
          keyword_hits_force_injected?: number
          cosine_p25?: number | null
          cosine_p50?: number | null
          cosine_p75?: number | null
          guard_downgrades_count?: number | null
          diversity_cap_rejections?: Json | null
        }
        Relationships: []
      }
      api_budget_log: {
        Row: {
          date: string
          provider: string
          calls_used: number
          calls_limit: number
          created_at: string
        }
        Insert: {
          date: string
          provider: string
          calls_used?: number
          calls_limit: number
          created_at?: string
        }
        Update: {
          date?: string
          provider?: string
          calls_used?: number
          calls_limit?: number
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      prefilter_ranking_candidates: {
        Args: {
          user_embedding: string | number[]
          target_user_id: string
          cutoff_time: string
          max_count?: number
          keyword_cap?: number
          preferred_language?: string | null
          min_word_count?: number
          pinned_feed_ids?: string[]
        }
        Returns: Array<{
          item_id: string
          url: string
          title: string | null
          author: string | null
          site_name: string | null
          published_at: string | null
          content_text: string | null
          word_count: number | null
          distance: number
          unpop_score: number
          is_keyword_hit: boolean
          matched_keywords: string[]
          keyword_rank: number
          source_kind: 'rss' | 'agent'
        }>
      }
      count_relevant_rss: {
        Args: {
          target_user_id: string
          user_embedding: string | number[]
          distance_max?: number
          lookback_days?: number
        }
        Returns: number
      }
      list_keyword_hits: {
        Args: {
          target_user_id: string
          cutoff_time: string
        }
        Returns: Array<{
          keyword: string
          item_id: string
          url: string
          title: string | null
          site_name: string | null
          published_at: string | null
          word_count: number | null
        }>
      }
      count_similar_items: {
        Args: {
          target_item_id: string
          target_embedding: string | number[]
          distance_threshold?: number
        }
        Returns: number
      }
      increment_api_budget: {
        Args: {
          p_date: string
          p_provider: string
          p_increment: number
          p_limit: number
        }
        Returns: number
      }
      increment_api_budget_user: {
        Args: {
          p_date: string
          p_provider: string
          p_increment: number
          p_limit: number
          p_user_id: string
        }
        Returns: number
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
