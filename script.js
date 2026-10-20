// ===== 1. 이메일 알림 신청 =====
const emailForm = document.querySelector("#start form");
const emailInput = document.querySelector("#email");
const submitButton = emailForm.querySelector("button[type='submit']");
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

emailForm.addEventListener("submit", handleSubmit);

function handleEmailInput() {
  if (feedbackEl.classList.contains("error")) {
    showFeedback("", "");
  }
  submitButton.disabled = emailInput.value.trim() === "";
}

emailInput.addEventListener("input", handleEmailInput);
handleEmailInput();

// ===== 2. 주요 기능 탭 =====
const tabs = document.querySelectorAll("[role='tab']");

function activateTab(selectedTab) {
  tabs.forEach((tab) => {
    const isSelected = tab === selectedTab;
    tab.classList.toggle("is-active", isSelected);
    tab.setAttribute("aria-selected", String(isSelected));
    tab.tabIndex = isSelected ? 0 : -1;
    document.getElementById(tab.getAttribute("aria-controls")).hidden =
      !isSelected;
  });
}

function handleTabKeydown(e) {
  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;

  const list = Array.from(tabs);
  const step = e.key === "ArrowRight" ? 1 : -1;
  const next = list[(list.indexOf(e.currentTarget) + step + list.length) % list.length];
  activateTab(next);
  next.focus();
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => activateTab(tab));
  tab.addEventListener("keydown", handleTabKeydown);
});

// ===== 3. 한 줄 기록 · 독서 캘린더 · 완독 목록 =====
const MEMO_MAX = 50;
const MEMO_WARN = 40;

const STATUS_INFO = {
  reading: { label: "읽는 중", badge: "열심히 읽는 중이에요", button: "기록하기" },
  finished: { label: "완독", badge: "완독했어요! 축하해요", button: "완독 기록하기" },
  paused: { label: "잠시 멈춤", badge: "잠시 쉬어가도 괜찮아요", button: "멈춤 기록하기" },
};

const recordForm = document.querySelector("#record-form");
const titleInput = document.querySelector("#book-title");
const statusSelect = document.querySelector("#read-status");
const statusBadge = document.querySelector("#status-badge");
const memoInput = document.querySelector("#memo");
const memoCounter = document.querySelector("#memo-counter");
const recordButton = document.querySelector("#record-button");
const recordList = document.querySelector("#record-list");
const recordEmpty = document.querySelector("#record-empty");
const calendarEl = document.querySelector("#calendar");
const calendarSummary = document.querySelector("#calendar-summary");
const finishedList = document.querySelector("#finished-list");
const finishedEmpty = document.querySelector("#finished-empty");

const records = [];

function updateRecordButton() {
  const memoLength = memoInput.value.trim().length;
  recordButton.disabled =
    titleInput.value.trim() === "" || memoLength === 0 || memoLength > MEMO_MAX;
}

function updateCounter() {
  const length = memoInput.value.trim().length;
  memoCounter.textContent =
    length > MEMO_MAX
      ? `${length} / ${MEMO_MAX} · ${length - MEMO_MAX}자를 줄여주세요`
      : `${length} / ${MEMO_MAX}`;
  memoCounter.classList.toggle("warn", length >= MEMO_WARN && length <= MEMO_MAX);
  memoCounter.classList.toggle("over", length > MEMO_MAX);
  memoInput.classList.toggle("is-invalid", length > MEMO_MAX);
  updateRecordButton();
}

function updateStatusBadge() {
  const info = STATUS_INFO[statusSelect.value];
  statusBadge.textContent = info.badge;
  statusBadge.dataset.status = statusSelect.value;
  recordButton.textContent = info.button;
}

function createRecordItem(record) {
  const item = document.createElement("li");
  const title = document.createElement("strong");
  const status = document.createElement("span");
  const memo = document.createElement("p");

  title.textContent = record.title;
  status.textContent = STATUS_INFO[record.status].label;
  status.className = "status-badge";
  status.dataset.status = record.status;
  memo.textContent = record.memo;

  item.append(title, status, memo);
  return item;
}

function renderRecords() {
  recordList.replaceChildren(...records.map(createRecordItem));
  recordEmpty.hidden = records.length > 0;
}

function renderFinished() {
  const finished = records.filter((record) => record.status === "finished");
  finishedList.replaceChildren(...finished.map(createRecordItem));
  finishedEmpty.hidden = finished.length > 0;
}

function getWeekDates() {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    return date;
  });
}

function renderCalendar() {
  const dayNames = ["월", "화", "수", "목", "금", "토", "일"];
  const todayKey = new Date().toDateString();
  const recordedDays = new Set(records.map((record) => record.date));

  const days = getWeekDates().map((date, i) => {
    const key = date.toDateString();
    const day = document.createElement("li");
    day.className = "calendar-day";
    day.classList.toggle("is-today", key === todayKey);
    day.classList.toggle("is-recorded", recordedDays.has(key));
    day.innerHTML = `<span>${dayNames[i]}</span><strong>${date.getDate()}</strong>`;
    return day;
  });

  calendarEl.replaceChildren(...days);
  const weekCount = days.filter((day) => day.classList.contains("is-recorded")).length;
  calendarSummary.textContent =
    weekCount > 0
      ? `이번 주 ${weekCount}일 기록했어요. 좋은 습관이에요!`
      : "이번 주 0일 기록했어요.";
}

function addRecord(e) {
  e.preventDefault();
  if (recordButton.disabled) return;

  records.unshift({
    title: titleInput.value.trim(),
    status: statusSelect.value,
    memo: memoInput.value.trim(),
    date: new Date().toDateString(),
  });

  renderRecords();
  renderFinished();
  renderCalendar();

  recordForm.reset();
  updateStatusBadge();
  updateCounter();
  titleInput.focus();
}

titleInput.addEventListener("input", updateRecordButton);
memoInput.addEventListener("input", updateCounter);
statusSelect.addEventListener("change", updateStatusBadge);
recordForm.addEventListener("submit", addRecord);

renderRecords();
renderFinished();
renderCalendar();

// ===== 4. 책 검색으로 고르기 (중간고사 추가 · 목표 만들기 2단계) =====
const BOOK_CATALOG = [
  { id: "almond", title: "아몬드", author: "손원평", pages: 264 },
  { id: "demian", title: "데미안", author: "헤르만 헤세", pages: 248 },
  { id: "siddhartha", title: "싯다르타", author: "헤르만 헤세", pages: 216 },
  { id: "vegetarian", title: "채식주의자", author: "한강", pages: 192 },
  { id: "boy", title: "소년이 온다", author: "한강", pages: 216 },
  {
    id: "dallergut",
    title: "달러구트 꿈 백화점",
    author: "이미예",
    pages: 300,
  },
  {
    id: "little-prince",
    title: "어린 왕자",
    author: "앙투안 드 생텍쥐페리",
    pages: 144,
  },
  { id: "kim", title: "82년생 김지영", author: "조남주", pages: 192 },
  {
    id: "habit",
    title: "아주 작은 습관의 힘",
    author: "제임스 클리어",
    pages: 360,
  },
];

const bookSearchInput = document.querySelector("#book-search-input");
const bookSearchError = document.querySelector("#book-search-error");
const bookSearchStatus = document.querySelector("#book-search-status");
const bookSearchResults = document.querySelector("#book-search-results");
const bookSearchEmpty = document.querySelector("#book-search-empty");
const bookSelected = document.querySelector("#book-selected");
const bookSelectedText = document.querySelector("#book-selected-text");
const searchTitleInput = document.querySelector("#goal-title");
const searchAuthorInput = document.querySelector("#goal-author");

let searchState = { query: "", results: [], selected: null };

function normalize(text) {
  return text.replace(/\s/g, "").toLowerCase();
}

function searchBooks(query) {
  const keyword = normalize(query);
  return BOOK_CATALOG.filter(
    (book) =>
      normalize(book.title).includes(keyword) ||
      normalize(book.author).includes(keyword),
  );
}

function formatBook(book) {
  return `${book.title} · ${book.author} (${book.pages}쪽)`;
}

function createResultItem(book) {
  const isSelected = searchState.selected?.id === book.id;
  const item = document.createElement("li");
  const info = document.createElement("div");
  const title = document.createElement("strong");
  const meta = document.createElement("span");
  const button = document.createElement("button");

  item.classList.toggle("is-selected", isSelected);
  title.textContent = book.title;
  meta.textContent = `${book.author} · ${book.pages}쪽`;
  button.type = "button";
  button.className = isSelected ? "btn-primary" : "btn-secondary";
  button.dataset.searchAction = "select";
  button.dataset.bookId = book.id;
  button.setAttribute("aria-pressed", String(isSelected));
  button.textContent = isSelected ? "✓ 선택됨" : "이 책 선택";

  info.append(title, meta);
  item.append(info, button);
  return item;
}

function renderSearchResults() {
  bookSearchResults.replaceChildren(
    ...searchState.results.map(createResultItem),
  );
}

function renderSelected() {
  const { selected } = searchState;
  bookSelected.hidden = selected === null;
  bookSelectedText.textContent = selected ? formatBook(selected) : "";
  renderSearchResults();
}

function runSearch() {
  const query = bookSearchInput.value.trim();

  if (query === "") {
    setFieldError(
      bookSearchInput,
      bookSearchError,
      "책 제목이나 저자 이름을 입력해주세요.",
    );
    bookSearchInput.focus();
    return;
  }

  setFieldError(bookSearchInput, bookSearchError, "");
  searchState.query = query;
  searchState.results = searchBooks(query);

  const count = searchState.results.length;
  bookSearchEmpty.hidden = count > 0;
  bookSearchStatus.classList.toggle("is-empty", count === 0);
  bookSearchStatus.textContent =
    count > 0
      ? `'${query}' 검색 결과 ${count}권 · 읽을 책을 선택해주세요.`
      : `'${query}'와(과) 맞는 책이 없어요. 다른 검색어로 찾거나 직접 입력해주세요.`;
  renderSearchResults();
}

function selectBook(id) {
  const book = BOOK_CATALOG.find((item) => item.id === id);
  searchState.selected = book;
  searchTitleInput.value = book.title;
  searchAuthorInput.value = book.author;
  if (searchTitleInput.classList.contains("is-invalid")) validateTitle();
  bookSearchStatus.classList.remove("is-empty");
  bookSearchStatus.textContent = `『${book.title}』을(를) 골랐어요. '다음'을 눌러 목표를 정해주세요.`;
  renderSelected();
}

function unselectBook() {
  searchState.selected = null;
  searchTitleInput.value = "";
  searchAuthorInput.value = "";
  bookSearchStatus.classList.remove("is-empty");
  bookSearchStatus.textContent =
    "선택을 취소했어요. 다시 고르거나 책 제목을 직접 입력해주세요.";
  renderSelected();
  bookSearchInput.focus();
}

// 선택한 책은 그대로 두고 검색어와 결과만 비움
function clearSearch() {
  bookSearchInput.value = "";
  searchState.query = "";
  searchState.results = [];
  setFieldError(bookSearchInput, bookSearchError, "");
  bookSearchStatus.textContent = "";
  bookSearchStatus.classList.remove("is-empty");
  bookSearchEmpty.hidden = true;
  renderSearchResults();
}

function resetBookSearch() {
  clearSearch();
  searchState = { query: "", results: [], selected: null };
  renderSelected();
}

function getSelectedPages() {
  return searchState.selected ? searchState.selected.pages : 0;
}

function restartSearch() {
  clearSearch();
  bookSearchInput.focus();
}

const SEARCH_ACTIONS = {
  search: runSearch,
  clear: restartSearch,
  retry: restartSearch,
  manual: () => searchTitleInput.focus(),
  select: (button) => selectBook(button.dataset.bookId),
  unselect: unselectBook,
};

function handleSearchClick(e) {
  const button = e.target.closest("button[data-search-action]");
  if (!button) return;
  SEARCH_ACTIONS[button.dataset.searchAction](button);
}

// Enter로 폼이 제출(다음 단계 이동)되지 않고 검색이 실행되도록 함
function handleSearchKeydown(e) {
  if (e.key !== "Enter") return;
  e.preventDefault();
  runSearch();
}

// 선택 후 제목을 직접 고치면 검색으로 고른 책 정보(쪽수)는 해제
function handleTitleEdit() {
  const { selected } = searchState;
  if (selected && searchTitleInput.value.trim() !== selected.title) {
    searchState.selected = null;
    renderSelected();
  }
}

document
  .querySelector(".book-search")
  .addEventListener("click", handleSearchClick);
bookSearchInput.addEventListener("keydown", handleSearchKeydown);
bookSearchInput.addEventListener("input", () => {
  if (bookSearchInput.classList.contains("is-invalid")) {
    setFieldError(bookSearchInput, bookSearchError, "");
  }
});
searchTitleInput.addEventListener("input", handleTitleEdit);

// ===== 5. 독서 목표 만들기 (단계형 흐름) =====
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
  return { step: 1, title: "", author: "", cycle: "", amount: "", notify: false, pages: 0, completed: false };
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
    goalState.pages = getSelectedPages();
  }
  if (step === 3) {
    goalState.cycle = getSelectedCycle();
    goalState.amount = goalAmount.value;
    goalState.notify = goalNotify.checked;
  }
}

function renderSummary() {
  const { title, author, pages, amount } = goalState;
  const book = `${author ? `${title} · ${author}` : title}${pages ? ` (${pages}쪽)` : ""}`;
  // 검색으로 고른 책이고 쪽 단위 목표일 때만 완독 예상일 안내
  const pagesPerDay = amount.endsWith("p") ? parseInt(amount, 10) : 0;
  const finishMessage =
    pages && pagesPerDay
      ? `${pages}쪽 책이니 하루 ${pagesPerDay}쪽씩 읽으면 약 ${Math.ceil(pages / pagesPerDay)}일 만에 완독할 수 있어요.`
      : "";
  const values = {
    book,
    title: `『${title}』`,
    cycle: CYCLE_LABELS[goalState.cycle],
    amount: AMOUNT_LABELS[goalState.amount],
    notify: goalState.notify ? "받기" : "받지 않기",
    notifyMessage: goalState.notify ? "읽을 시간이 되면 알림으로 알려드릴게요." : "",
    finishMessage,
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
  resetBookSearch();
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
