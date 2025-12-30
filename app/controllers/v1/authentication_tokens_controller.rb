class Api::V1::AuthenticationTokensController < ApiController
  skip_before_action :authorize_request, only: [:create]

  def create
    external_application = ExternalApplication.find_by(api_key: params[:api_key])

    if external_application&.authenticate(params[:secret_key])
      expiration_date = 24.hours.from_now

      token = JsonWebTokenService.encode(
        application_id: external_application.id,
        expiration_date:
      )

      render json: {
        token: token,
        exp: expiration_date.iso8601,
        application_name: external_application.name
      }, status: :ok
    else
      render json: { error: 'unauthorized' }, status: :unauthorized
    end
  end
end
