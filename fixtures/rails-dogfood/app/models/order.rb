class Order < ApplicationRecord
  belongs_to :customer
  validates :scheduled_on, presence: true
  validate :scheduled_in_future

  private

  def scheduled_in_future
    errors.add(:scheduled_on, "must be a future date") unless scheduled_on && scheduled_on > Date.current
  end
end
