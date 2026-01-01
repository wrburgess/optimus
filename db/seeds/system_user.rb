# Seeds a pre-confirmed admin user if not already present.
user_email = 'wrburgess@gmail.com'
password = SecureRandom.base58(16)

user = User.find_or_initialize_by(email: user_email)

if user.new_record?
  user.password = password
  user.password_confirmation = password if user.respond_to?(:password_confirmation=)
  user.skip_confirmation! if user.respond_to?(:skip_confirmation!)
  user.confirmed_at ||= Time.current if user.respond_to?(:confirmed_at=)
  user.save!
  puts "Created user #{user_email} with password: #{password}"
else
  # Ensure the user stays confirmed
  if user.respond_to?(:confirmed_at) && user.confirmed_at.nil?
    user.update!(confirmed_at: Time.current)
    puts "Updated user #{user_email} to be confirmed"
  else
    puts "User #{user_email} already exists"
  end
end
