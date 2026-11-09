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
  // 오류 상태를 색뿐 아니라 aria-invalid로도 알림
  if (status === "error") {
    emailInput.setAttribute("aria-invalid", "true");
  } else {
    emailInput.removeAttribute("aria-invalid");
  }
}

function handleSubmit(e) {
  e.preventDefault();

  const email = emailInput.value.trim();

  if (email === "") {
    showFeedback("이메일을 입력해주세요. 예: you@example.com", "error");
    emailInput.focus();
    return;
  }

  if (!isValidEmail(email)) {
    showFeedback(
      "이메일 형식이 올바르지 않아요. '@'와 도메인을 포함해 입력해주세요. 예: you@example.com",
      "error",
    );
    emailInput.focus();
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

// 버튼은 항상 누를 수 있게 두고(키보드·스크린 리더 사용자도 오류 안내를 받도록) 제출 시 검증
function handleEmailInput() {
  if (feedbackEl.classList.contains("error")) {
    showFeedback("", "");
  }
}

emailInput.addEventListener("input", handleEmailInput);

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

// ←/→로 이웃 탭, Home/End로 처음·마지막 탭
function handleTabKeydown(e) {
  const list = Array.from(tabs);
  const current = list.indexOf(e.currentTarget);
  const targets = {
    ArrowRight: (current + 1) % list.length,
    ArrowLeft: (current - 1 + list.length) % list.length,
    Home: 0,
    End: list.length - 1,
  };
  if (!(e.key in targets)) return;

  e.preventDefault();
  const next = list[targets[e.key]];
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
  reading: {
    label: "읽는 중",
    badge: "열심히 읽는 중이에요",
    button: "기록하기",
  },
  finished: {
    label: "완독",
    badge: "완독했어요! 축하해요",
    button: "완독 기록하기",
  },
  paused: {
    label: "잠시 멈춤",
    badge: "잠시 쉬어가도 괜찮아요",
    button: "멈춤 기록하기",
  },
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
const recordCount = document.querySelector("#record-count");
const recordShowAll = document.querySelector("#record-show-all");
const filterButtons = document.querySelectorAll(".filter-group [data-filter]");
const calendarEl = document.querySelector("#calendar");
const calendarSummary = document.querySelector("#calendar-summary");
const finishedList = document.querySelector("#finished-list");
const finishedEmpty = document.querySelector("#finished-empty");

const records = [];
let recordFilter = "all";

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
  memoCounter.classList.toggle(
    "warn",
    length >= MEMO_WARN && length <= MEMO_MAX,
  );
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

// 필터 버튼 선택 표시와 목록·개수·빈 상태 안내를 함께 갱신
function renderRecords() {
  const visible =
    recordFilter === "all"
      ? records
      : records.filter((record) => record.status === recordFilter);
  const filterLabel = STATUS_INFO[recordFilter]?.label;

  filterButtons.forEach((button) => {
    const isSelected = button.dataset.filter === recordFilter;
    button.classList.toggle("is-active", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });

  recordList.replaceChildren(...visible.map(createRecordItem));

  recordCount.textContent =
    records.length === 0
      ? ""
      : recordFilter === "all"
        ? `기록 ${records.length}개를 모두 보고 있어요.`
        : `전체 기록 ${records.length}개 중 '${filterLabel}' ${visible.length}개를 보고 있어요.`;

  // 기록 자체가 없는 경우와 선택한 조건에 맞는 기록만 없는 경우를 구분
  const isFilteredEmpty = records.length > 0 && visible.length === 0;
  recordEmpty.hidden = visible.length > 0;
  recordEmpty.textContent = isFilteredEmpty
    ? `'${filterLabel}' 상태의 기록이 없어요. 다른 상태를 고르거나 전체 보기를 눌러보세요.`
    : "아직 남긴 기록이 없어요. 첫 기록을 남겨보세요!";
  recordShowAll.hidden = !isFilteredEmpty;
}

function setRecordFilter(filter) {
  recordFilter = filter;
  renderRecords();
}

filterButtons.forEach((button) => {
  button.addEventListener("click", () => setRecordFilter(button.dataset.filter));
});
recordShowAll.addEventListener("click", () => {
  setRecordFilter("all");
  filterButtons[0].focus();
});

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
    const isToday = key === todayKey;
    const isRecorded = recordedDays.has(key);
    day.classList.toggle("is-today", isToday);
    day.classList.toggle("is-recorded", isRecorded);
    // 색만으로 구분하지 않도록 ✓ 기호와 스크린 리더용 문구를 함께 표시
    const notes = [isToday && "오늘", isRecorded ? "기록함" : "기록 없음"]
      .filter(Boolean)
      .join(", ");
    day.innerHTML =
      `<span>${dayNames[i]}</span><strong>${date.getDate()}</strong>` +
      `<span class="day-mark" aria-hidden="true">${isRecorded ? "✓" : ""}</span>` +
      `<span class="visually-hidden">${notes}</span>`;
    return day;
  });

  calendarEl.replaceChildren(...days);
  const weekCount = days.filter((day) =>
    day.classList.contains("is-recorded"),
  ).length;
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
  updateTitleCounter();
  if (searchTitleInput.classList.contains("is-invalid")) validateTitle();
  bookSearchStatus.classList.remove("is-empty");
  bookSearchStatus.textContent = `『${book.title}』을(를) 골랐어요. '다음'을 눌러 목표를 정해주세요.`;
  renderSelected();
}

function unselectBook() {
  searchState.selected = null;
  searchTitleInput.value = "";
  searchAuthorInput.value = "";
  updateTitleCounter();
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
const AMOUNT_LABELS = {
  "10p": "10쪽",
  "20p": "20쪽",
  "30m": "30분",
  "60m": "1시간",
};
const NOTIFY_METHOD_LABELS = { push: "앱 푸시", email: "이메일" };
const TITLE_MAX = 30;
const GOALS_STORAGE_KEY = "bookmark-goals";
const SUBMIT_DELAY = 800;

const goalSection = document.querySelector("#goal");
const goalForm = document.querySelector("#goal-form");
const goalSteps = goalForm.querySelectorAll(".goal-step");
const stepperItems = goalSection.querySelectorAll(".stepper li");
const goalStatus = document.querySelector("#goal-status");
const goalTitle = document.querySelector("#goal-title");
const goalAuthor = document.querySelector("#goal-author");
const goalAmount = document.querySelector("#goal-amount");
const goalNotify = document.querySelector("#goal-notify");
const notifyOptions = document.querySelector("#notify-options");
const goalNotifyTime = document.querySelector("#goal-notify-time");
const titleCounter = document.querySelector("#goal-title-counter");
const goalSubmit = document.querySelector("#goal-submit");
const goalSubmitFeedback = document.querySelector("#goal-submit-feedback");
const cycleFieldset = goalForm.querySelector("fieldset");

let goalState = {
  step: 1,
  title: "",
  author: "",
  cycle: "",
  amount: "",
  notify: false,
  notifyTime: "",
  notifyMethod: "",
  pages: 0,
  completed: false,
  submitting: false,
};

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
  if (step !== 4) resetSubmitState();
}

function focusStepHeading() {
  goalForm
    .querySelector(`.goal-step[data-step="${goalState.step}"] h3`)
    .focus();
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
  setFieldError(
    goalTitle,
    document.querySelector("#goal-title-error"),
    message,
  );
  return message === "" ? null : goalTitle;
}

function validateCycle() {
  const message =
    getSelectedCycle() === "" ? "독서 주기를 하나 선택해주세요." : "";
  setFieldError(
    cycleFieldset,
    document.querySelector("#goal-cycle-error"),
    message,
  );
  return message === "" ? null : cycleFieldset.querySelector("input");
}

// 알림을 받을 때만 시간이 필수
function validateNotifyTime() {
  const message =
    goalNotify.checked && goalNotifyTime.value === ""
      ? "알림 시간을 선택해주세요. 예: 오후 9:00"
      : "";
  setFieldError(
    goalNotifyTime,
    document.querySelector("#goal-notify-time-error"),
    message,
  );
  return message === "" ? null : goalNotifyTime;
}

function validateAmount() {
  const message =
    goalAmount.value === "" ? "하루 목표 분량을 목록에서 골라주세요." : "";
  setFieldError(
    goalAmount,
    document.querySelector("#goal-amount-error"),
    message,
  );
  return message === "" ? null : goalAmount;
}

// 단계별 검증. 통과하면 true, 실패하면 첫 번째 오류 필드로 이동
function validateStep(step) {
  const validators = {
    2: [validateTitle],
    3: [validateCycle, validateAmount, validateNotifyTime],
  };
  const invalidFields = (validators[step] || [])
    .map((validate) => validate())
    .filter(Boolean);

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
    goalState.notifyTime = goalNotify.checked ? goalNotifyTime.value : "";
    goalState.notifyMethod = goalNotify.checked
      ? goalForm.querySelector("input[name='notifyMethod']:checked").value
      : "";
  }
}

// 입력하는 동안 글자 수와 조건 충족 여부를 문구로 표시
function updateTitleCounter() {
  const length = goalTitle.value.trim().length;
  const status =
    length === 0
      ? "책 제목을 입력해주세요"
      : length > TITLE_MAX
        ? `${length - TITLE_MAX}자를 줄여주세요`
        : "✓ 조건 충족";
  titleCounter.textContent = `${length} / ${TITLE_MAX}자 · ${status}`;
  titleCounter.classList.toggle("ok", length > 0 && length <= TITLE_MAX);
  titleCounter.classList.toggle("over", length > TITLE_MAX);
}

// 알림 영역을 숨기면 안쪽 입력도 비활성화해 검증·제출 대상에서 빠지도록 함
function toggleNotifyOptions() {
  const isOn = goalNotify.checked;
  notifyOptions.hidden = !isOn;
  notifyOptions.querySelectorAll("input").forEach((input) => {
    input.disabled = !isOn;
  });
  if (!isOn) validateNotifyTime();
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
    notify: goalState.notify
      ? `받기 · ${goalState.notifyTime} · ${NOTIFY_METHOD_LABELS[goalState.notifyMethod]}`
      : "받지 않기",
    notifyMessage: goalState.notify
      ? `읽는 날 ${goalState.notifyTime}에 ${NOTIFY_METHOD_LABELS[goalState.notifyMethod]} 알림을 보내드릴게요.`
      : "",
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

function showSubmitFeedback(message, status) {
  goalSubmitFeedback.textContent = message;
  goalSubmitFeedback.className = `form-feedback ${status}`;
}

function setSubmitting(isSubmitting) {
  goalState.submitting = isSubmitting;
  goalSubmit.disabled = isSubmitting;
  goalSubmit.textContent = isSubmitting ? "등록 중…" : "목표 등록";
  if (isSubmitting) showSubmitFeedback("목표를 저장하고 있어요…", "pending");
}

function resetSubmitState() {
  setSubmitting(false);
  showSubmitFeedback("", "");
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function readSavedGoals() {
  try {
    return JSON.parse(localStorage.getItem(GOALS_STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

// 실패 조건: 같은 제목의 목표가 이미 저장됨(duplicate) 또는 localStorage 쓰기 오류(storage)
function saveGoal(goal) {
  const goals = readSavedGoals();
  if (goals.some((saved) => saved.title === goal.title)) {
    throw new Error("duplicate");
  }

  const { step, completed, submitting, ...data } = goal;
  try {
    localStorage.setItem(
      GOALS_STORAGE_KEY,
      JSON.stringify([
        ...goals,
        { ...data, createdAt: new Date().toISOString() },
      ]),
    );
  } catch {
    throw new Error("storage");
  }
}

const SUBMIT_ERRORS = {
  duplicate: (title) =>
    `이미 『${title}』 목표가 등록되어 있어요. 책 '수정'을 눌러 다른 책으로 바꾼 뒤 다시 시도해주세요.`,
  storage: () =>
    "목표를 저장하지 못했어요. 입력한 내용은 그대로 있으니 잠시 후 다시 시도해주세요.",
};

async function completeGoal(e) {
  e.preventDefault();
  if (goalState.submitting) return;

  // 확인 단계가 아닐 때 Enter로 제출하면 '다음'처럼 동작
  if (goalState.step !== 4) {
    if (goalState.step < 4) goNext();
    return;
  }

  // 수정이 필요한 단계로 이동해 오류 항목을 안내
  const invalidStep = [2, 3].find((step) => !validateStep(step));
  if (invalidStep) {
    showStep(invalidStep);
    validateStep(invalidStep);
    return;
  }

  setSubmitting(true);
  await wait(SUBMIT_DELAY);

  try {
    saveGoal(goalState);
  } catch (error) {
    setSubmitting(false);
    goalSubmit.textContent = "다시 시도";
    showSubmitFeedback(SUBMIT_ERRORS[error.message](goalState.title), "error");
    goalSubmit.focus();
    return;
  }

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
  toggleNotifyOptions();
  updateTitleCounter();
  goalState = {
    step: 1,
    title: "",
    author: "",
    cycle: "",
    amount: "",
    notify: false,
    notifyTime: "",
    notifyMethod: "",
    pages: 0,
    completed: false,
    submitting: false,
  };
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
  if (name === "title") updateTitleCounter();
  if (name === "notify") toggleNotifyOptions();
  if (name === "notifyTime" && goalNotifyTime.classList.contains("is-invalid"))
    validateNotifyTime();
  if (name === "title" && goalTitle.classList.contains("is-invalid"))
    validateTitle();
  if (name === "cycle" && cycleFieldset.classList.contains("is-invalid"))
    validateCycle();
  if (name === "amount" && goalAmount.classList.contains("is-invalid"))
    validateAmount();
}

goalForm.addEventListener("click", handleGoalClick);
goalForm.addEventListener("submit", completeGoal);
goalForm.addEventListener("input", handleGoalFieldChange);
goalForm.addEventListener("change", handleGoalFieldChange);

showStep(1);

// ===== 6. 메뉴 이동 · 현재 위치 · 모바일 메뉴 (9주차) =====
const navToggle = document.querySelector(".nav-toggle");
const mainMenu = document.querySelector("#main-menu");
const menuLinks = mainMenu.querySelectorAll("a[href^='#']");
const menuSections = Array.from(menuLinks, (link) =>
  document.querySelector(link.getAttribute("href")),
);
// 섹션 윗부분이 화면 위에서 이 거리 안으로 들어오면 현재 위치로 봄
const CURRENT_OFFSET = 120;

function setCurrentMenu(id) {
  menuLinks.forEach((link) => {
    const isCurrent = link.getAttribute("href") === `#${id}`;
    link.classList.toggle("is-current", isCurrent);
    if (isCurrent) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

// 실제 스크롤 위치 기준으로 현재 섹션 계산 (새로고침·뒤로 가기·직접 스크롤 모두 대응)
function updateCurrentFromScroll() {
  const atBottom =
    window.innerHeight + window.scrollY >=
    document.documentElement.scrollHeight - 2;
  // 페이지 끝에서는 더 내려갈 수 없어 아래쪽 섹션이 위에 닿지 못함
  // → 메뉴로 이동한 섹션이 화면에 보이면 그 섹션, 아니면 마지막 섹션
  const hashSection = menuSections.find(
    (section) => `#${section.id}` === location.hash,
  );
  const isHashVisible =
    hashSection &&
    hashSection.getBoundingClientRect().top < window.innerHeight &&
    hashSection.getBoundingClientRect().bottom > 0;
  const current = atBottom
    ? isHashVisible
      ? hashSection
      : menuSections[menuSections.length - 1]
    : menuSections
        .filter((section) => section.getBoundingClientRect().top <= CURRENT_OFFSET)
        .pop() || menuSections[0];
  setCurrentMenu(current.id);
}

let scrollTicking = false;
function handleScroll() {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(() => {
    updateCurrentFromScroll();
    scrollTicking = false;
  });
}

function handleHashChange() {
  const id = location.hash.slice(1);
  if (menuSections.some((section) => section.id === id)) setCurrentMenu(id);
}

// 메뉴 표시 상태·버튼 문구·aria-expanded를 함께 변경
function setMenuOpen(isOpen) {
  mainMenu.classList.toggle("is-open", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.textContent = isOpen ? "메뉴 닫기" : "메뉴 열기";
}

navToggle.addEventListener("click", () => {
  setMenuOpen(navToggle.getAttribute("aria-expanded") !== "true");
});

menuLinks.forEach((link) => {
  link.addEventListener("click", () => setMenuOpen(false));
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape" || !mainMenu.classList.contains("is-open")) return;
  setMenuOpen(false);
  navToggle.focus();
});

window.addEventListener("scroll", handleScroll, { passive: true });
window.addEventListener("hashchange", handleHashChange);
window.addEventListener("load", updateCurrentFromScroll);
handleHashChange();
if (!location.hash) setCurrentMenu(menuSections[0].id);
