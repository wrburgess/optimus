# Seeds system permissions for each admin controller action, and assigns them to a System Management role and group.
Rails.application.eager_load!

user_email = 'wrburgess@gmail.com'
user = User.find_by(email: user_email)

role = SystemRole.find_or_create_by!(name: 'System Management')
group = SystemGroup.find_or_create_by!(name: 'System Managers')

group.system_roles << role unless group.system_roles.include?(role)

group.users << user if user && !group.users.include?(user)

admin_controllers = ApplicationController.descendants.select { |controller| controller.name&.start_with?('Admin::') }

admin_controllers.each do |controller|
  resource_name = controller.name.demodulize.sub('Controller', '').singularize
  actions = controller.action_methods

  actions.each do |operation|
    permission = SystemPermission.find_or_create_by!(resource: resource_name, operation: operation) do |perm|
      perm.name = "#{resource_name} #{operation.to_s.titleize}"
    end

    role.system_permissions << permission unless role.system_permissions.include?(permission)
  end
end
