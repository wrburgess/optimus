## Rails Documentation Stack (Context7)

Always use Context7 MCP when we need library/API documentation, code generation, setup or configuration steps without anyone having to explicitly ask.

## Core Libraries (Query in Priority Order)

1. `/ruby/ruby` - Ruby language
2. `/rails/rails` - Ruby on Rails framework
3. `/rspec/rspec-rails` - Testing
4. `/postgres/postgres` - Database
5. `/hotwired/stimulus-rails` - Stimulus JS
6. `/hotwired/turbo-rails` - Turbo/Hotwire
7. `/viewcomponent/view_component` - View components
8. `/twbs/bootstrap` - CSS framework
9. `/heartcombo/simple_form` - Form builder
10. `/rubocop/rubocop` - Linting

## Additional Libraries (Query as Needed)

- `/heartcombo/devise` - Authentication
- `/varvet/pundit` - Authorization

## Project Preferences

- Use RSpec for testing (never Minitest or Test::Unit)
- Use Stimulus/Hotwire for frontend interactivity (never React, Vue, or other JS frameworks)
- Use Devise for authentication
- Use Pundit for authorization

## Query Strategy

- Always check Ruby and Ruby on Rails docs first
- Query additional libraries based on the topic
- If Context7 doesn't have a library, proceed with general knowledge

## Reference Projects

- `/wrburgess/optimus` - Project template patterns
- `/basecamp/fizzy` - Fizzy framework
