class UserSetting < ApplicationRecord
  validates :session_token, presence: true, uniqueness: true
end
