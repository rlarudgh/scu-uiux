// 독서 목표 만들기 (단계형 흐름)
const GOAL_LAST_STEP = 5;
const STEP_NAMES = ["시작", "책 입력", "목표 선택", "확인", "완료"];
const CYCLE_LABELS = { daily: "매일", three: "주 3회", weekend: "주말만" };
const AMOUNT_LABELS = { "10p": "10쪽", "20p": "20쪽", "30m": "30분", "60m": "1시간" };
const TITLE_MAX = 30;

const goalSection = document.querySelector("#goal");
const goalForm = document.querySelector("#goal-form");
const goalSteps = goalForm.querySelectorAll(".goal-step");
const stepperItems = goalSection.querySelectorAll(".stepper li");
const goalStatus = document.querySelector("#goal-status");
const goalTitle = document.querySelector("#goal-title");
const goalAuthor = document.querySelector("#goal-author");
const goalAmount = document.querySelector("#goal-amount");
const goalNotify = document.querySelector("#goal-notify");
const cycleFieldset = goalForm.querySelector("fieldset");

function createGoalState() {
  return { step: 1, title: "", author: "", cycle: "", amount: "", notify: false, completed: false };
}

let goalState = createGoalState();

function showStep(step) {
  goalState.step = step;

  goalSteps.forEach((panel) => {
    panel.hidden = Number(panel.dataset.step) !== step;
  });

  stepperItems.forEach((item) => {
    const itemStep = Number(item.dataset.step);
    const isDone = itemStep < step || goalState.completed;
    item.classList.toggle("is-done", isDone);
    if (itemStep === step) {
      item.setAttribute("aria-current", "step");
    } else {
      item.removeAttribute("aria-current");
    }
  });

  goalStatus.textContent = goalState.completed
    ? "모든 단계를 마쳤어요 · 목표 등록 완료"
    : `${step} / ${GOAL_LAST_STEP} 단계 · ${STEP_NAMES[step - 1]}`;

  if (step === 4 || step === 5) renderSummary();
}

function focusStepHeading() {
  goalForm.querySelector(`.goal-step[data-step="${goalState.step}"] h3`).focus();
}

function setFieldError(field, errorEl, message) {
  field.classList.toggle("is-invalid", message !== "");
  if (message) {
    field.setAttribute("aria-invalid", "true");
  } else {
    field.removeAttribute("aria-invalid");
  }
  errorEl.textContent = message;
}

function getSelectedCycle() {
  const checked = goalForm.querySelector("input[name='cycle']:checked");
  return checked ? checked.value : "";
}

function validateTitle() {
  const length = goalTitle.value.trim().length;
  const message =
    length === 0
      ? "책 제목을 입력해주세요. (1~30자)"
      : length > TITLE_MAX
        ? `책 제목은 ${TITLE_MAX}자 이내로 줄여주세요.`
        : "";
  setFieldError(goalTitle, document.querySelector("#goal-title-error"), message);
  return message === "" ? null : goalTitle;
}

function validateCycle() {
  const message = getSelectedCycle() === "" ? "독서 주기를 하나 선택해주세요." : "";
  setFieldError(cycleFieldset, document.querySelector("#goal-cycle-error"), message);
  return message === "" ? null : cycleFieldset.querySelector("input");
}

function validateAmount() {
  const message = goalAmount.value === "" ? "하루 목표 분량을 목록에서 골라주세요." : "";
  setFieldError(goalAmount, document.querySelector("#goal-amount-error"), message);
  return message === "" ? null : goalAmount;
}

// 단계별 검증. 통과하면 true, 실패하면 첫 번째 오류 필드로 이동
function validateStep(step) {
  const validators = { 2: [validateTitle], 3: [validateCycle, validateAmount] };
  const invalidFields = (validators[step] || []).map((validate) => validate()).filter(Boolean);

  if (invalidFields.length > 0) {
    goalStatus.textContent = `필수 항목 ${invalidFields.length}개를 확인해주세요.`;
    invalidFields[0].focus();
    return false;
  }
  return true;
}

function saveStep(step) {
  if (step === 2) {
    goalState.title = goalTitle.value.trim();
    goalState.author = goalAuthor.value.trim();
  }
  if (step === 3) {
    goalState.cycle = getSelectedCycle();
    goalState.amount = goalAmount.value;
    goalState.notify = goalNotify.checked;
  }
}

function renderSummary() {
  const book = goalState.author ? `${goalState.title} · ${goalState.author}` : goalState.title;
  const values = {
    book,
    title: `『${goalState.title}』`,
    cycle: CYCLE_LABELS[goalState.cycle],
    amount: AMOUNT_LABELS[goalState.amount],
    notify: goalState.notify ? "받기" : "받지 않기",
    notifyMessage: goalState.notify ? "읽을 시간이 되면 알림으로 알려드릴게요." : "",
  };

  goalForm.querySelectorAll("[data-summary]").forEach((el) => {
    el.textContent = values[el.dataset.summary];
  });
}

function goToStep(step) {
  showStep(step);
  focusStepHeading();
}

function goNext() {
  const { step } = goalState;
  if (!validateStep(step)) return;
  saveStep(step);
  goToStep(step + 1);
}

function goPrev() {
  saveStep(goalState.step);
  goToStep(goalState.step - 1);
}

function completeGoal(e) {
  e.preventDefault();

  // 확인 단계가 아닐 때 Enter로 제출하면 '다음'처럼 동작
  if (goalState.step !== 4) {
    if (goalState.step < 4) goNext();
    return;
  }

  if (!validateStep(2) || !validateStep(3)) return;

  goalState.completed = true;
  goalSection.classList.add("is-completed");
  goToStep(5);
}

function resetGoal() {
  goalForm.reset();
  setFieldError(goalTitle, document.querySelector("#goal-title-error"), "");
  setFieldError(cycleFieldset, document.querySelector("#goal-cycle-error"), "");
  setFieldError(goalAmount, document.querySelector("#goal-amount-error"), "");
  goalState = createGoalState();
  goalSection.classList.remove("is-completed");
  goToStep(1);
}

function startFirstRecord() {
  activateTab(tabs[0]);
  titleInput.value = goalState.title;
  updateRecordButton();
  document.querySelector("#features").scrollIntoView({ behavior: "smooth" });
  memoInput.focus({ preventScroll: true });
}

const GOAL_ACTIONS = {
  next: goNext,
  prev: goPrev,
  edit: (button) => {
    saveStep(goalState.step);
    goToStep(Number(button.dataset.target));
  },
  restart: resetGoal,
  record: startFirstRecord,
};

function handleGoalClick(e) {
  const button = e.target.closest("button[data-action]");
  if (!button) return;
  GOAL_ACTIONS[button.dataset.action](button);
}

// 값을 고치면 해당 항목의 오류 안내를 바로 지움
function handleGoalFieldChange(e) {
  const { name } = e.target;
  if (name === "title" && goalTitle.classList.contains("is-invalid")) validateTitle();
  if (name === "cycle" && cycleFieldset.classList.contains("is-invalid")) validateCycle();
  if (name === "amount" && goalAmount.classList.contains("is-invalid")) validateAmount();
}

goalForm.addEventListener("click", handleGoalClick);
goalForm.addEventListener("submit", completeGoal);
goalForm.addEventListener("input", handleGoalFieldChange);
goalForm.addEventListener("change", handleGoalFieldChange);

showStep(1);
