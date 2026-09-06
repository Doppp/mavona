class CreateOrders < ActiveRecord::Migration[8.1]
  def change
    create_table :customers do |table|
      table.string :name, null: false
    end
    create_table :orders do |table|
      table.references :customer, null: false, foreign_key: true
      table.date :scheduled_on, null: false
    end
  end
end
