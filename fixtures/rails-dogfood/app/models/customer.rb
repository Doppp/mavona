class Customer < ApplicationRecord
  has_many :orders, dependent: :restrict_with_exception
end
