const form = document.querySelector("#start form");
const emailInput = document.querySelector("#email");
const submitButton = form.querySelector("button[type='submit']");
const feedbackEl = document.querySelector("#email-feedback");

const subscribedEmails = [];

function isValidEmail(value) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

function showFeedback(message, status) {
  feedbackEl.textContent = message;
  feedbackEl.className = `form-feedback ${status}`;
}

function handleSubmit(e) {
  e.preventDefault();

  const email = emailInput.value.trim();

  if (email === "") {
    showFeedback("이메일을 입력해주세요.", "error");
    return;
  }

  if (!isValidEmail(email)) {
    showFeedback("올바른 이메일 형식이 아니에요.", "error");
    return;
  }

  if (subscribedEmails.includes(email)) {
    showFeedback("이미 신청하신 이메일이에요.", "warning");
    return;
  }

  subscribedEmails.push(email);
  showFeedback("신청 완료! 오픈 소식을 가장 먼저 알려드릴게요.", "success");

  submitButton.textContent = "신청 완료";
  submitButton.disabled = true;
  emailInput.disabled = true;
}

form.addEventListener("submit", handleSubmit);
