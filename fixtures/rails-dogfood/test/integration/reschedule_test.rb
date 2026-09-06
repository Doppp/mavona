require "test_helper"
class RescheduleTest < ActionDispatch::IntegrationTest
  setup { post session_path, params: { customer_id: customers(:alice).id } }
  test "customer sees Turbo frame and Stimulus date feedback markup" do
    get order_path(orders(:alice_order))
    assert_response :success
    assert_select "turbo-frame#order_#{orders(:alice_order).id}"
    assert_select 'form[data-controller="reschedule"]'
    assert_select 'input[type="date"][data-action="change->reschedule#preview"]'
    assert_select 'script[type="importmap"]'
  end
  test "authorized rescheduling redirects and persists intended record only" do
    other_date = orders(:bob_order).scheduled_on
    patch reschedule_order_path(orders(:alice_order)), params: { order: { scheduled_on: (Date.current + 4).iso8601 } }
    assert_response :see_other
    assert_equal Date.current + 4, orders(:alice_order).reload.scheduled_on
    assert_equal other_date, orders(:bob_order).reload.scheduled_on
    follow_redirect!
    assert_select '[role="status"]', text: /Rescheduled/
  end
  test "invalid reschedule returns frame error without changing persistence" do
    original = orders(:alice_order).scheduled_on
    patch reschedule_order_path(orders(:alice_order)), params: { order: { scheduled_on: "2000-01-01" } }, headers: { "Turbo-Frame" => "order_#{orders(:alice_order).id}" }
    assert_response :unprocessable_content
    assert_select '[role="alert"]', text: /future date/
    assert_select "turbo-frame#order_#{orders(:alice_order).id}"
    assert_equal original, orders(:alice_order).reload.scheduled_on
  end
  test "another customer's order is neither visible nor mutable" do
    original = orders(:bob_order).scheduled_on
    get order_path(orders(:bob_order))
    assert_response :not_found
    patch reschedule_order_path(orders(:bob_order)), params: { order: { scheduled_on: (Date.current + 4).iso8601, customer_id: customers(:alice).id } }
    assert_response :not_found
    assert_equal original, orders(:bob_order).reload.scheduled_on
    assert_equal customers(:bob).id, orders(:bob_order).customer_id
  end
  test "unauthenticated rescheduling is rejected" do
    delete session_path
    patch reschedule_order_path(orders(:alice_order)), params: { order: { scheduled_on: (Date.current + 4).iso8601 } }
    assert_redirected_to new_session_path
  end
end
