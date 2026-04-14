-- Seed 10 curated RSS feeds for scoring v2 pipeline
INSERT INTO feeds (url, title, site_name) VALUES
  ('https://www.latent.space/feed', 'Latent Space', 'latent.space'),
  ('https://www.interconnects.ai/feed', 'Interconnects', 'interconnects.ai'),
  ('https://simonwillison.net/atom/everything/', 'Simon Willison''s Weblog', 'simonwillison.net'),
  ('https://www.anthropic.com/rss.xml', 'Anthropic Research', 'anthropic.com'),
  ('https://every.to/feed', 'Every', 'every.to'),
  ('https://www.lennysnewsletter.com/feed', 'Lenny''s Newsletter', 'lennysnewsletter.com'),
  ('https://www.bensbites.com/feed', 'Ben''s Bites', 'bensbites.com'),
  ('https://newsletter.pragmaticengineer.com/feed', 'Pragmatic Engineer', 'pragmaticengineer.com'),
  ('https://www.deeplearning.ai/the-batch/feed', 'The Batch', 'deeplearning.ai'),
  ('https://eugeneyan.com/rss/', 'Eugene Yan', 'eugeneyan.com')
ON CONFLICT (url) DO NOTHING;
