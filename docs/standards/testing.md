# MPI Testing Standards

## Test Framework

- RSpec with FactoryBot (never fixtures)
- Shoulda-matchers for validations and associations
- Capybara for feature/system tests
- WebMock to prevent accidental external HTTP calls
- VCR for recording HTTP cassettes

## Spec Types and When to Use

| Type | Directory | Purpose |
|------|-----------|---------|
| Model | `spec/models/` | Validations, associations, scopes, instance methods |
| Request | `spec/requests/admin/` | Controller actions, HTTP responses, redirects |
| Policy | `spec/policies/admin/` | Pundit authorization for each permission |
| Job | `spec/jobs/` | Background job behavior and side effects |
| Component | `spec/components/` | ViewComponent rendering and DOM output |
| Feature | `spec/features/` | End-to-end UI flows with Capybara |
| Module | `spec/modules/` | Enumerable modules (e.g., `OrderStatuses`) |

**Use request specs for controllers, not controller specs.**

## Model Spec Structure

```ruby
RSpec.describe ModelName, type: :model do
  # Shared examples for concerns
  it_behaves_like "archivable"
  it_behaves_like "loggable"

  describe "factory" do
    it "creates a valid instance" do
      instance = create(:model_name)
      expect(instance).to be_persisted
    end
  end

  describe "associations" do
    # Use shoulda-matchers
  end

  describe "validations" do
    # Use shoulda-matchers
  end

  describe "scopes" do
    # Test each scope returns expected records
  end

  describe "ransackable" do
    # Test .ransackable_attributes and .ransackable_associations
  end

  describe "instance methods" do
    # Test each method with various states
  end
end
```

## Request Spec Structure

Every request spec must test three contexts:

```ruby
RSpec.describe Admin::ResourceController, type: :request do
  let(:user) { create(:user, confirmed_at: Time.current) }

  context "when authenticated and authorized" do
    before do
      login_as(user, scope: :user)
      allow_any_instance_of(described_class).to receive(:authorize).and_return(true)
    end

    # Test CRUD operations, redirects, flash messages
  end

  context "when not authenticated" do
    # Test redirect to sign-in
  end

  context "when authenticated but unauthorized" do
    before do
      login_as(user, scope: :user)
      allow_any_instance_of(described_class).to receive(:authorize).and_raise(Pundit::NotAuthorizedError)
      allow_any_instance_of(ApplicationController).to receive(:user_not_authorized) do |controller, _exception|
        controller.render(plain: "unauthorized", status: :unauthorized)
      end
    end

    # Test 401 responses
  end
end
```

## Policy Spec Structure

```ruby
RSpec.describe Admin::ModelPolicy, type: :policy do
  include_context 'policy_setup'

  describe '#index?' do
    it 'allows access if user has index permission' do
      expect(policy.index?).to be_truthy
    end

    it 'denies access if user does not have index permission' do
      system_role.system_permissions.delete(sp_index)
      expect(policy.index?).to be_falsey
    end
  end

  # Repeat for: show?, new?, create?, edit?, update?, destroy?, archive?, unarchive?
end
```

## Job Spec Patterns

```ruby
RSpec.describe SomeJob, type: :job do
  describe "#perform" do
    it "creates expected records" do
      expect {
        described_class.perform_now(args)
      }.to change(Model, :count).by(1)
    end

    it "enqueues downstream jobs" do
      expect {
        described_class.perform_now(args)
      }.to have_enqueued_job(DownstreamJob)
    end
  end
end
```

- Use `.perform_now` for synchronous testing
- Use `perform_enqueued_jobs` when jobs trigger other jobs
- Use `freeze_time` for time-dependent logic

## Component Spec Patterns

```ruby
RSpec.describe Admin::SomeComponent, type: :component do
  let(:user) { create(:user) }

  before { sign_in(user) }

  it "renders expected content" do
    render_inline(described_class.new(args))
    expect(page).to have_css(".expected-class")
    expect(page).to have_text("Expected text")
  end
end
```

## Factory Conventions

- One factory file per model in `spec/factories/`
- Use `sequence` for unique attributes
- Use `Faker` for realistic data
- Use `association` for required belongs_to
- Use `trait` for state variations (e.g., `:inactive`, `:distributed`, `:daily`)

```ruby
FactoryBot.define do
  factory :model_name do
    sequence(:name) { |n| "Name #{n}" }
    description { Faker::Lorem.sentence }
    association :parent_model
    active { true }

    trait :inactive do
      active { false }
    end
  end
end
```

## Shared Contexts

Use shared contexts from `spec/support/shared_contexts/`:

| Context | Use In | What It Sets Up |
|---------|--------|-----------------|
| `controller_setup` | Request specs | User with all CRUD + archive + export permissions |
| `policy_setup` | Policy specs | Same permissions, auto-resolves policy class |
| `feature_setup` | Feature specs | Same permissions, derives model from description |
| `component_setup` | Component specs | Same permissions for component rendering |

## Shared Examples

Use shared examples from `spec/support/shared_examples/`:

- `archivable` — Tests archive/unarchive, scopes, state checks
- `loggable` — Tests audit log creation via async job
- `has_distribution_method` — Tests distribution method validations
- `has_distribution_frequency` — Tests frequency validations and predicates

## Testing Conventions

- Use `let` for data definition (lazy), `before` for setup/side effects
- Use `build` for unit tests, `create` for integration tests
- Use `.reload` after mutations to verify persistence
- Use `contain_exactly` for collection assertions (order-independent)
- Use `freeze_time` or `travel_to` for time-dependent tests
- Test flash messages: `expect(flash[:success]).to be_present`
- Test redirects: `expect(response).to have_http_status(:redirect)`
- Minimize mocks — use real objects when possible

## HC Review Checklist for Tests

When reviewing tests written by an agent, verify:

- [ ] All three auth contexts tested in request specs (authed+authorized, not authed, authed+unauthorized)
- [ ] Policy specs test both grant and deny for each permission
- [ ] Shared examples used for concerns (archivable, loggable)
- [ ] Factory creates a valid instance (factory test exists)
- [ ] Edge cases covered (nil values, empty collections, boundary conditions)
- [ ] No hard-coded IDs or timestamps
- [ ] Time-dependent tests use `freeze_time` or `travel_to`
- [ ] Jobs tested with `perform_now`, not just enqueue assertions
