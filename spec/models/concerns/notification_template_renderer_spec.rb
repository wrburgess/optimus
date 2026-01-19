require "rails_helper"

RSpec.describe NotificationTemplateRenderer do
  describe ".render" do
    it "renders a simple template with context" do
      template = "Hello, <%= name %>!"
      context = { name: "John" }

      result = described_class.render(template, context)

      expect(result).to eq("Hello, John!")
    end

    it "renders a template with multiple variables" do
      template = "Hello, <%= first_name %> <%= last_name %>! Your email is <%= email %>."
      context = { first_name: "John", last_name: "Doe", email: "john@example.com" }

      result = described_class.render(template, context)

      expect(result).to eq("Hello, John Doe! Your email is john@example.com.")
    end

    it "renders a template with object access" do
      user = create(:user, first_name: "Jane", last_name: "Smith")
      template = "Hello, <%= user.full_name %>!"
      context = { user: user }

      result = described_class.render(template, context)

      expect(result).to eq("Hello, Jane Smith!")
    end

    it "renders a template with method calls" do
      template = "Count: <%= items.count %>, First: <%= items.first %>"
      context = { items: [1, 2, 3] }

      result = described_class.render(template, context)

      expect(result).to eq("Count: 3, First: 1")
    end

    it "renders a template with conditional logic" do
      template = "<%= active ? 'Active' : 'Inactive' %>"

      expect(described_class.render(template, { active: true })).to eq("Active")
      expect(described_class.render(template, { active: false })).to eq("Inactive")
    end

    it "renders a template with loops" do
      template = "<% items.each do |item| %><%= item %>, <% end %>"
      context = { items: %w[a b c] }

      result = described_class.render(template, context)

      expect(result).to eq("a, b, c, ")
    end

    it "returns empty string for blank template" do
      expect(described_class.render("", {})).to eq("")
      expect(described_class.render(nil, {})).to eq("")
    end

    it "raises TemplateRenderError for invalid template" do
      template = "<%= undefined_variable %>"

      expect { described_class.render(template, {}) }
        .to raise_error(NotificationTemplateRenderer::TemplateRenderError)
    end

    it "raises TemplateRenderError for syntax errors" do
      template = "<%= if true %>"

      expect { described_class.render(template, {}) }
        .to raise_error(NotificationTemplateRenderer::TemplateRenderError)
    end
  end

  describe ".render_subject" do
    it "renders the subject template from a notification template" do
      topic = create(:notification_topic)
      template = create(:notification_template,
        notification_topic: topic,
        subject_template: "Password Changed for <%= user.full_name %>")
      user = create(:user, first_name: "Test", last_name: "User")

      result = described_class.render_subject(template, { user: user })

      expect(result).to eq("Password Changed for Test User")
    end
  end

  describe ".render_body" do
    it "renders the body template from a notification template" do
      topic = create(:notification_topic)
      template = create(:notification_template,
        notification_topic: topic,
        body_template: "Hello <%= user.full_name %>, your password was changed at <%= changed_at %>.")
      user = create(:user, first_name: "Test", last_name: "User")
      changed_at = "2026-01-19 10:00:00"

      result = described_class.render_body(template, { user: user, changed_at: changed_at })

      expect(result).to eq("Hello Test User, your password was changed at 2026-01-19 10:00:00.")
    end
  end

  describe ".safe_render" do
    it "returns rendered content for valid template" do
      template = "Hello, <%= name %>!"
      context = { name: "John" }

      result = described_class.safe_render(template, context)

      expect(result).to eq("Hello, John!")
    end

    it "returns empty string for invalid template instead of raising" do
      template = "<%= undefined_variable %>"

      result = described_class.safe_render(template, {})

      expect(result).to eq("")
    end
  end

  describe "RenderContext" do
    it "provides access to context variables via methods" do
      context = NotificationTemplateRenderer::RenderContext.new(name: "Test", value: 42)

      expect(context.name).to eq("Test")
      expect(context.value).to eq(42)
    end

    it "provides binding for ERB" do
      context = NotificationTemplateRenderer::RenderContext.new(name: "Test")

      expect(context.get_binding).to be_a(Binding)
    end
  end
end
