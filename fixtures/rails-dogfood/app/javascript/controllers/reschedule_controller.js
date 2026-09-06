import { Application, Controller } from "@hotwired/stimulus"
const application = Application.start()
application.register("reschedule", class extends Controller {
  static targets = ["date", "feedback"]
  connect() { this.feedbackTarget.textContent = "Choose a future date." }
  preview() { this.feedbackTarget.textContent = this.dateTarget.value ? `Ready to request ${this.dateTarget.value}.` : "Choose a future date." }
})
