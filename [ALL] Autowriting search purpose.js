window.Webflow ||= [];
window.Webflow.push(() => {
  const searchInput = document.querySelector('input[type="search"]');
  if (!searchInput) return;

  const PHRASES = [
    'Ланцюгова пила',
    'Акумулятор',
    'Шабельна пила',
    'Шурупокрут',
    'КШМ',
    'Перфоратор',
    'Лобзик',
    'Культиватор',
    'Подовжувач',
  ];

  const DELAY = {
    type: 100,
    delete: 50,
    pause: 2000,
    next: 500,
    resume: 1000,
    idle: 3000,
  };

  let phraseIdx = 0;
  let charIdx = 0;
  let deleting = false;
  let paused = false;
  let timerId = null;

  const schedule = (fn, ms) => { timerId = setTimeout(fn, ms); };

  const type = () => {
    if (paused) { schedule(type, DELAY.idle); return; }

    const phrase = PHRASES[phraseIdx];

    if (!deleting) {
      searchInput.placeholder = phrase.substring(0, ++charIdx);
      if (charIdx === phrase.length) {
        deleting = true;
        schedule(type, DELAY.pause);
      } else {
        schedule(type, DELAY.type);
      }
    } else {
      searchInput.placeholder = phrase.substring(0, --charIdx);
      if (charIdx === 0) {
        deleting = false;
        phraseIdx = (phraseIdx + 1) % PHRASES.length;
        schedule(type, DELAY.next);
      } else {
        schedule(type, DELAY.delete);
      }
    }
  };

  searchInput.addEventListener('focus', () => {
    paused = true;
    clearTimeout(timerId);
    searchInput.placeholder = '';
  });

  searchInput.addEventListener('blur', () => {
    if (searchInput.value) return;
    paused = false;
    charIdx = 0;
    deleting = false;
    schedule(type, DELAY.resume);
  });

  type();
});
