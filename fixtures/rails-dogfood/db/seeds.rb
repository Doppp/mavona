# Only explicit canonical fixture records are inserted/updated; no table reset.
alice = Customer.find_or_create_by!(name: "Alice")
bob = Customer.find_or_create_by!(name: "Bob")
[alice, bob].each { |customer| customer.orders.create!(scheduled_on: Date.current + 7) unless customer.orders.exists? }
