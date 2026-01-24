require "rails_helper"
require "concerns/archivable_shared"
require "concerns/loggable_shared"

RSpec.describe User, type: :model do
  it_behaves_like "archivable"
  it_behaves_like "loggable"

  describe "associations" do
    it { is_expected.to have_many(:data_logs).dependent(:destroy) }
    it { is_expected.to have_many(:system_group_users).dependent(:destroy) }
    it { is_expected.to have_many(:system_groups).through(:system_group_users) }
    it { is_expected.to have_many(:system_roles).through(:system_groups) }
    it { is_expected.to have_many(:system_permissions).through(:system_roles) }
  end

  describe "validations" do
    subject(:user) { build(:user) }

    it { is_expected.to validate_presence_of(:email) }

    it "validates uniqueness of email" do
      create(:user, email: "person@example.com")
      duplicate = build(:user, email: "person@example.com")

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:email]).to include("has already been taken")
    end
  end

  describe ".ransackable_attributes" do
    it "includes first_name and last_name" do
      expect(described_class.ransackable_attributes).to include("first_name", "last_name")
    end
  end

  describe ".select_order" do
    it "orders users by last name then first name" do
      second = create(:user, first_name: "Zara", last_name: "Alpha")
      first = create(:user, first_name: "Anna", last_name: "Able")

      expect(described_class.select_order.pluck(:id)).to eq([ first.id, second.id ])
    end
  end

  describe ".options_for_select" do
    it "returns last name, first name pairs" do
      user = create(:user, first_name: "john", last_name: "doe")

      expect(described_class.options_for_select).to include([ "Doe, John", user.id ])
    end
  end

  describe "#admin?" do
    it "returns false" do
      expect(build(:user).admin?).to be(false)
    end
  end

  describe "#system_manager?" do
    it "returns true when user belongs to System Managers group" do
      user = create(:user)
      system_managers = SystemGroup.create!(name: "System Managers")
      SystemGroupUser.create!(system_group: system_managers, user: user)

      expect(user.reload.system_manager?).to be(true)
    end

    it "returns false when user does not belong to System Managers group" do
      user = create(:user)
      other_group = SystemGroup.create!(name: "Regular Users")
      SystemGroupUser.create!(system_group: other_group, user: user)

      expect(user.reload.system_manager?).to be(false)
    end

    it "returns false when user has no groups" do
      user = create(:user)

      expect(user.system_manager?).to be(false)
    end
  end

  describe "#access_authorized?" do
    let(:user) { create(:user) }
    let(:system_group) { SystemGroup.create!(name: "Operations") }
    let(:system_role) { SystemRole.create!(name: "Manager") }
    let(:system_permission) do
      SystemPermission.create!(
        name: "View Reports",
        resource: "reports",
        operation: "view"
      )
    end

    before do
      SystemGroupUser.create!(system_group:, user:)
      SystemGroupSystemRole.create!(system_group:, system_role:)
      SystemRoleSystemPermission.create!(system_role:, system_permission:)
      user.reload
    end

    it "returns true when the user has the requested permission" do
      expect(user.access_authorized?(resource: "reports", operation: "view")).to be(true)
    end

    it "returns false when the user lacks the requested permission" do
      expect(user.access_authorized?(resource: "reports", operation: "edit")).to be(false)
    end

    it "handles symbol arguments by converting to strings" do
      expect(user.access_authorized?(resource: :reports, operation: :view)).to be(true)
    end

    it "memoizes permissions and only queries the database once" do
      # Clear any cached data
      user.reload

      # Count queries during multiple access_authorized? calls
      query_count = 0
      counter = ->(*) { query_count += 1 }

      ActiveSupport::Notifications.subscribed(counter, "sql.active_record") do
        # Multiple permission checks should only trigger one query
        user.access_authorized?(resource: "reports", operation: "view")
        user.access_authorized?(resource: "reports", operation: "edit")
        user.access_authorized?(resource: "other", operation: "view")
      end

      # Should only have 1 query (the initial permissions load)
      expect(query_count).to eq(1)
    end
  end

  describe "#has_system_permission?" do
    it "returns false when no permissions exist" do
      expect(create(:user).has_system_permission?).to be(false)
    end

    it "returns true when permissions exist" do
      user = create(:user)
      permission = SystemPermission.create!(
        name: "Manage Users",
        resource: "users",
        operation: "manage"
      )
      group = SystemGroup.create!(name: "Admin")
      role = SystemRole.create!(name: "Administrator")
      SystemGroupUser.create!(system_group: group, user: user)
      SystemGroupSystemRole.create!(system_group: group, system_role: role)
      SystemRoleSystemPermission.create!(system_role: role, system_permission: permission)

      expect(user.reload.has_system_permission?).to be(true)
    end
  end

  describe "#name" do
    it "returns the full_name" do
      user = build(:user, first_name: "jane", last_name: "doe")

      expect(user.name).to eq("Jane Doe")
    end
  end

  describe "#full_name" do
    it "titleizes and joins first and last name" do
      user = build(:user, first_name: "jane", last_name: "doe")

      expect(user.full_name).to eq("Jane Doe")
    end

    it "returns an empty string when no names are present" do
      user = build(:user, first_name: nil, last_name: nil)

      expect(user.full_name).to eq("")
    end
  end

  describe "#last_name_first_name" do
    it "returns 'Last, First' when both names exist" do
      user = build(:user, first_name: "jane", last_name: "doe")

      expect(user.last_name_first_name).to eq("Doe, Jane")
    end

    it "returns last name when first name is blank" do
      user = build(:user, first_name: nil, last_name: "doe")

      expect(user.last_name_first_name).to eq("Doe")
    end

    it "returns first name when last name is blank" do
      user = build(:user, first_name: "jane", last_name: nil)

      expect(user.last_name_first_name).to eq("Jane")
    end

    it "returns nil when both names are blank" do
      user = build(:user, first_name: nil, last_name: nil)

      expect(user.last_name_first_name).to be_nil
    end
  end

  describe "#full_name_and_email" do
    it "returns full name with email" do
      user = build(:user, first_name: "jane", last_name: "doe", email: "jane@example.com")

      expect(user.full_name_and_email).to eq("Jane Doe (jane@example.com)")
    end
  end
end
