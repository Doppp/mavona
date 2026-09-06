class OrdersController < ApplicationController
  before_action :require_customer
  before_action :set_order, only: [:show, :reschedule]

  def index
    @orders = current_customer.orders.order(:id)
  end

  def show; end

  def reschedule
    if @order.update(params.require(:order).permit(:scheduled_on))
      redirect_to order_path(@order), status: :see_other, notice: "Rescheduled for #{@order.scheduled_on.iso8601}"
    else
      render :show, status: :unprocessable_content
    end
  end

  private

  def set_order
    @order = current_customer.orders.find(params[:id])
  end
end
