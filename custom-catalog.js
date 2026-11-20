(() => {
  'use strict';

  const { content, tokens } = window.customCatalogData;
  const { bindFilter, productHref } = window.catalogControls;
  const section = document.querySelector('#custom-catalog');
  const grid = section.querySelector('.custom-catalog-grid');
  const filter = section.querySelector('.catalog-filter');
  const trigger = filter.querySelector('.catalog-filter-trigger');
  const close = filter.querySelector('.catalog-filter-close');
  const options = filter.querySelector('#cut-filter-options');
  const definition = content.filter_definition;
  const status = section.querySelector('#cut-filter-status');
  const formatCount = new Intl.NumberFormat('fa');

  function applyDesignTokens() {
    const { desktop, tablet, mobile, colors, typography, interaction } = tokens;
    const sizes = {
      'reference-width': tokens.reference_artboard.width,
      'desktop-side': desktop.side_padding_px,
      'desktop-gap': desktop.column_gap_px,
      'desktop-grid-top': desktop.grid_top_px,
      'desktop-photo-height': desktop.photo_height_px,
      'desktop-caption-height': desktop.caption_height_px,
      'desktop-row-two': desktop.next_row_top_px,
      'photo-cut': desktop.photo_top_left_cut_px,
      'heading-top': desktop.header.heading_top_px,
      'filter-offset': desktop.header.filter_left_px - desktop.side_padding_px,
      'filter-top-offset': desktop.header.filter_top_px - desktop.header.heading_top_px,
      'filter-width': desktop.header.filter_width_px,
      'filter-height': desktop.header.filter_height_px,
      'campaign-height': desktop.campaign.panel_height_px,
      'raven-height': desktop.campaign.cutout_height_px,
      'wordmark-left': desktop.campaign.wordmark_left_inset_px,
      'wordmark-bottom': desktop.campaign.wordmark_bottom_inset_px,
      'heading-size': typography.heading_px,
      'model-size': typography.product_name_px,
      'view-size': typography.view_label_px,
      'filter-size': typography.filter_label_px,
      'tablet-side': tablet.side_padding_px,
      'tablet-gap': tablet.gap_px,
      'mobile-side': mobile.side_padding_px,
      'mobile-gap': mobile.gap_px,
      'mobile-heading': mobile.heading_px,
      'mobile-model': mobile.product_name_px,
      'mobile-view': mobile.view_label_px,
      'desktop-columns': desktop.columns,
      'tablet-columns': tablet.columns,
      'mobile-columns': mobile.columns,
      'campaign-span': content.campaign.grid_span_desktop
    };
    for (const [name, value] of Object.entries(sizes)) section.style.setProperty(`--custom-${name}`, value);
    section.style.setProperty('--custom-base', colors.section_base);
    section.style.setProperty('--custom-dark', colors.section_dark);
    section.style.setProperty('--custom-studio', colors.studio_blue_gray);
    section.style.setProperty('--custom-text', colors.text);
    section.style.setProperty('--custom-muted', colors.secondary_text);
    section.style.setProperty('--custom-focus', colors.focus);
    section.style.setProperty('--custom-hit', `${interaction.minimum_hit_size_px}px`);
    section.style.setProperty('--custom-focus-width', `${interaction.focus_ring_px}px`);
    section.style.setProperty('--custom-hover', `${interaction.hover_translation_y_px}px`);
    section.style.setProperty('--custom-transition', `${interaction.transition_ms}ms`);
    section.style.setProperty('--custom-photo-position', tokens.photo_rendering.object_position);
    section.style.setProperty('--custom-photo-fit', tokens.photo_rendering.object_fit);
    section.style.setProperty('--custom-raven-fit', tokens.photo_rendering.campaign_object_fit);
    section.style.setProperty('--custom-background', `url('${content.campaign.background.path}')`);
  }

  function applyImage(image, asset) {
    image.width = asset.width;
    image.height = asset.height;
    image.alt = asset.alt_fa;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.src = asset.path;
  }

  function makeCard(product) {
    const card = document.createElement('article');
    card.className = 'custom-catalog-card';
    card.dataset.model = product.id;
    const href = productHref(product.product_url);
    const body = document.createElement(href ? 'a' : 'div');
    body.className = 'custom-catalog-card-body';

    const nameId = `custom-model-${product.id}`;
    const linkId = `${nameId}-view`;
    const noticeId = `${nameId}-notice`;
    if (href) {
      body.href = href;
      body.setAttribute('aria-labelledby', `${linkId} ${nameId}`);
    }
    body.innerHTML = `
      <div class="custom-catalog-photo"><img><span class="catalog-image-error" dir="rtl" hidden></span></div>
      <div class="custom-catalog-caption">
        <h3 class="custom-catalog-model-name" lang="en" dir="ltr"></h3>
        <span class="custom-catalog-view" dir="rtl"></span>
      </div>`;

    const title = body.querySelector('h3');
    title.id = nameId;
    title.textContent = product.display_name;
    const view = body.querySelector('.custom-catalog-view');
    view.id = linkId;
    view.textContent = product.view_label_fa;
    const image = body.querySelector('img');
    const imageError = body.querySelector('.catalog-image-error');
    imageError.textContent = content.status_messages_fa.image_error;
    image.addEventListener('error', () => {
      image.hidden = true;
      imageError.hidden = false;
    });
    applyImage(image, product.image);

    if (!href) {
      view.setAttribute('role', 'link');
      view.setAttribute('aria-disabled', 'true');
      view.setAttribute('aria-describedby', noticeId);
      const notice = document.createElement('p');
      notice.id = noticeId;
      notice.className = 'custom-catalog-notice';
      notice.dir = 'rtl';
      notice.textContent = content.status_messages_fa.unconfigured_product;
      body.querySelector('.custom-catalog-caption').append(notice);
    }

    card.append(body);
    return { card, product };
  }

  applyDesignTokens();
  section.querySelector('h2').textContent = content.heading_fa;
  trigger.querySelector('.catalog-filter-trigger-label').textContent = content.filter_button_fa;
  section.querySelector('#cut-filter-legend').textContent = definition.label_fa;
  close.textContent = definition.close_label_fa;
  section.querySelector('.custom-catalog-wordmark').textContent = content.campaign.wordmark;
  applyImage(section.querySelector('.custom-catalog-raven'), content.campaign.image);

  const cards = [...content.products].sort((a, b) => a.order - b.order).map(makeCard);
  grid.append(...cards.map(({ card }) => card));

  function filterCards(value, announce) {
    let visible = 0;
    const firstRowSlots = tokens.desktop.columns - content.campaign.grid_span_desktop;
    for (const { card, product } of cards) {
      const matches = value === 'all' || product[definition.field] === value;
      card.hidden = !matches;
      card.toggleAttribute('data-first-row', matches && visible < firstRowSlots);
      if (matches) visible++;
    }
    trigger.toggleAttribute('data-filtered', value !== 'all');
    const option = definition.options.find(item => item.value === value);
    trigger.setAttribute('aria-label', value === 'all' ? content.filter_button_fa : `${content.filter_button_fa}، ${option.label_fa}`);
    if (announce) status.textContent = `${formatCount.format(visible)} مدل نمایش داده شد`;
  }

  for (const option of definition.options) {
    const label = document.createElement('label');
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'catalog-cut';
    radio.value = option.value;
    radio.checked = option.value === definition.default;
    const text = document.createElement('span');
    text.textContent = option.label_fa;
    label.append(radio, text);
    options.append(label);
  }
  filterCards(definition.default, false);
  bindFilter(filter, value => filterCards(value, true));
})();
