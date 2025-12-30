class AdminApplicationPolicy < ApplicationPolicy
  attr_reader :user, :record

  def initialize(user, record)
    @user = user
    @record = record
  end

  def user_access_authorized?(operation)
    user.access_authorized?(resource: record.name, operation:)
  end

  def index?
    user_access_authorized?(:index)
  end

  def show?
    user_access_authorized?(:show)
  end

  def new?
    user_access_authorized?(:new)
  end

  def create?
    user_access_authorized?(:create)
  end

  def edit?
    user_access_authorized?(:edit)
  end

  def update?
    user_access_authorized?(:update)
  end

  def destroy?
    user_access_authorized?(:destroy)
  end

  def archive?
    user_access_authorized?(:archive)
  end

  def unarchive?
    user_access_authorized?(:unarchive)
  end

  def collection_export_xlsx?
    user_access_authorized?(:collection_export_xlsx)
  end

  def member_export_xlsx?
    user_access_authorized?(:member_export_xlsx)
  end
end
