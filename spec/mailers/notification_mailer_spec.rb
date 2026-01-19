require "rails_helper"

RSpec.describe NotificationMailer, type: :mailer do
  let(:user) { create(:user, email: "test@example.com", first_name: "Test", last_name: "User") }

  describe "#single_notification" do
    let(:mail) do
      described_class.single_notification(
        user: user,
        subject: "Password Changed",
        body: "Your password has been changed."
      )
    end

    it "renders the headers" do
      expect(mail.subject).to eq("Password Changed")
      expect(mail.to).to eq(["test@example.com"])
    end

    it "renders the body" do
      expect(mail.html_part.body.encoded).to include("Your password has been changed.")
      expect(mail.text_part.body.encoded).to include("Your password has been changed.")
    end

    it "includes the user email in the footer" do
      expect(mail.html_part.body.encoded).to include("test@example.com")
      expect(mail.text_part.body.encoded).to include("test@example.com")
    end
  end

  describe "#summarized_notification" do
    let(:topic) { create(:notification_topic) }
    let(:message1) { create(:notification_message, notification_topic: topic, subject: "Subject 1", body: "Body 1") }
    let(:message2) { create(:notification_message, notification_topic: topic, subject: "Subject 2", body: "Body 2") }
    let(:mail) do
      described_class.summarized_notification(
        user: user,
        messages: [message1, message2]
      )
    end

    it "renders the headers with correct count" do
      expect(mail.subject).to eq("You have 2 new notifications")
      expect(mail.to).to eq(["test@example.com"])
    end

    it "renders all messages in the body" do
      expect(mail.html_part.body.encoded).to include("Subject 1")
      expect(mail.html_part.body.encoded).to include("Body 1")
      expect(mail.html_part.body.encoded).to include("Subject 2")
      expect(mail.html_part.body.encoded).to include("Body 2")
    end

    it "includes the user name in the greeting" do
      expect(mail.html_part.body.encoded).to include("Test User")
      expect(mail.text_part.body.encoded).to include("Test User")
    end

    context "with single message" do
      let(:mail) do
        described_class.summarized_notification(
          user: user,
          messages: [message1]
        )
      end

      it "uses singular form in subject" do
        expect(mail.subject).to eq("You have 1 new notification")
      end
    end
  end
end
