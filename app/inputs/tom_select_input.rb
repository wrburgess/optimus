class TomSelectInput < SimpleForm::Inputs::Base
  def input(wrapper_options = nil)
    merged_input_options = merge_wrapper_options(input_html_options, wrapper_options)
    autocomplete = options[:autocomplete] || "off"
    multiple = options[:multiple] || false
    prompt = options[:prompt] || "Select..."

    @builder.select(
      attribute_name,
      options[:collection],
      { prompt: },
      {
        multiple:,
        autocomplete:,
        class: "tom-select",
        data: { tom_select_target: "tomselect" }
      }.merge(merged_input_options)
    )
  end
end
