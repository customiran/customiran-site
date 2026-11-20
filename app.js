'use strict';

const content = window.heroContent;
const colors = content.color_order.map(id => content.colors.find(color => color.id === id));
const colorById = new Map(colors.map(color => [color.id, color]));
const photoIds = { hero: 'hero-photo', onfoot: 'onfoot-photo', detail: 'detail-photo' };
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const swatches = document.querySelector('.swatches');
const status = document.querySelector('#color-status');
const progress = document.querySelector('#color-progress');
const retry = document.querySelector('#retry-color');
const featuredShoe = document.querySelector('#featured-shoe');
const floatingMotion = featuredShoe.parentElement;
const gallery = document.querySelector('#product-dialog');
const productGrid = document.querySelector('#product-grid');
const searchButton = document.querySelector('#open-search');
const searchPanel = document.querySelector('#catalog-search');
const searchInput = document.querySelector('#product-query');
const swatchButtons = new Map();
const cardItems = new Map();
const imageSets = new Map();

let selected = colorById.get(content.default_color);
let requested = selected;
let requestVersion = 0;
let failedColor = null;
let galleryInvoker = null;

// Each outline traces the exterior view in its supplied 1024 × 1536 sneaker sheet.
const shoeProfiles = {
  blue: {
    box: [110, 70, 478, 317],
    outline: [[112, 368], [113, 334], [119, 315], [125, 251], [127, 218], [132, 206], [139, 169], [147, 143], [161, 135], [207, 128], [264, 114], [265, 102], [275, 85], [285, 74], [292, 72], [304, 82], [320, 103], [331, 124], [328, 128], [342, 143], [347, 160], [361, 184], [366, 201], [384, 225], [406, 239], [434, 248], [471, 265], [526, 276], [554, 283], [570, 294], [580, 310], [582, 324], [586, 330], [582, 344], [562, 359], [519, 373], [467, 379], [397, 382], [159, 383], [123, 379]]
  },
  green: {
    box: [98, 69, 428, 285],
    outline: [[101, 337], [101, 307], [104, 293], [108, 244], [110, 221], [114, 191], [118, 181], [119, 154], [125, 140], [139, 129], [173, 126], [216, 112], [241, 111], [238, 98], [244, 85], [254, 75], [266, 71], [277, 83], [291, 108], [303, 134], [311, 159], [313, 180], [335, 200], [368, 214], [411, 237], [466, 249], [498, 260], [508, 271], [516, 293], [523, 304], [520, 317], [505, 329], [477, 339], [427, 348], [374, 351], [156, 351], [116, 347]]
  },
  black: {
    box: [78, 80, 389, 261],
    outline: [[81, 295], [86, 280], [91, 264], [105, 251], [124, 245], [160, 239], [179, 231], [196, 215], [218, 205], [239, 194], [267, 185], [273, 154], [282, 133], [296, 107], [306, 92], [319, 83], [330, 87], [341, 99], [345, 111], [339, 128], [364, 130], [399, 139], [428, 143], [436, 149], [440, 161], [447, 189], [452, 199], [457, 250], [461, 282], [464, 319], [462, 329], [450, 333], [420, 336], [333, 337], [212, 339], [153, 336], [113, 327], [90, 314], [82, 305]]
  },
  bone: {
    box: [113, 73, 472, 311],
    outline: [[116, 368], [117, 335], [121, 314], [125, 260], [127, 224], [134, 207], [138, 175], [146, 155], [152, 145], [167, 137], [206, 132], [269, 119], [268, 104], [273, 91], [281, 80], [291, 75], [303, 84], [317, 103], [332, 127], [345, 146], [352, 166], [361, 198], [378, 220], [397, 235], [428, 247], [465, 264], [508, 272], [549, 281], [565, 291], [574, 304], [577, 321], [582, 331], [578, 346], [562, 359], [532, 370], [482, 378], [431, 380], [147, 381], [126, 378]]
  }
};

function renderShoe(element, id) {
  const { box: [left, top, width, height], outline } = shoeProfiles[id];
  const sheet = `assets/sheets/sneaker-sheet-${id}.jpeg`;
  const polygon = outline.map(([x, y]) => `${((x - left) / width * 100).toFixed(2)}% ${((y - top) / height * 100).toFixed(2)}%`);
  element.style.aspectRatio = `${width} / ${height}`;
  element.style.backgroundImage = `url('${sheet}')`;
  element.style.backgroundSize = `${1024 / width * 100}% ${1536 / height * 100}%`;
  element.style.backgroundPosition = `${left / (1024 - width) * 100}% ${top / (1536 - height) * 100}%`;
  element.style.clipPath = `polygon(${polygon.join(', ')})`;
}

function initializeHeader() {
  const localTargets = { home: '#top', collections: '#collection', products: '#custom-catalog', about: '#about' };
  const navigation = document.querySelector('.navigation');
  document.querySelector('.wordmark').textContent = content.brand;
  document.querySelectorAll('#campaign-title span').forEach((line, index) => {
    line.textContent = content.headline_lines[index];
  });
  document.querySelector('#campaign-subtitle').textContent = content.subtitle_fa;
  document.querySelector('#products-title bdi').textContent = content.collection;
  for (const item of content.navigation) {
    const href = item.href ?? localTargets[item.id];
    const node = document.createElement(href ? 'a' : 'span');
    node.dataset.id = item.id;
    node.textContent = item.label_fa;
    if (href) node.setAttribute('href', href);
    else node.setAttribute('aria-disabled', 'true');
    navigation.append(node);
  }

  document.querySelector('#order-link span:last-child').textContent = content.cta.label_fa;
}

function initializeContactLinks() {
  const contactUrl = content.cta.contact_url;
  if (!contactUrl || !/^https?:\/\//i.test(contactUrl)) return;

  for (const link of document.querySelectorAll('[data-contact-link]')) {
    link.href = contactUrl;
    link.removeAttribute('role');
    link.removeAttribute('aria-disabled');
    link.removeAttribute('aria-describedby');
  }
  for (const note of document.querySelectorAll('[data-contact-note]')) note.hidden = true;
}

function initializeSwatches() {
  for (const [index, color] of colors.entries()) {
    const button = document.createElement('button');
    button.className = 'swatch';
    button.type = 'button';
    button.title = color.label;
    button.setAttribute('aria-label', color.label);
    button.style.setProperty('--swatch', color.hex);
    const sample = document.createElement('span');
    sample.className = 'swatch-sample';
    sample.setAttribute('aria-hidden', 'true');
    button.append(sample);
    button.addEventListener('click', event => selectColor(color, event.detail > 0));
    button.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const offset = event.key === 'ArrowRight' ? 1 : -1;
      const next = colors[(index + offset + colors.length) % colors.length];
      swatchButtons.get(next.id).focus();
      selectColor(next, false);
    });
    swatchButtons.set(color.id, button);
    swatches.append(button);
  }
}

function loadPhotoSet(color, priority = 'auto') {
  if (!imageSets.has(color.id)) {
    const photos = Object.entries(photoIds).map(async ([view, id]) => {
      const asset = color.assets[view];
      const image = new Image(asset.width, asset.height);
      image.id = id;
      image.alt = asset.alt_fa;
      image.fetchPriority = priority === 'low' || view !== 'hero' ? 'low' : 'auto';
      image.src = asset.path;
      await image.decode();
      return image;
    });
    imageSets.set(color.id, Promise.all(photos).catch(error => {
      imageSets.delete(color.id);
      throw error;
    }));
  }
  return imageSets.get(color.id);
}

function updateSelection(color, animate) {
  for (const [id, button] of swatchButtons) {
    button.setAttribute('aria-pressed', String(id === color.id));
  }
  const counter = `${color.index} / ${content.counter_total}`;
  document.querySelector('#main-counter').textContent = counter;
  document.querySelector('#detail-counter').textContent = counter;
  progress.style.transitionDuration = animate ? '' : '0ms';
  progress.style.width = `${(colors.indexOf(color) + 1) / colors.length * 100}%`;
  renderShoe(featuredShoe, color.id);
}

function setPending(color) {
  for (const [id, button] of swatchButtons) button.toggleAttribute('data-pending', id === color?.id);
}

async function selectColor(color, allowMotion) {
  if (requested === color && requested !== selected && !failedColor) return;

  const version = ++requestVersion;
  const animate = allowMotion && !reducedMotion.matches;
  requested = color;
  failedColor = null;
  retry.hidden = true;
  setPending(null);

  if (selected === color) {
    status.textContent = '';
    return;
  }

  setPending(color);
  status.textContent = content.status_messages_fa.loading;
  try {
    const images = await loadPhotoSet(color);
    if (version !== requestVersion) return;
    for (const image of images) {
      document.getElementById(image.id).replaceWith(image);
      image.getAnimations().forEach(animation => animation.cancel());
      if (animate) {
        image.animate([{ opacity: .68 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
      }
    }
    selected = color;
    updateSelection(color, animate);
    setPending(null);
    status.textContent = '';
    document.querySelector('#selected-color-announcement').textContent = `رنگ انتخاب‌شده ${color.label}`;
  } catch {
    if (version !== requestVersion) return;
    requested = selected;
    failedColor = color;
    setPending(null);
    status.textContent = content.status_messages_fa.error;
    retry.hidden = false;
  }
}

function stepColor(offset, allowMotion) {
  const nextIndex = (colors.indexOf(requested) + offset + colors.length) % colors.length;
  selectColor(colors[nextIndex], allowMotion);
}

function warmPhotoSets() {
  const otherColors = colors.filter(color => color !== selected);
  const warm = async () => {
    for (const color of otherColors) await loadPhotoSet(color, 'low').catch(() => {});
  };
  if ('requestIdleCallback' in window) window.requestIdleCallback(warm, { timeout: 1400 });
  else window.setTimeout(warm, 600);
}

function initializeCatalog() {
  for (const color of colors) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'product-card';
    button.dataset.color = color.id;
    button.style.setProperty('--swatch', color.hex);
    button.setAttribute('aria-label', `دیدن پاخور و جزئیات کتونی ${color.label}`);
    button.setAttribute('aria-haspopup', 'dialog');
    button.innerHTML = `
      <span class="product-artboard" aria-hidden="true"><span class="product-card-shoe"><span class="shoe-art"></span></span></span>
      <span class="product-card-meta"><span></span><span class="card-open" aria-hidden="true"><span class="diagonal-arrow"></span></span></span>`;
    button.querySelector('.product-card-meta > span').textContent = color.label;
    renderShoe(button.querySelector('.shoe-art'), color.id);
    button.addEventListener('click', event => openGallery(color, button, event.detail > 0));
    cardItems.set(color.id, item);
    item.append(button);
    productGrid.append(item);
  }
}

function openGallery(color, invoker, animate) {
  galleryInvoker = invoker;
  gallery.classList.toggle('animate-dialog', animate && !reducedMotion.matches);
  document.querySelector('#product-title').textContent = `کتونی کاستوم ${color.label}`;
  for (const view of ['onfoot', 'detail']) {
    const image = document.getElementById(`product-${view}`);
    image.alt = color.assets[view].alt_fa;
    image.src = color.assets[view].path;
  }
  gallery.showModal();
}

function filterCatalog() {
  const query = searchInput.value.trim().toLocaleLowerCase('fa');
  let count = 0;
  for (const color of colors) {
    const matches = color.label.includes(query) || color.id.includes(query);
    cardItems.get(color.id).hidden = !matches;
    if (matches) count++;
  }
  document.querySelector('#search-status').textContent = `${new Intl.NumberFormat('fa').format(count)} رنگ پیدا شد`;
  document.querySelector('#no-products').hidden = count !== 0;
}

initializeHeader();
initializeContactLinks();
initializeSwatches();
initializeCatalog();
for (const [view, id] of Object.entries(photoIds)) {
  const image = document.getElementById(id);
  const asset = selected.assets[view];
  image.alt = asset.alt_fa;
  if (image.getAttribute('src') !== asset.path) image.src = asset.path;
}
updateSelection(selected, false);

const initialShoe = new Image();
initialShoe.src = `assets/sheets/sneaker-sheet-${selected.id}.jpeg`;
initialShoe.decode().then(() => {
  if (!reducedMotion.matches) floatingMotion.classList.add('is-floating');
}).catch(() => {});

document.querySelector('#previous-color').addEventListener('click', event => stepColor(-1, event.detail > 0));
document.querySelector('#next-color').addEventListener('click', event => stepColor(1, event.detail > 0));
retry.addEventListener('click', event => selectColor(failedColor, event.detail > 0));
gallery.addEventListener('close', () => galleryInvoker?.focus({ preventScroll: true }));
gallery.addEventListener('click', event => {
  if (event.target === gallery) gallery.close();
});
searchInput.addEventListener('input', filterCatalog);
searchButton.addEventListener('click', () => {
  searchPanel.hidden = false;
  searchButton.setAttribute('aria-expanded', 'true');
  document.querySelector('#products').scrollIntoView({ block: 'start' });
  searchInput.focus({ preventScroll: true });
});
searchInput.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  searchInput.value = '';
  filterCatalog();
  searchPanel.hidden = true;
  searchButton.setAttribute('aria-expanded', 'false');
  searchButton.focus();
});

if (document.readyState === 'complete') warmPhotoSets();
else window.addEventListener('load', warmPhotoSets, { once: true });
