# Seed 16 preset themes (15 original + NERV)
# Idempotent: uses find_or_create_by on slug

RHYME_COLORS = [
  "#00859e", "#3072c1", "#7f5bb6", "#a84b84",
  "#b54c3d", "#a06200", "#687c00", "#008a5d"
].freeze

PRESET_THEMES = [
  {
    slug: "classic", name: "Classic", position: 0,
    text_color: "#333333", background_color: "#FDFBF7",
    accent_color: "#F15060", cursor_color: "#F15060",
    strikethrough_color: "#F15060", selection_color: "rgba(241,80,96,0.2)",
    highlight_colors: {
      noun: "#0078BF", pronoun: "#9B59B6", verb: "#F15060", adjective: "#00A95C",
      adverb: "#E67E22", preposition: "#1ABC9C", conjunction: "#FF6C2F",
      article: "#5F6C6D", interjection: "#E91E63", url: "#2980B9",
      number: "#8E6F3E", hashtag: "#2980B9"
    }
  },
  {
    slug: "blueprint", name: "Blueprint", position: 1,
    text_color: "#FDFBF7", background_color: "#0078BF",
    accent_color: "#FFE800", cursor_color: "#FFE800",
    strikethrough_color: "#FFFFFF", selection_color: "rgba(255,232,0,0.3)",
    highlight_colors: {
      noun: "#FFE800", pronoun: "#E91E63", verb: "#FFFFFF", adjective: "#F15060",
      adverb: "#00A95C", preposition: "#9B59B6", conjunction: "#00A95C",
      article: "#D5E0E6", interjection: "#FF6C2F", url: "#B8E6FF",
      number: "#FFD700", hashtag: "#B8E6FF"
    }
  },
  {
    slug: "midnight", name: "Midnight", position: 2,
    text_color: "#e8e8e8", background_color: "#1a1a2e",
    accent_color: "#00d9ff", cursor_color: "#00d9ff",
    strikethrough_color: "#ff79c6", selection_color: "rgba(0,217,255,0.2)",
    highlight_colors: {
      noun: "#00d9ff", pronoun: "#bd93f9", verb: "#ff79c6", adjective: "#50fa7b",
      adverb: "#ffb86c", preposition: "#8be9fd", conjunction: "#ffb86c",
      article: "#8A93B4", interjection: "#ff5555", url: "#69C4FF",
      number: "#F1FA8C", hashtag: "#69C4FF"
    }
  },
  {
    slug: "sepia", name: "Sepia", position: 3,
    text_color: "#5c4b37", background_color: "#f4ecd8",
    accent_color: "#8b6914", cursor_color: "#8b6914",
    strikethrough_color: "#a65d3f", selection_color: "rgba(139,105,20,0.2)",
    highlight_colors: {
      noun: "#8b6914", pronoun: "#8e44ad", verb: "#a65d3f", adjective: "#6b8e23",
      adverb: "#d35400", preposition: "#16a085", conjunction: "#996633",
      article: "#6B7580", interjection: "#c0392b", url: "#2471A3",
      number: "#7D6608", hashtag: "#2471A3"
    }
  },
  {
    slug: "paper", name: "Paper", position: 4,
    text_color: "#1A1A1A", background_color: "#FFFFFF",
    accent_color: "#2563EB", cursor_color: "#2563EB",
    strikethrough_color: "#DC2626", selection_color: "rgba(37,99,235,0.2)",
    highlight_colors: {
      noun: "#2563EB", pronoun: "#7C3AED", verb: "#DC2626", adjective: "#059669",
      adverb: "#D97706", preposition: "#0891B2", conjunction: "#EA580C",
      article: "#6B7280", interjection: "#DB2777", url: "#1D4ED8",
      number: "#92400E", hashtag: "#1D4ED8"
    }
  },
  {
    slug: "terminal", name: "Terminal", position: 5,
    text_color: "#00FF00", background_color: "#0C0C0C",
    accent_color: "#00FF00", cursor_color: "#00FF00",
    strikethrough_color: "#FF6600", selection_color: "rgba(0,255,0,0.2)",
    highlight_colors: {
      noun: "#00FF00", pronoun: "#00FFFF", verb: "#FF6600", adjective: "#FFFF00",
      adverb: "#FF00FF", preposition: "#00CCFF", conjunction: "#66FF66",
      article: "#669966", interjection: "#FF3333", url: "#3399FF",
      number: "#CCCC00", hashtag: "#3399FF"
    }
  },
  {
    slug: "warmth", name: "Warmth", position: 6,
    text_color: "#4A3728", background_color: "#FFF8F0",
    accent_color: "#D97706", cursor_color: "#D97706",
    strikethrough_color: "#DC2626", selection_color: "rgba(217,119,6,0.2)",
    highlight_colors: {
      noun: "#B45309", pronoun: "#9333EA", verb: "#DC2626", adjective: "#15803D",
      adverb: "#D97706", preposition: "#0D9488", conjunction: "#EA580C",
      article: "#78716C", interjection: "#BE185D", url: "#1E40AF",
      number: "#854D0E", hashtag: "#1E40AF"
    }
  },
  {
    slug: "ocean", name: "Ocean", position: 7,
    text_color: "#E2E8F0", background_color: "#0F172A",
    accent_color: "#38BDF8", cursor_color: "#38BDF8",
    strikethrough_color: "#F472B6", selection_color: "rgba(56,189,248,0.2)",
    highlight_colors: {
      noun: "#38BDF8", pronoun: "#C084FC", verb: "#F472B6", adjective: "#4ADE80",
      adverb: "#FBBF24", preposition: "#22D3EE", conjunction: "#2DD4BF",
      article: "#94A3B8", interjection: "#FB7185", url: "#60A5FA",
      number: "#FCD34D", hashtag: "#60A5FA"
    }
  },
  {
    slug: "forest", name: "Forest", position: 8,
    text_color: "#D4E5D4", background_color: "#1A2F1A",
    accent_color: "#4ADE80", cursor_color: "#4ADE80",
    strikethrough_color: "#FCA5A5", selection_color: "rgba(74,222,128,0.2)",
    highlight_colors: {
      noun: "#4ADE80", pronoun: "#C4B5FD", verb: "#FCA5A5", adjective: "#FDE047",
      adverb: "#FDBA74", preposition: "#67E8F9", conjunction: "#86EFAC",
      article: "#9CA38A", interjection: "#F9A8D4", url: "#93C5FD",
      number: "#FDE68A", hashtag: "#93C5FD"
    }
  },
  {
    slug: "flexoki-light", name: "Flexoki Light", position: 9,
    text_color: "#100F0F", background_color: "#FFFCF0",
    accent_color: "#205EA6", cursor_color: "#100F0F",
    strikethrough_color: "#AF3029", selection_color: "rgba(32,94,166,0.2)",
    highlight_colors: {
      noun: "#205EA6", pronoun: "#5E409D", verb: "#AF3029", adjective: "#66800B",
      adverb: "#BC5215", preposition: "#24837B", conjunction: "#AD8301",
      article: "#6F6E69", interjection: "#A02F6F", url: "#2C5494",
      number: "#8B7200", hashtag: "#2C5494"
    }
  },
  {
    slug: "flexoki-dark", name: "Flexoki Dark", position: 10,
    text_color: "#FFFCF0", background_color: "#100F0F",
    accent_color: "#4385BE", cursor_color: "#FFFCF0",
    strikethrough_color: "#D14D41", selection_color: "rgba(67,133,190,0.3)",
    highlight_colors: {
      noun: "#4385BE", pronoun: "#8B7EC8", verb: "#D14D41", adjective: "#879A39",
      adverb: "#DA702C", preposition: "#3AA99F", conjunction: "#D0A215",
      article: "#878580", interjection: "#CE5D97", url: "#5B9BD5",
      number: "#E0B429", hashtag: "#5B9BD5"
    }
  },
  {
    slug: "apple-music", name: "Apple Music", position: 11,
    text_color: "#1D1D1F", background_color: "#FFFFFF",
    accent_color: "#FC3C44", cursor_color: "#FC3C44",
    strikethrough_color: "#86868B", selection_color: "rgba(252,60,68,0.15)",
    highlight_colors: {
      noun: "#007AFF", pronoun: "#5856D6", verb: "#FF3B30", adjective: "#34C759",
      adverb: "#FF9500", preposition: "#5AC8FA", conjunction: "#AF52DE",
      article: "#8E8E93", interjection: "#FF2D55", url: "#007AFF",
      number: "#A2845E", hashtag: "#30B0C7"
    }
  },
  {
    slug: "spotify", name: "Spotify", position: 12,
    text_color: "#FFFFFF", background_color: "#121212",
    accent_color: "#1DB954", cursor_color: "#1DB954",
    strikethrough_color: "#535353", selection_color: "rgba(29,185,84,0.25)",
    highlight_colors: {
      noun: "#1DB954", pronoun: "#B49BC8", verb: "#F573A0", adjective: "#1ED760",
      adverb: "#FFA42B", preposition: "#509BF5", conjunction: "#E8115B",
      article: "#B3B3B3", interjection: "#F59B23", url: "#1DB954",
      number: "#CBA6F7", hashtag: "#509BF5"
    }
  },
  {
    slug: "soundcloud", name: "SoundCloud", position: 13,
    text_color: "#333333", background_color: "#FFFFFF",
    accent_color: "#FF5500", cursor_color: "#FF5500",
    strikethrough_color: "#999999", selection_color: "rgba(255,85,0,0.12)",
    highlight_colors: {
      noun: "#FF5500", pronoun: "#8C6BB1", verb: "#E2442F", adjective: "#F77F00",
      adverb: "#FCBF49", preposition: "#FF7700", conjunction: "#D62828",
      article: "#999999", interjection: "#E36414", url: "#FF5500",
      number: "#9B6A2F", hashtag: "#FF7700"
    }
  },
  {
    slug: "deezer", name: "Deezer", position: 14,
    text_color: "#F5F5F5", background_color: "#121216",
    accent_color: "#A238FF", cursor_color: "#A238FF",
    strikethrough_color: "#555555", selection_color: "rgba(162,56,255,0.25)",
    highlight_colors: {
      noun: "#A238FF", pronoun: "#E04FD0", verb: "#FF4F7B", adjective: "#00E5FF",
      adverb: "#FFB300", preposition: "#7C4DFF", conjunction: "#536DFE",
      article: "#888888", interjection: "#FF6E40", url: "#A238FF",
      number: "#FFAB40", hashtag: "#7C4DFF"
    }
  },
  # NERV theme — Evangelion tech-art aesthetic
  {
    slug: "nerv", name: "NERV", position: 15,
    text_color: "#E8E6E3", background_color: "#0A0A12",
    accent_color: "#FF0040", cursor_color: "#FF0040",
    strikethrough_color: "#FF0040", selection_color: "rgba(255,0,64,0.3)",
    highlight_colors: {
      noun: "#00D4FF", pronoun: "#8B5CF6", verb: "#FF0040", adjective: "#00FF41",
      adverb: "#FF6600", preposition: "#FFCC00", conjunction: "#00D4FF",
      article: "rgba(232,230,227,0.4)", interjection: "#FF0040", url: "#00D4FF",
      number: "#FFCC00", hashtag: "#8B5CF6"
    }
  }
].freeze

PRESET_THEMES.each do |attrs|
  Theme.find_or_create_by!(slug: attrs[:slug]) do |t|
    t.name = attrs[:name]
    t.theme_type = "preset"
    t.position = attrs[:position]
    t.text_color = attrs[:text_color]
    t.background_color = attrs[:background_color]
    t.highlight_colors = attrs[:highlight_colors]
    t.accent_color = attrs[:accent_color]
    t.cursor_color = attrs[:cursor_color]
    t.strikethrough_color = attrs[:strikethrough_color]
    t.selection_color = attrs[:selection_color]
    t.rhyme_colors = RHYME_COLORS
  end
end

puts "Seeded #{Theme.presets.count} preset themes"
