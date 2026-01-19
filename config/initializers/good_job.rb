Rails.application.configure do
  config.good_job.cron = {
    process_summarized_notifications: {
      cron: "0 * * * *", # Every hour at minute 0
      class: "ProcessSummarizedNotificationsJob",
      description: "Process pending summarized notifications"
    }
  }
end
