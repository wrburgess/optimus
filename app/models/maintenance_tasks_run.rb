class MaintenanceTasksRun < ApplicationRecord
  def name
    "Maintenance Tasks Run for #{task_name}"
  end
end
