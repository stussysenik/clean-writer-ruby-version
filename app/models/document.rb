class Document < ApplicationRecord
  DEFAULT_HIGHLIGHT_CONFIG = {
    nouns: true,
    pronouns: true,
    verbs: true,
    adjectives: true,
    adverbs: true,
    prepositions: true,
    conjunctions: true,
    articles: true,
    interjections: true,
    urls: true,
    numbers: true,
    hashtags: true
  }.freeze

  validates :session_token, presence: true
  validates :view_mode, inclusion: { in: %w[write preview] }
  validates :max_width, numericality: { greater_than: 0 }
  validates :font_size_offset, numericality: { only_integer: true }
end
