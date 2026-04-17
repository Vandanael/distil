-- Seed diversifie : ajoute des feeds RSS dans les categories sous-representees
-- par 00012_seed_feeds.sql (tech/IA uniquement). Source de verite : URLs dans
-- SOURCES_BY_CATEGORY de src/lib/agents/discovery-agent.ts.
-- Additif, idempotent : ON CONFLICT (url) DO NOTHING preserve les feeds existants.
INSERT INTO feeds (url, title, site_name) VALUES
  -- Politique & monde
  ('https://www.lemonde.fr/rss/une.xml', 'Le Monde - A la une', 'lemonde.fr'),
  ('https://www.theguardian.com/world/rss', 'The Guardian - World', 'theguardian.com'),
  ('https://feeds.bbci.co.uk/news/world/rss.xml', 'BBC News - World', 'bbc.com'),
  ('https://foreignpolicy.com/feed/', 'Foreign Policy', 'foreignpolicy.com'),
  -- Economie
  ('https://www.lesechos.fr/rss/rss_une.xml', 'Les Echos - A la une', 'lesechos.fr'),
  ('https://www.ft.com/rss/home', 'Financial Times', 'ft.com'),
  -- Science
  ('https://www.quantamagazine.org/feed/', 'Quanta Magazine', 'quantamagazine.org'),
  ('https://www.nature.com/news.rss', 'Nature News', 'nature.com'),
  ('https://news.mit.edu/rss/research', 'MIT News - Research', 'mit.edu'),
  -- Cuisine & gastronomie
  ('https://www.seriouseats.com/feeds/all', 'Serious Eats', 'seriouseats.com'),
  ('https://www.eater.com/rss/index.xml', 'Eater', 'eater.com'),
  ('https://smittenkitchen.com/feed/', 'Smitten Kitchen', 'smittenkitchen.com'),
  -- Sport & bien-etre
  ('https://www.lequipe.fr/rss/actu_rss.xml', 'L''Equipe', 'lequipe.fr'),
  ('https://www.runnersworld.com/feed/all', 'Runner''s World', 'runnersworld.com'),
  ('https://www.outsideonline.com/feed/', 'Outside Online', 'outsideonline.com'),
  -- Culture & societe
  ('https://www.newyorker.com/feed/everything', 'The New Yorker', 'newyorker.com'),
  ('https://www.telerama.fr/rss.xml', 'Telerama', 'telerama.fr'),
  ('https://theconversation.com/fr/articles.atom', 'The Conversation FR', 'theconversation.com'),
  ('https://usbeketrica.com/feed', 'Usbek & Rica', 'usbeketrica.com'),
  -- Essais & longreads
  ('https://aeon.co/feed.rss', 'Aeon', 'aeon.co'),
  ('https://nautil.us/feed/', 'Nautilus', 'nautil.us'),
  ('https://longreads.com/feed/', 'Longreads', 'longreads.com'),
  ('https://themarkup.org/feeds/rss.xml', 'The Markup', 'themarkup.org'),
  ('https://feeds.propublica.org/propublica/main', 'ProPublica', 'propublica.org'),
  -- Design
  ('https://www.dezeen.com/feed/', 'Dezeen', 'dezeen.com'),
  ('https://www.designboom.com/feed/', 'Designboom', 'designboom.com')
ON CONFLICT (url) DO NOTHING;
