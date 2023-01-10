function setCanvasImage(index, path) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d');
    img.onload = function () {
      c.width = this.naturalWidth;
      c.height = this.naturalHeight;
      ctx.drawImage(this, 0, 0);
      let dataURL = c.toDataURL('image/jpeg').replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
      c.remove();
      resolve({ url: dataURL, index });
    };
    img.src = path;
  });
}
function nl2br(str, is_xhtml) {
  if (typeof str === 'undefined' || str === null) {
    return '';
  }
  var breakTag = is_xhtml || typeof is_xhtml === 'undefined' ? '<br />' : '<br>';
  return (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
}
function getBase64Image(img) {
  var canvas = document.createElement('canvas');
  img.crossOrigin = 'anonymous';
  canvas.width = img.width;
  canvas.height = img.height;
  var ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  var dataURL = canvas.toDataURL('image/jpeg');
  return dataURL.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');
}
$('<link rel="stylesheet" type="text/css" href="' + chrome.runtime.getURL('css/style.css') + '" >').appendTo('head');
chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
  if (msg.type == 'RELOAD_MAIN_PAGE') {
    window.location.reload();
  }
});
getBaseUrl = function (url) {
  if (url.indexOf('?') >= 0) {
    return url.substring(0, url.indexOf('?'));
  }
  return url;
};
function craw_next() {
  chrome.storage.local.get(function (result) {
    let urlList = Array.isArray(result.urlList) ? result.urlList : [];
    if (urlList.length > 0) {
      let curHref = urlList.pop();

      chrome.storage.local.set({ urlList, mode: 'crawling', curHref }, function () {
        console.log('success', urlList);
      });

      window.location.href = curHref;
    } else {
      chrome.storage.local.set({ mode: 'done', curHref: undefined }, function () {
        alert('Đã thêm thành công ' + result.total + ' sản phẩm!');
      });
    }
  });
}
function runCrawling() {
  var meta_title = '';
  var meta_description = '';
  var folders = '';
  var description = '';
  var sku = '';
  var brand = '';
  var price = '';
  var old_price = '';
  var prod_images = [];
  let data_product = '';
  function add_product() {
    chrome.runtime.sendMessage(
      {
        type: 'API_AJAX_POST',
        url: 'https://topclass.3tc.vn/index.php?route=api/product/sync',
        payload: data_product,
      },
      function (response) {
        if (response && response.success) {
          chrome.storage.local.get(function (result) {
            if (result && result.mode) {
              if (result.mode == 'crawling') {
                let urlList = Array.isArray(result.urlList) ? result.urlList : [];
                if (urlList.length > 0) {
                  let curHref = urlList.pop();

                  chrome.storage.local.set({ urlList, mode: 'crawling', curHref }, function () {
                    console.log('success', curHref);
                  });

                  window.location.href = curHref;
                } else {
                  chrome.storage.local.set({ mode: 'done', curHref: undefined }, function () {
                    alert('Đã thêm thành công ' + result.total + ' sản phẩm!');
                  });
                }
              } else if (result.mode == 'single-crawling') {
                alert('Đã thêm sản phẩm thành công!');
              }
            }
          });
        } else {
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      }
    );
  }
  if (window.location.href.match(/dienmayxanh.com/) && $('.detail').length > 0) {
    meta_title = $('title').text();
    meta_description = $('meta[name="description"]').attr('content');
    folders = $.map($('.breadcrumb li a').toArray(), function (n, i) {
      return $(n).text().trim();
    });
    description = $('.article.content-t-wrap .article__content.short .content-article').html();
    if (typeof description == 'undefined') {
      description = '';
    }
    var sku = '';
    var name = '';
    var mpn = '';
    var brand = {};
    var productld = $('#productld').text();
    if (typeof productld == 'undefined' || productld == '') {
      productld = '';
      name = $('.breadcrumb + h1').text();
      if ($('.parameter__list li p.lileft:contains("Hãng")').length) {
        $('.parameter__list li p.lileft:contains("Hãng") + .liright > span').children().remove();
        brand.name = [];
        let brand_name = $('.parameter__list li p.lileft:contains("Hãng") + .liright > span').text();

        brand_name = brand_name.trim().replace(/\.$/gm, '');
        brand.name.push(brand_name);
      }
      sku = mpn = $('section[data-id]').data('id');
    } else {
      var productInfo = JSON.parse(productld);
      var { sku, name, mpn, brand } = productInfo;
    }
    if (typeof meta_title == 'undefined' || meta_title == '') {
      meta_title = name;
    }
    var prod_images = [];
    $('.detail-slider.owl-carousel img:not(.hide)').each(function (i, item) {
      let img_src = $(item).attr('data-src');
      if (img_src == '' || typeof img_src == 'undefined') {
        img_src = $(item).attr('src');
      }
      if (img_src.startsWith('//')) {
        img_src = 'https:' + img_src;
      }
      if (prod_images.indexOf(img_src) == -1) {
        prod_images.push(img_src);
      }
    });
    price = $('.box04.box_normal .kmml21 .kmbox.kb1 strong').text();
    if (typeof price == 'undefined') {
      price = $('.bs_title div strong').text();
    }
    if (typeof price == 'undefined') {
      price = $('.price-one .box-price .box-price-present').text();
    }
    if (typeof price == 'undefined') {
      price = $('.price-two div[data-price="price01"] .box-price-present').text();
    }
    if (typeof price == 'undefined') {
      price = '';
    }
    price = price.trim().replace('₫', '').replaceAll('.', '').replaceAll(',', '');
    old_price = $('.box04.box_normal .kmml21 .kmbox.kb1 del').text();
    if (typeof old_price == 'undefined') {
      old_price = $('.bs_title div em').text();
    }
    if (typeof old_price == 'undefined') {
      old_price = $('.price-one .box-price .box-price-old').text();
    }
    if (typeof old_price == 'undefined') {
      old_price = $('.price-two div[data-price="price01"] p.box-price-old').text();
    }
    if (typeof old_price == 'undefined') {
      old_price = '';
    }
    if (old_price == price) {
      old_price = '';
    }
    old_price = old_price.trim().replace('₫', '').replaceAll('.', '').replaceAll(',', '');
    colorIdList = [];
    if ($('[id^="thumb-color-images-gallery"]').length > 0) {
      $('[id^="thumb-color-images-gallery"]').each(function (i, thumb) {
        const colorId = $(thumb).data('color-id');
        const colorName = $('p', thumb).text();
        colorIdList.push({ colorId, colorName });
      });
    }
    const subUrlList = colorIdList.map((colorObj) => {
      return {
        type: 'image',
        colorName: colorObj.colorName,
        url: `https://www.dienmayxanh.com/Product/GetGalleryItem?productId=${sku}&isAppliance=false&galleryType=2&colorId=${colorObj.colorId}`,
      };
    });
    subUrlList.unshift({
      type: 'attrib',
      url: `https://www.dienmayxanh.com/Product/GetGalleryItemInPopup?productId=${sku}&isAppliance=false&galleryType=5&colorId=0`,
    });
    var prod_attribs = [];
    var option_images = [];
    chrome.runtime.sendMessage(
      {
        type: 'API_AJAX_HTML',
        urlList: subUrlList,
      },
      function (response) {
        console.log(response);
        if (response && response.length > 0) {
          response.forEach((element) => {
            if (element.type == 'attrib' && $('.parameter-item', element.text).length > 0) {
              var parameter_items = $('.parameter-item', element.text);
              console.log('parameter', parameter_items);
              parameter_items.each(function (index, item) {
                var group = { name: $('.parameter-ttl', item).text() };
                if (group.name == '') {
                  group.name = 'Thông số kỹ thuật';
                }
                var group_attrs = [];
                $('ul.ulist li', item).each(function (attr_index, attr) {
                  group_attr = {};
                  group_attr.key = $('.ctLeft', attr).text().trim();
                  var subitems = [];
                  $('.ctRight p,.ctRight span,.ctRight a', attr).each(function (idx, itx) {
                    subitems.push($(itx).text().trim());
                  });
                  group_attr.value = subitems.join('|');
                  group_attrs.push(group_attr);
                });
                group.attrs = group_attrs;
                prod_attribs.push(group);
              });
            }
            if (
              element.type == 'image' &&
              $('.content-t__list__item, .detail-slider.owl-carousel', element.text).length > 0
            ) {
              var listImage = [];
              var list_img = $('.content-t__list__item img, .detail-slider.owl-carousel img:not(.hide)', element.text);
              list_img.each(function (i, item) {
                let img_src = $(item).attr('src');
                if (img_src == '' || typeof img_src == 'undefined') {
                  img_src = $(item).attr('data-src');
                }
                if (img_src.startsWith('//')) {
                  img_src = 'https:' + img_src;
                }
                if (listImage.indexOf(img_src) == -1) {
                  listImage.push(img_src);
                }
              });
              option_images.push({
                options: [{ optionName: 'Màu sắc', optionValue: element.colorName }],
                listImage,
                extraText: element.colorName,
                price,
                oldPrice: old_price,
              });
            }
          });
          data_product = {
            name,
            meta_title,
            option_images,
            prod_images,
            sku,
            brand: brand.name[0],
            description,
            mpn,
            folders,
            meta_description,
            price,
            product_attributes: prod_attribs,
            old_price,
            referer: window.location.href,
          };
          console.log('data_product', data_product);
          add_product();
        }
      }
    );
  } else if (window.location.href.match(/thegioididong.com/) && $('.detail').length > 0) {
    meta_title = $('title').text();
    meta_description = $('meta[name="description"]').attr('content');
    folders = $.map($('.breadcrumb li a').toArray(), function (n, i) {
      return $(n).text().trim();
    });
    description = $('.article.content-t-wrap .article__content.short .content-article').html();
    if (typeof description == 'undefined') {
      description = '';
    }
    var sku = '';
    var name = '';
    var mpn = '';
    var brand = {};
    var productld = $('#productld').text();
    if (typeof productld == 'undefined' || productld == '') {
      productld = '';
      name = $('.breadcrumb + h1').text();
      if ($('.parameter__list li p.lileft:contains("Hãng")').length) {
        $('.parameter__list li p.lileft:contains("Hãng") + .liright > span').children().remove();
        brand.name = [];
        let brand_name = $('.parameter__list li p.lileft:contains("Hãng") + .liright > span').text();

        brand_name = brand_name.trim().replace(/\.$/gm, '');
        brand.name.push(brand_name);
      }
      sku = mpn = $('section[data-id]').data('id');
    } else {
      var productInfo = JSON.parse(productld);
      var { sku, name, mpn, brand } = productInfo;
    }
    if (typeof meta_title == 'undefined' || meta_title == '') {
      meta_title = name;
    }
    var prod_images = [];
    $('.detail-slider.owl-carousel img:not(.hide)').each(function (i, item) {
      let img_src = $(item).attr('data-src');
      if (img_src == '' || typeof img_src == 'undefined') {
        img_src = $(item).attr('src');
      }
      if (img_src.startsWith('//')) {
        img_src = 'https:' + img_src;
      }
      if (prod_images.indexOf(img_src) == -1) {
        prod_images.push(img_src);
      }
    });
    price = $('.box04.box_normal .kmml21 .kmbox.kb1 strong').text();
    if (typeof price == 'undefined') {
      price = $('.bs_title div strong').text();
    }
    if (typeof price == 'undefined') {
      price = $('.price-one .box-price .box-price-present').text();
    }
    if (typeof price == 'undefined') {
      price = $('.price-two div[data-price="price01"] .box-price-present').text();
    }
    if (typeof price == 'undefined') {
      price = '';
    }
    price = price.trim().replace('₫', '').replaceAll('.', '').replaceAll(',', '');
    old_price = $('.box04.box_normal .kmml21 .kmbox.kb1 del').text();
    if (typeof old_price == 'undefined') {
      old_price = $('.bs_title div em').text();
    }
    if (typeof old_price == 'undefined') {
      old_price = $('.price-one .box-price .box-price-old').text();
    }
    if (typeof old_price == 'undefined') {
      old_price = $('.price-two div[data-price="price01"] p.box-price-old').text();
    }
    if (typeof old_price == 'undefined') {
      old_price = '';
    }
    if (old_price == price) {
      old_price = '';
    }
    old_price = old_price.trim().replace('₫', '').replaceAll('.', '').replaceAll(',', '');
    colorIdList = [];
    if ($('[id^="thumb-color-images-gallery"]').length > 0) {
      $('[id^="thumb-color-images-gallery"]').each(function (i, thumb) {
        const colorId = $(thumb).data('color-id');
        const colorName = $('p', thumb).text();
        colorIdList.push({ colorId, colorName });
      });
    }
    const subUrlList = colorIdList.map((colorObj) => {
      return {
        type: 'image',
        colorName: colorObj.colorName,
        url: `https://www.thegioididong.com/Product/GetGalleryItem?productId=${sku}&isAppliance=false&galleryType=2&colorId=${colorObj.colorId}`,
      };
    });

    subUrlList.unshift({
      type: 'attrib',
      url: `https://www.thegioididong.com/Product/GetGalleryItemInPopup?productId=${sku}&isAppliance=false&galleryType=5&colorId=0`,
    });
    var prod_attribs = [];
    var option_images = [];
    chrome.runtime.sendMessage(
      {
        type: 'API_AJAX_HTML',
        urlList: subUrlList,
      },
      function (response) {
        console.log(response);
        if (response && response.length > 0) {
          response.forEach((element) => {
            if (element.type == 'attrib' && $('.parameter-item', element.text).length > 0) {
              var parameter_items = $('.parameter-item', element.text);
              console.log('parameter', parameter_items);
              parameter_items.each(function (index, item) {
                var group = { name: $('.parameter-ttl', item).text() };
                if (group.name == '') {
                  group.name = 'Thông số kỹ thuật';
                }
                var group_attrs = [];
                $('ul.ulist li', item).each(function (attr_index, attr) {
                  group_attr = {};
                  group_attr.key = $('.ctLeft', attr).text().trim();
                  var subitems = [];
                  $('.ctRight p,.ctRight span,.ctRight a', attr).each(function (idx, itx) {
                    subitems.push($(itx).text().trim());
                  });
                  group_attr.value = subitems.join('|');
                  group_attrs.push(group_attr);
                });
                group.attrs = group_attrs;
                prod_attribs.push(group);
              });
            }

            if (
              element.type == 'image' &&
              $('.content-t__list__item, .detail-slider.owl-carousel', element.text).length > 0
            ) {
              var listImage = [];
              var list_img = $('.content-t__list__item img, .detail-slider.owl-carousel img:not(.hide)', element.text);
              list_img.each(function (i, item) {
                let img_src = $(item).attr('src');
                if (img_src == '' || typeof img_src == 'undefined') {
                  img_src = $(item).attr('data-src');
                }
                if (img_src.startsWith('//')) {
                  img_src = 'https:' + img_src;
                }
                if (listImage.indexOf(img_src) == -1) {
                  listImage.push(img_src);
                }
              });

              option_images.push({
                options: [{ optionName: 'Màu sắc', optionValue: element.colorName }],
                listImage,
                extraText: element.colorName,
              });
            }
          });
          data_product = {
            name,
            meta_title,
            option_images,
            prod_images,
            sku,
            brand: brand.name[0],
            description,
            mpn,
            folders,
            meta_description,
            price,
            product_attributes: prod_attribs,
            old_price,
            referer: window.location.href,
          };
          console.log('data_product', data_product);
          add_product();
        }
      }
    );
  } else if (window.location.href.match(/dienmaycholon.vn/) && $('#product_detail').length > 0) {
    meta_title = $('title').text();
    meta_description = $('meta[name="description"]').attr('content');
    folders = $.map($('.box_breadcrumb-item li a').toArray(), function (n, i) {
      return $(n).text().trim();
    });
    folders.shift();
    var name = $('.name_pro_detail h1').text();
    description = $('.des_pro_item').first().html();
    sku = $('.sku_detail').attr('data-sku');
    brand = $('.trademark_detail a').text();
    old_price = $('.price_giaban.price_market span').text();
    if (typeof old_price == 'undefined') {
      old_price = $('.price_block .discount .price_market').text();
    }
    if (typeof old_price == 'undefined') {
      old_price = '';
    }
    old_price = old_price.replace('đ', '').replaceAll('.', '').replaceAll(',', '').trim();
    price = $('span.price-pro').first().text();
    if (typeof price == 'undefined') {
      price = $('.box_product .price_block .price_sale').text();
    }
    if (typeof price == 'undefined') {
      price = $('.box_price_layout_cost strong').text();
    }
    if (typeof price == 'undefined') {
      price = '';
    }
    price = price.replace('đ', '').replaceAll('.', '').replaceAll(',', '').trim();
    $('.item.dmcl-gallery img').each(function (i, item) {
      let img_src = $(item).attr('data-src');
      if (img_src == '' || typeof img_src == 'undefined') {
        img_src = $(item).attr('src');
      }
      if (img_src.startsWith('//')) {
        img_src = 'https:' + img_src;
      }
      if (prod_images.indexOf(img_src) == -1) {
        prod_images.push(img_src);
      }
    });
    var prod_attribs = [];
    var group = {};
    var group_attrs = [];
    $('.detail_specifications .list_specifications li').each(function (index, item) {
      if ($(item).is('.title-specification')) {
        if (Object.keys(group).length !== 0) {
          prod_attribs.push(group);
        }
        group = {};
        group.name = $(item).text();
        group_attrs = [];
      } else {
        group_attr = {};
        group_attr.key = $('p:eq(0)', item).text().trim();
        group_attr.value = $('p:eq(1)', item).text().trim();
        group_attrs.push(group_attr);
        group.attrs = group_attrs;
      }
    });
    if (Object.keys(group).length !== 0) {
      prod_attribs.push(group);
    }
    data_product = {
      meta_title,
      meta_description,
      folders,
      name,
      description,
      sku,
      brand,
      old_price,
      price,
      prod_images,
      product_attributes: prod_attribs,
      referer: window.location.href,
    };
    console.log('data', data_product);
    add_product();
  } else if (window.location.href.match(/tiki.vn/) && $('.styles__Wrapper-sc-8ftkqd-0').length > 0) {
    meta_title = $('title').text();
    if (typeof meta_title == 'undefined') {
      meta_title = '';
    }
    meta_description = $('meta[name="description"]').attr('content');
    if (typeof meta_description == 'undefined') {
      meta_description = '';
    }
    var name = $('h1.title').text();
    folders = $.map($('a:not([href="#"]).breadcrumb-item span').toArray(), function (n, i) {
      return $(n).text().trim();
    });
    folders.shift();
    old_price = $('.product-price__list-price').text();
    if (typeof old_price == 'undefined') {
      old_price = '';
    }
    old_price = old_price.replace('₫', '').replaceAll('.', '').replaceAll(',', '').replace(' ', '').trim();
    price = $('.product-price__current-price').text();
    if (typeof price == 'undefined') {
      price = '';
    }
    price = price.trim().replace('₫', '').replaceAll('.', '').replaceAll(',', '');
    description = $('.ToggleContent__View-sc-1dbmfaw-0.wyACs').html();
    if (typeof description == 'undefined') {
      description = '';
    }
    var list_img = $('.review-images__list img[src]');
    list_img.each(function (i, item) {
      if (prod_images.indexOf($(item).attr('src')) == -1) {
        var img = $(item).attr('src');
        img = img.replace('/cache/100x100/', '/').replace('.webp', '');
        prod_images.push(img);
      }
    });
    var prod_attribs = [];
    var group = { name: $('.BlockTitle__Wrapper-sc-qpz3fo-0:eq(1)').text() };
    if (group.name == '') {
      group.name = 'Thông số kỹ thuật';
    }
    var group_attrs = [];
    $('.content.has-table tr').each(function (attr_index, attr) {
      group_attr = {};
      group_attr.key = $('td:eq(0)', attr).text().trim();
      var subitems = [];
      $('td:eq(1)', attr).each(function (idx, itx) {
        subitems.push($(itx).text().trim());
      });
      group_attr.value = subitems.join('|');
      group_attrs.push(group_attr);
    });
    group.attrs = group_attrs;
    prod_attribs.push(group);
    data_product = {
      meta_title,
      meta_description,
      name,
      folders,
      old_price,
      price,
      description,
      product_attributes: prod_attribs,
      prod_images,
      referer: window.location.href,
    };
    console.log('data', data_product);
    add_product();
  } else if (window.location.href.match(/fptshop.com.vn/) && $('.l-main').length > 0) {
    meta_title = $('title').text();
    if (typeof meta_title == 'undefined') {
      meta_title = '';
    }
    meta_title = meta_title.replace('| Fptshop.com.vnClose modal window', '').trim();
    meta_description = $('meta[name="description"]').attr('content');
    if (typeof meta_description == 'undefined') {
      meta_description = '';
    }
    let skus = $('.st-sku').text();
    let sku = skus.match(/[0-9]+/g)[0];
    $('h1.st-name').children().remove();
    var name = $('h1.st-name').text();
    folders = $.map($('.breadcrumb-item a').toArray(), function (n, i) {
      return $(n).text().trim();
    });
    folders.shift();
    if (typeof folders == 'undefined') {
      folders = '';
    }
    price = $('.st-price-main').text();
    if (typeof price == 'undefined') {
      price = '';
    }
    price = price.replace('₫', '').replaceAll('.', '').replaceAll(',', '').trim();
    old_price = $('.st-price-sub').text();
    if (typeof old_price == 'undefined') {
      old_price = '';
    }
    old_price = old_price.replace('₫', '').replaceAll('.', '').replaceAll(',', '').trim();
    description = $('.card.re-card.st-card.st-card--article').html();
    description = description
      .replaceAll('js--pd-contentSlider re-swiper swiper-container-initialized swiper-container-horizontal', '')
      .replaceAll('style="transform: translate3d(-665px, 0px, 0px); transition-duration: 0ms;"', '')
      .replaceAll('swiper-slide-prev', '')
      .replaceAll('style="width: 665px;"', '');
    prod_images = [];
    $('.swiper-wrapper.js--slide--full img').each(function (i, item) {
      let img_src = $(item).attr('src');
      if (img_src == '' || typeof img_src == 'undefined') {
        img_src = $(item).attr('data-src');
      }
      img_src = img_src
        .replace('images.fpt.shop/unsafe/fit-in/585x390/filters:quality(90):fill(white)/', '')
        .replace('https://images.fpt.shop/unsafe/fit-in/750x500/filters:quality(90):fill(white)/', '');
      prod_images.push(img_src);
    });
    var prod_attribs = [];
    var parent = $('.c-modal__content .c-modal__row');
    parent.each(function (index, item) {
      var group = {};
      group.name = $('> .st-table-title', item).text();
      var group_attrs = [];
      $('> .st-table-title ~ .st-table  tr', item).each(function (attr, tr_item) {
        var group_attr = {};
        group_attr.key = $('td:eq(0) ', tr_item).text().trim();
        group_attr.value = $('td:eq(1)', tr_item).text().trim();
        group_attrs.push(group_attr);
      });
      $('> .st-table-title ~ .st-list li', item).each(function (attr_4, li_item) {
        var group_attr = {};
        group_attr.key = $(this).clone().children().remove().end().text().trim();
        group_attr.value = $('div', li_item).text().trim();
        group_attrs.push(group_attr);
      });
      if ($('.st-table-title ~ .st-table-wrapper', item).length > 0) {
        group.child = [];
      }
      $('> .st-table-title ~ .st-table-wrapper .st-table-col', item).each(function (attr_2, sub_group_item) {
        var sub_group = {};
        var sub_group_attrs = [];
        sub_group.name = $('.st-table-title', sub_group_item).text();
        $('.st-table tr', sub_group_item).each(function (index_2, tr_item_2) {
          var group_attr = {};
          group_attr.key = $('td:eq(0) ', tr_item_2).text().trim();
          group_attr.value = $('td:eq(1)', tr_item_2).text().trim();
          sub_group_attrs.push(group_attr);
        });
        sub_group.attrs = sub_group_attrs;
        group.child.push(sub_group);
      });
      group.attrs = group_attrs;
      prod_attribs.push(group);
    });
    let option_combinations = [];
    $('.l-pd-right .st-select-color:not(:last) .st-select-color__item').each(function (img_index, img_item) {
      let option_combination = {};
      let base_option = {};
      base_option.optionName = 'Màu Sắc';
      base_option.optionValue = $('p', img_item).text();
      option_combination.options = [base_option];
      let img = $('.img img', img_item).attr('src');
      img = img.replace('/40x40/', '/1000x1000/').trim();
      option_combination.listImage = [img];
      price = price.replace('₫', '').replaceAll('.', '').trim();
      option_combination.price = price;
      old_price = old_price.replace('₫', '').replaceAll('.', '').trim();
      option_combination.oldPrice = old_price;
      option_combination.extraText = $('p', img_item).text();
      option_combinations.push(option_combination);
    });
    data_product = {
      meta_title,
      meta_description,
      name,
      sku,
      folders,
      price,
      old_price,
      prod_images,
      description,
      option_images: option_combinations,
      product_attributes: prod_attribs,
      referer: window.location.href,
    };
    console.log('data product', data_product);
    add_product();
  } else if (window.location.href.match(/mediamart.vn/) && $('.wrap-product').length > 0) {
    meta_title = $('title').text();
    if (typeof meta_title == 'undefined') {
      meta_title = '';
    }
    meta_description = $('meta[name="description"]').attr('content');
    if (typeof meta_description == 'undefined') {
      meta_description = '';
    }
    var name = $('.pdetail-name h1').text();
    folders = $.map($('.breadcrumb-item a').toArray(), function (n, i) {
      return $(n).text().trim();
    });
    folders.shift();
    if (typeof folders == 'undefined') {
      folders = '';
    }
    price = $('.pdetail-price-box h3').text();
    if (typeof price == 'undefined') {
      price = '';
    }
    price = price.replace('₫', '').replaceAll('.', '').replaceAll(',', '').trim();
    old_price = $('.pdetail-price-box .product-price-regular').text();
    if (typeof old_price == 'undefined') {
      old_price = '';
    }
    old_price = old_price.replace('₫', '').replaceAll('.', '').replaceAll(',', '').trim();
    description = $('.pd-content-seemore div:not(.clearfix)').html();
    $('.owl-item picture img[src]').each(function (i, item) {
      let img_src = $(item).attr('src');
      prod_images.push(img_src);
    });
    var prod_attribs = [];
    var group = {};
    var group_attrs = [];
    $('.table tbody tr').each(function (index, item) {
      var children = $(this).closest('tr').children('th');
      if (children.length > 0) {
        if (Object.keys(group).length !== 0) {
          prod_attribs.push(group);
        }
        group = {};
        group.name = $(children).text();
        if (group.name == '' || typeof group.name == 'undefined') {
          group.name = 'Thông số kỹ thuật';
        }
        group_attrs = [];
      } else {
        group_attr = {};
        group_attr.key = $('td:eq(0)', item).text().trim();
        group_attr.value = $('td:eq(1)', item).text().trim();
        group_attrs.push(group_attr);
        group.attrs = group_attrs;
      }
    });
    if (Object.keys(group).length !== 0) {
      prod_attribs.push(group);
    }
    data_product = {
      meta_title,
      meta_description,
      name,
      folders,
      price,
      old_price,
      description,
      product_attributes: prod_attribs,
      prod_images,
      referer: window.location.href,
    };
    console.log('data product', data_product);
    add_product();
  } else if (window.location.href.match(/nguyenkim.com/) && $('.NkPdp_productInfo').length > 0) {
    meta_title = $('title').text();
    if (typeof meta_title == 'undefined') {
      meta_title = '';
    }
    meta_title = meta_title.replace(' | Nguyễn Kim', '').trim();
    meta_description = $('meta[name="description"]').attr('content');
    if (typeof meta_description == 'undefined') {
      meta_description = '';
    }
    var name = $('h1.product_info_name').text();
    folders = $.map($('.pdp_breadcrumbs a').toArray(), function (n, i) {
      return $(n).text().trim();
    });
    folders.shift();
    if (typeof folders == 'undefined') {
      folders = '';
    }
    price = $('.nk-price-final').first().text();
    if (typeof price == 'undefined') {
      price = '';
    }
    price = price.replace('đ', '').replaceAll('.', '').replaceAll(',', '').trim();
    old_price = $('.product_info_price_value-real').first().text();
    if (typeof old_price == 'undefined') {
      old_price = '';
    }
    old_price = old_price.replace('đ', '').replaceAll('.', '').replaceAll(',', '').trim();
    $('.NkPdp_productFeature *').show();
    description = $('.NkPdp_productFeature').last().html();
    if (typeof description == 'undefined') {
      description = '';
    }
    var prod_attribs = [];
    var group_attrs = [];
    var group = {};
    $('#custom-scroll-popup-tskt tr').each(function (index, tr_item) {
      var group_attr = {};
      group_attr.key = $('.title', tr_item).text().trim();
      group_attr.value = $('.value', tr_item).text().trim();
      group_attrs.push(group_attr);
      group.attrs = group_attrs;
    });
    group.name = 'Thông số sản phẩm';
    prod_attribs.push(group);
    prod_images = [];
    let image_length = $('.nk-product-bigImg .wrap-img-tag-pdp > img').length;
    prod_image_contents = new Array(image_length).fill('');
    async function get_image_contents() {
      for (i = 0; i < image_length; i++) {
        let item = $('.nk-product-bigImg .wrap-img-tag-pdp > img')[i];
        var img_src = $(item).attr('data-src');
        if (img_src == '' || typeof img_src == 'undefined') {
          img_src = $(item).attr('src');
        }
        prod_images.push(img_src);
        await setCanvasImage(i, img_src).then(function (data_obj) {
          prod_image_contents[data_obj.index] = data_obj.url;
          console.log('prod_image_contents.length', prod_image_contents.length);
        });
      }
    }
    get_image_contents().then(function () {
      data_product = {
        meta_title,
        meta_description,
        name,
        folders,
        price,
        old_price,
        description,
        prod_images,
        prod_image_contents,
        product_attributes: prod_attribs,
        referer: window.location.href,
      };
      console.log('data product', data_product);
      add_product();
    });
  } else if (window.location.href.match(/dienmaytamviet.com/) && $('.product-details').length > 0) {
    chrome.storage.local.get(function (result) {
      let urlList = Array.isArray(result.urlList) ? result.urlList : [];
      let nextHref = '';
      if (urlList.length > 0) {
        nextHref = urlList.pop();
      } else {
        nextHref = 'https://dienmaytamviet.com';
      }
      nextHref = encodeURI(nextHref);
      if ($('meta[content^="dienmaytamviet.com"]').length > 0) {
        url = $('meta[content^="dienmaytamviet.com"]').attr('content');
        matches = url.match(/\.p(\d+)\.html/);
        link = `https://dienmayxanhlocphuc.com/index.php?route=api/product/sync_tamviet&prod_id=${matches[1]}&session_id=${result.token}&next=${nextHref}`;
        window.location.href = link;
      }
    });
  } else if (window.location.href.match(/shopee.vn/) && !window.location.href.match(/shopee.vn\/api\/v4\/item\/get/g)) {
    let in_product_detail = false;
    let in_product_detail_try = 0;
    function while_promise() {
      return new Promise((resolve, reject) => {
        function while_loop() {
          setTimeout(function () {
            in_product_detail = $('.page-product').length > 0;
            if (!in_product_detail && in_product_detail_try < 10) {
              in_product_detail_try++;
              while_loop();
            } else {
              resolve(in_product_detail);
            }
          }, 300);
        }
        while_loop();
      });
    }
    while_promise().then(function (is_product_detail) {
      if (!is_product_detail) {
        console.log('not found');
        craw_next();
        return;
      }
      console.log('ok');
      let url_regex = /-i\.(\d+)\.(\d+)/gi;
      let url_matches = url_regex.exec(window.location.href);
      console.log('url_matches', url_matches);
      if (url_matches.length > 2) {
        let json_url = `https://shopee.vn/api/v4/item/get?itemid=${url_matches[2]}&shopid=${url_matches[1]}`;
        fetch(json_url)
          .then((result) => result.json())
          .then((output) => {
            let data = output.data;
            meta_title = data.name
              .replace(/\[(.*?)\]/, '')
              .replace(/\[(.*?)\]/, '')
              .replace(/\[(.*?)\]/, '');
            if (typeof meta_title == 'undefined') {
              meta_title = '';
            }
            meta_description = $('meta[name="description"]').attr('content');
            if (typeof meta_description == 'undefined') {
              meta_description = '';
            }
            var name = data.name
              .replace(/\[(.*?)\]/, '')
              .replace(/\[(.*?)\]/, '')
              .replace(/\[(.*?)\]/, '');
            var folders = [];
            folders = $.map(data.fe_categories, function (n, i) {
              return n.display_name;
            });
            price = data.price / 100000;
            if (typeof price == 'undefined') {
              price = '';
            }
            old_price = data.price_before_discount / 100000;
            if (typeof old_price == 'undefined') {
              old_price = '';
            }
            description = $('.KqLK01 ._5RoKIR').html();
            if (typeof description == 'undefined') {
              description = data.description;
            }
            description = nl2br(description);
            var prod_attribs = [];
            var group_attrs = [];
            var group = {};
            $('.KqLK01 ._3Xk7SJ').each(function (index, tr_item) {
              var group_attr = {};
              group_attr.key = $('label', tr_item).text().trim();
              group_attr.value = $('.kQy1zo , div', tr_item).text().trim();
              group_attrs.push(group_attr);
            });
            if (group_attrs && group_attrs.length > 0) {
              group_attrs.shift();
            }
            group.attrs = group_attrs;
            group.name = 'Thông số sản phẩm';
            prod_attribs.push(group);
            prod_images = [];
            prod_images = $.map(data.images, function (item, index) {
              return 'https://cf.shopee.vn/file/' + item;
            });
            let image = 'https://cf.shopee.vn/file/' + data.image;
            let option_combinations = [];
            let base_options = [];
            data.tier_variations.forEach(function (tier_variation) {
              let base_option = {};
              base_option['name'] = tier_variation.name;
              base_option['option_values'] = [];
              for (i = 0; i < tier_variation.options.length; i++) {
                let base_option_value = {};
                base_option_value['name'] = tier_variation.options[i];
                if (tier_variation.images && tier_variation.images[i]) {
                  base_option_value['image'] = tier_variation.images[i];
                }
                base_option['option_values'].push(base_option_value);
              }
              base_options.push(base_option);
            });
            for (i = 0; i < data.models.length; i++) {
              let option_combination = {};
              let option_value_names = data.models[i].name;
              option_combination['extraText'] = option_value_names;
              option_combination['options'] = [];
              if (option_value_names.includes(',')) {
                base_options.forEach(function (item) {
                  let found_option_value = item.option_values.filter(function (subitem) {
                    return (
                      option_value_names.includes(subitem.name + ',') || option_value_names.includes(',' + subitem.name)
                    );
                  });
                  if (found_option_value.length > 0) {
                    let option_combination_option = {};
                    option_combination_option.optionName = item.name;
                    option_combination_option.optionValue = found_option_value[0].name;
                    if (typeof found_option_value[0].image != 'undefined') {
                      option_combination.listImage = ['https://cf.shopee.vn/file/' + found_option_value[0].image];
                    }
                    option_combination['options'].push(option_combination_option);
                  }
                });
              } else {
                base_options.forEach(function (item) {
                  let found_option_value = item.option_values.filter(function (subitem) {
                    return subitem.name == option_value_names;
                  });
                  if (found_option_value.length > 0) {
                    let option_combination_option = {};
                    option_combination_option.optionName = item.name;
                    option_combination_option.optionValue = found_option_value[0].name;
                    if (typeof found_option_value[0].image != 'undefined') {
                      option_combination.listImage = ['https://cf.shopee.vn/file/' + found_option_value[0].image];
                    }
                    option_combination['options'].push(option_combination_option);
                  }
                });
              }
              option_combination['price'] = data.models[i].price / 100000;
              if (data.models[i].price_before_discount > 0) {
                option_combination['oldPrice'] = data.models[i].price_before_discount / 100000;
              }
              option_combinations.push(option_combination);
            }
            data_product = {
              meta_title,
              meta_description,
              name,
              folders,
              price,
              old_price,
              description,
              prod_images,
              image,
              option_images: option_combinations,
              product_attributes: prod_attribs,
              referer: window.location.href,
            };
            console.log('data product', data_product);
            add_product();
          })
          .catch((err) => console.error(err));
      }
    });
  } else if (window.location.href.match(/avv.vn/) && $('[class^="product-product-"]').length > 0) {
    meta_title = $('title').text();
    if (typeof meta_title == 'undefined') {
      meta_title = '';
    }
    meta_description = $('meta[name="description"]').attr('content');
    if (typeof meta_description == 'undefined') {
      meta_description = '';
    }
    var name = $('h1.title-product').text();
    folders = [];
    old_price = '';
    if (typeof old_price == 'undefined') {
      old_price = '';
    }
    price = $('.price.product-price').text();
    if (typeof price == 'undefined') {
      price = '';
    }
    price = price.replace('đ', '').replaceAll('.', '').replaceAll(',', '').trim();
    description = $('.tab-content #tab-description').html();
    if (typeof description == 'undefined') {
      description = '';
    }
    prod_images = [];
    var list_img = $('.thumbnail-product.thumb_product_details .item a[href]');
    list_img.each(function (i, item) {
      var img = $(item).attr('href');
      if (prod_images.indexOf(img) == -1) {
        prod_images.push(img);
      }
    });
    var prod_attribs = [];
    data_product = {
      meta_title,
      meta_description,
      name,
      folders,
      old_price,
      price,
      description,
      prod_images,
      referer: window.location.href,
    };
    console.log('data', data_product);
    add_product();
  } else if (window.location.href.match(/omizu.com.vn/) && $('.full.detail').length > 0) {
    meta_title = $('title').text();
    if (typeof meta_title == 'undefined') {
      meta_title = '';
    }
    meta_description = $('meta[name="description"]').attr('content');
    if (typeof meta_description == 'undefined') {
      meta_description = '';
    }
    var name = $('.title_product').text();
    folders = $.map($('.tth_navigation li:not(:last)').toArray(), function (n, i) {
      return $(n).text().trim();
    });
    folders.shift();
    folders.shift();
    old_price = '';
    if (old_price == '' || typeof old_price == 'undefined') {
      old_price = '';
    }
    old_price = old_price.trim().replace('đ', '').replaceAll('.', '').replaceAll(',', '');
    price = $('.price_format .autoUpdate').text();
    if (price == '' || typeof price == 'undefined') {
      price = '';
    }
    price = price.trim().replace('đ', '').replaceAll('.', '').replaceAll(',', '');
    description = $('#tabs .resp-contents.table-responsive').first().html();
    if (description == '' || typeof description == 'undefined') {
      description = '';
    }
    var list_img = $('#gallery_slider_thumb .item img[src]');
    list_img.each(function (i, item) {
      if (prod_images.indexOf($(item).attr('src')) == -1) {
        var img = $(item).attr('src');
        img = img.replace('[90x70', '[1000x1000').trim();
        prod_images.push(img);
      }
    });
    var prod_attribs = [];
    var group_attrs = [];
    var group = {};
    var parent_attrs = $('#tabs .resp-contents.table-responsive table tr');
    if (parent_attrs.length > 0) {
      parent_attrs.each(function (index, item) {
        var group_attr = {};
        group_attr.key = $('td:eq(0)', item).text().trim();
        if (group_attr.key != '') {
          group_attr.value = $('td:eq(1)', item).text().trim();
          group_attrs.push(group_attr);
          group.attrs = group_attrs;
        }
      });
      group.name = 'Thông số sản phẩm';
      prod_attribs.push(group);
    } else {
      prod_attribs = [];
    }
    data_product = {
      meta_title,
      meta_description,
      name,
      folders,
      old_price,
      price,
      description,
      prod_images,
      product_attributes: prod_attribs,
      referer: window.location.href,
    };
    console.log('data', data_product);
    add_product();
  } else if (window.location.href.match(/hafelevietnam.vn/) && $('#getId').length > 0) {
    meta_title = $('title').text();
    if (typeof meta_title == 'undefined') {
      meta_title = '';
    }
    meta_description = $('meta[name="description"]').attr('content');
    if (typeof meta_description == 'undefined') {
      meta_description = '';
    }
    var name = $('#name_pr').text();
    folders = $.map($('.breadcrumb.f li a:not(:last)').toArray(), function (n, i) {
      return $(n).text().trim();
    });
    folders.shift();
    old_price = $('.fl.dbcol2.flexCol>p>u').text();
    if (typeof old_price == 'undefined') {
      old_price = '';
    }
    old_price = old_price.replace('đ', '').replaceAll('.', '').replaceAll(',', '').trim();
    price = $('.dbprice span').text();
    if (typeof price == 'undefined') {
      price = '';
    }
    price = price.replace('đ', '').replaceAll('.', '').replaceAll(',', '').trim();
    description = $('#cdacdiemnoibat').html();
    if (typeof description == 'undefined') {
      description = '';
    }
    prod_images = [];
    var list_img = $('#ProImg .pswrap .psitem img');
    list_img.each(function (i, item) {
      let img = $(item).attr('data-src');
      if (img == '' || typeof img == 'undefined') {
        img = $(item).attr('src');
      }
      prod_images.push(img);
    });
    var prod_attribs = [];
    var group_attrs = [];
    var group = {};
    var group_attr = {};
    var parent_attrs = $('#cthongso .table table tbody tr');
    var parent_attrs_2 = $('#ctongquan span').text().trim().replaceAll('• ', '');
    if (parent_attrs.length > 0) {
      parent_attrs.each(function (index, item) {
        group_attr = {};
        group_attr.key = $('td:eq(0)', item).text().trim();
        if (group_attr.key != '') {
          group_attr.value = $('td:eq(1)', item).text().trim();
          group_attrs.push(group_attr);
          group.attrs = group_attrs;
        }
      });
    }
    let parent_items = [];
    if (parent_attrs_2.length > 0) {
      parent_items = parent_attrs_2.split('\n');
      parent_items.shift();
      parent_items.forEach(function (item_atrs, ind) {
        group_attr = {};
        group_attr.key = item_atrs.split(':')[0];
        group_attr.value = item_atrs.split(':')[1];
        group_attrs.push(group_attr);
        group.attrs = group_attrs;
      });
    } else {
      prod_attribs = [];
    }
    group.name = 'Thông số sản phẩm';
    prod_attribs.push(group);
    console.log(prod_attribs);
    data_product = {
      meta_title,
      meta_description,
      name,
      folders,
      old_price,
      price,
      description,
      prod_images,
      product_attributes: prod_attribs,
      referer: window.location.href,
    };
    console.log('data_product', data_product);
    add_product();
  } else if (window.location.href.match(/vender.vn/) && $('.main-body.main-body-product').length > 0) {
    meta_title = $('title').text();
    if (typeof meta_title == 'undefined') {
      meta_title = '';
    }
    meta_description = $('meta[name="description"]').attr('content');
    if (typeof meta_description == 'undefined') {
      meta_description = '';
    }
    var name = $('.product-title h1').text();
    folders = $.map($('.breadcrumb li a').toArray(), function (n, i) {
      return $(n).text().trim();
    });
    folders.shift();
    old_price = $('.product-price-content del').text();
    if (typeof old_price == 'undefined') {
      old_price = '';
    }
    old_price = old_price.replace('đ', '').replaceAll('.', '').replaceAll(',', '').trim();
    price = $('.product-price-content .pro-price').text();
    if (typeof price == 'undefined') {
      price = '';
    }
    price = price.replace('đ', '').replaceAll('.', '').replaceAll(',', '').trim();
    description = $('.description-content').html();
    if (typeof description == 'undefined') {
      description = '';
    }
    let short_description = $('.product-outstanding').text();
    if (typeof short_description == 'undefined') {
      short_description = '';
    }
    let brand = $('.product-sku-type span:eq(0)').text();
    if (typeof brand == 'undefined') {
      brand = '';
    }
    brand = brand.split(':')[1];
    prod_images = [];
    var list_img = $('.product-gallery .flexslider .flex-viewport ul li img');
    list_img.each(function (i, item) {
      let img = $(item).attr('data-src');
      if (img == '' || typeof img == 'undefined') {
        img = $(item).attr('src');
      }
      if (img.startsWith('//')) {
        img = 'https:' + img;
      }
      prod_images.push(img);
    });
    let option_combinations = [];
    let parent_option = $('.select-swap.select-swap-color .n-sd.swatch-element');
    parent_option.each(function (index, item) {
      let base_option = {};
      base_option.extraText = $('.variant_name', item).text().trim();
      base_option.price = $('.variant_price', item).text().trim();
      base_option.price = base_option.price.trim().replace('đ', '').replaceAll('.', '').replaceAll(',', '').trim();
      let list_img = [];
      img_src = $('img', item).attr('src');
      if (img_src.startsWith('//')) {
        img_src = 'https:' + img_src.trim();
        list_img.push(img_src);
      }
      base_option.listImage = list_img;
      let option = [];
      let op = {};
      op.optionName = 'Màu sắc';
      op.optionValue = base_option.extraText;
      option.push(op);
      base_option.options = option;
      base_option.oldPrice = $('.product-price-content del').text();
      base_option.oldPrice = base_option.oldPrice.replace('₫', '').replaceAll(',', '').trim();
      option_combinations.push(base_option);
    });
    var prod_attribs = [];
    var group_attrs = [];
    var group = {};
    var group_attr = {};
    var parent = $('.product-information table tbody tr');
    group.name = 'Thông số kỹ thuật';
    group.child = [];
    parent.each(function (index, tr_item) {
      if ($('td:eq(1) strong', tr_item).length == 0) {
        group_attr = {};
        group_attr.key = $('td:eq(0)', tr_item).text().trim();
        group_attr.value = $('td:eq(1)', tr_item).text().trim();
        if (group_attr.key != '' || group_attr.value != '') {
          group_attrs.push(group_attr);
          group.attrs = group_attrs;
        }
      } else {
        let base_sub_group = {};
        let sub_groups = [];
        base_sub_group.name = $('td:eq(0)', tr_item).text().trim();
        let sub_groups_length = $('td:eq(0) ~ td', tr_item).length;
        $('td:eq(0) ~ td', tr_item).each(function (td_index, td_item) {
          let sub_group = {};
          let sub_group_attrs = [];
          let sub_group_attr = {};
          if ($('div.select-swap > div').length == sub_groups_length) {
            sub_group.name =
              base_sub_group.name + '(' + $('div.select-swap > div:eq(' + td_index + ')').data('value') + ')';
          } else {
            sub_group.name = base_sub_group.name;
          }
          $('p', td_item).each(function (p_index, p_item) {
            if ($('strong', p_item).length == 0) {
              let sub_group_attr_value = $(this, p_item).text().trim();
              if (sub_group_attr_value != '') {
                sub_group_attr.value = sub_group_attr_value;
                sub_group_attrs.push(sub_group_attr);
                sub_group_attr = {};
              }
            } else {
              sub_group_attr.key = $('strong', p_item).text().trim();
              let sub_group_attr_value = $(p_item).children('strong').remove().end().text();
              if (sub_group_attr_value != '') {
                sub_group_attr.value = sub_group_attr_value;
                sub_group_attrs.push(sub_group_attr);
                sub_group_attr = {};
              }
            }
          });
          sub_group.attrs = sub_group_attrs;
          sub_groups.push(sub_group);
        });

        base_sub_group.child = sub_groups;
        if (sub_groups_length == 1) {
          group.child.push(sub_groups[0]);
        } else {
          group.child.push(base_sub_group);
        }
      }
    });
    prod_attribs.push(group);
    data_product = {
      meta_title,
      meta_description,
      name,
      folders,
      brand,
      old_price,
      price,
      description,
      short_description,
      prod_images,
      option_images: option_combinations,
      product_attributes: prod_attribs,
      referer: window.location.href,
    };
    console.log('data_product', data_product);
    add_product();
  } else if (window.location.href.match(/cellphones.com.vn/) && $('.block-detail-product').length > 0) {
    meta_title = $('title').text();
    if (typeof meta_title == 'undefined') {
      meta_title = '';
    }
    meta_description = $('meta[name="description"]').attr('content');
    if (typeof meta_description == 'undefined') {
      meta_description = '';
    }
    var name = $('.box-product-name h1').text().trim();
    folders = $.map($('.block-breadcrumbs.affix li a').toArray(), function (n, i) {
      return $(n).text().trim();
    });
    folders.shift();
    old_price = $('.box-detail-product__box-center .product__price--through').text();
    if (typeof old_price == 'undefined') {
      old_price = '';
    }
    old_price = old_price.replace('₫', '').replaceAll('.', '').trim();
    price = $('.box-detail-product__box-center .product__price--show').text();
    if (typeof price == 'undefined') {
      price = '';
    }
    price = price.replace('₫', '').replaceAll('.', '').trim();
    description = $('.cps-block-content > div:not(.ksp-content.p-2.mb-2 , .cps-block-content_btn-showmore)').html();
    if (typeof description == 'undefined') {
      description = '';
    }
    let short_description = $('.ksp-content.p-2.mb-2').html();
    if (typeof short_description == 'undefined') {
      short_description = '';
    }
    let prod_images = [];
    $('.gallery-product-detail.my-2 .gallery-thumbs .swiper-slide img').each(function (img_index, img_item) {
      let img = $(img_item).attr('data-src');
      if (img == '' || typeof list_img == 'undefined') {
        img = $(img_item).attr('src');
        img = img.replace('/50x/', '/1000/').trim();
        prod_images.push(img);
      }
    });
    let prod_attribs = [];
    $('.modal-card-body .modal-content .technical-content-modal li').each(function (li_index, li_item) {
      let group = {};
      group.name = $('>p.title', li_item).text();
      let group_attrs = [];
      $('.modal-item-description>div', li_item).each(function (div_index, div_item) {
        let group_attr = {};
        group_attr.key = $('>p', div_item).text();
        group_attr.value = $('>div', div_item).text();
        group_attrs.push(group_attr);
      });
      group.attrs = group_attrs;
      prod_attribs.push(group);
    });

    let option_combinations = [];
    let count_combine = 0;
    const waitForDone = new Promise((resolve, reject) => {
      $('body script').each(function (script_index, script_item) {
        let scriptContent = $(script_item).html();
        if (scriptContent.includes('window.__NUXT__')) {
          let main_product_id = scriptContent.match(/Array\(\d+\),(\d+?),/);
          let subScriptContent = scriptContent.match(/\.path\s*=\s*\"[^\"]+\";\s*\w+\d*\[\d+\].*?return/)[0];
          let item_man = main_product_id[1];
          let list_product_id = subScriptContent.matchAll(/\w+\d*\w*\[(\d+)\]=(\d+?);/g);
          let meet_times = 0;
          let array_product_id = Array.from(list_product_id);
          let addition_array_product_id = array_product_id
            .filter((m) => {
              if (parseInt(m[1]) === 0) {
                meet_times++;
              } return meet_times > 1;
            }).map((m) => m[2]);
          let all_array_product_id = [...addition_array_product_id, item_man];
          count_combine = all_array_product_id.length;
          all_array_product_id.forEach(function (item_id_pro) {
            const waitForDoneItem = new Promise((resolveItem, reject) => {
              $.ajax({
                type: 'POST',
                url: 'https://api.cellphones.com.vn/graphql/query',
                dataType: 'json',
                contentType: 'application/json',
                data: JSON.stringify({
                  query: `query {\n                product(\n                    id : ${item_id_pro},\n                    regionId : 7,\n                ){\n                    general{\n                       attributes\n                       attribute_set_id\n                       galleries\n                       name\n                       relation\n                       url_path\n                       child_product\n                       up_sell\n                       youtube\n                       sku\n                       product_components\n                       categories{\n                       categoryId\n                        similar\n                        name\n                        uri\n                        level\n                        path\n                      }\n                    }\n                    region {\n                        promotion_information\n                        promotion_pack\n                        price\n                        special_price\n                        thumbnail\n                         product_state\n                      included_accessories\n                      warranty_information\n                      sticker\n                      short_description\n                      default_id {\n                        product_id\n                      }\n                    }\n                    filterable {\n                        stock\n                        stock_available\n                    }\n                    specification {\n                        basic\n                        full_by_group\n                    }\n                }\n              }`,
                  variables: {},
                }),
              }).done(function (response_main) {
                let data_color_main = response_main.data.product.general.attributes;
                let option_combination = {};
                let list_img_option =
                  'https://cdn2.cellphones.com.vn/1000x/media/catalog/product' + data_color_main.ads_base_image;
                option_combination.listImage = [list_img_option];
                let base_option = {};
                base_option.optionName = 'Màu Sắc';
                base_option.optionValue = data_color_main.color;
                option_combination.options = [base_option];
                option_combination.price = data_color_main.special_price.replace('.0000', '');
                option_combination.oldPrice = old_price.replace('₫', '').replaceAll('.', '').trim();
                resolveItem(option_combination);
              }).fail(function (any) {
                console.log('fgdfg', any);
              });
            });
            waitForDoneItem.then(function (data_options) {
              option_combinations.push(data_options);
              if (option_combinations.length == count_combine) {
                resolve(option_combinations);
              }
            });
          });
        }
      });
    });
    waitForDone.then(function (option_combinations) {
      data_product = {
        meta_title,
        meta_description,
        name,
        folders,
        old_price,
        price,
        description,
        short_description,
        prod_images,
        option_images: option_combinations,
        product_attributes: prod_attribs,
        referer: window.location.href,
      };
      console.log('data_product', data_product);
    });
  } else if (window.location.href.match(/khangluxury.vn/) && $('.product.products-details').length > 0) {
    meta_title = $('title').text();
    if (typeof meta_title == 'undefined') {
      meta_title = '';
    }
    meta_description = $('meta[name="description"]').attr('content');
    if (typeof meta_description == 'undefined') {
      meta_description = '';
    }
    var name = $('h1.title-head').text().trim();
    folders = $.map($('.breadcrumb li a:not(:last)').toArray(), function (n, i) {
      return $(n).text().trim();
    });
    folders.shift();
    old_price = '';
    price = $('.price-box.clearfix .price.product-price').text();
    if (price == '' || typeof price == 'undefined') {
      price = '';
    }
    price = price.replace('VNĐ', '').replaceAll('.', '').replaceAll(',', '').trim();
    price = price.split(':')[1];
    description = $('.tab-content.current').html();
    if (description == '' || typeof description == 'undefined') {
      description = '';
    }
    description = description.replaceAll(/style=\"(.*?)\"/g, '');
    description = description.replaceAll(
      / src=\"\/images/g,
      ' class="lazyload" data-src="https://khangluxury.vn/images'
    );
    let prod_attribs = [];
    let prod_images = [];
    let list_img = $('.thumbnail-product .item img');
    if ($('.thumbnail-product .item img').length > 0) {
      list_img.each(function (img_index, img_item) {
        let img_src = $(img_item).attr('src');
        if (img_src.startsWith('/')) {
          img_src = 'https://khangluxury.vn' + img_src.trim();
        }
        img_src = img_src.replace(/images\/image.php\?width=(\d+)&image=\//, '');
        prod_images.push(img_src);
      });
    } else {
      let attr_style = $('.zoomContainer .zoomWindowContainer .zoomWindow').attr('style');
      let regex_img = /url\(\"(.*?)\"\)\;/g;
      let img_regex = regex_img.exec(attr_style);
      let img = 'https://khangluxury.vn' + img_regex[1];
      img = img.replace(/images\/image.php\?width=(\d+)&image=\//, '');
      prod_images.push(img);
    }

    data_product = {
      meta_title,
      meta_description,
      name,
      folders,
      old_price,
      price,
      description,
      prod_images,
      product_attributes: prod_attribs,
      referer: window.location.href,
    };
    console.log('data_product', data_product);
    add_product();
  } else if (window.location.href.match(/lazada.vn/) && $('.pdp-block.pdp-block__product-detail').length > 0) {
    meta_title = $('title').text();
    if (typeof meta_title == 'undefined') {
      meta_title = '';
    }
    meta_title = meta_title.replace('| Lazada.vn', '').trim();
    meta_description = $('meta[name="description"]').attr('content');
    if (typeof meta_description == 'undefined') {
      meta_description = '';
    }
    var name = $('h1.pdp-mod-product-badge-title').text().trim();
    folders = $.map($('.breadcrumb li a').toArray(), function (n, i) {
      return $(n).text().trim();
    });
    old_price = $('.pdp-mod-product-price .origin-block span.pdp-price_type_deleted').text();
    if (typeof old_price == 'undefined') {
      old_price == '';
    }
    old_price = old_price.replace('₫', '').replaceAll('.', '').replaceAll(',', '').trim();
    price = $('.pdp-product-price span.pdp-price_type_normal').text();
    if (typeof price == 'undefined') {
      price = '';
    }
    price = price.replace('₫', '').replaceAll('.', '').replaceAll(',', '').trim();
    description = $('.html-content.detail-content').html();
    if (typeof description == 'undefined') {
      description = '';
    }
    let short_description = $('.html-content.pdp-product-highlights').html();
    let prod_attribs = [];
    let group = {};
    let group_attrs = [];
    $('.pdp-mod-specification .specification-keys li.key-li').each(function (index, item) {
      group_attr = {};
      group_attr.key = $('.key-title', item).text().trim();
      group_attr.value = $('.key-value', item).text().trim();
      group_attrs.push(group_attr);
    });
    group.attrs = group_attrs;
    group.name = 'Thông số kỹ thuật';
    prod_attribs.push(group);
    let prod_images = [];
    $('#module_item_gallery_1 .item-gallery__thumbnail .item-gallery__image-wrapper img').each(function (
      img_index,
      img_item
    ) {
      let img_src = $(img_item).attr('src');
      img_src = img_src.replace('_120x120q80.jpg_.webp', '');
      prod_images.push(img_src);
    });
    let option_combinations = [];
    $('body script').each(function (index, item) {
      let scriptContent = $(item).html();
      if (scriptContent.includes('__moduleData__')) {
        let found = scriptContent.match(/__moduleData__\s*=\s*(.*?\}\}\});/);
        let jsonstring = found[1];
        let jsonData = JSON.parse(jsonstring);
        let data_pro = jsonData.data.root.fields;
        data_pro.productOption.skuBase.skus.forEach(function (sku_id_item) {
          let base_option = {};
          let sku_id = sku_id_item.skuId;
          let sku_infos = data_pro.skuInfos;
          let sku_info = sku_infos[sku_id];
          base_option.oldPrice = sku_info.price.originalPrice.value;
          base_option.price = sku_info.price.salePrice.value;
          let propPath = sku_id_item.propPath;
          propOptions = propPath.split(';');
          base_option['options'] = [];
          propOptions.forEach(function (it) {
            let pid_vid = it.split(':');
            let vid = pid_vid[1];
            data_pro.productOption.skuBase.properties.forEach(function (prop) {
              let found_option_value = prop.values.filter(function (obj) {
                return obj.vid == vid;
              });
              if (found_option_value.length > 0) {
                let option_combination_option = {};
                option_combination_option.optionName = prop.name;
                option_combination_option.optionValue = found_option_value[0].name;
                if (typeof found_option_value[0].image != 'undefined') {
                  base_option.listImage = ['https:' + found_option_value[0].image];
                }
                base_option['options'].push(option_combination_option);
              }
            });
          });
          option_combinations.push(base_option);
        });
      }
    });
    data_product = {
      meta_title,
      meta_description,
      name,
      folders,
      old_price,
      price,
      description,
      short_description,
      prod_images,
      option_images: option_combinations,
      product_attributes: prod_attribs,
      referer: window.location.href,
    };
    console.log('data_product', data_product);
    add_product();
  } else if (window.location.href.match(/sendo.vn/) && !window.location.href.match(/detail-api.sendo.vn\/full/g)) {
    let in_product_detail = false;
    let in_product_detail_try = 0;
    function while_promise() {
      return new Promise((resolve, reject) => {
        function while_loop() {
          setTimeout(function () {
            in_product_detail = $('#id-media-block').length > 0;
            if (!in_product_detail && in_product_detail_try < 10) {
              in_product_detail_try++;
              while_loop();
            } else {
              resolve(in_product_detail);
            }
          }, 300);
        }
        while_loop();
      });
    }
    while_promise().then(function (is_product_detail) {
      if (!is_product_detail) {
        console.log('not found');
        craw_next();
        return;
      }
      console.log('ok');
      let url_regex = /www.sendo.vn\/(.*?)\.html/gi;
      let url_matches = url_regex.exec(window.location.href);
      if (url_matches.length > 0) {
        let json_url = `https://detail-api.sendo.vn/full/${url_matches[1]}`;
        fetch(json_url)
          .then((result) => result.json())
          .then((output) => {
            let data = output.data;
            console.log('🚀 ~ file: content.js ~ line 1764 ~ .then ~ data', data);
            let meta_title = output.meta_data.og_title;
            if (typeof meta_title == 'undefined') {
            }
            let meta_description = $('meta[name="description"]').attr('content');
            if (typeof meta_description == 'undefined') {
              meta_description = '';
            }
            let name = output.meta_data.page_title;
            let folders = [];
            data.category_info.forEach(function (folder_item) {
              let folder = folder_item.title;
              folders.push(folder);
            });
            let short_description = data.short_description;
            if (typeof short_description == 'undefined') {
              short_description = '';
            }
            let price = data.final_price;
            if (price == '' || typeof price == 'undefined') {
              price = '';
            }
            let old_price = data.price;
            if (typeof old_price == 'undefined') {
              old_price = '';
            }
            let description = data.description_info.description;
            if (typeof description == 'undefined') {
              description = '';
            }
            let prod_images = [];
            data.media.forEach(function (img_item) {
              let list_img = img_item.image;
              prod_images.push(list_img);
            });
            let parent_options = data.attribute[0].value;
            let option_combinations = [];
            if (parent_options) {
              parent_options.forEach(function (op_item) {
                let option_combination = {};
                let base_option = {};
                base_option.optionName = data.attribute[0].name;
                option_combination.listImage = [op_item.image];
                base_option.optionValue = op_item.name;
                option_combination.price = price;
                option_combination.oldPrice = old_price;
                option_combination.options = [base_option];
                option_combinations.push(option_combination);
              });
            }
            let prod_attribs = [];
            let group = {};
            let group_attrs = [];
            let paren_prod_attr = data.description_info.attributes;
            if (paren_prod_attr) {
              paren_prod_attr.forEach(function (attr_item) {
                let group_attr = {};
                group_attr.key = attr_item.name;
                group_attr.value = attr_item.value;
                group_attrs.push(group_attr);
              });
              group.attrs = group_attrs;
              group.name = $('._96e-fc73c8.undefined.d7e-d87aa1.d7e-fb1c84').text();
              prod_attribs.push(group);
            }
            data_product = {
              meta_title,
              meta_description,
              name,
              folders,
              short_description,
              description,
              price,
              old_price,
              option_images: option_combinations,
              product_attributes: prod_attribs,
              referer: window.location.href,
              prod_images,
            };
            console.log('data_product', data_product);
            add_product();
          })
          .catch((err) => console.error(err));
      }
    });
  } else if (window.location.href.match(/meta.vn/) && $('.view-detail-product').length > 0) {
    meta_title = $('title').text();
    if (meta_title == '' || typeof meta_title == 'undefined') {
      meta_title = '';
    }
    meta_description = $('meta[name="description"]').attr('content');
    if (meta_description == '' || typeof meta_description == 'undefined') {
      meta_description = '';
    }
    let folders = [];
    folders = $.map($('.breadcrum-cat-box li.breadcrum-cat-item a').toArray(), function (n, i) {
      return $(n).text().trim();
    });
    folders.shift();
    let name = $('.prod-name-main h1').text();
    let price = $('.info-spec-right .p-price').text();
    if (price == '' || typeof price == 'undefined') {
      price = '';
    }
    price = price.replaceAll('.', '').replace('đ', '').trim();
    let old_price = $('.info-spec-right .p-price-old').text();
    if (old_price == '' || typeof old_price == 'undefined') {
      old_price = '';
    }
    old_price = old_price.replaceAll('.', '').replace('đ', '').trim();
    let description = $('.show-content-main').html();
    let prod_images = [];
    $('.view-images-product img').each(function (index, item) {
      let img_src = $(item).attr('data-ssrc');
      if (img_src == '' || typeof img_src == 'undefined') {
        img_src = $(item).attr('src');
      }
      prod_images.push(img_src);
    });
    let option_combinations = [];
    $('.att-layout-thumbnail ul.option-thumb li').each(function (li_index, li_item) {
      let option_combination = {};
      let img_src = $('img', li_item).attr('src');
      option_combination.listImage = ['https://meta.vn' + img_src];
      option_combination.price = price.replaceAll('.', '').replace('đ', '').trim();
      option_combination.oldPrice = old_price.replaceAll('.', '').replace('đ', '').trim();
      let base_option = {};
      base_option.optionName = 'Màu Sắc';
      base_option.optionValue = $('.color-item', li_item).attr('title').trim();
      option_combination.options = [base_option];
      option_combinations.push(option_combination);
    });
    let prod_attribs = [];
    $('.prod-Spec-main .title-specs').each(function (name_index, name_item) {
      let group = {};
      group.name = $('h2', name_item).text().trim();
      console.log('group.name', group.name);
      let group_attrs = [];
      $(name_item)
        .next('.body-specs')
        .find('li')
        .each(function (attr_index, attr_item) {
          let group_attr = {};
          group_attr.key = $('span:eq(0)', attr_item).text().trim();
          group_attr.value = $('span:eq(1)', attr_item).text().trim();
          group_attrs.push(group_attr);
        });
      group.attrs = group_attrs;
      prod_attribs.push(group);
    });

    data_product = {
      meta_title,
      meta_description,
      folders,
      name,
      price,
      old_price,
      prod_images,
      description,
      option_images: option_combinations,
      product_attributes: prod_attribs,
      referer: window.location.href,
    };
    console.log('data_product', data_product);
    add_product();
  } else if (window.location.href.match(/hoanghamobile.com/) && $('.product-layout.product-layout-grid').length > 0) {
    meta_title = $('title').text();
    if (meta_title == '' || typeof meta_title == 'undefined') {
      meta_title = '';
    }
    meta_description = $('meta[name="description"]').attr('content');
    if (meta_description == '' || typeof meta_description == 'undefined') {
      meta_description = '';
    }
    let folders = [];
    folders = $.map($('.breadcrumb li a span:not(:last)').toArray(), function (n, i) {
      return $(n).text().trim();
    });
    folders.shift();
    let price = $('.price.current-product-price strong').text();
    if (price == '' || typeof price == 'undefined') {
      price = '';
    }
    price = price.replaceAll(',', '').replace('₫', '').trim();
    let old_price = $('.price.current-product-price strike').text();
    if (old_price == '' || typeof old_price == 'undefined') {
      old_price = '';
    }
    old_price = old_price.replaceAll(',', '').replace('₫', '').trim();
    let option_combinations = [];
    $('#colorOptions > div').each(function (data_index, data_item) {
      let base_option = {};
      let data_idx = $(data_item).attr('data-idx');
      base_option.oldPrice = $(data_item).attr('data-lastprice');
      if (typeof base_option.oldPrice == 'undefined') {
        base_option.oldPrice = '';
      }
      base_option.oldPrice = base_option.oldPrice.replaceAll(',', '').replace('₫', '').trim();
      base_option.price = $(data_item).attr('data-bestprice');
      if (typeof base_option.price == 'undefined') {
        base_option.price = '';
      }
      base_option.price = base_option.price.replaceAll(',', '').replace('₫', '').trim();
      let options = [];
      let option = {};
      option.optionName = 'Màu sắc';
      option.optionValue = $(data_item).attr('data-name');
      base_option.listImage = [
        $('#imagePreview div.viewer[data-u="slides"]:not(:first) > div:eq(' + data_idx + ') a[href]').attr('href'),
      ];
      options.push(option);
      base_option.options = options;
      option_combinations.push(base_option);
    });
    let prod_images = [];
    $('.product-image #imagePreview a').each(function (index, item) {
      let img_src = $(item).attr('href');
      prod_images.push(img_src);
    });
    let description = $('#productContent').html();
    $('head script').each(function (indexz, itemz) {
      let scriptContent = $(itemz).html();
      if (scriptContent.includes('window.insider_object.product')) {
        let found = scriptContent.match(/window.insider_object.product\s*=\s*(.*?\});/);
        let jsonstring = found[1];
        let jsonData = JSON.parse(jsonstring);
        let prod_id = jsonData.id;
        let name = jsonData.name;
        $.ajax({
          url: `https://hoanghamobile.com/Ajax/fullspecs/${prod_id}`,
        }).done(function (data) {
          let prod_attribs = [];
          let group = {};
          let group_attrs = [];
          $('tr', data).each(function (tr_index, tr_item) {
            if ($(tr_item).find('th').length > 0) {
              if (typeof group.name !== 'undefined') {
                prod_attribs.push(group);
              }
              group = {};
              group.name = $('th', tr_item).text();
              group_attrs = [];
            } else {
              let group_attr = {};
              group_attr.key = $('td:eq(0)', tr_item).text().trim();
              group_attr.value = $('td:eq(1)', tr_item).text().trim();
              group_attr.value = group_attr.value.replaceAll(/[ ]{2,}/g, '');
              if (
                group_attr.key != '' ||
                (typeof group_attr.key != 'undefined' && group_attr.value != '') ||
                group_attr.value != 'undefined'
              ) {
                group_attrs.push(group_attr);
                group.attrs = group_attrs;
              }
            }
          });
          prod_attribs.push(group);
          data_product = {
            meta_title,
            meta_description,
            folders,
            name,
            price,
            old_price,
            prod_images,
            description,
            option_images: option_combinations,
            product_attributes: prod_attribs,
            referer: window.location.href,
          };
          console.log('data_product', data_product);
          add_product();
        });
      }
    });
  } else if (window.location.href.match(/didongthongminh.vn/) && $('.product.mt20').length > 0) {
    meta_title = $('title').text();
    if (meta_title == '' || typeof meta_title == 'undefined') {
      meta_title = '';
    }
    meta_description = $('meta[name="description"]').attr('content');
    if (meta_description == '' || typeof meta_description == 'undefined') {
      meta_description = '';
    }
    let folders = [];
    folders = $.map($('.breadcrumb .fl-left a span:not(:last)').toArray(), function (n, i) {
      return $(n).text().trim();
    });
    folders.shift();
    let name = $('h1.pull-left').text();
    let price = $('.top_prd ._price').text();
    if (price == '' || typeof price == 'undefined') {
      price = '';
    }
    price = price.replaceAll('.', '').replace('₫', '').trim();
    let old_price = $('.top_prd .price_old').text();
    if (old_price == '' || typeof old_price == 'undefined') {
      old_price = '';
    }
    old_price = old_price.replaceAll('.', '').replace('₫', '').trim();
    let prod_images = [];
    $('#imageGallery img').each(function (index, item) {
      let img_src = $(item).attr('src');
      prod_images.push(img_src);
    });
    let short_description = $('#boxdesc div').html();
    let prod_attribs = [];
    $('.charactestic_table_detail tbody tr').each(function (tr_index, tr_item) {
      let group = {};
      if ($(tr_item).find('td.group_field').length > 0) {
        $(tr_item)
          .find('td.group_field')
          .each(function (td_index, td_item) {
            group.name = $(td_item).text().trim();
            prod_attribs.push(group);
            group_attrs = [];
          });
      } else {
        group_attr = {};
        group_attr.key = $('td:eq(0)', tr_item).text().trim();
        group_attr.value = $('td:eq(1)', tr_item).text().trim();
        if (group_attr.value != '' || group_attr.key != '') {
          group_attrs.push(group_attr);
        }
      }
      group.attrs = group_attrs;
    });
    prod_attribs.push(group);
    let option_combinations = [];

    $('.products_type:first() .item_price.products_type_item').each(function (type_idex, type_item) {
      let base_option = {};
      base_option.price = $('p>span:eq(1)', type_item).text().trim();
      if (base_option.price == 'undefined') {
        base_option.price = '';
      }
      base_option.price = base_option.price.replaceAll('.', '').replace('đ', '');
      base_option.oldPrice = old_price.replaceAll('.', '').replace('đ', '').trim();
      if (base_option.oldPrice == 'undefined') {
        base_option.oldPrice = '';
      }
      base_option.listImage = [];
      let img = $('span>img', type_item).attr('src');
      if (img != 'undefined') {
        img = img.replace('/resized/', '/original/');
        base_option.listImage.push(img);
      }
      let options = [];
      let option = {};
      option.optionName = 'Màu Sắc';
      option.optionValue = $('p>span:eq(0)', type_item).text().trim();
      if (
        option.optionName != '' &&
        option.optionValue != '' &&
        base_option.listImage != '' &&
        base_option.price != ''
      ) {
        options.push(option);
        base_option.options = options;
        option_combinations.push(base_option);
      }
    });
    let description = $('#boxdesc').html();
    description = description
      .replaceAll('class="lazy-loaded"', '')
      .replaceAll('data-src="/', 'class="lazyload" data-src="https://didongthongminh.vn/')
      .replaceAll('src="/upload_images', 'src="https://didongthongminh.vn/upload_images');
    data_product = {
      meta_title,
      meta_description,
      folders,
      name,
      price,
      old_price,
      prod_images,
      short_description,
      description,
      product_attributes: prod_attribs,
      referer: window.location.href,
      option_images: option_combinations,
    };
    console.log('data_product', data_product);
    add_product();
  } else if (window.location.href.match(/viettelstore.vn/) && $('#ProductId').length > 0) {
    meta_title = $('title').text();
    if (meta_title == '' || typeof meta_title == 'undefined') {
      meta_title = '';
    }
    meta_description = $('meta[name="description"]').attr('content');
    if (meta_description == '' || typeof meta_description == 'undefined') {
      meta_description = '';
    }
    let folders = [];
    folders = $.map($('.text1 a').toArray(), function (n, i) {
      return $(n).text().trim();
    });
    folders.shift();
    let name = $('h1.txt-24').text().trim();
    let price = $('#_price_new436').text();
    if (price == '' || typeof price == 'undefined') {
      price = '';
    }
    price = price.replaceAll('.', '').replace('₫', '').trim();
    let old_price = $('#_price_new437').text();
    if (old_price == '' || typeof old_price == 'undefined') {
      old_price = '';
    }
    old_price = old_price.replaceAll('.', '').replace('₫', '').trim();
    let prod_images = [];
    $('#sync-big .item img').each(function (index, item) {
      let img_src = $(item).attr('src');
      prod_images.push(img_src);
    });
    let prod_attribs = [];
    $('#panel-cau-hinh table tbody tr').each(function (tr_index, tr_item) {
      let group = {};
      if ($(tr_item).find('b').length > 0) {
        group.name = $(tr_item).find('b').text();
        if (group.name == '') {
          group.name = 'Thông số kỹ thuật';
        }
        prod_attribs.push(group);
        group_attrs = [];
      } else {
        let group_attr = {};
        group_attr.key = $('.left_row_item', tr_item).text().trim();
        group_attr.value = $('.right_row_item', tr_item).text().trim();
        group_attrs.push(group_attr);
      }
      group.attrs = group_attrs;
    });
    prod_attribs.push(group);
    let description = $('#gioithieu1').html();
    let option_combinations = [];
    let url_regex = /-pid(\d+)\.html/gi;
    let url_matches = url_regex.exec(window.location.href);
    let combines = $('#GenProducInfos_checker .child_box label');
    let count_combine = combines.length;
    const waitForDone = new Promise((resolve, reject) => {
      combines.each(function (type_idex, type_item) {
        const waitForDoneItem = new Promise((resolveItem, reject) => {
          let base_option = {};
          let option_combination = {};
          base_option.optionName = 'Màu Sắc';
          base_option.optionValue = $('.title-color', type_item).text();

          let color_id = $(type_item).attr('id');
          $.post('https://viettelstore.vn/AjaxAction.aspx', {
            action: 'getimgincolorv3',
            productId: url_matches[1],
            rulesId: `${color_id}`,
          }).done(function (data) {
            option_combination.listImage = [];
            $(data).each(function (index, item) {
              if ($(item).is('#sync-big-2')) {
                $('.item img', item).each(function (idx, img_item) {
                  option_combination.listImage.push($(img_item).attr('src'));
                });
                $.ajax({
                  type: 'POST',
                  url: 'https://viettelstore.vn/Site/_Sys/ajax.asmx/ProductRule_GetPriceByRule',
                  dataType: 'json',
                  contentType: 'application/json',
                  data: JSON.stringify({
                    id: `${color_id}`,
                    pid: url_matches[1],
                  }),
                }).done(function (response) {
                  option_combination.oldPrice = response.d.data.Price;
                  option_combination.price = response.d.data.SellPrice;
                  option_combination.options = [base_option];
                  resolveItem(option_combination);
                });
              }
            });
          });
        });
        waitForDoneItem.then(function (data) {
          console.log('add item', new Date().getTime());
          option_combinations.push(data);
          if (option_combinations.length == count_combine) {
            resolve(option_combinations);
          }
        });
      });
    });
    waitForDone.then(function (option_combinations) {
      data_product = {
        meta_title,
        meta_description,
        folders,
        name,
        price,
        old_price,
        prod_images,
        description,
        option_images: option_combinations,
        product_attributes: prod_attribs,
        referer: window.location.href,
      };
      console.log('data_product', data_product);
      add_product();
    });
  } else if (window.location.href.match(/donghohaitrieu.com/) && $('.product-template-default').length > 0) {
    meta_title = $('title').text();
    if (meta_title == '' || typeof meta_title == 'undefined') {
      meta_title = '';
    }
    meta_description = $('meta[name="description"]').attr('content');
    if (meta_description == '' || typeof meta_description == 'undefined') {
      meta_description = '';
    }
    let folders = [];
    folders = $.map($('.woocommerce-breadcrumb a').toArray(), function (n, i) {
      return $(n).text().trim();
    });
    folders.shift();
    let name = $('h1.title.product_title').text();
    let old_price = $('.product_meta .price .woocommerce-Price-amount.amount bdi').text();
    if (old_price == '' || typeof old_price == 'undefined') {
      old_price = '';
    }
    old_price = old_price.replaceAll('.', '').replace('₫', '').trim();
    let price = old_price.replaceAll('.', '').replace('₫', '').trim();
    let prod_images = [];
    $('.woocommerce-product-gallery__wrapper li a').each(function (index, item) {
      let img_src = $(item).attr('href');
      prod_images.push(img_src);
    });
    let prod_attribs = [];
    let group_attrs = [];
    $('.thong-tin-san-pham p').each(function (p_index, p_item) {
      let group_attr = {};
      let p_text = $(p_item).text();
      group_attr.key = p_text.split(':')[0];
      group_attr.value = p_text.split(':')[1];
      if (group_attr.key != '' && group_attr.value != '') {
        group_attrs.push(group_attr);
      }
    });
    let group = {};
    group.name = 'Thông số kỹ thuật';
    group.attrs = group_attrs;
    prod_attribs.push(group);
    let sku = $('.sku_wrapper .sku').text();
    if (typeof sku == 'undefined') {
      sku = '';
    }
    let description = $(
      '#content_tab_description .wpb_column.vc_column_container.vc_col-sm-8 .wpb_text_column.wpb_content_element '
    ).html();
    description = description
      .replaceAll('perfmatters-lazy', 'lazyload')
      .replaceAll('perfmatters-lazy-youtube', 'lazyload')
      .replaceAll('loaded', '');
    data_product = {
      meta_title,
      meta_description,
      folders,
      name,
      price,
      sku,
      old_price,
      prod_images,
      description,
      product_attributes: prod_attribs,
      referer: window.location.href,
    };
    console.log('data_product', data_product);
    add_product();
  } else if (window.location.href.match(/zshop.vn/) && $('.product-detail-cs').length > 0) {
    meta_title = $('title').text();
    if (meta_title == '' || typeof meta_title == 'undefined') {
      meta_title = '';
    }
    meta_description = $('meta[name="description"]').attr('content');
    if (meta_description == '' || typeof meta_description == 'undefined') {
      meta_description = '';
    }
    let folders = [];
    folders = $.map($('#breadcrumbs_11 a.ty-breadcrumbs__a bdi').toArray(), function (n, i) {
      return $(n).text().trim();
    });
    folders.shift();
    let name = $('h1.ty-product-block-title').text();
    let old_price = $('.ty-product-prices .ty-strike .ty-list-price.ty-nowrap').text();
    if (old_price == '' || typeof old_price == 'undefined') {
      old_price = '';
    }
    old_price = old_price.replaceAll(',', '').replace('₫', '').trim();
    let price = $('.ty-product-block__price-actual .ty-price .ty-price-num').text();
    if (price == '' || typeof price == 'undefined') {
      price = '';
    }
    price = price.replaceAll(',', '').replace('₫', '').trim();
    let prod_images = [];
    $('.ty-product-img .owl-item a').each(function (index, item) {
      let img_src = $(item).attr('href');
      prod_images.push(img_src);
    });
    let option_combinations = [];
    let combines = $('.cm-picker-product-variation-features.ty-product-options .ty-control-group .v-wrap a');
    let count_combine = combines.length;
    const waitForDone = new Promise((resolve, reject) => {
      combines.each(function (a_index, a_item) {
        const waitForDoneItem = new Promise((resolveItem, rejectItem) => {
          let url_regex = /\.html(.*?)$/gi;
          let url_matches = url_regex.exec($(a_item).attr('href'));
          let url_a = $(a_item).attr('href');
          if (typeof url_matches[1] == 'undefined' || url_matches[1] == '') {
            url_a = url_a + `?result_ids=product_detail_page`;
          } else {
            url_a = url_a + `&result_ids=product_detail_page`;
          }
          let url_ajax = url_a + '&is_ajax=1';
          $.ajax({
            url: `${url_ajax}`,
          }).done(function (data) {
            let data_op = data.html.product_detail_page;
            $(data_op).each(function (id, item_data) {
              if ($(item_data).is('.ty-product-block.ty-product-detail')) {
                let base_option = {};
                let option_combination = {};
                base_option.optionName = 'Màu Sắc';
                base_option.optionValue = $('.ty-product-option-child', item_data).text();
                option_combination.options = [base_option];
                option_combination.listImage = [$('img', item_data).attr('src')];
                option_combination.oldPrice = $('.ty-product-prices .ty-strike .ty-list-price.ty-nowrap').text();
                option_combination.oldPrice = option_combination.oldPrice.replaceAll(',', '').replace('đ', '').trim();
                option_combination.price = $('.ty-product-block__price-actual .ty-price .ty-price-num').text();
                option_combination.price = option_combination.price.replaceAll(',', '').replace('đ', '').trim();
                resolveItem(option_combination);
              }
            });
          });
        });
        waitForDoneItem.then(function (data) {
          console.log('add item', new Date().getTime());
          option_combinations.push(data);
          if (option_combinations.length == count_combine) {
            resolve(option_combinations);
          }
        });
      });
    });
    waitForDone.then(function (option_combinations) {
      let prod_attribs = [];
      let group_attrs = [];
      $('#content_extra_tab_7 table tbody tr').each(function (tr_index, tr_item) {
        let group_attr = {};
        group_attr.key = $('td:eq(0)', tr_item).text().trim();
        group_attr.value = $('td:eq(1)', tr_item).text().trim();
        if (group_attr.key != '' && group_attr.value != '') {
          group_attrs.push(group_attr);
        }
      });
      let group = {};
      group.name = 'Thông số kỹ thuật';
      group.attrs = group_attrs;
      prod_attribs.push(group);
      let sku = $('.sku_wrapper .sku').text();
      if (typeof sku == 'undefined') {
        sku = '';
      }
      let description = $('#content_description').html();
      description = description.replace('max-height: 650px;', '');
      if (typeof description == 'undefined') {
        description = '';
      }
      let short_description = $('.ty-product-block__description').html();
      data_product = {
        meta_title,
        meta_description,
        folders,
        name,
        price,
        sku,
        old_price,
        prod_images,
        short_description,
        description,
        product_attributes: prod_attribs,
        option_images: option_combinations,
        referer: window.location.href,
      };
      console.log('data_product', data_product);
      add_product();
    });
  } else if (window.location.href.match(/bachlongmobile.com/) && $('.catalog-product-view').length > 0) {
    let in_script_product = false;
    let in_script_product_try = 0;
    function while_promise() {
      return new Promise((resolve, reject) => {
        function while_loop() {
          setTimeout(function () {
            in_script_product = $('body script').length > 0;
            if (!in_script_product && in_script_product_try < 10) {
              in_script_product_try++;
              while_loop();
            } else {
              resolve(in_script_product);
            }
          }, 300);
        }
        while_loop();
      });
    }
    while_promise().then(function (data_script) {
      if (!data_script) {
        console.log('not found');
        craw_next();
        return;
      }
      console.log('ok');
      meta_title = $('title').text();
      if (meta_title == '' || typeof meta_title == 'undefined') {
        meta_title = '';
      }
      meta_description = $('meta[name="description"]').attr('content');
      if (meta_description == '' || typeof meta_description == 'undefined') {
        meta_description = '';
      }
      let folders = [];
      folders = $.map($('.breadcrumbs li a').toArray(), function (n, i) {
        return $(n).text().trim();
      });
      folders.shift();
      let name = $('.product-name h1').text();
      let old_price = $('.box-column-group .oldprice .price').text();
      if (old_price == '' || typeof old_price == 'undefined') {
        old_price = '';
      }
      old_price = old_price.replaceAll('.', '').replace('₫', '').trim();
      let price = $('.box-title-product input').attr('data-price');
      if (price == '' || typeof price == 'undefined') {
        price = '';
      }
      let prod_images = [];
      $('#sync2 .owl-wrapper .item img').each(function (index, item) {
        let img_src = $(item).attr('src');
        img_src = img_src.replace('/60x60/', '/').trim();
        prod_images.push(img_src);
      });
      let description = $('.box-info-content-left .box-content-product').html();
      if (typeof description == 'undefined') {
        description = '';
      }
      let prod_attribs = [];
      $('#collateral-tabs #additional .title_group_attribute').each(function (index, item) {
        let group = {};
        group.name = $(item).text();
        let group_attrs = [];
        $(item)
          .next('ul')
          .find('li')
          .each(function (li_index, li_item) {
            let group_attr = {};
            group_attr.key = $('strong', li_item).text().trim();
            group_attr.value = $('span', li_item).text().trim();
            group_attrs.push(group_attr);
          });
        group.attrs = group_attrs;
        prod_attribs.push(group);
      });
      let option_combinations = [];
      let id_product = $('.list-color-product ul').attr('id');
      let id_regex = /options\-(\d+)\-list/gi;
      let found_id_product = id_regex.exec(id_product);
      let regex_id_product = found_id_product[1];
      $('body script').each(function (script_index, script_item) {
        let scriptContent = $(script_item).html();
        if (scriptContent.includes('Product.Options(')) {
          let found = scriptContent.match(/new\s*Product.Options\((.*?\}\}\})\);/);
          let jsonstring = found[1];
          let jsonData = JSON.parse(jsonstring);
          $('.options-list.color-list li').each(function (li_index, li_item) {
            let option_combination = {};
            let id_price = $('input', li_item).attr('value');
            let id_img = $('input', li_item).attr('onclick');
            let index_regex = /LoadImageColor\(\'(.*?)\'\)/gi;
            let found_index_img = index_regex.exec(id_img);
            let regex_index_img = found_index_img[1];
            option_combination.listImage = [$(`.owl-wrapper-outer .${regex_index_img} img`).attr('data-image')];
            let data_prices = jsonData[`${regex_id_product}`][`${id_price}`];
            let data_price = data_prices.price;
            option_combination.price = data_price + parseInt(price);
            option_combination.oldPrice = old_price;
            option_combination.oldPrice = option_combination.oldPrice.replaceAll('.', '').replace('₫', '');
            let base_option = {};
            base_option.optionName = 'Màu Sắc';
            let label_name = $('.label label', li_item).text();
            label_name = label_name.split('+');
            base_option.optionValue = label_name[0].trim();
            option_combination.options = [base_option];
            option_combinations.push(option_combination);
          });
        }
      });
      data_product = {
        meta_title,
        meta_description,
        folders,
        name,
        price,
        prod_images,
        old_price,
        description,
        product_attributes: prod_attribs,
        option_images: option_combinations,
        referer: window.location.href,
      };
      console.log('data_product', data_product);
      add_product();
    });
  } else if (window.location.href.match(/hnammobile.com/) && $('.product-detail-page').length > 0) {
    meta_title = $('title').text();
    if (meta_title == '' || typeof meta_title == 'undefined') {
      meta_title = '';
    }
    meta_description = $('meta[name="description"]').attr('content');
    if (meta_description == '' || typeof meta_description == 'undefined') {
      meta_description = '';
    }
    let folders = [];
    folders = $.map($('.list-breadcrumb a').toArray(), function (n, i) {
      return $(n).text().trim();
    });
    folders.shift();
    let name = $('h1.product-title').text();
    let old_price = $('#product-item-price .price-base del').text();
    if (old_price == '' || typeof old_price == 'undefined') {
      old_price = '';
    }
    old_price = old_price.replaceAll('.', '').replace('đ', '').trim();
    let price = $('#product-item-price .price').text();
    if (price == '' || typeof price == 'undefined') {
      price = '';
    }
    price = price.replaceAll('.', '').replace('đ', '').trim();
    let prod_images = [];
    $('#p-carousel-container .p-item-wrapper figure picture img').each(function (index, item) {
      let img_src = $(item).attr('data-src');
      if (typeof img_src == 'undefined' || img_src == '') {
        img_src = $(item).attr('src');
      }
      prod_images.push(img_src);
    });
    let description = $('.article-main-content').html();
    description = description.replaceAll(/(data-src\=\".*?\")/gi, '$1 class="lazyload"');
    if (typeof description == 'undefined') {
      description = '';
    }
    let option_combinations = [];
    $('#product-color-carousel1 .itemi-p2>div').each(function (index_div, item_div) {
      let data_id = $(item_div).attr('data-id');
      let data_color = $(item_div).attr('data-color');
      let option_combination = {};
      option_combination.price = $(item_div).attr('data-price');
      option_combination.oldPrice = $('#product-item-price .price-base del').text();
      if (typeof option_combination.oldPrice == 'undefined') {
        old_price = '';
      }
      option_combination.oldPrice = option_combination.oldPrice.replaceAll('.', '').replace('đ', '').trim();
      let scriptContent = $('.swiper-outer-wrapper script').text();
      let found = scriptContent.match(/productThumbnail\s*=\s*(.*?jpg\"\]\,\});/);
      let jsonstring = found[1];
      jsonstring = jsonstring.replace('"],}', '"]}');
      jsonstring = jsonstring.replaceAll(/\'(data\d+?)\'/gi, '"$1"');
      let jsonData = JSON.parse(jsonstring);
      let data_option_id = `data${data_id}`;
      option_combination.listImage = jsonData[data_option_id];
      let base_option = {};
      base_option.optionName = 'Màu sắc';
      base_option.optionValue = data_color;
      option_combination.options = [base_option];
      option_combinations.push(option_combination);
    });
    let prod_attribs = [];
    let group = {};
    let group_attrs = [];
    $('#tableThongso tr').each(function (tr_index, tr_item) {
      if ($(tr_item).find('th.config-group').length > 0) {
        if (typeof group.name !== 'undefined') {
          prod_attribs.push(group);
        }
        group = {};
        group.name = $('th', tr_item).text();
        group_attrs = [];
      } else {
        let group_attr = {};
        group_attr.key = $('th', tr_item).text().trim();
        group_attr.value = $('td', tr_item).text().trim();
        if (group_attr.key != '' && group_attr.value != '') {
          group_attrs.push(group_attr);
          group.attrs = group_attrs;
        }
      }
    });
    prod_attribs.push(group);
    data_product = {
      meta_title,
      meta_description,
      folders,
      name,
      price,
      prod_images,
      old_price,
      description,
      option_images: option_combinations,
      product_attributes: prod_attribs,
      referer: window.location.href,
    };
    console.log('data_product', data_product);
    add_product();
  } else if (window.location.href.match(/noithathoaphat.com/) && $('.detail-content-product').length > 0) {
    meta_title = $('title').text();
    if (meta_title == '' || typeof meta_title == 'undefined') {
      meta_title = '';
    }
    meta_description = $('meta[name="description"]').attr('content');
    if (meta_description == '' || typeof meta_description == 'undefined') {
      meta_description = '';
    }
    let folders = [];
    folders = $.map($('.tool-right li a').toArray(), function (n, i) {
      return $(n).text().trim();
    });
    folders.shift();
    let name = $('.tit-product h1').text();
    let old_price = '';
    let price = $('#CurrentPrice').text();
    if (price == '' || typeof price == 'undefined') {
      price = '';
    }
    price = price.replaceAll(',', '').replace('đ', '').trim();
    let prod_images = [];
    $('.parameter .lSSlideWrapper.usingCss .img-frt.lslide ').each(function (index, item) {
      let img_src = $('img', item).attr('src');
      img_src = 'https://noithathoaphat.com' + img_src;
      prod_images.push(img_src);
    });
    let description = $('#content-ct').children('.toc.f').remove().html();
    if (typeof description == 'undefined') {
      description = '';
    }
    let prod_attribs = [];
    let group = {};
    let group_attrs = [];
    $('#sticky-wrapper .content-right p:first').each(function (p_index, p_item) {
      let attr = $('span', p_item).text();
      let gr_attr = attr.split('\n');
      gr_attr.forEach(function (gr_item) {
        gr_item.split(':');
        let group_attr = {};
        group_attr.key = gr_item.split(':')[0];
        group_attr.value = gr_item.split(':')[1];
        group_attrs.push(group_attr);

      });

    });
    group.name = "Thông số kỹ thuật";
    group.attrs = group_attrs;
    prod_attribs.push(group);
    data_product = {
      meta_title,
      meta_description,
      folders,
      name,
      price,
      prod_images,
      old_price,
      description,
      product_attributes: prod_attribs,
      referer: window.location.href,
    };
    console.log('data_product', data_product);
    add_product();
  } else if (window.location.href.match(/gara20.com/) && $('body.single-product .product.type-product').length > 0) {
    var meta_title = $('meta[property="og:title"]').attr('content');
    var meta_description = $('meta[property="og:description"]').attr('content');
    var prod_images = [];
    $('.woocommerce-product-gallery__image.slide a').each(function (index, item) {
      let img = $(item).attr('href');
      prod_images.push(img);
    });
    var name = $('.product-title.product_title.entry-title').text();
    name = name.trim();
    let folders = [];
    folders = $.map($('.product_meta .posted_in a').toArray(), function (n, i) {
      return $(n).text().trim();
    });
    var short_description = $('.product-main .product-short-description').text();

    var product_custom_tabs = $('.product-main .product-short-description').html();
    var description = $('.large-8 .noibat__box').html();
    if (description == '' || typeof description == 'undefined') {
      description = '';
    }
    var price = $('.product-main .product-page-price.price-on-sale ins .woocommerce-Price-amount.amount,.product-main .product-page-price:not(.price-on-sale) .woocommerce-Price-amount.amount').text();
    price = price.trim();
    if (price == '' || typeof price == 'undefined') {
      price = '';
    }
    price = price.trim().replace("₫", "").replaceAll(".", "").replaceAll(",", "");
    var old_price = $('.product-main .product-page-price del .woocommerce-Price-amount.amount').text();
    if (old_price == '' || typeof old_price == 'undefined') {
      old_price = '';
    }
    old_price = old_price.replace("₫", "").replaceAll(".", "").replaceAll(",", "");
    //option
    let scriptContent = $('#main .type-product>script').text();
    let found = scriptContent.match(/const\s*kv_products\s*=\s*(.*)\;/);
    let jsonstring = found[1];
    let jsonData = JSON.parse(jsonstring);
    console.log("🚀 ~ file: content.js ~ line 2784 ~ jsonData", jsonData)
    let option_combinations = [];
    let data = jsonData.forEach(function (data_item) {
      let option_combination = {};
      option_combination.price = data_item.basePrice;
      option_combination.listImage = data_item.images;
      option_combination.extraText = data_item.fullName;
      let base_options = [];
      if (data_item.attributes && data_item.attributes.length > 0) {
        data_item.attributes.forEach(function (at_item) {
          let base_option = {};
          base_option.optionName = at_item.attributeName;
          base_option.optionValue = at_item.attributeValue;
          base_options.push(base_option);
          option_combination.options = base_options;

        });
         option_combinations.push(option_combination);
      }



    });
    data_product = {
      meta_title,
      meta_description,
      folders,
      name,
      price,
      prod_images,
      old_price,
      description,
      referer: window.location.href,
      option_images: option_combinations,
    };
    console.log('data_product', data_product);

    chrome.runtime.sendMessage(
      {
        type: 'API_AJAX_POST',
        url: 'https://topclass.3tc.vn/index.php?route=api/product/sync',
        payload: data_product,
      },
      function (response) {
        console.log("🚀 ~ file: content.js ~ line 2823 ~ response", response)

        if (response && response.success) {
          chrome.storage.local.get(function (result) {
    if (result && result.mode) {
      if (result.mode == 'crawling') {
        let urlList = Array.isArray(result.urlList) ? result.urlList : [];
        if (urlList.length > 0) {
          let curHref = urlList.pop();

          chrome.storage.local.set({ urlList, mode: 'crawling', curHref }, function () {
            console.log('success', curHref);
          });

          window.location.href = curHref;
        } else {
          chrome.storage.local.set({ mode: 'done', curHref: undefined }, function () {
            alert('Đã thêm thành công ' + result.total + ' sản phẩm!');
          });
        }
      } else if (result.mode == 'single-crawling') {
        alert('Đã thêm sản phẩm thành công!');
      }
    }
  });
} else {
  setTimeout(() => {
    window.location.reload();
  }, 2000);
}
      }
    );
  }
  else {
  craw_next();
}
}
//Tạo element
const addProductBtn = `<button class="addProductBtn">+</button>`;
const sendProduct = `<div class="sendProductBtn">
<button class="">
<span>0</span>
<i class="icondetail-tickbuy">
</i>
</button>
<ul>
<li class="add_this_page">Thêm sp vào hàng đợi</li>
<li class="add_all">Thêm tất cả SP trang này</li>
<li class="remove_this_page">Xóa tất cả SP trang này</li>
<li class="remove_all">Xóa tất cả SP hàng đợi</li>
</ul>
`;
let urlList = [];
chrome.storage.local.get(function (result) {
  if (result && result.mode) {
    if (result.mode == 'crawling') {
      runCrawling();
    }
  }
  if (result && result.token) {
    urlList = Array.isArray(result.urlList) ? result.urlList : [];
    let whellTimeout = null;
    $('body').on('pointerup wheel', function () {
      if (whellTimeout != null) {
        clearTimeout(whellTimeout);
      }
      whellTimeout = setTimeout(function () {
        if (window.location.href.match(/dienmayxanh.com/) && $('.listproduct').length > 0) {
          chrome.storage.local.get(function (thisResult) {
            const listProduct = $('.listproduct');
            const listItem = $('.item', listProduct);
            urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
            listItem.each(function (index, item) {
              $('a[data-id]', item).css('position', 'relative');
              if ($('a[data-id] .addProductBtn', item).length == 0) {
                $('a[data-id]', item).append(addProductBtn);
              }
              if (urlList && urlList.length > 0) {
                const href = $('a[data-id]', item).attr('href');
                if (urlList.includes(href)) {
                  $('.addProductBtn', item).addClass('remove').html('-');
                } else {
                  $('.addProductBtn', item).removeClass('remove').html('+');
                }
              }
            });
          });
        }
        if (window.location.href.match(/thegioididong.com/) && $('.listproduct').length > 0) {
          chrome.storage.local.get(function (thisResult) {
            const listProduct = $('.listproduct');
            const listItem = $('.item', listProduct);
            urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
            listItem.each(function (index, item) {
              $('a[data-id]', item).css('position', 'relative');
              if ($('a[data-id] .addProductBtn', item).length == 0) {
                $('a[data-id]', item).append(addProductBtn);
              }
              if (urlList && urlList.length > 0) {
                const href = $('a[data-id]', item).attr('href');
                if (urlList.includes(href)) {
                  $('.addProductBtn', item).addClass('remove').html('-');
                } else {
                  $('.addProductBtn', item).removeClass('remove').html('+');
                }
              }
            });
          });
        }
        if (window.location.href.match(/dienmaycholon.vn/) && $('.product_child , .hot_pro_detail , .list_product_cat , .list_productcate ').length > 0) {
          chrome.storage.local.get(function (thisResult) {
            let itemProduct = $('.product_child .product ,.hot_pro_detail .product , .list_productcate .data_order_product');
            let item_prod = $('.list_product_cat .products .product');
            urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
            if (itemProduct.length > 0) {
              itemProduct.each(function (index, item) {
                $('.product , .data_order_product', item).css('position', 'relative');
                if ($('a[href] .addProductBtn', item).length == 0) {
                  $('a[href]', item).append(addProductBtn).removeClass('item_product_new');
                }
                if (urlList && urlList.length > 0) {
                  const href = $('a', item).attr('href');
                  if (urlList.includes(href)) {
                    $('.addProductBtn', item).addClass('remove').html('-');
                  } else {
                    $('.addProductBtn', item).removeClass('remove').html('+');
                  }
                }
              });
            } else if (item_prod.length > 0) {
              item_prod.each(function (a_index, a_item) {
                $(a_item).css('position', 'relative');
                if ($('.product_block_img .addProductBtn', a_item).length == 0) {
                  $('.product_block_img', a_item).append(addProductBtn);
                }
                if (urlList && urlList.length > 0) {
                  const href = $(a_item).attr('href');
                  if (urlList.includes(href)) {
                    $('.addProductBtn', a_item).addClass('remove').html('-');
                  } else {
                    $('.addProductBtn', a_item).removeClass('remove').html('+');
                  }
                }
              });
            }

          });
        }
        if (window.location.href.match(/tiki.vn/) && $('.ProductList__Wrapper-sc-1dl80l2-0.Kxajl , .style__StyledInfiniteScroll-sc-r7dr5o-0.icHRkQ ').length > 0) {
          chrome.storage.local.get(function (thisResult) {
            let item_product = $('.ProductList__Wrapper-sc-1dl80l2-0.Kxajl a.product-item , .style__StyledInfiniteScroll-sc-r7dr5o-0.icHRkQ a.product-item');
            urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
            item_product.each(function (index, item) {
              $(item).css('position', 'relative');
              if ($('.addProductBtn', item).length == 0) {
                $(item).append(addProductBtn);
              }
              if (urlList && urlList.length > 0) {
                const href = $(item).attr('href');
                if (urlList.includes(href)) {
                  $('.addProductBtn', item).addClass('remove').html('-');
                } else {
                  $('.addProductBtn', item).removeClass('remove').html('+');
                }
              }
            });
          });
        }
        if (window.location.href.match(/fptshop.com.vn/) && $('.prd-sale__product ,.cat-prd__product , .cdt-product-wrapper ,.swiper-wrapper , .product-grid').length > 0) {
          chrome.storage.local.get(function (thisResult) {
            let item_product = $('.prd-sale__product .cdt-product ,.cat-prd__product .cdt-product ,.cdt-product-wrapper .cdt-product ,.swiper-wrapper .product-item ,.product-grid .product-grid__item ');
            urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
            item_product.each(function (index, cdt_item) {
              $('.cdt-product__img ,.product_img', cdt_item).css('position', 'relative');
              if ($('.cdt-product__img a .addProductBtn ,.product_img a .addProductBtn', cdt_item).length == 0) {
                $('.cdt-product__img a ,.product_img a', cdt_item).append(addProductBtn);
              }
              if (urlList && urlList.length > 0) {
                const href = $('.cdt-product__img>a ,.product_img a ', cdt_item).attr('href');
                if (urlList.includes(href)) {
                  $('.addProductBtn', cdt_item).addClass('remove').html('-');
                } else {
                  $('.addProductBtn', cdt_item).removeClass('remove').html('+');
                }
              }
            });
          });
        }
        if (window.location.href.match(/mediamart.vn/) && $('.product-list').length > 0) {
          chrome.storage.local.get(function (thisResult) {
            const list_item = $('.product-list .card');
            urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
            list_item.each(function (index, item) {
              $('.product-item', item).css('position', 'relative');
              if ($('.product-item .card-img-top .addProductBtn', item).length == 0) {
                $('.product-item .card-img-top', item).append(addProductBtn);
              }
              if (urlList && urlList.length > 0) {
                const href = $('a', item).attr('href');
                if (urlList.includes(href)) {
                  $('.addProductBtn', item).addClass('remove').html('-');
                } else {
                  $('.addProductBtn', item).removeClass('remove').html('+');
                }
              }
            });
          });
        }
        if (window.location.href.match(/nguyenkim.com/) && $('.nk-product-cate-style-grid , .owl-stage , .first-render').length > 0) {
          chrome.storage.local.get(function (thisResult) {
            let item_product = $('.nk-product-cate-style-grid .item , .owl-stage .owl-item ');
            urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
            item_product.each(function (index, it_item) {
              $('.product .product-header , .item', it_item).css('position', 'relative');
              if ($('.product-header .product-image a .addProductBtn , .item a .addProductBtn', it_item).length == 0) {
                $('.product-header .product-image a ', it_item).append(addProductBtn);
              }
              if (urlList && urlList.length > 0) {
                const href = $('.product-header>.product-image>a , .item a', it_item).attr('href');
                if (urlList.includes(href)) {
                  $('.addProductBtn', it_item).addClass('remove').html('-');
                } else {
                  $('.addProductBtn', it_item).removeClass('remove').html('+');
                }
              }
            });
          });
        }
        if (window.location.href.match(/dienmaytamviet.com/) && $('.mk-product-list, .swiper-wrapper').length > 0) {
          chrome.storage.local.get(function (thisResult) {
            let item_product = $('.mk-product-list .mk-product-item ,.swiper-wrapper .mk-product-item');
            urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
            item_product.each(function (index, item) {
              $('.mk-product-content', item).css('position', 'relative');
              if ($('.mk-product-content .mk-product-images .addProductBtn', item).length == 0) {
                $('.mk-product-content .mk-product-images ', item).append(addProductBtn);
              }
              if (urlList && urlList.length > 0) {
                const href = $('.mk-product-images a[href]', item).attr('href');
                if (urlList.includes(href)) {
                  $('.addProductBtn', item).addClass('remove').html('-');
                } else {
                  $('.addProductBtn', item).removeClass('remove').html('+');
                }
              }
            });
          });
        }
        if (window.location.href.match(/shopee.vn/) && $('.shopee-search-item-result__items, .stardust-tabs-panels__panel , .tIJtcv').length > 0) {
          chrome.storage.local.get(function (thisResult) {
            let list_item = $('.shopee-search-item-result__items div[data-sqe="item"] , .stardust-tabs-panels__panel ._4beVMw , .tIJtcv .httLi0');
            urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
            list_item.each(function (index, item) {
              $(item).css('position', 'relative');
              $('a[data-sqe="link"]', item).parent().css('position', 'relative');
              if ($('a[data-sqe="link"] .addProductBtn', item).length == 0) {
                $('a[data-sqe="link"]', item).append(addProductBtn);
              }
              if (urlList && urlList.length > 0) {
                const href = $('a', item).attr('href');
                if (urlList.includes(href)) {
                  $('.addProductBtn', item).addClass('remove').html('-');
                  console.log('href', href);
                } else {
                  $('.addProductBtn', item).removeClass('remove').html('+');
                }
              }
            });
          });
        }
        if (window.location.href.match(/avv.vn/) && $('.product-layout').length > 0) {
          chrome.storage.local.get(function (thisResult) {
            let list_item = $('.row .product-block');
            urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
            list_item.each(function (index, item) {
              $('.image', item).css('position', 'relative');
              if ($('.image > a .addProductBtn', item).length == 0) {
                $('.image > a', item).append(addProductBtn);
              }
              if (urlList && urlList.length > 0) {
                const href = $('.image >a', item).attr('href');
                if (urlList.includes(href)) {
                  $('.addProductBtn', item).addClass('remove').html('-');
                  console.log('href', href);
                } else {
                  $('.addProductBtn', item).removeClass('remove').html('+');
                }
              }
            });
          });
        }
        if (window.location.href.match(/omizu.com.vn/) && $('.list_item_product').length > 0) {
          chrome.storage.local.get(function (thisResult) {
            let list_item = $('.list_item_product .product_item');
            urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
            list_item.each(function (index, item) {
              $('.img', item).css('position', 'relative');
              if ($('.img > a .addProductBtn', item).length == 0) {
                $('.img > a', item).append(addProductBtn);
              }
              if (urlList && urlList.length > 0) {
                const href = $('.img >a', item).attr('href');
                if (urlList.includes(href)) {
                  $('.addProductBtn', item).addClass('remove').html('-');
                  console.log('href', href);
                } else {
                  $('.addProductBtn', item).removeClass('remove').html('+');
                }
              }
            });
          });
        }
        if (window.location.href.match(/hafelevietnam.vn/) && $('#Product').length > 0) {
          chrome.storage.local.get(function (thisResult) {
            let list_item = $('#Product .gri');
            urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
            list_item.each(function (index, item) {
              $('.gi', item).css('position', 'relative');
              if ($('.gi > a .addProductBtn', item).length == 0) {
                $('.gi > a', item).append(addProductBtn);
              }
              if (urlList && urlList.length > 0) {
                const href = $('.gi >a', item).attr('href');
                if (urlList.includes(href)) {
                  $('.addProductBtn', item).addClass('remove').html('-');
                  console.log('href', href);
                } else {
                  $('.addProductBtn', item).removeClass('remove').html('+');
                }
              }
            });
          });
        }
        if (window.location.href.match(/vender.vn/) && $('.content-product-list.product-list').length > 0) {
          chrome.storage.local.get(function (thisResult) {
            let list_item = $('.content-product-list.product-list .pro-loop');
            urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
            list_item.each(function (index, item) {
              $('.neon-product-block-item', item).css('position', 'relative');
              if ($('.neon-product-block-item > a:first .addProductBtn', item).length == 0) {
                $('.neon-product-block-item > a:first', item).append(addProductBtn);
              }
              if (urlList && urlList.length > 0) {
                const href = $('.neon-product-block-item >a:first', item).attr('href');
                if (urlList.includes(href)) {
                  $('.addProductBtn', item).addClass('remove').html('-');
                  console.log('href', href);
                } else {
                  $('.addProductBtn', item).removeClass('remove').html('+');
                }
              }
            });
          });
        }
        if (window.location.href.match(/cellphones.com.vn/) && $('.product-list,.product-list-swiper,.block-product-list-filter').length > 0) {
          chrome.storage.local.get(function (thisResult) {
            let list_item = $('.product-info-container');
            urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
            list_item.each(function (index, item) {
              $('.product-info', item).css('position', 'relative');
              if ($('.product-info > a .addProductBtn', item).length == 0) {
                $('.product-info > a', item).append(addProductBtn);
              }
              if (urlList && urlList.length > 0) {
                const href = $('.product-info >a', item).attr('href');
                if (urlList.includes(href)) {
                  $('.addProductBtn', item).addClass('remove').html('-');
                  console.log('href', href);
                } else {
                  $('.addProductBtn', item).removeClass('remove').html('+');
                }
              }
            });
          });
        }
        if (window.location.href.match(/khangluxury.vn/) && $('.productscates-boxslider,.products').length > 0) {
          chrome.storage.local.get(function (thisResult) {
            let list_item = $('.prdboxsli-item');
            urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
            list_item.each(function (index, item) {
              $('.prdboxsli-thumb', item).css('position', 'relative');
              if ($('.prdboxsli-thumb> a .addProductBtn', item).length == 0) {
                $('.prdboxsli-thumb > a', item).append(addProductBtn);
              }
              if (urlList && urlList.length > 0) {
                const href = $('.prdboxsli-thumb >a', item).attr('href');
                if (urlList.includes(href)) {
                  $('.addProductBtn', item).addClass('remove').html('-');
                  console.log('href', href);
                } else {
                  $('.addProductBtn', item).removeClass('remove').html('+');
                }
              }
            });
          });
        }
        if (window.location.href.match(/lazada.vn/) && $('.card-jfy-wrapper, div[data-qa-locator="general-products"]').length > 0) {
          chrome.storage.local.get(function (thisResult) {
            let list_item = $('.card-jfy-item-wrapper, div[data-qa-locator="product-item"]');
            urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
            list_item.each(function (index, item) {
              $(item).css('position', 'relative');
              if ($('a:first .addProductBtn', item).length == 0) {
                $('a:first', item).append(addProductBtn);
              }
              if (urlList && urlList.length > 0) {
                const href = $('a:first', item).attr('href');
                if (urlList.includes(href)) {
                  $('.addProductBtn', item).addClass('remove').html('-');
                  console.log('href', href);
                } else {
                  $('.addProductBtn', item).removeClass('remove').html('+');
                }
              }
            });
          });
        }
        if (window.location.href.match(/sendo.vn/) && $('.d7e-57f266 .d7e-a90f22 ,.products-wrap_2tU1,#sd-product-sponsored-upting-swiper').length > 0) {
          chrome.storage.local.get(function (thisResult) {
            let list_item = $('.d7e-be8bce.d7e-39b182.e9f-5c81d7  .d7e-d4ddb0.eaf-1b1d73 .d7e-f7453d,.d7e-f7453d.d7e-57f266,.products-wrap_2tU1 .product_inner_AyVi,#sd-product-sponsored-upting-swiper .sd-productSponsored-upting');
            urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
            list_item.each(function (index, item) {
              $(item).css('position', 'relative');
              if ($('a:first .addProductBtn', item).length == 0) {
                $('a:first', item).append(addProductBtn);
              }
              if (urlList && urlList.length > 0) {
                const href = $('a:first', item).attr('href');
                if (urlList.includes(href)) {
                  $('.addProductBtn', item).addClass('remove').html('-');
                  console.log('href', href);
                } else {
                  $('.addProductBtn', item).removeClass('remove').html('+');
                }
              }
            });
          });
        }
        if (window.location.href.match(/meta.vn/) && $('.product-highlight-wrap').length > 0) {
          chrome.storage.local.get(function (thisResult) {
            let list_item = $('.product-highlight-item');
            urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
            list_item.each(function (index, item) {
              $('.prod-hl-thumb', item).css('position', 'relative');
              if ($('.prod-hl-thumb a:first .addProductBtn', item).length == 0) {
                $('.prod-hl-thumb a:first', item).append(addProductBtn);
              }
              if (urlList && urlList.length > 0) {
                const href = $('a:first', item).attr('href');
                if (urlList.includes(href)) {
                  $('.addProductBtn', item).addClass('remove').html('-');
                  console.log('href', href);
                } else {
                  $('.addProductBtn', item).removeClass('remove').html('+');
                }
              }
            });
          });
        }
        if (window.location.href.match(/hoanghamobile.com/) && $('.lts-product ,.ins-web-smart-recommender-bod').length > 0) {
          chrome.storage.local.get(function (thisResult) {
            let list_item = $('.item ,.ins-web-smart-recommender-box-item');
            urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
            list_item.each(function (index, item) {
              $('.img ,.ins-web-smart-recommender-inner-box', item).css('position', 'relative');
              if ($('.img a:first .addProductBtn, .ins-web-smart-recommender-inner-box a:first .addProductBtn', item).length == 0) {
                $('.img a:first,.ins-web-smart-recommender-inner-box a:first', item).append(addProductBtn);
              }
              if (urlList && urlList.length > 0) {
                const href = $('a:first', item).attr('href');
                if (urlList.includes(href)) {
                  $('.addProductBtn', item).addClass('remove').html('-');
                  console.log('href', href);
                } else {
                  $('.addProductBtn', item).removeClass('remove').html('+');
                }
              }
            });
          });
        }
        if (window.location.href.match(/didongthongminh.vn/) && $('.products_item_content,.products_sale,.productlist').length > 0) {
          chrome.storage.local.get(function (thisResult) {
            let list_item = $('.frame ,.owl-item');
            urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
            list_item.each(function (index, item) {
              $(item).css('position', 'relative');
              if ($('.product_image a:first .addProductBtn , a:first .addProductBtn', item).length == 0) {
                $('.product_image a:first ,a:first', item).append(addProductBtn);
              }
              if (urlList && urlList.length > 0) {
                const href = $('a:first', item).attr('href');
                if (urlList.includes(href)) {
                  $('.addProductBtn', item).addClass('remove').html('-');
                  console.log('href', href);
                } else {
                  $('.addProductBtn', item).removeClass('remove').html('+');
                }
              }
            });
          });
        }
        if (window.location.href.match(/viettelstore.vn/) && $('.form-product-1,.form-product-0,.wrap-pro-list').length > 0) {
          chrome.storage.local.get(function (thisResult) {
            let list_item = $('.owl-wrapper-outer .owl-item,.wrap-item-home,.item.ProductList3Col_item');
            urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
            list_item.each(function (index, item) {
              $(item).css('position', 'relative');
              if ($('.list-pk-item .item-pk-sale a:last .addProductBtn, a .addProductBtn', item).length == 0) {
                $('.list-pk-item .item-pk-sale a:last, a', item).append(addProductBtn);
              }
              if (urlList && urlList.length > 0) {
                const href = $('.list-pk-item .item-pk-sale a:last ,a', item).attr('href');
                if (urlList.includes(href)) {
                  $('.addProductBtn', item).addClass('remove').html('-');
                  console.log('href', href);
                } else {
                  $('.addProductBtn', item).removeClass('remove').html('+');
                }
              }
            });
          });
        }
        if (window.location.href.match(/donghohaitrieu.com/) && $('.products-grid').length > 0) {
          chrome.storage.local.get(function (thisResult) {
            let list_item = $('.product.type-product');
            urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
            list_item.each(function (index, item) {
              $('.product-image-wrapper', item).css('position', 'relative');
              if ($('a[id] .addProductBtn', item).length == 0) {
                $('a[id]', item).append(addProductBtn);
              }
              if (urlList && urlList.length > 0) {
                const href = $('a[id]', item).attr('href');
                if (urlList.includes(href)) {
                  $('.addProductBtn', item).addClass('remove').html('-');
                  console.log('href', href);
                } else {
                  $('.addProductBtn', item).removeClass('remove').html('+');
                }
              }
            });
          });
        }
        if (window.location.href.match(/zshop.vn/) && $('.grid-list').length > 0) {
          chrome.storage.local.get(function (thisResult) {
            let list_item = $('.ypi-scroller-list__item ,.ypi-grid-list__item_body');
            urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
            list_item.each(function (index, item) {
              $('.ty-grid-list__item-name', item).css('position', 'relative');
              if ($('a.abt-single-image .addProductBtn', item).length == 0) {
                $('a.abt-single-image', item).append(addProductBtn);
              }
              if (urlList && urlList.length > 0) {
                const href = $('a.abt-single-image', item).attr('href');
                if (urlList.includes(href)) {
                  $('.addProductBtn', item).addClass('remove').html('-');
                  console.log('href', href);
                } else {
                  $('.addProductBtn', item).removeClass('remove').html('+');
                }
              }
            });
          });
        }
        if (window.location.href.match(/bachlongmobile.com/) && $('.products-grid').length > 0) {
          chrome.storage.local.get(function (thisResult) {
            let list_item = $('.products-grid .item');
            urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
            list_item.each(function (index, item) {
              $(item).css('position', 'relative');
              if ($('a:first .addProductBtn', item).length == 0) {
                $('a:first', item).append(addProductBtn);
              }
              if (urlList && urlList.length > 0) {
                const href = $('a:first', item).attr('href');
                if (urlList.includes(href)) {
                  $('.addProductBtn', item).addClass('remove').html('-');
                  console.log('href', href);
                } else {
                  $('.addProductBtn', item).removeClass('remove').html('+');
                }
              }
            });
          });
        }
        if (window.location.href.match(/hnammobile.com/) && $('.list-products').length > 0) {
          chrome.storage.local.get(function (thisResult) {
            let list_item = $('.list-products .product-item-list');
            urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
            list_item.each(function (index, item) {
              $('.product-image', item).css('position', 'relative');
              if ($('.product-image a:first .addProductBtn', item).length == 0) {
                $('.product-image a:first', item).append(addProductBtn);
              }
              if (urlList && urlList.length > 0) {
                const href = $('.product-image a:first', item).attr('href');
                if (urlList.includes(href)) {
                  $('.addProductBtn', item).addClass('remove').html('-');
                  console.log('href', href);
                } else {
                  $('.addProductBtn', item).removeClass('remove').html('+');
                }
              }
            });
          });
        }
        if (window.location.href.match(/noithathoaphat.com/) && $('.slider-list-product').length > 0) {
          chrome.storage.local.get(function (thisResult) {
            let list_item = $('.lSSlideOuter .item');
            urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
            list_item.each(function (index, item) {
              $('.img', item).css('position', 'relative');
              if ($('.img a:first .addProductBtn', item).length == 0) {
                $('.img a:first', item).append(addProductBtn);
              }
              if (urlList && urlList.length > 0) {
                const href = $('.img a:first', item).attr('href');
                if (urlList.includes(href)) {
                  $('.addProductBtn', item).addClass('remove').html('-');
                  console.log('href', href);
                } else {
                  $('.addProductBtn', item).removeClass('remove').html('+');
                }
              }
            });
          });
        }
        if (window.location.href.match(/gara20.com/) && $('.row.home__products , .row.category-page-row').length > 0) {
          chrome.storage.local.get(function (thisResult) {
            let list_item = $('.home__products .product-small , .products .product-small .product-small');
            urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
            list_item.each(function (index, item) {
              $('.box-image', item).css('position', 'relative');
              if ($('.box-image a:first .addProductBtn , .image-none .box-image a:first .addProductBtn', item).length == 0) {
                $('.box-image a:first', item).append(addProductBtn);
              }
              if (urlList && urlList.length > 0) {
                const href = $('.box-image a:first', item).attr('href');
                if (urlList.includes(href)) {
                  $('.addProductBtn', item).addClass('remove').html('-');
                  console.log('href', href);
                } else {
                  $('.addProductBtn', item).removeClass('remove').html('+');
                }
              }
            });
          });
        }
      }, 500);
    });
    $('body').on('click', '.addProductBtn', function (e) {
      e.preventDefault();
      const btn = $(this);
      chrome.storage.local.get(function (thisResult) {
        const href = btn.closest('a').attr('href');
        urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
        if (!btn.hasClass('remove')) {
          console.log('before add', urlList.length, href);
          if (!urlList.includes(href)) {
            urlList.push(href);
            btn.html('-');
            btn.toggleClass('remove', true);
          }
          console.log('after add', urlList.length);
        } else {
          if (urlList.includes(href)) {
            console.log('before remove', urlList.length);
            urlList.splice(urlList.indexOf(href), 1);
            console.log('after remove', urlList.length);
            btn.html('+');
            btn.toggleClass('remove', false);
          }
        }
        chrome.storage.local.set({ urlList }, function () {
          $('.sendProductBtn span').text(urlList.length);
        });
      });
    });

    $('body').append(sendProduct);
    if (urlList && urlList.length > 0) {
      $('.sendProductBtn span').text(urlList.length);
    } else {
      $('.sendProductBtn span').text(0);
    }
    $('.sendProductBtn button').on('click', function (e) {
      e.preventDefault();
      chrome.storage.local.get(function (thisResult) {
        urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
        if (urlList && urlList.length > 0) {
          console.log('fullList', urlList);
          let confirmQuestion = confirm('Bạn có chắc thêm ' + urlList.length + ' sản phẩm vào website!');
          if (confirmQuestion) {
            let total = urlList.length;
            let curHref = urlList.pop();
            chrome.storage.local.set({ urlList, mode: 'crawling', curHref, total }, function () {
              console.log('success', urlList);
            });

            window.location.href = curHref;
          }
        } else {
          chrome.storage.local.set({ mode: 'single-crawling' }, function () {
            let confirmQuestion = confirm('Bạn có chắc thêm sản phẩm này vào website!');
            if (confirmQuestion) {
              runCrawling();
            }
          });
        }
      });
    });
    $('.sendProductBtn li.remove_all').on('click', function (e) {
      e.preventDefault();
      let confirmQuestion = confirm('Bạn có chắc xóa tất cả liên kết sản phẩm trong hàng đợi!');
      if (confirmQuestion) {
        let all_hrefs = $.map($('.item a[data-id]').toArray(), function (item, index) {
          $('.addProductBtn', item).removeClass('remove').html('+');
          return $(item).attr('href');
        });
        urlList = [];
        chrome.storage.local.set({ urlList }, function () {
          $('.sendProductBtn span').text(0);
        });
      }
    });
    $('.sendProductBtn li.remove_this_page').on('click', function (e) {
      e.preventDefault();
      chrome.storage.local.get(function (thisResult) {
        urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
        let confirmQuestion = confirm('Bạn có chắc xóa tất cả liên kết sản phẩm trong trang khỏi hàng đợi!');
        if (confirmQuestion) {
          $('.item a[data-id]').each(function (index, item) {
            $('.addProductBtn', item).removeClass('remove').html('+');
            let href = $(item).attr('href');
            if (urlList.includes(href)) {
              urlList.splice(urlList.indexOf(href), 1);
            }
          });

          chrome.storage.local.set({ urlList }, function () {
            $('.sendProductBtn span').text(urlList.length);
          });
        }
      });
    });
    $('.sendProductBtn li.add_this_page').on('click', function (e) {
      e.preventDefault();
      console.log('add_this_page');
      chrome.storage.local.get(function (thisResult) {
        urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
        if (
          $('.box_main').length > 0 || //dienmayxanh //thegioididong
          $('#product_detail').length > 0 || //dienmaycholon 
          $('.styles__Wrapper-sc-8ftkqd-0').length > 0 || //tiki
          $('.l-main').length > 0 || //fptshop
          $('.product-detail').length > 0 || //mediamart
          $('.NkPdp_productInfo').length > 0 || //nguyenkim
          $('.product-details').length > 0 || //dienmaytamviet
          $('.page-product').length > 0 || //shoppe
          $('[class^="product-product-"]').length > 0 || //avv
          $('.full.detail').length > 0 || //omizu
          $('#getId').length > 0 || //hafelevietnam
          $('.main-body.main-body-product').length > 0 || //vender
          $('.block-detail-product').length > 0 || //cellphones
          $('.product.products-details').length > 0 ||//khangluxury
          $('.pdp-block.pdp-block__product-detail').length > 0 || //lazada
          $('#id-media-block').length > 0 || //sendo
          $('.view-detail-product').length > 0 || //meta
          $('.product-layout.product-layout-grid').length > 0 || //hoanghamobile
          $('.product.mt20').length > 0 || //didongthongminh
          $('#ProductId').length > 0 || //viettelstore
          $('.product-template-default').length > 0 || //donghohaitrieu
          $('.product-detail-cs').length > 0 ||//zshop
          $('.catalog-product-view').length > 0 ||//bachlongmobile
          $('.product-detail-page').length > 0 ||//hnammobile.com
          $('.slider-list-product').length > 0 ||//noithathoaphat.com
          $('.category-page-row').length > 0
        ) {
          let href = window.location.href;
          console.log(href);
          if (!urlList.includes(href)) {
            urlList.push(href);
          }
        }
        chrome.storage.local.set({ urlList }, function () {
          $('.sendProductBtn span').text(urlList.length);
          $('.sendProductBtn ul').toggleClass('hidden', true);
          setTimeout(() => {
            $('.sendProductBtn ul').toggleClass('hidden', false);
          }, 300);
        });
      });
    });
    $('.sendProductBtn li.add_all').on('click', function (e) {
      e.preventDefault();
      let confirmQuestion = confirm('Bạn có chắc thêm tất cả liên kết sản phẩm trong trang vào hàng đợi!');
      if (confirmQuestion) {
        var viewMoreTimeout = null;

        function runViewMoreDMX() {
          if (window.location.href.match(/dienmayxanh.com/)) {
            viewMoreTimeout = setTimeout(function () {
              //dienmayxanh
              if ($('.view-more a').is(':visible')) {
                if ($('.view-more a:not(.prevent)').length > 0 && $('.view-more a').is(':visible')) {
                  $('.view-more a:not(.prevent)')[0].click();
                }
                $('html, body')
                  .stop()
                  .animate(
                    {
                      scrollTop: $('.view-more a').offset().top,
                    },
                    500
                  );
                runViewMore();
              } else {
                if (viewMoreTimeout != null && typeof viewMoreTimeout != 'undefined') {
                  chrome.storage.local.get(function (thisResult) {
                    urlList = Array.isArray(thisResult.urlList) ? thisResult.urlList : [];
                    $('.item a[data-id]').each(function (index, item_a) {
                      $('.addProductBtn', item_a).addClass('remove').html('-');
                      let href = $(item_a).attr('href');
                      console.log(href);
                      if (!urlList.includes(href)) {
                        urlList.push(href);
                      }
                    });
                    chrome.storage.local.set({ urlList }, function () {
                      $('.sendProductBtn span').text(urlList.length);
                      console.log("🚀 ~ file: content.js ~ line 3087 ~ urlList", urlList)
                    });

                  });
                  clearTimeout(viewMoreTimeout);
                }
              }

            }, 500);
          }

        }
        runViewMoreDMX();
        //GARA 20
        let lstLink = $('.addProductBtn:not(.remove)').toArray();
        function processQueue() {
          if (lstLink.length > 0) {
            let curLink = lstLink.pop();
            $(curLink).trigger('click');
            setTimeout(function () {
              processQueue();
            }, 100);
          }
        }
        processQueue();
      }
    });
  }
});