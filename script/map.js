// 検索失敗したら再度検索するようにして、全部検索できるようにしたものの、
// よく考えると、そんなに頻繁にデータが変わるわけでもないので、
// 検索するのやめにすればいいと気づいた。
const APP = {
  map: null,         // 地図本体
  infoWindow: null,  // マーカーをクリックした時の情報ウィンドウ
  infoWindowOpen: false,  // 情報ウィンドウが開いているかどうか
  placeData: null,
  trekkingData: null,
  urlData: null,
  textData: null,
  markerList: [],
};

const CONSTS = {
  lat: 34.7,
  lang: 135,
  zoom: 6,
  mapInHTML: 'map',
};

// toString的なものを追加。
// nに日数を入れることで、期間も設定できる。
Date.prototype.getString = function(n) {
  let str =
      `${this.getFullYear()}年${this.getMonth() + 1}月${this.getDate()}日`;
  if (n > 0) {
    let enddate =
        new Date(this.getFullYear(), this.getMonth(), this.getDate() + n);
    str += `〜${enddate.getMonth() + 1}月${enddate.getDate()}日`;
  }
  return str;
};

Date.prototype.nendo =
    function() {
  return this.getMonth() < 3 ? this.getFullYear() - 1 : this.getFullYear()
}

    APP.visual = {
  changeMarkerVisual: function() {  // show=trueで表示される
    const years = [...document.getElementsByClassName('yearchecker')]
                      .filter(x => x.checked)
                      .map(x => Number(x.id.slice(-4)));
    const places = APP.trekkingData.filter(x => years.includes(x[2].nendo()))
                       .map(x => x[0].slice(0, -2));
    console.log(years, places)
    APP.markerList.forEach(
        marker => marker.setVisible(places.includes(marker.placeid)));
  },
  createContent: function(place) {  // 表示テキスト(html)を作る
                return `<p><b>${place[1]}</b></p>`								// とりあえず場所名
			+ APP.trekkingData
					.filter(trek => trek[0].slice(0,-2) === place[0])		// 場所に付随する山行データを取得, trek[1]は山の名前
					.map(trek => {
						const [id, title, start, end]  = trek
                console.log(id, title, start, end)
                                                return `<p>${title} : ${start.getString(end)}</p>`			// 山行タイトル、日時表示
							+ (APP.textData.has(id) ? `<p>${APP.textData.get(id)}</p>` : '')
							+ (APP.urlData.has(id) ?
							  `<p>ブログ : <a href="${APP.urlData.get(id)}" target="_blank">${APP.urlData.get(id)}</a></p>` : '')
					}).join('<hr>');
  },
  createMarker: function(place) {  // マーカー生成
    const [id, name, lat, lng] = place;
    let marker = new google.maps.Marker({
      position: new google.maps.LatLng(lat, lng),
      map: APP.map,
      animation: google.maps.Animation.DROP,
    });
    marker.placeid = id;            // プロパティに記録しておく
    marker.infoWindowOpen = false;  // 初期状態はウィンドウなし
    APP.markerList.push(marker);    // マーカーリストに追加
    marker.addListener('click', function() {  // マーカーに情報ウィンドウを付加。
      if (marker
              .infoWindowOpen) {  // infoWindowがopenなマーカーをクリックした時
        APP.infoWindow.close();         // APP全体で1つだけにする
        marker.infoWindowOpen = false;  // 閉じる
      } else {
        if (APP.infoWindow !==
            null) {  // すでに他でウィンドウが開いていてnullでなくなっている時は
          APP.infoWindow.close();  // それをとりあえず閉じる。
        }
        APP.infoWindow = new google.maps.InfoWindow({
          // 情報ウィンドウ作成
          content: APP.visual.createContent(
              place),  // 場所データから表示テキストを作成
        });
        APP.infoWindow.open(APP.map, marker);  // ウィンドウをmapに表示
        marker.infoWindowOpen = true;          // 自分のinfoWindowOpenをtrue
      }
    });
  },
};

APP.initMap = async function() {
  const opts = {
    // 地図の表示オプション
    zoom: CONSTS.zoom,                                        // ズーム
    center: new google.maps.LatLng(CONSTS.lat, CONSTS.lang),  // 地図の中心
    mapTypeId: google.maps.MapTypeId.TERRAIN,  // 地図の表示モード(地形)
  };
  APP.map = new google.maps.Map(
      document.getElementById(CONSTS.mapInHTML),
      opts);  // 地図オブジェクト(htmlのmap要素に貼り付け)
  const getCSV = async function(filename) {
    return fetch('data/' + filename)
        .then(response => response.text())
        .then(
            text =>
                text.trim()       // 前後の空白を除く
                    .split('\n')  // 行ごとに分割
                    .filter(
                        x => x.trim().substr(0, 2) != '//')  // コメント行を無視
                    .filter(x => x !== '')  // 空白行を無視
                    .map(
                        x => x.split(',').map(
                            y => y.trim()))  // コンマで区切って、トリム)
        )
  };
  const [place, trek, url, text] = await Promise.all(
      'place.csv trekking.csv url.csv text.csv'.split(' ').map(getCSV))
  APP.placeData = place;
  APP.trekkingData =
      trek.map(x => [x[0], x[1], new Date(x[2], x[3] - 1, x[4]), Number(x[5])]);
  APP.urlData = new Map(url);
  APP.textData = new Map(text);

  APP.placeData.forEach(APP.visual.createMarker);
  APP.visual.changeMarkerVisual();

  [...document.getElementsByClassName('yearchecker')].forEach(
      check => check.addEventListener('change', APP.visual.changeMarkerVisual));
};

window.addEventListener('load', APP.initMap);
