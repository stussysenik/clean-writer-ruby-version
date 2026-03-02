class Theme < ApplicationRecord
  has_many :theme_overrides, dependent: :destroy

  validates :slug, presence: true
  validates :name, presence: true
  validates :theme_type, inclusion: { in: %w[preset custom] }
  validates :text_color, presence: true
  validates :background_color, presence: true

  scope :presets, -> { where(theme_type: "preset").order(:position) }
  scope :for_session, ->(token) { where(session_token: token, theme_type: "custom").order(:position) }
end
