window.Webflow ||= [];
window.Webflow.push(() => {
  // Якщо немає жодного модала на сторінці — нічого не робимо
  if (!document.querySelector("[modal]")) return;

  function openModal(modalName) {
    const modal = document.querySelector(`[modal="${modalName}"]`);
    if (modal) {
      modal.style.display = "flex";
      document.body.style.overflow = "hidden"; // блокує вертикальний
      document.body.style.overflowX = "hidden"; // блокує горизонтальний
    }
  }

  function closeModal(modal) {
    if (modal) {
      modal.style.display = "none";

      // Перевіряємо, чи є ще відкриті модалки
      const anyModalOpen = document.querySelector('[modal][style*="display: flex"]');
      if (!anyModalOpen) {
        document.body.style.overflow = ""; // повертаємо вертикальний
        document.body.style.overflowX = ""; // повертаємо горизонтальний
      }
    }
  }

  // Відкриття по [modal-open="popup1"]
  document.querySelectorAll("[modal-open]").forEach(button => {
    button.addEventListener("click", () => {
      openModal(button.getAttribute("modal-open"));
    });
  });

  // Закриття по .modal-close всередині відповідного [modal]
  document.querySelectorAll(".modal-close").forEach(button => {
    button.addEventListener("click", () => {
      const modal = button.closest("[modal]");
      closeModal(modal);
    });
  });

  // Закриття по кліку на бекдроп ([modal] контейнер)
  document.querySelectorAll("[modal]").forEach(modal => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) { // клікаємо саме по контейнеру, а не по контенту
        closeModal(modal);
      }
    });
  });
});
