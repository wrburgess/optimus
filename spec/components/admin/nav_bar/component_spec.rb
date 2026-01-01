require 'rails_helper'

describe Admin::NavBar::Component, type: :component do
  let(:user) { create(:user) }
  let(:environment) { 'development' }
  let(:component) { described_class.new(environment:) }

  before { sign_in(user) }

  describe '#env_class_color' do
    subject { component.env_class_color }

    context 'when environment is development' do
      let(:environment) { 'development' }

      it { is_expected.to eq 'bg-primary' }
    end

    context 'when environment is staging' do
      let(:environment) { 'staging' }

      it { is_expected.to eq 'bg-danger' }
    end

    context 'when environment is production' do
      let(:environment) { 'production' }

      it { is_expected.to eq 'bg-secondary' }
    end

    context 'when environment is unknown' do
      let(:environment) { 'unknown' }

      it { is_expected.to eq 'bg-secondary' }
    end
  end

  describe 'nav_items' do
    let(:environment) { 'development' }
    let(:component) { described_class.new(environment: environment) }

    it 'renders multiple nav items' do
      allow_any_instance_of(described_class).to receive(:admin_root_path).and_return('/admin')
      allow_any_instance_of(described_class).to receive(:production_site_url).and_return('https://prod.example.com')
      allow_any_instance_of(described_class).to receive(:staging_site_url).and_return('https://staging.example.com')
      allow_any_instance_of(described_class).to receive(:admin_data_logs_path).and_return('/admin/data_logs')
      allow_any_instance_of(described_class).to receive(:admin_users_path).and_return('/admin/users')
      allow_any_instance_of(described_class).to receive(:destroy_user_session_path).and_return('/users/sign_out')
      allow(Pundit).to receive(:policy).with(user, [ :admin, DataLog ]).and_return(double(index?: true))
      allow(Pundit).to receive(:policy).with(user, [ :admin, User ]).and_return(double(index?: true))

      render_inline(component)

      expect(page).to have_css('nav.navbar.bg-primary')
      expect(page).to have_link('Admin', href: '/admin')
      expect(page).to have_text('Sites')
      expect(page).to have_text('Management')
      expect(page).to have_link('Production', href: 'https://prod.example.com')
      expect(page).to have_link('Staging', href: 'https://staging.example.com')
      expect(page).to have_link('Data Logs', href: '/admin/data_logs')
      expect(page).to have_link('System Users', href: '/admin/users')
      expect(page).to have_link('Sign out', href: '/users/sign_out')
      expect(page).to have_text('Optimus')
    end
  end
end
