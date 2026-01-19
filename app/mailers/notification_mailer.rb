class NotificationMailer < ApplicationMailer
  def single_notification(user:, subject:, body:)
    @user = user
    @subject = subject
    @body = body

    mail(
      to: @user.email,
      subject: @subject
    )
  end

  def summarized_notification(user:, messages:)
    @user = user
    @messages = messages
    @subject = "You have #{messages.count} new notification#{'s' if messages.count > 1}"

    mail(
      to: @user.email,
      subject: @subject
    )
  end
end
