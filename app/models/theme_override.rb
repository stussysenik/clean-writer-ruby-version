class ThemeOverride < ApplicationRecord
  belongs_to :theme

  validates :session_token, presence: true
  validates :theme_id, uniqueness: { scope: :session_token }
end
