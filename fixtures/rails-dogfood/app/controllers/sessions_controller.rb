# Fixture-only identity selector: the application refuses all non-test environments.
class SessionsController < ApplicationController
  def new
    @customers = Customer.order(:name)
  end

  def create
    customer = Customer.find(params.require(:customer_id))
    reset_session
    session[:customer_id] = customer.id
    redirect_to orders_path, status: :see_other
  end

  def destroy
    reset_session
    redirect_to new_session_path, status: :see_other
  end
end
