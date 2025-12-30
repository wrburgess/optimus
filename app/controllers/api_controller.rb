class ApiController < ApplicationController
  skip_forgery_protection
  before_action :authorize_request

  private

  def authorize_request
    header = request.headers["Authorization"]
    header = header.split(" ").last if header
    decoded = JsonWebTokenService.decode(header)
    @current_application = ExternalApplication.find(decoded[:application_id])
  rescue ActiveRecord::RecordNotFound => e
    render json: { errors: e.message }, status: :unauthorized
  rescue JWT::DecodeError => e
    render json: { errors: e.message }, status: :unauthorized
  end

  # Tell Pundit to use @current_application instead of current_user
  def pundit_user
    @current_application
  end
end
