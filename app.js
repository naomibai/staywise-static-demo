'use strict';

/*
 * 纯静态演示数据：按 IS5413_B_final/01_SQL脚本/03_seed_data.sql 的结构和样例整理。
 * 所有查询只在浏览器内对下列数组进行筛选/汇总，不会访问 SQL Server 或后端 API。
 * 房源、用户、订单、支付和评论的样例值与 B 组种子数据对应；日期以打开网页当天为演示基准。
 */
const demoToday = new Date();
demoToday.setHours(0, 0, 0, 0);
const dateOffset = (offset) => {
  const date = new Date(demoToday);
  date.setDate(date.getDate() + offset);
  return toISODate(date);
};
function toISODate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function fromISO(value) {
  return new Date(`${value}T00:00:00`);
}
function daysBetween(start, end) {
  return Math.round((fromISO(end) - fromISO(start)) / 86400000);
}

const users = [
  { user_id: 1, name: 'Alice Wong' }, { user_id: 2, name: 'Ben Chen' },
  { user_id: 3, name: 'Chloe Lee' }, { user_id: 4, name: 'David Ho' },
  { user_id: 5, name: 'Emma Lin' }, { user_id: 6, name: 'Frank Liu' },
  { user_id: 7, name: 'Grace Tan' }, { user_id: 8, name: 'Henry Wu' }
];
const hosts = [1, 2, 4];
const guests = [3, 4, 5, 6, 7];
const listings = [
  { listing_id: 1, host_id: 1, title: 'Harbour Studio', address: '18 Harbour Road', city: 'Hong Kong', base_price: 800, room_type: 'entire_home' },
  { listing_id: 2, host_id: 2, title: 'Garden Apartment', address: '28 Garden Street', city: 'Shenzhen', base_price: 600, room_type: 'entire_home' },
  { listing_id: 3, host_id: 4, title: 'Quiet Private Room', address: '8 Lotus Road', city: 'Macau', base_price: 900, room_type: 'private_room' },
  { listing_id: 4, host_id: 1, title: 'Central Family Flat', address: '32 Queen Road', city: 'Hong Kong', base_price: 1200, room_type: 'entire_home' }
];

const availability = [];
for (const listing of listings) {
  for (let offset = -30; offset <= 120; offset += 1) {
    const dayInWeek = (offset + 30) % 7;
    availability.push({
      listing_id: listing.listing_id,
      availability_date: dateOffset(offset),
      price: listing.base_price + ([5, 6].includes(dayInWeek) ? 100 : 0)
    });
  }
}

const bookingFixtures = [
  { booking_id: 1, guest_id: 3, listing_id: 1, arrival: -8, departure: -5, number_of_guests: 2, booking_status: 'completed' },
  { booking_id: 2, guest_id: 4, listing_id: 2, arrival: -6, departure: -3, number_of_guests: 1, booking_status: 'completed' },
  { booking_id: 3, guest_id: 5, listing_id: 1, arrival: 7, departure: 10, number_of_guests: 2, booking_status: 'pending' },
  { booking_id: 4, guest_id: 6, listing_id: 2, arrival: 8, departure: 11, number_of_guests: 1, booking_status: 'pending' },
  { booking_id: 5, guest_id: 3, listing_id: 3, arrival: 12, departure: 15, number_of_guests: 2, booking_status: 'confirmed' },
  { booking_id: 6, guest_id: 4, listing_id: 1, arrival: 17, departure: 19, number_of_guests: 1, booking_status: 'cancelled' },
  { booking_id: 7, guest_id: 5, listing_id: 2, arrival: 20, departure: 22, number_of_guests: 2, booking_status: 'cancelled' },
  { booking_id: 8, guest_id: 7, listing_id: 3, arrival: 23, departure: 25, number_of_guests: 2, booking_status: 'cancelled' },
  { booking_id: 9, guest_id: 6, listing_id: 4, arrival: 26, departure: 29, number_of_guests: 3, booking_status: 'cancelled' },
  { booking_id: 10, guest_id: 4, listing_id: 4, arrival: 30, departure: 32, number_of_guests: 2, booking_status: 'cancelled' }
];
function priceForStay(listingId, checkIn, checkOut) {
  return availability.filter((night) => night.listing_id === listingId && night.availability_date >= checkIn && night.availability_date < checkOut)
    .reduce((sum, night) => sum + night.price, 0);
}
const bookingRows = bookingFixtures.map((fixture) => {
  const check_in = dateOffset(fixture.arrival);
  const check_out = dateOffset(fixture.departure);
  return {
    booking_id: fixture.booking_id,
    guest_id: fixture.guest_id,
    listing_id: fixture.listing_id,
    check_in,
    check_out,
    number_of_guests: fixture.number_of_guests,
    booking_status: fixture.booking_status,
    agreed_total: priceForStay(fixture.listing_id, check_in, check_out)
  };
});

const paymentFixture = {
  1: { method: 'card', status: 'paid', paid: true },
  2: { method: 'paypal', status: 'paid', paid: true },
  3: { method: 'unselected', status: 'pending', paid: false },
  4: { method: 'card', status: 'failed', paid: false },
  5: { method: 'card', status: 'paid', paid: true },
  6: { method: 'unselected', status: 'voided', paid: false },
  7: { method: 'card', status: 'refunded', paid: true },
  8: { method: 'paypal', status: 'refund_pending', paid: true },
  9: { method: 'card', status: 'paid', paid: true },
  10: { method: 'card', status: 'partially_refunded', paid: true }
};
let payments = bookingRows.map((booking) => {
  const details = paymentFixture[booking.booking_id];
  const refundRequested = [7, 8].includes(booking.booking_id) ? booking.agreed_total : booking.booking_id === 10 ? booking.agreed_total / 2 : 0;
  const refunded = [7].includes(booking.booking_id) ? booking.agreed_total : booking.booking_id === 10 ? booking.agreed_total / 2 : 0;
  return {
    payment_id: booking.booking_id,
    booking_id: booking.booking_id,
    amount: booking.agreed_total,
    method: details.method,
    status: details.status,
    paid_at: details.paid ? dateOffset(-1) : null,
    refund_requested_amount: refundRequested,
    refunded_amount: refunded
  };
});
const reviews = [
  { review_id: 1, booking_id: 1, reviewer_role: 'guest', rating: 5, comment: 'Clean studio and a helpful host.', submitted_at: dateOffset(-1) },
  { review_id: 2, booking_id: 1, reviewer_role: 'host', rating: 5, comment: 'Chloe respected the house rules.', submitted_at: dateOffset(-1) },
  { review_id: 3, booking_id: 2, reviewer_role: 'guest', rating: 4, comment: 'Comfortable apartment near transport.', submitted_at: dateOffset(0) },
  { review_id: 4, booking_id: 2, reviewer_role: 'host', rating: 5, comment: 'David communicated clearly and left the room tidy.', submitted_at: dateOffset(0) }
];

let savedReservations = (() => {
  try { return JSON.parse(localStorage.getItem('staywise-static-reservations') || '[]'); }
  catch { return []; }
})();
for (const saved of savedReservations) {
  bookingRows.push(saved.booking);
  payments.push(saved.payment);
}
const state = { view: 'explore', orderMode: 'guest', analyticsId: 5, selectedStay: null, reviews };
const $ = (id) => document.getElementById(id);

function toast(message) {
  const node = $('toast');
  node.textContent = message;
  node.classList.add('show');
  setTimeout(() => node.classList.remove('show'), 2600);
}
function escapeText(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}
function formatDate(value, options = { month: 'short', day: 'numeric' }) {
  if (!value) return '—';
  const date = value instanceof Date ? value : fromISO(String(value).slice(0, 10));
  return Number.isNaN(date.valueOf()) ? String(value) : date.toLocaleDateString('zh-CN', options);
}
function money(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `HK$${number.toLocaleString('en-HK', { maximumFractionDigits: 0 })}` : '—';
}
function typeLabel(value) {
  return ({ entire_home: '整套房源', private_room: '独立房间', shared_room: '合住房间' })[value] || value || '住宿';
}
function switchView(name) {
  state.view = name;
  document.querySelectorAll('.page-view').forEach((view) => view.classList.toggle('active', view.id === `${name}View`));
  document.querySelectorAll('[data-nav]').forEach((button) => button.classList.toggle('active', button.dataset.nav === name));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* 对应 Query 1：按城市和入住区间查询逐晚报价（退房日不计入）。 */
function query1({ city, startDate, endDate }) {
  return listings.flatMap((listing) => listing.city === city
    ? availability.filter((night) => night.listing_id === listing.listing_id && night.availability_date >= startDate && night.availability_date < endDate)
      .map((night) => ({ listing_id: listing.listing_id, title: listing.title, city: listing.city, room_type: listing.room_type, availability_date: night.availability_date, price: night.price }))
    : []);
}
/* 对应 Query 2：某房源未来十四天的价格日历。 */
function query2(listingId) {
  const today = toISODate(demoToday);
  const cutoff = dateOffset(14);
  return availability.filter((night) => night.listing_id === Number(listingId) && night.availability_date >= today && night.availability_date < cutoff)
    .map((night) => ({ listing_id: night.listing_id, title: listings.find((listing) => listing.listing_id === night.listing_id).title, availability_date: night.availability_date, price: night.price }));
}
/* 对应 Query 3：住客预订和付款。 */
function query3(guestId) {
  return bookingRows.filter((booking) => booking.guest_id === Number(guestId)).map((booking) => {
    const user = users.find((item) => item.user_id === booking.guest_id);
    const listing = listings.find((item) => item.listing_id === booking.listing_id);
    const payment = payments.find((item) => item.booking_id === booking.booking_id);
    return { booking_id: booking.booking_id, guest_name: user?.name, listing_title: listing?.title, check_in: booking.check_in, check_out: booking.check_out, booking_status: booking.booking_status, payment_status: payment?.status, payment_method: payment?.method };
  });
}
/* 对应 Query 4：房东名下的所有预订。 */
function query4(hostId) {
  const owned = listings.filter((listing) => listing.host_id === Number(hostId));
  return bookingRows.filter((booking) => owned.some((listing) => listing.listing_id === booking.listing_id)).map((booking) => ({
    booking_id: booking.booking_id,
    listing_title: listings.find((listing) => listing.listing_id === booking.listing_id).title,
    guest_name: users.find((user) => user.user_id === booking.guest_id)?.name,
    check_in: booking.check_in,
    check_out: booking.check_out,
    booking_status: booking.booking_status,
    payment_status: payments.find((payment) => payment.booking_id === booking.booking_id)?.status
  }));
}
/* 对应 Query 5：待处理或失败的付款。 */
function query5() {
  return payments.filter((payment) => ['pending', 'failed'].includes(payment.status)).map((payment) => {
    const booking = bookingRows.find((item) => item.booking_id === payment.booking_id);
    return { payment_id: payment.payment_id, payment_status: payment.status, method: payment.method, booking_id: booking.booking_id, guest_name: users.find((user) => user.user_id === booking.guest_id)?.name, listing_title: listings.find((listing) => listing.listing_id === booking.listing_id)?.title };
  });
}
/* 对应 Query 6：取消订单的退款信息。 */
function query6() {
  return bookingRows.filter((booking) => booking.booking_status === 'cancelled').map((booking) => {
    const payment = payments.find((item) => item.booking_id === booking.booking_id);
    return { booking_id: booking.booking_id, listing_title: listings.find((item) => item.listing_id === booking.listing_id)?.title, original_amount: payment?.amount, refunded_amount: payment?.refunded_amount };
  });
}
/* 对应 Query 7：按房东和房源统计已付款笔数与原始付款总额。 */
function query7() {
  const grouped = new Map();
  payments.filter((payment) => payment.paid_at).forEach((payment) => {
    const booking = bookingRows.find((item) => item.booking_id === payment.booking_id);
    const listing = listings.find((item) => item.listing_id === booking.listing_id);
    const key = `${listing.host_id}-${listing.listing_id}`;
    const row = grouped.get(key) || { host_id: listing.host_id, listing_id: listing.listing_id, listing_title: listing.title, paid_count: 0, total_paid: 0 };
    row.paid_count += 1;
    row.total_paid += payment.amount;
    grouped.set(key, row);
  });
  return [...grouped.values()].sort((a, b) => a.host_id - b.host_id || a.listing_id - b.listing_id);
}
/* 对应 Query 8：按房源统计总预订、已完成和已取消数量。 */
function query8() {
  return listings.map((listing) => {
    const rows = bookingRows.filter((booking) => booking.listing_id === listing.listing_id);
    return { listing_id: listing.listing_id, title: listing.title, city: listing.city, total_bookings: rows.length, completed_bookings: rows.filter((booking) => booking.booking_status === 'completed').length, cancelled_bookings: rows.filter((booking) => booking.booking_status === 'cancelled').length };
  }).sort((a, b) => b.completed_bookings - a.completed_bookings);
}
/* 对应 Query 9：显示评论和关联房源。 */
function query9() {
  return reviews.map((review) => {
    const booking = bookingRows.find((item) => item.booking_id === review.booking_id);
    const listing = listings.find((item) => item.listing_id === booking?.listing_id);
    return { review_id: review.review_id, listing_id: listing?.listing_id, listing_title: listing?.title, reviewer_role: review.reviewer_role, rating: review.rating, comment: review.comment, submitted_at: review.submitted_at };
  }).sort((a, b) => b.submitted_at.localeCompare(a.submitted_at));
}
/* 对应 Query 10：按城市统计总预订和已完成预订数。 */
function query10() {
  return [...new Set(listings.map((listing) => listing.city))].map((city) => {
    const rows = bookingRows.filter((booking) => listings.find((listing) => listing.listing_id === booking.listing_id).city === city);
    return { city, total_bookings: rows.length, completed_bookings: rows.filter((booking) => booking.booking_status === 'completed').length };
  }).sort((a, b) => b.total_bookings - a.total_bookings);
}
function runQuery(id, params = {}) {
  return ({ 1: () => query1(params), 2: () => query2(params.listingId), 3: () => query3(params.guestId), 4: () => query4(params.hostId), 5: query5, 6: query6, 7: query7, 8: query8, 9: query9, 10: query10 })[id]();
}

function searchStays(event) {
  if (event) event.preventDefault();
  const city = $('searchCity').value.trim();
  const startDate = $('searchStart').value;
  const endDate = $('searchEnd').value;
  if (!city || !startDate || !endDate || startDate >= endDate) {
    $('listingSubheading').textContent = '请填写城市，并确认退房日期晚于入住日期。';
    return;
  }
  $('listingHeading').textContent = `探索 ${city} 的房源`;
  const rows = runQuery(1, { city, startDate, endDate });
  renderStays(rows, startDate, endDate);
}
function renderStays(rows, startDate, endDate) {
  const group = new Map();
  rows.forEach((row) => {
    if (!group.has(row.listing_id)) {
      const sourceListing = listings.find((listing) => listing.listing_id === row.listing_id);
      group.set(row.listing_id, { id: row.listing_id, title: row.title, address: sourceListing?.address, city: row.city, roomType: row.room_type, rows: [] });
    }
    group.get(row.listing_id).rows.push(row);
  });
  const nights = daysBetween(startDate, endDate);
  const guestReviews = query9().filter((review) => review.reviewer_role === 'guest');
  const stays = [...group.values()].filter((stay) => new Set(stay.rows.map((row) => row.availability_date)).size === nights).map((stay) => {
    const nightly = stay.rows.filter((row) => row.availability_date >= startDate && row.availability_date < endDate).map((row) => Number(row.price));
    const matches = guestReviews.filter((review) => review.listing_id === stay.id);
    stay.nights = nightly.length;
    stay.total = nightly.reduce((sum, price) => sum + price, 0);
    stay.average = stay.nights ? stay.total / stay.nights : 0;
    stay.rating = matches.length ? matches.reduce((sum, review) => sum + Number(review.rating), 0) / matches.length : 0;
    stay.reviewCount = matches.length;
    stay.startDate = startDate;
    stay.endDate = endDate;
    stay.guests = Number($('searchGuests').value || 1);
    return stay;
  });
  $('stayCount').textContent = `${stays.length} 套房源`;
  $('listingSubheading').textContent = `${formatDate(startDate)} – ${formatDate(endDate)} · ${nights} 晚 · ${$('searchGuests').value} 位旅客 · 静态演示数据`;
  if (!stays.length) {
    $('stayGrid').innerHTML = '<div class="empty-listings">这段日期没有找到每晚均有报价的房源。试试更换日期或目的地。</div>';
    return;
  }
  $('stayGrid').replaceChildren(...stays.map((stay, index) => createStayCard(stay, index)));
}
function createStayCard(stay, index) {
  const card = document.createElement('article');
  card.className = 'stay-card';
  const scene = index % 6;
  card.innerHTML = `<div class="stay-art art-scene-${scene}"><span class="house-ill">⌂</span><button class="heart-button" type="button" title="收藏">♡</button></div><div class="stay-copy"><div class="stay-title-line"><span class="stay-title">${escapeText(stay.title)}</span><span class="stay-rating"><b>★</b> ${stay.rating ? `${stay.rating.toFixed(1)} (${stay.reviewCount})` : '新房源'}</span></div><div class="stay-meta">${escapeText(stay.city)} · ${escapeText(typeLabel(stay.roomType))}</div><div class="stay-price"><strong>${money(stay.average)}</strong> <small>/ 晚</small></div><div class="stay-total">${money(stay.total)} · ${stay.nights} 晚</div></div>`;
  card.querySelector('.heart-button').addEventListener('click', (event) => { event.stopPropagation(); toast('静态演示暂未保存收藏'); });
  card.addEventListener('click', () => openStay({ ...stay, scene }));
  return card;
}
function openStay(stay) {
  state.selectedStay = stay;
  $('detailTitle').textContent = stay.title;
  $('detailLocation').textContent = `${stay.address} · ${stay.city}`;
  $('detailType').textContent = typeLabel(stay.roomType);
  $('bookingPrice').textContent = money(stay.average);
  $('detailArt').className = `detail-art art-scene-${stay.scene ?? 0}`;
  $('bookingStart').value = stay.startDate || $('searchStart').value;
  $('bookingEnd').value = stay.endDate || $('searchEnd').value;
  $('bookingGuests').value = String(stay.guests || $('searchGuests').value || 1);
  $('bookingMessage').classList.add('hidden');
  loadCalendar(stay.id);
  loadReviews(stay.id);
  $('stayDialog').showModal();
}
function loadCalendar(listingId) {
  const rows = runQuery(2, { listingId });
  const list = $('calendarList');
  if (!rows.length) { list.innerHTML = '<span class="muted-copy">未来 14 天没有价格记录。</span>'; return; }
  list.replaceChildren(...rows.map((row) => {
    const item = document.createElement('div'); item.className = 'calendar-day';
    const date = document.createElement('small'); date.textContent = formatDate(row.availability_date);
    const price = document.createElement('strong'); price.textContent = money(row.price);
    item.append(date, price); return item;
  }));
}
function loadReviews(listingId) {
  const listingReviews = runQuery(9).filter((review) => Number(review.listing_id) === Number(listingId));
  const guestReviews = listingReviews.filter((review) => review.reviewer_role === 'guest');
  const ratings = guestReviews.length ? guestReviews : listingReviews;
  const average = ratings.length ? ratings.reduce((sum, review) => sum + Number(review.rating), 0) / ratings.length : 0;
  $('detailRating').textContent = ratings.length ? `★ ${average.toFixed(1)} · ${ratings.length} 条评价` : '☆ 暂无评价';
  const list = $('reviewList');
  if (!listingReviews.length) { list.innerHTML = '<span class="muted-copy">这套房源目前还没有评价。</span>'; return; }
  list.replaceChildren(...listingReviews.map((review) => {
    const card = document.createElement('article'); card.className = 'review-card';
    const heading = document.createElement('div'); heading.className = 'review-card-head';
    const role = document.createElement('strong'); role.textContent = review.reviewer_role === 'guest' ? '住客评价' : '房东评价';
    const rating = document.createElement('span'); rating.textContent = `★ ${review.rating}/5`;
    heading.append(role, rating);
    const comment = document.createElement('p'); comment.textContent = review.comment;
    const date = document.createElement('small'); date.textContent = formatDate(review.submitted_at, { year: 'numeric', month: 'short', day: 'numeric' });
    card.append(heading, comment, date); return card;
  }));
}

function simulateReservation(event) {
  event.preventDefault();
  if (!state.selectedStay) return;
  const checkIn = $('bookingStart').value;
  const checkOut = $('bookingEnd').value;
  const guestCount = Number($('bookingGuests').value);
  const message = $('bookingMessage');
  message.className = 'booking-message hidden';
  if (!checkIn || !checkOut || checkIn >= checkOut) {
    return showBookingMessage('退房日期必须晚于入住日期。', true);
  }
  const nights = availability.filter((night) => night.listing_id === state.selectedStay.id && night.availability_date >= checkIn && night.availability_date < checkOut);
  if (nights.length !== daysBetween(checkIn, checkOut)) {
    return showBookingMessage('所选日期有未开放的晚上，请重新选择。', true);
  }
  const overlaps = bookingRows.some((booking) => booking.listing_id === state.selectedStay.id && ['pending', 'confirmed'].includes(booking.booking_status) && booking.check_in < checkOut && checkIn < booking.check_out);
  if (overlaps) return showBookingMessage('该日期与已有预订冲突，请更换入住日期。', true);
  const listing = listings.find((item) => item.listing_id === state.selectedStay.id);
  const guestId = 3;
  if (listing.host_id === guestId) return showBookingMessage('演示用户不能预订自己发布的房源。', true);
  const bookingId = Math.max(0, ...bookingRows.map((booking) => booking.booking_id)) + 1;
  const total = nights.reduce((sum, night) => sum + night.price, 0);
  const booking = { booking_id: bookingId, guest_id: guestId, listing_id: listing.listing_id, check_in: checkIn, check_out: checkOut, number_of_guests: guestCount, booking_status: 'pending', agreed_total: total };
  const payment = { payment_id: bookingId, booking_id: bookingId, amount: total, method: 'unselected', status: 'pending', paid_at: null, refund_requested_amount: 0, refunded_amount: 0 };
  bookingRows.push(booking);
  payments.push(payment);
  savedReservations.push({ booking, payment });
  try { localStorage.setItem('staywise-static-reservations', JSON.stringify(savedReservations)); }
  catch { /* 若浏览器禁止本地存储，本次页面会话仍可使用预订演示。 */ }
  showBookingMessage(`演示预订已创建：订单 #${bookingId}，共 ${daysBetween(checkIn, checkOut)} 晚，${money(total)}。数据仅保存在本浏览器。`, false);
  toast('本地演示订单已创建');
}
function showBookingMessage(text, isError) {
  const message = $('bookingMessage');
  message.textContent = text;
  message.className = `booking-message${isError ? ' error' : ''}`;
}

function renderTable(container, rows) {
  container.replaceChildren();
  if (!rows.length) { const empty = document.createElement('div'); empty.className = 'table-empty'; empty.textContent = '演示数据中没有符合条件的记录。'; container.appendChild(empty); return; }
  const columns = Object.keys(rows[0]);
  const table = document.createElement('table');
  const thead = document.createElement('thead'); const heading = document.createElement('tr');
  columns.forEach((column) => { const th = document.createElement('th'); th.textContent = column.replaceAll('_', ' '); heading.appendChild(th); });
  thead.appendChild(heading);
  const tbody = document.createElement('tbody');
  rows.forEach((row) => { const tr = document.createElement('tr'); columns.forEach((column) => { const td = document.createElement('td'); const value = row[column]; td.textContent = value === null || value === undefined ? '—' : (column.includes('date') || column === 'check_in' || column === 'check_out' || column === 'submitted_at') ? formatDate(value, { year: 'numeric', month: 'short', day: 'numeric' }) : typeof value === 'number' && /amount|total|price|paid/.test(column) ? money(value) : String(value); tr.appendChild(td); }); tbody.appendChild(tr); });
  table.append(thead, tbody); container.appendChild(table);
}
function loadOrderQuery(event) {
  if (event) event.preventDefault();
  const id = state.orderMode === 'guest' ? 3 : 4;
  const result = runQuery(id, state.orderMode === 'guest' ? { guestId: $('orderId').value } : { hostId: $('orderId').value });
  $('orderRowCount').textContent = `${result.length} 条演示记录`;
  renderTable($('orderTableWrap'), result);
}
function setupOrderMode(mode) {
  state.orderMode = mode;
  document.querySelectorAll('[data-order-mode]').forEach((tab) => tab.classList.toggle('active', tab.dataset.orderMode === mode));
  $('orderIdLabel').textContent = mode === 'guest' ? '住客编号' : '房东编号';
  $('orderId').value = mode === 'guest' ? '4' : '1';
  $('orderQueryTag').textContent = mode === 'guest' ? 'QUERY 03' : 'QUERY 04';
  $('orderResultTitle').textContent = mode === 'guest' ? '住客预订和付款' : '房东名下的预订';
  $('orderRowCount').textContent = '尚未查询';
  $('orderTableWrap').innerHTML = '<div class="table-empty">输入编号并查询后，静态演示结果会显示在这里。</div>';
}
const analyticsInfo = [
  { id: 5, title: '待处理或失败付款', description: '付款状态为 pending 或 failed。' },
  { id: 6, title: '取消订单退款', description: '查看取消订单的原始付款和已退款金额。' },
  { id: 7, title: '房源已支付总额', description: '按房东与房源汇总已付款笔数和金额。' },
  { id: 8, title: '房源预订统计', description: '统计总预订、已完成及已取消数。' },
  { id: 9, title: '评价列表', description: '评论、评分及其所属房源。' },
  { id: 10, title: '城市预订统计', description: '按城市汇总总预订和已完成订单。' }
];
function renderAnalyticsMenu() {
  $('analyticsMenu').replaceChildren(...analyticsInfo.map((item) => {
    const button = document.createElement('button'); button.type = 'button';
    button.className = `analytics-query${item.id === state.analyticsId ? ' active' : ''}`;
    button.innerHTML = `<strong>Query ${String(item.id).padStart(2, '0')} · ${escapeText(item.title)}</strong><small>${escapeText(item.description)}</small>`;
    button.addEventListener('click', () => selectAnalytics(item.id)); return button;
  }));
}
function selectAnalytics(id) {
  state.analyticsId = id;
  const item = analyticsInfo.find((query) => query.id === id);
  $('analyticsQueryTag').textContent = `QUERY ${String(id).padStart(2, '0')}`;
  $('analyticsTitle').textContent = item.title;
  $('analyticsDescription').textContent = item.description;
  $('analyticsRowCount').textContent = '尚未查询';
  $('analyticsTableWrap').innerHTML = '<div class="table-empty">点击“运行查询”计算本地演示数据。</div>';
  renderAnalyticsMenu();
}
function runAnalytics() {
  const rows = runQuery(state.analyticsId);
  $('analyticsRowCount').textContent = `${rows.length} 条演示记录`;
  renderTable($('analyticsTableWrap'), rows);
}
function init() {
  $('connectionDot').classList.add('online');
  $('connectionText').textContent = '静态演示模式';
  $('searchStart').value = dateOffset(3);
  $('searchEnd').value = dateOffset(5);
  $('bookingStart').min = dateOffset(0);
  $('bookingEnd').min = dateOffset(1);
  $('searchForm').addEventListener('submit', searchStays);
  $('bookingForm').addEventListener('submit', simulateReservation);
  $('closeDialog').addEventListener('click', () => $('stayDialog').close());
  $('stayDialog').addEventListener('click', (event) => { if (event.target === $('stayDialog')) $('stayDialog').close(); });
  $('bookingStart').addEventListener('change', () => {
    const next = toISODate(new Date(fromISO($('bookingStart').value).setDate(fromISO($('bookingStart').value).getDate() + 1)));
    $('bookingEnd').min = next;
    if ($('bookingEnd').value <= $('bookingStart').value) $('bookingEnd').value = next;
  });
  $('orderForm').addEventListener('submit', loadOrderQuery);
  $('runAnalytics').addEventListener('click', runAnalytics);
  $('profileButton').addEventListener('click', () => toast('这是纯静态演示，所有订单操作仅保存在当前浏览器。'));
  document.querySelectorAll('[data-nav]').forEach((button) => button.addEventListener('click', () => switchView(button.dataset.nav)));
  document.querySelectorAll('[data-order-mode]').forEach((button) => button.addEventListener('click', () => setupOrderMode(button.dataset.orderMode)));
  renderAnalyticsMenu();
  selectAnalytics(5);
}

init();
