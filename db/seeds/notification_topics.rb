# Seeds notification topics and their email templates.
topics = [
  {
    key: "user.password_changed",
    name: "User Password Changed",
    description: "Notification sent when a user's password is changed",
    template: {
      subject_template: "Password Changed for <%= user.full_name %>",
      body_template: "Hello,\n\nThe password for <%= user.full_name %> (<%= user.email %>) was changed<% if changed_by %> by <%= changed_by.full_name %><% end %>.\n\nIf you did not make this change, please contact your administrator immediately."
    }
  },
  {
    key: "user.created",
    name: "User Created",
    description: "Notification sent when a new user account is created",
    template: {
      subject_template: "New User Created: <%= user.full_name %>",
      body_template: "Hello,\n\nA new user account has been created:\n\nName: <%= user.full_name %>\nEmail: <%= user.email %><% if created_by %>\nCreated by: <%= created_by.full_name %><% end %>"
    }
  },
  {
    key: "user.archived",
    name: "User Archived",
    description: "Notification sent when a user account is archived",
    template: {
      subject_template: "User Archived: <%= user.full_name %>",
      body_template: "Hello,\n\nThe following user account has been archived:\n\nName: <%= user.full_name %>\nEmail: <%= user.email %><% if archived_by %>\nArchived by: <%= archived_by.full_name %><% end %>"
    }
  }
]

topics.each do |topic_data|
  topic = NotificationTopic.find_or_create_by!(key: topic_data[:key]) do |t|
    t.name = topic_data[:name]
    t.description = topic_data[:description]
  end

  if topic_data[:template]
    NotificationTemplate.find_or_create_by!(
      notification_topic: topic,
      distribution_method: "email"
    ) do |template|
      template.subject_template = topic_data[:template][:subject_template]
      template.body_template = topic_data[:template][:body_template]
      template.active = true
    end
  end
end

puts "Created #{NotificationTopic.count} notification topics"
puts "Created #{NotificationTemplate.count} notification templates"
