window.Webflow ||= [];
window.Webflow.push(() => {

  //функції - яка змінює id_crm в атрибутах кнопок save та unsave
  function updateElementsByAttribute(
    container,
    attributeString,
    targetAttribute
  ) {
    // Перевіряємо, чи переданий елемент контейнера існує
    /*if (!container || !(container instanceof HTMLElement)) {
      console.warn("Невірно заданий контейнер.");
      return;
    }*/

    // Розділяємо рядок на назву та значення атрибута
    const [attributeName, attributeValue] = attributeString
      .split("=")
      .map((item) => item.replace(/"/g, "").trim());

    // Знаходимо елемент за першим атрибутом всередині переданого контейнера
    const sourceElement = container.querySelector(
      `[${attributeName}="${attributeValue}"]`
    );

    // Перевіряємо, чи джерело знайдено
    if (sourceElement) {
      const text = sourceElement.textContent.trim(); // Витягуємо текст

      // Знаходимо всі елементи з другим атрибутом всередині контейнера
      const targetElements = container.querySelectorAll(`[${targetAttribute}]`);

      targetElements.forEach((element) => {
        element.setAttribute(targetAttribute, text); // Вставляємо текст у значення атрибута
      });
    } else {
      console.warn(
        `У контейнері не знайдено елемента з атрибутом ${attributeName}="${attributeValue}".`
      );
    }
  }

  // Виклик функції яка включає кнопки save та unsave, а також атрибут для тексту лічильника
  function toggleSavedProduct(
    saveAttribute,
    unsaveAttribute,
    storageKey,
    countTextAttribute
  ) {
    // Функція для оновлення лічильника
    function updateSavedCount() {
      let savedCount = JSON.parse(localStorage.getItem(countTextAttribute)) || 0;

      // Оновлюємо текст у всіх елементах з атрибутом countTextAttribute
      document
        .querySelectorAll(`[${countTextAttribute}]`)
        .forEach((countElement) => {
          let displayCount = savedCount > 9 ? "9+" : savedCount;
          countElement.textContent = displayCount;
        });
    }
    // Виводимо актуальну кількість збережених товарів після завантаження сторінки
    updateSavedCount();

    // Отримуємо список збережених товарів з localStorage
    let savedProducts = JSON.parse(localStorage.getItem(storageKey)) || [];

    // Отримуємо всі елементи з атрибутами saveAttribute та unsaveAttribute
    document
      .querySelectorAll(`[${saveAttribute}], [${unsaveAttribute}]`)
      .forEach((element) => {
        const productId =
          element.getAttribute(saveAttribute) ||
          element.getAttribute(unsaveAttribute);

        // Перевіряємо, чи цей товар збережений
        if (savedProducts.includes(productId)) {
          // Якщо товар збережений, приховуємо кнопку з атрибутом saveAttribute
          if (element.hasAttribute(saveAttribute)) {
            element.style.display = "none"; // Приховуємо кнопку для збережених товарів
          }
          // Показуємо кнопку з атрибутом unsaveAttribute
          if (element.hasAttribute(unsaveAttribute)) {
            element.style.display = "inline-block"; // Показуємо кнопку для збережених товарів
          }
        } else {
          // Якщо товар не збережений, приховуємо кнопку з атрибутом unsaveAttribute
          if (element.hasAttribute(unsaveAttribute)) {
            element.style.display = "none"; // Приховуємо кнопку для незбережених товарів
          }
          // Показуємо кнопку з атрибутом saveAttribute
          if (element.hasAttribute(saveAttribute)) {
            element.style.display =
              "inline-block"; // Показуємо кнопку для незбережених товарів
          }
        }

        // Додаємо обробники кліків на елементи
        element.addEventListener("click", function () {
          if (this.hasAttribute(saveAttribute)) {
            // Якщо товар ще не збережений, додаємо його
            if (!savedProducts.includes(productId)) {
              savedProducts.push(productId);
              let savedCount =
                JSON.parse(localStorage.getItem(countTextAttribute)) || 0;
              savedCount += 1;
              localStorage.setItem(storageKey, JSON.stringify(savedProducts));
              localStorage.setItem(
                countTextAttribute,
                JSON.stringify(savedCount)
              );
              //console.log(`Товар ${productId} збережено.`);
            } else {
              //console.log(`Товар ${productId} вже збережено.`);
            }
          } else if (this.hasAttribute(unsaveAttribute)) {
            // Якщо товар вже збережений, видаляємо його
            const index = savedProducts.indexOf(productId);
            if (index > -1) {
              savedProducts.splice(index, 1);
              let savedCount =
                JSON.parse(localStorage.getItem(countTextAttribute)) || 0;
              savedCount -= 1;
              localStorage.setItem(storageKey, JSON.stringify(savedProducts));
              localStorage.setItem(
                countTextAttribute,
                JSON.stringify(savedCount)
              );
              //console.log(`Товар ${productId} видалено зі збережених.`);
            }
          }

          // Оновлюємо текст у всіх елементах з атрибутом countTextAttribute
          updateSavedCount();
          //console.log("Поточний список збережених товарів:", savedProducts);
        });
      });
  }

  //Буде вимикати та вмикати потрібні кнопки unsave та save
  function SwitchbyAttribute(attribute1, attribute2) {
    // Отримуємо всі елементи з першим і другим атрибутом
    const elementsWithAttribute1 = document.querySelectorAll(`[${attribute1}]`);
    const elementsWithAttribute2 = document.querySelectorAll(`[${attribute2}]`);

    // Додаємо подію кліку для елементів з першим атрибутом
    elementsWithAttribute1.forEach((element) => {
      element.addEventListener("click", () => {
        // Ховаємо всі елементи з першим атрибутом
        elementsWithAttribute1.forEach((el) => (el.style.display = "none"));
        // Показуємо всі елементи з другим атрибутом
        elementsWithAttribute2.forEach((el) => (el.style.display = "flex"));
      });
    });

    // Додаємо подію кліку для елементів з другим атрибутом
    elementsWithAttribute2.forEach((element) => {
      element.addEventListener("click", () => {
        // Ховаємо всі елементи з другим атрибутом
        elementsWithAttribute2.forEach((el) => (el.style.display = "none"));
        // Показуємо всі елементи з першим атрибутом
        elementsWithAttribute1.forEach((el) => (el.style.display = "flex"));
      });
    });
  }

  //

  //

  // для сторінки збережено

  function updateCardsByAttribute(attributeName, targetIdentifierString) {
    // Витягуємо значення з targetIdentifierString
    const targetIdentifier = targetIdentifierString
      .split("=")[1]
      .replace(/"/g, "")
      .trim();

    //console.log("Шуканий targetIdentifier:", targetIdentifier);

    // Знаходимо всі елементи з атрибутом, що відповідає переданому параметру
    const sourceElements = document.querySelectorAll(`[${attributeName}]`);

    // Проходимо через всі знайдені елементи
    sourceElements.forEach((sourceElement) => {
      //console.log("Перевіряємо елемент:", sourceElement);

      // Шукаємо в кожному елементі дочірній елемент з атрибутом identifier, що містить значення targetIdentifier
      const targetElement = sourceElement.querySelector(
        `[identifier="${targetIdentifier}"]`
      );

      // Якщо такий елемент знайдено
      if (targetElement) {
        const text = targetElement.textContent.trim(); // Витягуємо текст з елемента
        //console.log("Знайдено дочірній елемент. Текст:", text);

        // Оновлюємо значення основного атрибута
        sourceElement.setAttribute(attributeName, text);

        // Оновлюємо значення атрибутів data-save, data-unsave
        const saveElement = sourceElement.querySelector("[data-save]");
        const unsaveElement = sourceElement.querySelector("[data-unsave]");

        if (saveElement) {
          saveElement.setAttribute("data-save", text);
          // Приховуємо елемент з data-save
          saveElement.style.display = "none";
          //console.log(`Оновлено data-save: ${text}, елемент приховано.`);
        }

        if (unsaveElement) {
          unsaveElement.setAttribute("data-unsave", text);
          // Залишаємо елемент з data-unsave видимим
          unsaveElement.style.display = "";
          //console.log(`Оновлено data-unsave: ${text}, елемент залишено видимим.`);
        }

        // Оновлюємо значення атрибутів data-poriv-save, data-poriv-unsave
        const porivSaveElement = sourceElement.querySelector("[data-poriv-save]");
        const porivUnsaveElement = sourceElement.querySelector(
          "[data-poriv-unsave]"
        );

        if (porivSaveElement) {
          porivSaveElement.setAttribute("data-poriv-save", text);
          // Приховуємо елемент з data-poriv-save
          porivSaveElement.style.display = "none";
          //console.log(`Оновлено data-poriv-save: ${text}, елемент приховано.`);
        }

        if (porivUnsaveElement) {
          porivUnsaveElement.setAttribute("data-poriv-unsave", text);
          // Залишаємо елемент з data-poriv-unsave видимим
          porivUnsaveElement.style.display = "";
        }

        const characteristic_namesElement = sourceElement.querySelector(
          "[characteristic_names]"
        );

        if (characteristic_namesElement) {
          characteristic_namesElement.setAttribute("characteristic_names", text);
        }

        // console.log(
        //   `Оновлено елемент з ${attributeName}="${sourceElement.getAttribute(
        //     attributeName
        //   )}", data-save="${text}", data-unsave="${text}", data-poriv-save="${text}", data-poriv-unsave="${text}".`
        // );
      } else {
        console.warn(
          `У елементі з ${attributeName}="${sourceElement.getAttribute(
          attributeName
        )}" не знайдено елемента з identifier="${targetIdentifier}".`
        );
      }
    });
  }

  function filterItemsByCollection(
    collectionAttribute,
    itemIdAttribute,
    storageKey
  ) {
    // Отримуємо всі елементи в колекції
    const collectionItems = document.querySelectorAll(
      `[${collectionAttribute}] [${itemIdAttribute}]`
    );

    // Отримуємо збережені ID з localStorage
    const savedItems = JSON.parse(localStorage.getItem(storageKey)) || [];

    collectionItems.forEach((item) => {
      // Отримуємо ID елемента
      const itemId = item.getAttribute(itemIdAttribute);

      // Якщо ID елемента не в списку збережених, видаляємо його з DOM
      if (!savedItems.includes(itemId)) {
        item.remove();
      }
    });

    updateSwiperInstance("first");
  }

  //Запускає фільтрування при кожному збереженні або видаленні на сторінці збережених
  function handleSaveOrUnsaveClick_Save() {
    document.addEventListener("click", function (event) {
      // Перевіряємо, чи клікнули на елемент з атрибутами data-save або data-unsave
      if (
        event.target.hasAttribute("data-save") ||
        event.target.hasAttribute("data-unsave")
      ) {
        // Викликаємо функцію filterItemsByCollection
        filterItemsByCollection(
          'data-collection="saved"',
          "data-item-id",
          "saved_products"
        );
      }
    });
  }

  // Оновлення Swiper за потреби
  function updateSwiperInstance(swiperAttribute) {
    // Знаходимо елемент за атрибутом
    const swiperElement = document.querySelector(
      `[data-swiper="${swiperAttribute}"]`
    );

    // Якщо елемент існує і інстанс Swiper знайдено
    if (swiperElement && swiperInstances[swiperAttribute]) {
      swiperInstances[swiperAttribute].update();
    }
    /*else {
       console.warn(
         `Елемент з атрибутом ${swiperAttribute} або інстанс Swiper не знайдено.`
       );
     }*/
  }

  //Запускає фільтрування при кожному збереженні або видаленні на сторінці порівняння
  function handleSaveOrUnsaveClick_Poriv() {
    document.addEventListener("click", function (event) {
      // Перевіряємо, чи клікнули на елемент з атрибутами data-save або data-unsave
      if (
        event.target.hasAttribute("data-poriv-save") ||
        event.target.hasAttribute("data-poriv-unsave")
      ) {
        // Викликаємо функцію filterItemsByCollection
        filterItemsByCollection(
          'data-collection="poriv"',
          "data-item-id",
          "poriv_products"
        );
      }
    });
  }

  //
  ////////////////////////////////
  // Функціонал збережених
  ////////////////////////////////
  //

  //Запускаються скрипти в залежності від Якщо елемент із атрибутом data-collection="saved" є, або нема
  if (document.querySelector('[data-collection="saved"]')) {
    // Якщо елемент із атрибутом data-collection="saved" існує
    console.log('Елемент з data-collection="saved" знайдено.');

    updateCardsByAttribute("data-item-id", 'identifier="card"');

    filterItemsByCollection(
      'data-collection="saved"',
      "data-item-id",
      "saved_products"
    );

    toggleSavedProduct(
      "data-save",
      "data-unsave",
      "saved_products",
      "saved_count"
    );

    handleSaveOrUnsaveClick_Save
      (); //Запускає фільтрування при кожному збереженні або видаленні на сторінці збережених
    document.querySelector('[data-collection="saved"]').parentElement.style.display = 'block';
  } else {
    // Якщо елемент із атрибутом data-collection="saved" відсутній
    //console.log('Елемент з data-collection="saved" не знайдено.');

    // Виклик функції - яка змінює id_crm в атрибутах кнопок save та unsave
    const product_page = document.getElementById(
      "product_page"); //Буде працювати лише на сторінці продукту
    updateElementsByAttribute(product_page, 'identifier="card"', "data-save");
    updateElementsByAttribute(product_page, 'identifier="card"', "data-unsave");

    // Виклик функції яка включає кнопки save та unsave, а також атрибут для тексту лічильника
    toggleSavedProduct(
      "data-save",
      "data-unsave",
      "saved_products",
      "saved_count"
    );

    //Буде вимикати та вмикати потрібні кнопки unsave та save
    SwitchbyAttribute("data-save", "data-unsave");
  }

  //
  ////////////////////////////////
  // Функціонал порівняння
  ////////////////////////////////
  //

  //Запускаються скрипти в залежності від Якщо елемент із атрибутом data-collection="saved" є, або нема
  if (document.querySelector('[data-collection="poriv"]')) {
    // Якщо елемент із атрибутом data-collection="poriv" існує
    console.log('Елемент з data-collection="poriv" знайдено.');

    updateCardsByAttribute("data-item-id", 'identifier="card"');

    filterItemsByCollection(
      'data-collection="poriv"',
      "data-item-id",
      "poriv_products"
    );

    toggleSavedProduct(
      "data-poriv-save",
      "data-poriv-unsave",
      "poriv_products",
      "poriv-count"
    );

    handleSaveOrUnsaveClick_Poriv
      (); //Запускає фільтрування при кожному збереженні або видаленні на сторінці збережених
  } else {
    // Якщо елемент із атрибутом data-collection="poriv" відсутній
    //console.log('Елемент з data-collection="poriv" не знайдено.');

    // Виклик функції - яка змінює id_crm в атрибутах кнопок save та unsave
    const product_page = document.getElementById(
      "product_page"); //Буде працювати лише на сторінці продукту
    updateElementsByAttribute(
      product_page,
      'identifier="card"',
      "data-poriv-save"
    );
    updateElementsByAttribute(
      product_page,
      'identifier="card"',
      "data-poriv-unsave"
    );

    // Виклик функції яка включає кнопки save та unsave, а також атрибут для тексту лічильника
    toggleSavedProduct(
      "data-poriv-save",
      "data-poriv-unsave",
      "poriv_products",
      "poriv-count"
    );

    //Буде вимикати та вмикати потрібні кнопки unsave та save
    SwitchbyAttribute("data-poriv-save", "data-poriv-unsave");
  }

  ////////////////////////////////////////////
  // Функціонал таблички порівняння Part 1
  ////////////////////////////////////////////

  if (document.querySelector('[data-collection="poriv_table"]')) {
    updateCardsByAttribute("characteristic_card", 'identifier="card"');
    updateCardsByAttribute("characteristic_names", 'identifier="card"');
  }

});
