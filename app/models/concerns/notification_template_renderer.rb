module NotificationTemplateRenderer
  class RenderContext
    def initialize(context = {})
      context.each do |key, value|
        define_singleton_method(key) { value }
      end
    end

    def get_binding
      binding
    end
  end

  class << self
    def render(template_string, context = {})
      return "" if template_string.blank?

      render_context = RenderContext.new(context)
      erb = ERB.new(template_string)
      erb.result(render_context.get_binding)
    rescue SyntaxError, StandardError => e
      Rails.logger.error("NotificationTemplateRenderer error: #{e.message}")
      raise TemplateRenderError, "Failed to render template: #{e.message}"
    end

    def render_subject(template, context = {})
      render(template.subject_template, context)
    end

    def render_body(template, context = {})
      render(template.body_template, context)
    end

    def safe_render(template_string, context = {})
      render(template_string, context)
    rescue TemplateRenderError => e
      Rails.logger.warn("Template render failed, returning empty string: #{e.message}")
      ""
    end
  end

  class TemplateRenderError < StandardError; end
end
