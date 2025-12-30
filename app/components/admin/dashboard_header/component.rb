class Admin::DashboardHeader::Component < ApplicationComponent
  renders_many :breadcrumbs, ->(name:, url:) { content_tag(:a, name, href: url) }
  renders_many :links, Admin::DashboardHeaderLink::Component
  renders_many :page_links, ->(name:, url:, options: {}) { link_to(name, url, class: 'btn btn-primary', **options) }

  def initialize(title:, breadcrumbs: [], **kwargs)
    @title = title
    @breadcrumbs = breadcrumbs
    @q = kwargs[:q]
    @show_filtering = kwargs[:show_filtering]
  end

  def show_filter_flag?
    return false if @q.nil?
    return false unless @q.conditions.present?

    # Don't show the flag if the only condition is `archived_at_not_null = false`.
    # Some models aren't archivable so Ransack will complain about not finding the
    # `archived_at_not_null` method. Since Ransack uses method_missing to create this
    # method, we can't use `respond_to?` so we'll rescue the exception.
    begin
      return false if @q.conditions.length == 1 && @q.archived_at_not_null == false
    rescue NoMethodError
      return true
    end

    true
  end
end
