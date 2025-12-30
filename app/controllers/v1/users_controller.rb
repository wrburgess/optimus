class Api::V1::UsersController < ApiController
  before_action :authorize_request

  def index
    scoped_users = policy_scope(User)
    @q = scoped_users.ransack(params[:q])
    @q.sorts = [ "name asc", "created_at desc" ] if @q.sorts.empty?
    @instances = @q.result
    render json: @instances
  end

  def create
    authorize User

    user = User.new(user_params)

    # Generate secure random password if not provided
    if user_params[:password].blank?
      generated_password = SecureRandom.urlsafe_base64(16)
      user.password = generated_password
      user.password_confirmation = generated_password
    end

    if user.save
      # Associate user with the external application's organization
      OrganizationUser.create!(
        user: user,
        organization: @current_application.organization
      )

      render json: user, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def user_params
    params.require(:user).permit(
      :email,
      :first_name,
      :last_name,
      :password,
      :password_confirmation
    )
  end
end
