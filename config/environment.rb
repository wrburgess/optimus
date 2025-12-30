# Load the Rails application.
require_relative "application"

# Initialize the Rails application.
Rails.application.initialize!

# Inherit default_url_options from ActionMailer default_url_options
# https://blog.konnor.site/rails/how-do-default-url-options-work/
Rails.application.default_url_options = Rails.application.config.action_mailer.default_url_options
