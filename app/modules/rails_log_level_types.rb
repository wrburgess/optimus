module RailsLogLevelTypes
  # The available log levels are: :debug, :info, :warn, :error, :fatal, and :unknown,
  # corresponding to the log level numbers from 0 up to 5 respectively.
  # To change the default log level, use
  # config.log_level = :warn # In any environment initializer, or
  # Rails.logger.level = 0 # at any time
  DEBUG = :debug
  INFO = :info
  WARN = :warn
  ERROR = :error
  FATAL = :fatal
  UNKNOWN = :unknown

  def self.all
    [ self::DEBUG, self::INFO, self::WARN, self::ERROR, self::FATAL, self::UNKNOWN ]
  end
end
