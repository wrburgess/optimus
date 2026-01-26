require "rails_helper"

RSpec.describe "Admin Authentication", type: :feature do
  include Rails.application.routes.url_helpers

  let(:user) { create(:user, email: "admin@example.com", password: "Password123!") }

  describe "login flow" do
    it "allows a confirmed user to log in" do
      visit new_user_session_path

      fill_in "Email", with: user.email
      fill_in "Password", with: "Password123!"
      click_button "Log in"

      expect(page).to have_current_path(root_path)
    end

    it "rejects invalid credentials" do
      visit new_user_session_path

      fill_in "Email", with: user.email
      fill_in "Password", with: "wrongpassword"
      click_button "Log in"

      expect(page).to have_content("Invalid email or password")
    end

    it "redirects unauthenticated users to login" do
      visit "/admin"

      expect(page).to have_current_path(new_user_session_path)
    end
  end

  describe "logout flow" do
    let(:system_group) { create(:system_group) }
    let(:system_role) { create(:system_role) }

    before do
      # Set up dashboard permission
      permission = create(:system_permission,
        name: "Dashboard Index",
        resource: "Dashboard",
        operation: "index")
      system_role.system_permissions << permission
      system_group.system_roles << system_role
      system_group.users << user

      login_as(user, scope: :user)
    end

    it "displays the admin dashboard when authenticated" do
      visit "/admin"

      expect(page).to have_content("Dashboard")
      expect(page).to have_link("Sign out")
    end
  end
end
