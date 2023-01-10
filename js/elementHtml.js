$('<link rel="stylesheet" type="text/css" href="' + chrome.runtime.getURL('css/style.css') + '" >').appendTo('head');
$('<link rel="stylesheet" type="text/css" href="' + chrome.runtime.getURL('plugins/select2.css') + '" >').appendTo(
  'head'
);

/** Customer HTML */
const customerLinkTpl = `<div class="customerLink">
<i class="fa fa-link-thumb">
</i>
</div>`;
const customerCheckedTpl = `<div class="customerChecked">
<i class="fa fa-check-circle">
</i>
</div>`;

const customerFormTpl = (customer) => {
  return `<div class="customerForm ${customer ? 'edit' : ''} d-none">
      <form>
        <div class="success-feedback">
</div>
        <div class="invalid-feedback zaloId">
</div>
        <div class="invalid-feedback name">
</div>
        <input type="text" name="name" placeholder="Tên khách hàng" required value="${customer ? customer.name : ''}" />
        <div class="invalid-feedback phone">
</div>
        <input type="text" name="phone" placeholder="Số điên thoại" required value="${
          customer ? customer.phone : ''
        }" />
        <div class="invalid-feedback address">
</div>
        <input type="text" name="address" placeholder="Địa chỉ" required value="${customer ? customer.address : ''}" />
        <div class="invalid-feedback province_id">
</div>
        <div class="invalid-feedback district_id">
</div>
        <div class="invalid-feedback ward_id">
</div>
        <select class="province" name="province_id" data-value="${customer ? customer.province_id : ''}" data-text="${
    customer ? customer.province.name : ''
  }" required>
          <option value="" selected>
            Chọn Tỉnh/TP
          </option>
        </select>
        <select class="district" name="district_id" data-value="${customer ? customer.district_id : ''}" data-text="${
    customer ? customer.district.name : ''
  }" required>
          <option value="" selected>
            Chọn Quận/Huyện
          </option>
        </select>
        <select class="ward" name="ward_id" data-value="${customer ? customer.ward_id : ''}" data-text="${
    customer ? customer.ward.name : ''
  }" required>
          <option value="" selected>
            Chọn Phường/Xã
          </option>
        </select>
        <div class="d-flex">
          <button type="submit" class="${customer ? 'editCustomerBtn' : 'addCustomerBtn'} ">
          ${customer ? 'Cập nhật' : 'Thêm'}
          </button>
          <button class="closeBtn">Đóng</button>

        </div>
      </form>
    </div>`;
};

const customerInfo = (name, phone, address) =>
  `<div class="customerInfo d-none">
    <h5 class="customer__title">
      ${name}
      <i class="fa fa-icon-outline-setting editCustomer">
</i>
    </h5>
    <div class="customer__content">
      <label>Địa chỉ:</label>
      <br>
      <div>${address} phường 16, quận Tân Bình, thành phố Hồ Chí minh</div>
      <label>SĐT:</label>
      <br>
      <div>${phone}</div>
    </div>
  </div>`;
/** End Customer */

const download_btn = `<div class="zaloapi_download_btn" style="position: relative;">
    <div class="msg-reaction-icon">
      <div class="default-react-icon-thumb">
        <i class="fa fa-outline-download f18 menu-icon">
</i>
      </div>
    </div>
    <div class="emoji-list-wrapper provider download hide-elist" style="">
      <ul>
</ul>;
    </div>
  </div>`;

const copy_btn = `<div class="zaloapi_copy_btn" style="position: relative;">
    <div class="msg-reaction-icon">
      <div class="default-react-icon-thumb">
        <i class="fa fa-outline-copy f18 menu-icon">
</i>
      </div>
    </div>
    <div class="emoji-list-wrapper provider copy hide-elist" style="">
      <ul>
      </ul>;
    </div>
  </div>`;
