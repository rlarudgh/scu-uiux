// 탭
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
