// Everything you are likely to edit lives here.
// Keys of `texts` are the element ids from the original page: the text of that
// element is replaced, its animation and styling are kept. Use "\n" for a line break.
export const groom = {
  // Which family this page belongs to ("groom" | "bride"): routes RSVP mail and the sheet column.
  side: "groom",
  // Countdown target (ISO 8601 with timezone).
  weddingDate: "2026-11-28T12:00:00+07:00",
  // Calendar: "day[, day].month.year" and language ("vi" | "en").
  calendarDate: "28.11.2026",
  calendarLang: "vi",
  // Google Maps search query for the venue map.
  mapQuery: "20.537250,106.386028", // 20°32'14.1"N 106°23'09.7"E
  // Gift popup QR image (public/images).
  qrImage: "/images/qr-nha-trai.jpg",

  texts: {
    "w-ksmu35mk": "Văn Tranh ",
    "w-6ok54w18": "Hoàng Châu ",
    "w-kmzqf2td": "28.11.2026 ",
    "w-f8mrerwc": "NHÀ TRAI ",
    "w-1h4gd4pq": "Xóm 2 - Thôn Vô Song,\nXã Bắc Đông Quan - Tỉnh Hưng Yên ",
    "w-ngq2i2oy": "ÔNG NGUYỄN VĂN ĐÔNG\nBÀ PHẠM THỊ YẾN ",
    "w-xuft7p4i": "NHÀ GÁI ",
    "w-o6uhzqw4": "Xóm 1 - Thôn Hiệp Thọ,\nXã Ninh Giang - TP. Hải Phòng ",
    "w-2poj4n4l": "ÔNG VŨ VĂN VƯỢNG\nBÀ TRẦN THỊ NHIÊN ",
    "w-e4l7vaw1": "Trân Trọng Báo Tin Lễ Thành Hôn Của ",
    "w-fc02kbza": "Nguyễn Văn Tranh ",
    "w-bbjvvlk9": "♥",
    "w-ag8riudy": "Vũ Hoàng Châu ",
    "w-k95qeyno": "LỄ THÀNH HÔN ",
    "w-dlk1x32i": "12:00 - Thứ Bảy ",
    "w-fb0euj06": "28.11.2026 ",
    "w-axsge25c": "(Tức Ngày 20 Tháng 10 Năm Bính Ngọ) ",
    "w-f4yc955s": "Tại Tư Gia Nhà Trai ",
    "w-5rxm49fd": "TIỆC MỪNG LỄ THÀNH HÔN ",
    "w-tqj2wowm": "12:00 - Thứ Bảy ",
    "w-p0yupcfy": "28.11.2026 ",
    "w-9pppdikn": "(Tức Ngày 20 Tháng 10 Năm Bính Ngọ) ",
    "w-37nes7vw": "Tại Tư Gia Nhà Trai ",
    "w-adxoew9t": "TƯ GIA NHÀ TRAI ",
    "w-rd8ocrxv": "Xóm 2 - Thôn Vô Song, Xã Bắc Đông Quan - Tỉnh Hưng Yên ",
    "w-wad8izgj": "TƯ GIA NHÀ TRAI ",
    "w-1hteyd0u": "Xóm 2 - Thôn Vô Song, Xã Bắc Đông Quan - Tỉnh Hưng Yên ",
    // Gift popup: bank / account number
    "w-q1hicfov": "TECHCOMBANK - NGUYEN VAN TRANH\n1903 7052 4660 18",
  },
};

// Bride's side: same page, venue and time switched to the bride's family home.
export const bride = {
  ...groom,
  side: "bride",
  weddingDate: "2026-11-28T08:30:00+07:00", // countdown target = start of the vu quy ceremony
  mapQuery: "20.720954,106.370906", // from https://maps.app.goo.gl/Ym24nCHikxVafixf8
  qrImage: "/images/qr-nha-gai.jpg",
  texts: {
    ...groom.texts,
    "w-q1hicfov": "VIETCOMBANK - VU HOANG CHAU\n0301000406936",
    // Bride first, as on her printed card.
    "w-ksmu35mk": "Hoàng Châu ",
    "w-6ok54w18": "Văn Tranh ",
    "w-fc02kbza": "Vũ Hoàng Châu ",
    "w-ag8riudy": "Nguyễn Văn Tranh ",
    "w-f8mrerwc": groom.texts["w-xuft7p4i"],
    "w-1h4gd4pq": groom.texts["w-o6uhzqw4"],
    "w-ngq2i2oy": groom.texts["w-2poj4n4l"],
    "w-xuft7p4i": groom.texts["w-f8mrerwc"],
    "w-o6uhzqw4": groom.texts["w-1h4gd4pq"],
    "w-2poj4n4l": groom.texts["w-ngq2i2oy"],
    // Bride's family holds the "vu quy" ceremony, not the groom's "thành hôn".
    "w-e4l7vaw1": "Trân Trọng Báo Tin Lễ Vu Quy Của ",
    "w-k95qeyno": "LỄ VU QUY ",
    "w-5rxm49fd": "TIỆC MỪNG LỄ VU QUY ",
    "w-dlk1x32i": "08:30 - Thứ Bảy ", // vu quy ceremony
    "w-f4yc955s": "Tại Tư Gia Nhà Gái ",
    "w-tqj2wowm": "09:00 - Thứ Bảy ", // party at 9:00 on the bride's side
    "w-37nes7vw": "Tại Tư Gia Nhà Gái ",
    "w-adxoew9t": "TƯ GIA NHÀ GÁI ",
    "w-rd8ocrxv": "Xóm 1 - Thôn Hiệp Thọ, Xã Ninh Giang - TP. Hải Phòng ",
    "w-wad8izgj": "TƯ GIA NHÀ GÁI ",
    "w-1hteyd0u": "Xóm 1 - Thôn Hiệp Thọ, Xã Ninh Giang - TP. Hải Phòng ",
  },
};
