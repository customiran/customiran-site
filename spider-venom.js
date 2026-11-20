(() => {
  'use strict';

  const { comic } = window.customCatalogData;
  const { bindFilter, productHref } = window.catalogControls;
  const section = document.querySelector('#spider-venom');
  const grid = section.querySelector('.comic-grid');
  const filter = section.querySelector('.comic-filter');
  const filterTrigger = filter.querySelector('.catalog-filter-trigger');
  const filterOptions = filter.querySelector('.comic-filter-options');
  const filterStatus = section.querySelector('#comic-filter-status');
  const gallery = document.querySelector('#comic-detail');
  const galleryTitle = gallery.querySelector('h2');
  const galleryImage = gallery.querySelector('#comic-detail-image');
  const originalImage = gallery.querySelector('.comic-image-original');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const formatCount = new Intl.NumberFormat('fa');
  let galleryTrigger;

  const title = section.querySelector('h2');
  title.textContent = comic.title;
  title.setAttribute('aria-label', `${comic.title}، اسپایدرمن و ونوم`);
  filter.querySelector('.comic-filter-label').textContent = comic.filter;
  section.querySelector('.comic-portrait-image').src = comic.portrait;
  section.querySelector('.comic-signature').src = comic.signature;
  gallery.querySelector('#comic-order-link').textContent = comic.contact_action;

  function openDetails(product, trigger, event) {
    galleryTrigger = trigger;
    gallery.classList.toggle('animate-dialog', event.detail > 0 && !reduceMotion.matches);
    galleryTitle.textContent = product.name;
    galleryImage.width = product.detail_width;
    galleryImage.height = product.detail_height;
    galleryImage.alt = product.alt_fa;
    galleryImage.src = product.detail_reference;
    originalImage.href = product.detail_reference;
    gallery.showModal();
  }

  function makeCard(product) {
    const card = document.createElement('article');
    card.className = 'comic-card';
    card.dataset.model = product.id;
    card.style.setProperty('--comic-row', product.desktop_row);
    card.style.setProperty('--comic-column', product.desktop_column_from_left);

    const href = productHref(product.product_url);
    const control = document.createElement(href ? 'a' : 'button');
    control.className = 'comic-card-control';
    if (href) control.href = href;
    else {
      control.type = 'button';
      control.setAttribute('aria-haspopup', 'dialog');
      control.addEventListener('click', event => openDetails(product, control, event));
    }
    control.innerHTML = `
      <img class="comic-card-photo" loading="lazy" decoding="async">
      <span class="comic-card-caption">
        <span class="comic-card-name" dir="ltr" lang="en"></span>
        <span class="comic-card-action" dir="rtl"></span>
      </span>`;

    const image = control.querySelector('img');
    image.width = product.image_width;
    image.height = product.image_height;
    image.alt = product.alt_fa;
    image.src = product.image;
    const name = control.querySelector('.comic-card-name');
    const action = control.querySelector('.comic-card-action');
    name.id = `comic-${product.id}-name`;
    name.textContent = product.name;
    action.id = `comic-${product.id}-action`;
    action.textContent = comic.product_action;
    control.setAttribute('aria-labelledby', `${action.id} ${name.id}`);
    card.append(control);
    return card;
  }

  const cards = comic.products.map(makeCard);
  grid.append(...cards);
  const filterChoices = [{ id: 'all', name: 'همه مدل‌ها' }, ...comic.products];
  for (const choice of filterChoices) {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'comic-model';
    input.value = choice.id;
    input.checked = choice.id === 'all';
    const name = document.createElement('span');
    name.textContent = choice.name;
    if (choice.id !== 'all') {
      name.lang = 'en';
      name.dir = 'ltr';
    }
    label.append(input, name);
    filterOptions.append(label);
  }

  bindFilter(filter, value => {
    const showAll = value === 'all';
    for (const card of cards) card.hidden = !showAll && card.dataset.model !== value;
    filterTrigger.toggleAttribute('data-filtered', !showAll);
    const selected = filterChoices.find(choice => choice.id === value);
    filterTrigger.setAttribute('aria-label', showAll ? comic.filter : `${comic.filter}، ${selected.name}`);
    filterStatus.textContent = `${formatCount.format(showAll ? cards.length : 1)} مدل نمایش داده شد`;
  });

  gallery.addEventListener('close', () => galleryTrigger?.focus({ preventScroll: true }));
  gallery.addEventListener('click', event => {
    if (event.target === gallery) gallery.close();
  });
})();
