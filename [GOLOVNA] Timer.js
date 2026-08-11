(function () {
  function pad(num) {
    return (num < 10 ? "0" : "") + num;
  }

  function initTimers() {
    var timerBlocks = document.querySelectorAll("[timer-end]");
    for (var i = 0; i < timerBlocks.length; i++) {
      (function (block) {
        var endDateStr = block.getAttribute("timer-end"); // "16.08.2025"
        if (!endDateStr) return;

        var parts = endDateStr.split(".");
        if (parts.length !== 3) return;

        var day = parseInt(parts[0], 10);
        var month = parseInt(parts[1], 10) - 1; // 0–11
        var year = parseInt(parts[2], 10);

        // Стабільний спосіб створити дату
        var endDate = new Date(year, month, day, 0, 0, 0);

        var timerElements = block.querySelectorAll("[data-timer]");

        function updateTimer() {
          var now = new Date();
          var diff = endDate.getTime() - now.getTime();

          var days = 0;
          var hours = "00";
          var minutes = "00";
          var seconds = "00";

          if (diff > 0) {
            days = Math.floor(diff / (1000 * 60 * 60 * 24));
            hours = pad(Math.floor((diff / (1000 * 60 * 60)) % 24));
            minutes = pad(Math.floor((diff / (1000 * 60)) % 60));
            seconds = pad(Math.floor((diff / 1000) % 60));
          }

          for (var j = 0; j < timerElements.length; j++) {
            var el = timerElements[j];
            var type = el.getAttribute("data-timer");
            if (type === "days") {
              el.textContent = days;
            } else if (type === "time-left") {
              el.textContent = hours + ":" + minutes + ":" + seconds;
            }
          }
        }

        // перший запуск
        updateTimer();

        // чи є взагалі елемент з time-left
        var hasTimeLeft = false;
        for (var j = 0; j < timerElements.length; j++) {
          if (timerElements[j].getAttribute("data-timer") === "time-left") {
            hasTimeLeft = true;
            break;
          }
        }

        if (hasTimeLeft) {
          setInterval(updateTimer, 1000);
        }
      })(timerBlocks[i]);
    }
  }

  // Щоб не було проблем, якщо скрипт у <head>
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTimers);
  } else {
    initTimers();
  }
})();
