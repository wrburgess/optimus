require "rails_helper"

describe Admin::NotificationTopicPolicy, type: :policy do
  include_context "policy_setup"

  describe "#index?" do
    it "allows access if user has index permission" do
      expect(policy.index?).to be_truthy
    end

    it "denies access if user does not have index permission" do
      system_role.system_permissions.delete(sp_index)
      expect(policy.index?).to be_falsey
    end
  end

  describe "#show?" do
    it "allows access if user has show permission" do
      expect(policy.show?).to be_truthy
    end

    it "denies access if user does not have show permission" do
      system_role.system_permissions.delete(sp_show)
      expect(policy.show?).to be_falsey
    end
  end

  describe "#new?" do
    it "allows access if user has new permission" do
      expect(policy.new?).to be_truthy
    end

    it "denies access if user does not have new permission" do
      system_role.system_permissions.delete(sp_new)
      expect(policy.new?).to be_falsey
    end
  end

  describe "#create?" do
    it "allows access if user has create permission" do
      expect(policy.create?).to be_truthy
    end

    it "denies access if user does not have create permission" do
      system_role.system_permissions.delete(sp_create)
      expect(policy.create?).to be_falsey
    end
  end

  describe "#edit?" do
    it "allows access if user has edit permission" do
      expect(policy.edit?).to be_truthy
    end

    it "denies access if user does not have edit permission" do
      system_role.system_permissions.delete(sp_edit)
      expect(policy.edit?).to be_falsey
    end
  end

  describe "#update?" do
    it "allows access if user has update permission" do
      expect(policy.update?).to be_truthy
    end

    it "denies access if user does not have update permission" do
      system_role.system_permissions.delete(sp_update)
      expect(policy.update?).to be_falsey
    end
  end

  describe "#destroy?" do
    it "allows access if user has destroy permission" do
      expect(policy.destroy?).to be_truthy
    end

    it "denies access if user does not have destroy permission" do
      system_role.system_permissions.delete(sp_destroy)
      expect(policy.destroy?).to be_falsey
    end
  end

  describe "#archive?" do
    it "allows access if user has archive permission" do
      expect(policy.archive?).to be_truthy
    end

    it "denies access if user does not have archive permission" do
      system_role.system_permissions.delete(sp_archive)
      expect(policy.archive?).to be_falsey
    end
  end

  describe "#unarchive?" do
    it "allows access if user has unarchive permission" do
      expect(policy.unarchive?).to be_truthy
    end

    it "denies access if user does not have unarchive permission" do
      system_role.system_permissions.delete(sp_unarchive)
      expect(policy.unarchive?).to be_falsey
    end
  end

  describe "#collection_export_xlsx?" do
    it "allows access if user has collection_export_xlsx permission" do
      expect(policy.collection_export_xlsx?).to be_truthy
    end

    it "denies access if user does not have collection_export_xlsx permission" do
      system_role.system_permissions.delete(sp_collection_export_xlsx)
      expect(policy.collection_export_xlsx?).to be_falsey
    end
  end
end
