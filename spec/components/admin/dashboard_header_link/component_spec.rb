require 'rails_helper'

describe Admin::DashboardHeaderLink::Component, type: :component do
  let(:user) { create(:user) }
  let(:resource) do
    instance_double(
      'AdminResource',
      unarchived?: true,
      archived?: false
    )
  end
  let(:policy) { instance_double('AdminResourcePolicy') }

  before do
    sign_in(user)
    allow(Pundit).to receive(:policy).with(user, resource).and_return(policy)
    allow(policy).to receive(:new?).and_return(true)
    allow(policy).to receive(:edit?).and_return(true)
    allow(policy).to receive(:destroy?).and_return(true)
    allow(policy).to receive(:unarchive?).and_return(true)
    allow(policy).to receive(:export_xlsx?).and_return(true)
    allow_any_instance_of(described_class).to receive(:polymorphic_path).and_return('/admin/resources/1')
    allow_any_instance_of(described_class).to receive(:new_polymorphic_path).and_return('/admin/resources/new')
    allow_any_instance_of(described_class).to receive(:edit_polymorphic_path).and_return('/admin/resources/1/edit')
  end

  it 'renders a new link with default styling and icon' do
    allow(resource).to receive(:to_model).and_return(double('Model', model_name: double('Name', name: 'Resource')))

    render_inline(described_class.new(instance: resource, type: :new))

    link = page.find('a.btn.btn-success')
    expect(link[:href]).to include('/admin/')
    expect(link).to have_css('i.bi.bi-plus-circle')
    expect(link.text).to include('New')
  end

  it 'renders an edit link with custom classes and options' do
    allow(resource).to receive(:to_model).and_return(double('Model', model_name: double('Name', name: 'Resource')))

    render_inline(
      described_class.new(
        instance: resource,
        type: :edit,
        additional_classes: 'btn-sm',
        additional_options: { data: { turbo: false } }
      )
    )

    link = page.find('a.btn.btn-secondary')
    expect(link[:class]).to include('btn-sm')
    expect(link['data-turbo']).to eq('false')
    expect(link.text).to include('Edit')
  end

  it 'renders an archive link with confirmation' do
    allow(resource).to receive(:to_model).and_return(double('Model', model_name: double('Name', name: 'Resource')))

    render_inline(described_class.new(instance: resource, type: :archive))

    link = page.find('a.btn.btn-warning', match: :first)
    expect(link['data-confirm']).to eq('Are you sure you want to archive this record?')
    expect(link['data-method']).to eq('delete')
    expect(link.text).to include('Archive')
  end

  it 'renders an unarchive link when resource is archived' do
    archived_resource = instance_double(
      'AdminResource',
      unarchived?: false,
      archived?: true
    )
    allow(archived_resource).to receive(:to_model).and_return(double('Model', model_name: double('Name', name: 'Resource')))

    allow(Pundit).to receive(:policy).with(user, archived_resource).and_return(policy)

    render_inline(described_class.new(instance: archived_resource, type: :archive))

    link = page.find('a.btn.btn-warning', match: :first)
    expect(link['data-method']).to eq('patch')
    expect(link['data-confirm']).to eq('Are you sure you want to unarchive this record?')
    expect(link.text).to include('Unarchive')
  end

  it 'hides the link when policy denies the action' do
    allow(resource).to receive(:to_model).and_return(double('Model', model_name: double('Name', name: 'Resource')))
    allow(policy).to receive(:new?).and_return(false)

    render_inline(described_class.new(instance: resource, type: :new))

    expect(page).not_to have_link('New', href: '/admin/resources/new')
  end

  it 'renders download link when policy permits export' do
    allow(resource).to receive(:to_model).and_return(double('Model', model_name: double('Name', name: 'Resource')))
    allow_any_instance_of(described_class).to receive(:polymorphic_path).and_return('/admin/resources/1/export_xlsx')

    render_inline(described_class.new(instance: resource, type: :download))

    link = page.find('a.btn.btn-info')
    expect(link[:href]).to include('/export_xlsx')
    expect(link.text).to include('Download')
  end
end
