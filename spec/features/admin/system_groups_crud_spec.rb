require "rails_helper"

RSpec.describe "Admin System Groups CRUD", type: :feature do
  let(:user) { create(:user) }
  let(:auth_system_group) { create(:system_group) }
  let(:system_role) { create(:system_role) }

  before do
    # Set up permissions for the user to access system groups
    %w[index show new create edit update destroy archive unarchive].each do |operation|
      permission = create(:system_permission,
        name: "SystemGroup #{operation.titleize}",
        resource: "SystemGroup",
        operation: operation)
      system_role.system_permissions << permission
    end
    auth_system_group.system_roles << system_role
    auth_system_group.users << user

    login_as(user, scope: :user)
  end

  describe "index page" do
    let!(:group_1) { create(:system_group, name: "Administrators") }
    let!(:group_2) { create(:system_group, name: "Editors") }

    it "displays a list of system groups" do
      visit "/admin/system_groups"

      expect(page).to have_content("Administrators")
      expect(page).to have_content("Editors")
    end
  end

  describe "show page" do
    let!(:target_group) { create(:system_group, name: "Test Group", description: "A test group") }

    it "displays system group details" do
      visit "/admin/system_groups/#{target_group.id}"

      expect(page).to have_content("Test Group")
      expect(page).to have_content("A test group")
    end
  end

  describe "new page" do
    it "displays the new system group form" do
      visit "/admin/system_groups/new"

      expect(page).to have_field("Name")
      expect(page).to have_content("System Users")
      expect(page).to have_button("Submit")
    end
  end

  describe "edit page" do
    let!(:target_group) { create(:system_group, name: "Original Name") }

    it "displays the edit system group form with current values" do
      visit "/admin/system_groups/#{target_group.id}/edit"

      expect(page).to have_field("Name", with: "Original Name")
      expect(page).to have_content("System Users")
      expect(page).to have_button("Submit")
    end
  end
end
