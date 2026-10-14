// 한 줄 기록
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
