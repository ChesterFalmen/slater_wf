// Призи з українським текстом, англійськими ключами та відсотками випадіння
const prizes = [
{
  text: "Купон 100 грн",
  color: "#ffffff",
  key: "SALE100",
  value: "100 UAH discount",
  type: "discount",
  amount: 100,
  promoCode: "SALE100",
  probability: 100 // 10%
},
{
  text: "Знижка - 5%",
  color: "#c41e3a",
  key: "SALE5",
  value: "5% discount",
  type: "discount",
  amount: 5,
  promoCode: "SALE5",
  probability: 60 // 35%
},
{
  text: "Доставка FREE",
  color: "#2c2c2c",
  key: "FREESHIP",
  value: "Free delivery",
  type: "delivery",
  amount: 0,
  promoCode: "FREESHIP",
  probability: 20 // 20%
},
{
  text: "Купон 200 грн",
  color: "#ffffff",
  key: "SALE200",
  value: "200 UAH discount",
  type: "discount",
  amount: 200,
  promoCode: "SALE200",
  probability: 14 // 11%
},
{
  text: "Знижка - 4%",
  color: "#c41e3a",
  key: "4% discount",
  value: "discount",
  type: "gift",
  amount: 4,
  promoCode: "SALE4",
  probability: 10 // 10%
},
{
  text: "Купон 300 грн",
  color: "#2c2c2c",
  key: "SALE300",
  value: "300 UAH discount",
  type: "discount",
  amount: 300,
  promoCode: "SALE300",
  probability: 1 // 4%
}];

// Функція для вибору призу на основі ймовірності
function selectPrizeByProbability() {
  const totalProbability = prizes.reduce((sum, prize) => sum + prize.probability, 0);
  let random = Math.random() * totalProbability;

  for (let i = 0; i < prizes.length; i++) {
    random -= prizes[i].probability;
    if (random <= 0) {
      return i;
    }
  }

  return 0; // Fallback
}

// Функція для визначення призу на основі кута зупинки
function getPrizeByAngle(finalAngle) {
  const segmentAngle = 360 / prizes.length;
  let normalized = (finalAngle % 360 + 360) % 360; // 0–360
  // Зсовуємо, щоб 0° відповідало початку першого сегмента (-90°)
  const adjusted = (normalized + 90) % 360;
  const segmentIndex = Math.floor(adjusted / segmentAngle);
  console.log(
    `🎯 finalAngle: ${normalized.toFixed(1)}°, adjusted: ${adjusted.toFixed(1)}°, index: ${segmentIndex}`
  );
  return segmentIndex;
}

let isSpinning = false;
let currentRotation = 0;
let animationId = null;

// Елементи DOM
const modal = document.getElementById('wheelModal');
const openModalLink = document.getElementById('banner_link_golovna');
const openModalBtn = document.getElementById('openModal');
const closeBtn = document.querySelector('.close');
const spinButton = document.getElementById('spinButton');
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const screenOverlay = document.querySelector('.screen-overlay');
const resetSpinsBtn = document.getElementById('resetSpinsBtn'); // НОВЕ

// === НОВЕ: перевірка, чи вже крутили ===
function hasSpun() {
  try {
    const stats = JSON.parse(localStorage.getItem('wheel_stats') || '{}');
    return (stats.total_spins || 0) >= 1;
  } catch (e) {
    return false;
  }
}

function updateSpinButtonState() {
  if (hasSpun()) {
    spinButton.disabled = true;
    spinButton.textContent = 'Ви вже крутили';
    spinButton.classList.add('used');
  } else if (!isSpinning) {
    spinButton.disabled = false;
    spinButton.textContent = 'Крутити колесо';
    spinButton.classList.remove('used');
  }
}

// Відкриття модального вікна
openModalBtn.addEventListener('click', () => {
  modal.classList.add('show');
  modal.classList.remove('hide');
  screenOverlay.classList.add('active');
  document.body.classList.add('overlay-lock');
  drawWheel();
  updateSpinButtonState();
  // Якщо збережено виграш – одразу показуємо поп-ап
  const saved = window.getWheelWin && window.getWheelWin();
  if (saved) showResultPopup(saved);
});

if (openModalLink) {
  openModalLink.addEventListener('click', () => {
    modal.classList.add('show');
    modal.classList.remove('hide');
    screenOverlay.classList.add('active');
    document.body.classList.add('overlay-lock');
    drawWheel();
    updateSpinButtonState();
    // Якщо збережено виграш – одразу показуємо поп-ап
    const saved = window.getWheelWin && window.getWheelWin();
    if (saved) showResultPopup(saved);
  });
}

// Закриття модального вікна
closeBtn.addEventListener('click', () => {
  modal.classList.add('hide');
  modal.classList.remove('show');
  screenOverlay.classList.remove('active');
  document.body.classList.remove('overlay-lock');
  // Зупиняємо постійне обертання
  stopIdleRotation();
  // Приховуємо модальне вікно після анімації
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);
});

// Закриття при кліку поза модальним вікном
window.addEventListener('click', (e) => {
  if (e.target === modal || e.target === screenOverlay) {
    modal.classList.add('hide');
    modal.classList.remove('show');
    screenOverlay.classList.remove('active');
    document.body.classList.remove('overlay-lock');
    // Зупиняємо постійне обертання
    stopIdleRotation();
    // Приховуємо модальне вікно після анімації
    setTimeout(() => {
      modal.style.display = 'none';
    }, 300);
  }
});

// Завантажуємо логотип один раз
const logoImage = new Image();
logoImage.src =
  'https://cdn.prod.website-files.com/6511ef558d67afe353cac882/691df5edd0cd53b9f2167ade_logo_black.png';

// Малювання колеса
function drawWheel() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 190; // Збільшив радіус для більшої рулетки
  const segmentAngle = (2 * Math.PI) / prizes.length;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Створюємо рівномірну темну тінь навколо кола
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Малюємо невидиме коло для створення тіні
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.01)'; // Майже прозоре
  ctx.fill();
  ctx.restore();

  prizes.forEach((prize, index) => {
    const startAngle = index * segmentAngle - Math.PI / 2;
    const endAngle = (index + 1) * segmentAngle - Math.PI / 2;

    // Малюємо сегмент без бордерів
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = prize.color;
    ctx.fill();

    // Додаємо текст радіально (від центру до краю)
    const textAngle = startAngle + segmentAngle / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(textAngle);

    // Колір тексту залежно від кольору сегмента
    ctx.fillStyle = prize.color === '#ffffff' ? '#000' : '#fff';
    ctx.font = 'bold 24px Arial'; // Збільшений шрифт для більшої рулетки
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Розміщуємо текст від центру до краю з відступом (збільшені значення)
    const textStartRadius = 65; // Збільшений відступ від центру
    const textEndRadius = radius - 20; // Збільшений відступ від краю
    const textCenterRadius = (textStartRadius + textEndRadius) / 2;

    // Максимальна ширина тексту (довжина доступного простору)
    const maxTextLength = textEndRadius - textStartRadius;
    const textWidth = ctx.measureText(prize.text).width;

    if (textWidth > maxTextLength) {
      // Розбиваємо текст на слова для переносу
      const words = prize.text.split(' ');
      if (words.length > 1) {
        const midPoint = Math.ceil(words.length / 2);
        const firstLine = words.slice(0, midPoint).join(' ');
        const secondLine = words.slice(midPoint).join(' ');

        // Розміщуємо 2 рядки перпендикулярно до радіуса (один над іншим)
        ctx.fillText(firstLine, textCenterRadius, -10); // Перший рядок вище
        ctx.fillText(secondLine, textCenterRadius, 10); // Другий рядок нижче
      } else {
        // Якщо одне довге слово, зменшуємо шрифт
        ctx.font = 'bold 14px Arial';
        ctx.fillText(prize.text, textCenterRadius, 0);
      }
    } else {
      // Текст поміщається в один рядок
      ctx.fillText(prize.text, textCenterRadius, 0);
    }

    ctx.restore();
  });

  // Центральне коло зі світлим фоном (збільшене)
  ctx.beginPath();
  ctx.arc(centerX, centerY, 45, 0, 2 * Math.PI);
  ctx.fillStyle = '#212121';
  ctx.fill();
  ctx.strokeStyle = 'rgba(213,213,213,0.25)'; // #D5D5D540
  ctx.lineWidth = 8;
  ctx.stroke();

  // Логотип малюємо окремим елементом .center-logo, тому на canvas пропускаємо
}

// Функція обертання з реалістичною анімацією
function spinWheel() {
  if (isSpinning || hasSpun()) return; // НОВЕ: не даємо крутити вдруге

  isSpinning = true;
  spinButton.classList.add('spinning');
  spinButton.disabled = true;
  spinButton.textContent = 'Крутиться...';

  // Зупиняємо постійне обертання під час спіну
  stopIdleRotation();

  // ========== СИСТЕМА З ЙМОВІРНОСТЯМИ ==========

  // 1️⃣ СИНХРОНІЗУЄМО ПОТОЧНУ ПОЗИЦІЮ КОЛЕСА
  const computedStyle = window.getComputedStyle(canvas);
  const matrix = computedStyle.transform;

  let realCurrentRotation = currentRotation;

  if (matrix && matrix !== 'none') {
    const values = matrix.split('(')[1].split(')')[0].split(',');
    const a = parseFloat(values[0]);
    const b = parseFloat(values[1]);
    realCurrentRotation = Math.atan2(b, a) * (180 / Math.PI);
    if (realCurrentRotation < 0) realCurrentRotation += 360;
    realCurrentRotation = -realCurrentRotation;
    if (realCurrentRotation < 0) realCurrentRotation += 360;
  }

  currentRotation = realCurrentRotation;
  console.log(`🔄 Поточна позиція колеса: ${currentRotation.toFixed(1)}°`);

  // 2️⃣ ВИБИРАЄМО ПРИЗ НА ОСНОВІ ЙМОВІРНОСТІ
  const selectedPrizeIndex = selectPrizeByProbability();
  const selectedPrize = prizes[selectedPrizeIndex];

  console.log(
    `🎲 ВИБРАНО ЗА ЙМОВІРНІСТЮ: "${selectedPrize.text}" (індекс ${selectedPrizeIndex}, ймовірність: ${selectedPrize.probability}%)`
  );

  // 3️⃣ РОЗРАХОВУЄМО ЦІЛЬОВИЙ КУТ ДЛЯ ВИБРАНОГО ПРИЗУ
  const turns = 8 + Math.floor(Math.random() * 3); // 8-10 повних обертів
  const finalRotation = 360 * turns + centerDegCW[selectedPrizeIndex]; // CW
  console.log(
    `🎯 Центр сегмента CW: ${centerDegCW[selectedPrizeIndex]}°, оберти: ${turns}, finalRotation: ${finalRotation}`
  );

  // Запускаємо CSS-анімацію
  canvas.style.setProperty('--rotate', finalRotation + 'deg');
  window._plannedPrize = selectedPrize;
  window._rotationCW = finalRotation;
  isSpinning = true; // позначка

  // Далі чекаємо подію transitionend на canvas
}

// Функція збереження виграшу з англійськими ключами
function saveWin(prize) {
  try {
    // Зберігаємо поточний активний виграш для замовлення
    const currentWin = {
      key: prize.key,
      value: prize.value,
      type: prize.type,
      amount: prize.amount,
      text_ua: prize.text,
      promoCode: prize.promoCode,
      date: new Date().toISOString(),
      timestamp: Date.now(),
      used: false
    };

    // Основна змінна для використання при замовленні
    localStorage.setItem('wheel_current_win', JSON.stringify(currentWin));

    // Історія всіх виграшів
    const wins = JSON.parse(localStorage.getItem('wheel_wins_history') || '[]');
    wins.push(currentWin);
    localStorage.setItem('wheel_wins_history', JSON.stringify(wins));

    // Статистика
    const stats = JSON.parse(localStorage.getItem('wheel_stats') || '{}');
    stats.total_spins = (stats.total_spins || 0) + 1;
    stats.total_wins = (stats.total_wins || 0) + 1;
    stats.last_prize_key = prize.key;
    stats.last_prize_value = prize.value;
    stats.last_win_date = new Date().toISOString();

    localStorage.setItem('wheel_stats', JSON.stringify(stats));

    console.log('Win saved:', currentWin);
  } catch (error) {
    console.error('Error saving win:', error);
  }
}

// Функції для роботи з виграшем при замовленні
window.getWheelWin = function () {
  try {
    const win = localStorage.getItem('wheel_current_win');
    return win ? JSON.parse(win) : null;
  } catch (error) {
    console.error('Error getting wheel win:', error);
    return null;
  }
};

window.useWheelWin = function () {
  try {
    const win = window.getWheelWin();
    if (win && !win.used) {
      win.used = true;
      win.used_date = new Date().toISOString();
      localStorage.setItem('wheel_current_win', JSON.stringify(win));
      return win;
    }
    return null;
  } catch (error) {
    console.error('Error using wheel win:', error);
    return null;
  }
};

window.clearWheelWin = function () {
  try {
    localStorage.removeItem('wheel_current_win');
    return true;
  } catch (error) {
    console.error('Error clearing wheel win:', error);
    return false;
  }
};

// Функція постійного легкого обертання
function idleRotation() {
  if (!isSpinning) {
    currentRotation += idleRotationSpeed;
    canvas.style.transform = `rotate(${-currentRotation}deg)`;
  }
  animationId = requestAnimationFrame(idleRotation);
}

// Зупинка постійного обертання
function stopIdleRotation() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}

// Обробник кнопки крутити
spinButton.addEventListener('click', spinWheel);

// Функція показу поп-апу з результатом
function showResultPopup(winner) {
  const resultPopup = document.getElementById('resultPopup');
  const resultPrize = document.getElementById('resultPrize');
  const promoInput = document.getElementById('promoInput');

  // Використовуємо фіксований промокод з масиву призів
  const promoCode = winner.promoCode || 'NOCODE';

  const prizeText = (winner.text || winner.text_ua || '').toUpperCase();
  resultPrize.textContent = prizeText;

  // Додаємо промокод в інпут
  if (promoInput) {
    promoInput.value = promoCode;
  }

  resultPopup.style.display = 'flex';
}

// Обробники для поп-апу результату
const resultPopup = document.getElementById('resultPopup');
const closeResultBtn = document.getElementById('closeResultBtn');
const closeResultX = document.querySelector('.close-result');

// Закриття поп-апу результату
function closeResultPopup() {
  resultPopup.style.display = 'none';
}

// Копіювання промокоду при натисканні основної кнопки (якщо кнопка існує)
if (closeResultBtn) {
  closeResultBtn.addEventListener('click', () => {
    copyPromoCode();
    setTimeout(closeResultPopup, 1000); // Закриваємо через секунду після копіювання
  });
}

closeResultX.addEventListener('click', closeResultPopup);

// Закриття при кліку поза поп-апом
resultPopup.addEventListener('click', (e) => {
  if (e.target === resultPopup) {
    closeResultPopup();
  }
});

// Ініціальне малювання при завантаженні
window.addEventListener('load', () => {
  updateSpinButtonState();
  if (modal.classList.contains('show')) {
    drawWheel();
  }
  // showSavedWinIfAny(); // НОВЕ
});

// ===== transitionend =====
canvas.addEventListener('transitionend', () => {
  if (!isSpinning) return; // ігноруємо зайві події
  const rot = window._rotationCW % 360;
  const hitIdx = centerDegCW.indexOf(rot);
  console.log('🔚 transitionend, rot', rot, 'hitIdx', hitIdx);
  const prize = prizes[hitIdx !== -1 ? hitIdx : 0];
  showResultPopup(prize);
  saveWin(prize);
  isSpinning = false;
  // Негайно блокуємо кнопку назавжди
  spinButton.disabled = true;
  spinButton.textContent = 'Ви вже крутили';
  spinButton.classList.add('used');
  updateSpinButtonState(); // на випадок синхронізації
});

// після масиву prizes
const centerDegCW = [330, 270, 210, 150, 90, 30];

// === НОВЕ: скидання прокрутів ===
function resetSpins() {
  localStorage.removeItem('wheel_stats');
  localStorage.removeItem('wheel_wins_history');
  localStorage.removeItem('wheel_current_win');
  updateSpinButtonState();
  alert('Прокрути очищено');
}

if (resetSpinsBtn) {
  resetSpinsBtn.addEventListener('click', resetSpins);
}

// === НОВЕ: показ збереженого виграшу ===
function showSavedWinIfAny() {
  const saved = window.getWheelWin && window.getWheelWin();
  if (saved) {
    // Відкриваємо модалку, якщо ще не відкрита
    modal.style.display = 'flex';
    modal.classList.add('show');
    modal.classList.remove('hide');
    screenOverlay.classList.add('active');
    document.body.classList.add('overlay-lock');
    drawWheel();
    updateSpinButtonState();
    // Затримка, аби модалка зʼявилась, тоді показуємо поп-ап
    setTimeout(() => showResultPopup(saved), 150);
  }
}
