require "test_helper"
class OrderTest < ActiveSupport::TestCase
  test "future date persists on the same customer order" do
    order = orders(:alice_order)
    assert order.update(scheduled_on: Date.current + 3)
    assert_equal Date.current + 3, order.reload.scheduled_on
    assert_equal customers(:alice).id, order.customer_id
  end
  test "past, today, blank and invalid calendar dates are rejected" do
    [Date.current - 1, Date.current, nil, "not-a-date", "2026-02-30"].each do |date|
      order = orders(:alice_order)
      original = order.scheduled_on
      assert_not order.update(scheduled_on: date), date.inspect
      assert_equal original, order.reload.scheduled_on
    end
  end
end
