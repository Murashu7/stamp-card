'use strict';
const stampTypeObj = require('../routes/stamp-type');
import moment from 'moment-timezone';
import $ from 'jquery';

const global = Function('return this;')();
global.jQuery = $;
import bootstrap from 'bootstrap';

const pathName = location.pathname;
const queryStrs = location.search;

if (pathName.match(/objectives\/new/)) {

} else if (pathName.match(/edit/) || queryStrs.match(/edit/)) {
  // 削除フォーム
  const deleteForm = document.getElementById('deleteForm');

  deleteForm.addEventListener('submit', function(event) {
    event.preventDefault();
    if (confirm('本当に削除しますか？')) {
      deleteForm.submit();
    }
  }, false);

} else if (pathName.match(/objectives/)) {

  const week = ['日', '月', '火', '水', '木', '金', '土'];
  const cal = document.getElementById("calendar");
  const prev = document.createElement("button");
  const next = document.createElement("button");
  const current = document.createElement("button");
  prev.id = "prev";
  next.id = "next";
  current.id = "current";
  prev.innerText = "前の月";
  next.innerText = "次の月";
  current.innerText = "今月へ";

  const thisWeekAchvNum = document.getElementById('thisWeekAchvNum');
  const thisWeekAchvRate = document.getElementById('thisWeekAchvRate');
  const totalAchvNum = document.getElementById('totalAchvNum');
  const totalAchvRate = document.getElementById('totalAchvRate');
  const elapsedDays = document.getElementById('elapsedDays');
  const remainingDays = document.getElementById('remainingDays');

  // Server → pug → JS
  const calDate = moment(cal.dataset.calmonth);
  const today = moment(cal.dataset.today);
  const createdAt = moment(cal.dataset.createdat);
  const dueDay = moment(cal.dataset.dueday);
  const todayStr = moment(today).tz('Asia/Tokyo').format('YYYY-MM-DD');
  const createdAtStr = moment(createdAt).tz('Asia/Tokyo').format('YYYY-MM-DD');
  const dueDayStr = moment(dueDay).tz('Asia/Tokyo').format('YYYY-MM-DD');
  const objId = cal.dataset.objid;
  const stampStrs = cal.dataset.stamps;
  const stampType = cal.dataset.stamptype;

  const setupStampMap = function(stampStrs) {
    let stampMap = new Map();
    let tmp = stampStrs.match(/\{[^\{\}]+\}/g);
    if (tmp) {
      tmp.forEach((t) => {
        let json = JSON.parse(t);
        stampMap.set(json.stampDate, json.stampStatus);
      });
    }
    return stampMap;
  }

  let stampMap = setupStampMap(stampStrs);
  console.log(stampMap);

  const displayCal = function(calDate) {
    const firstDay = calDate.startOf('month'); // その月の初日
    const startValue = firstDay.day(); // カレンダーの開始値( 0 - 6 )
    const lastDay = calDate.endOf('month'); // その月の末日
    const endValue = startValue + lastDay.date(); // カレンダーの終了値

    const table = document.createElement("table");
    const tHead = document.createElement("thead");
    const tBody = document.createElement("tbody");
    const tr = document.createElement("tr");
    const h5 = document.createElement("h5");
    const cal_title_btns = document.createElement("div");
    const prev_next = document.createElement("div");
    
    h5.innerText = moment(calDate).tz('Asia/Tokyo').format('YYYY年MM月');

    // スタイル適用( bootstrap )
    table.classList.add("table");
    table.classList.add("table-bordered");
    table.style.tableLayout = "fixed";
    cal_title_btns.classList.add("d-flex");
    cal_title_btns.classList.add("justify-content-between");
    cal_title_btns.classList.add("mt-5");
    cal_title_btns.classList.add("mb-1");
    prev.classList.add("mr-2");

    // カレンダーのタイトル、ボタン
    prev_next.appendChild(prev);
    prev_next.appendChild(next);
    cal_title_btns.appendChild(h5);
    cal_title_btns.appendChild(current);
    cal_title_btns.appendChild(prev_next);

    // 今月の場合は「今月へ」ボタンは無効    
    if (makeCurrentMonth() === calDate.tz('Asia/Tokyo').format('YYYY-MM')) {
      current.disabled = true;
    }

    // 全ての子要素を削除
    while (cal.firstChild) {
      cal.removeChild(cal.firstChild);
    }

    cal.appendChild(cal_title_btns);
    cal.appendChild(table);
    table.appendChild(tHead);
    tHead.appendChild(tr);

    // 曜日：日〜土まで作成
    for (let i = 0, len = week.length; i < len; i++) {
      let th = document.createElement("th");
      th.classList.add("text-center");
      th.classList.add("p-1");
      tr.appendChild(th);
      if (week[i] === '日') {
        th.classList.add('text-danger');
      } else if (week[i] === '土') {
        th.classList.add('text-primary');
      }
      th.innerText = week[i];
    }
    table.appendChild(tBody);

    let count = 0;
    let days = 1;
    for (let i = 0; i < 6; i++) {
      let tr = document.createElement("tr");
      for (let j = 0, len = week.length; j < len; j++) {
        // td の作成
        let td = document.createElement("td");
        let tdHeader = document.createElement("div");
        let divDay = document.createElement("div");
        let divLabel = document.createElement("div");
        let tdBody = document.createElement("div");
        
        // 日( 0 ), 土( 6 ) の日付に色付け
        if (j === 0) {
          divDay.classList.add("text-danger");
        } else if (j === 6) {
          divDay.classList.add("text-primary");
        }

        // td のスタイル
        td.classList.add("p-0", "position-relative");
        td.style.height = "65px";
        tdHeader.classList.add("p-0");
        divDay.classList.add("px-1");
        tdBody.classList.add("h2", "text-center","mb-0", "position-absolute", "w-100");
        tdBody.style.bottom = "0";

        if (startValue <= count && count < endValue) {
          // TODO: stamps
          divDay.innerText = days;
          td.setAttribute('data-day', days);
          const day = td.dataset.day;
          const tdDate = calDate.set('date', day).tz('Asia/Tokyo').format('YYYY-MM-DD');
          const stampDate = day.match(/^\d*$/) ? Number(day) : null;

          if (todayStr === tdDate) { // 今日の td に色付け
             td.style.backgroundColor = 'skyblue'; 
          } 
          
          if (createdAtStr === tdDate || dueDayStr === tdDate) { // 開始日か期限日にラベルをつける
             tdHeader.classList.add("d-flex");
             divLabel.classList.add("flex-grow-1", "bg-success", "font-weight-bold", "text-white", "small", "text-center", "rounded");
             divLabel.style.lineHeight = "24px";
             if (createdAtStr === tdDate) { // 開始日
               divLabel.innerText = '開始'; 
             } else { // 期限日
               divLabel.innerText = '終了'; 
             }
          } 

          if (stampMap.has(stampDate)) {
            if (stampMap.get(stampDate)) {
              pressStamp(tdBody, stampType);
            } else {
              removeStamp(tdBody);
            }
          }
          tdHeader.appendChild(divDay);
          tdHeader.appendChild(divLabel);
          td.appendChild(tdHeader);
          td.appendChild(tdBody);

          // 開始日から期限までの間でスタンプが押せる
          const tdDateUnix = moment(tdDate).unix();
          const createdAtUnix = moment(createdAtStr).unix();
          const dueDayUnix = moment(dueDayStr).unix();
          if (createdAtUnix <= tdDateUnix && tdDateUnix <= dueDayUnix) {
            addStampEventListener(td, tdBody, calDate, stampMap, objId);
          }
          tr.appendChild(td)  
          days++;
        } 
        count++;
        tr.appendChild(td)  
      }
      tBody.appendChild(tr);
    }
  }
  
  const pressStamp = function(elem, type) {
    if (stampTypeObj.map.has(type)) {
      elem.innerHTML = stampTypeObj.map.get(type);
    }
  }

  const removeStamp = function(elem) {
    elem.innerHTML = '';
  }

  const addStampEventListener = function(elem1, elem2, date, stampMap, objId) {
    elem1.addEventListener('click', function(e) {
      const day = elem1.dataset.day;
      const stampDate = day.match(/^\d*$/) ? Number(day) : null;
      const tdDate = `${date.year()}-${date.month + 1}-${day}`;
      const monthName = date.tz('Asia/Tokyo').format('YYYY-MM');
      let stampStatus = false;

      if (stampMap.has(stampDate)) {
        stampStatus = !stampMap.get(stampDate);
        stampMap.set(stampDate, stampStatus);
        if (stampStatus) {
          pressStamp(elem2, stampType);
        } else {
          removeStamp(elem2);
        }
      } else {
        stampStatus = !stampStatus;
        stampMap.set(stampDate, stampStatus);
        pressStamp(elem2, stampType);
      }
      postData(`/objectives/${objId}/months/${monthName}/stamps/${stampDate}`, { stampStatus: stampStatus })
        .then((data) => {
          const w_num = data["aggregate"]["thisWeekAchvNum"];
          const w_rate = data["aggregate"]["thisWeekAchvRate"];
          const t_num = data["aggregate"]["totalAchvNum"];
          const t_rate = data["aggregate"]["totalAchvRate"];
          const e_days = data["aggregate"]["elapsedDays"];
          const r_days = data["aggregate"]["remainingDays"];
          thisWeekAchvNum.innerText = `${w_num}`;
          thisWeekAchvRate.innerText = `${w_rate}`;
          totalAchvNum.innerText = `${t_num}`;
          totalAchvRate.innerText = `${t_rate}`;
          elapsedDays.innerText = `${e_days}`;
          remainingDays.innerText = `${r_days}`;
        })
        .catch(error => console.error(error));
    }, false);
  }

  function postData(url = ``, data = {}) {
    // 既定のオプションには * が付いています
    return fetch(url, {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, cors, *same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, same-origin, *omit
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        // "Content-Type": "application/x-www-form-urlencoded",
      },
      redirect: "follow", // manual, *follow, error
      referrer: "no-referrer", // no-referrer, *client
      body: JSON.stringify(data), // 本文のデータ型は "Content-Type" ヘッダーと一致する必要があります
    })
    .then(response => response.json()); // レスポンスの JSON を解析
  }

  const makePrevMonth = function(date) {
    return date.add(-1, 'M'); // 先月
  }

  const makeNextMonth = function(date) {
    return date.add(1, 'M'); // 来月
  }

  const makeCurrentMonth = function() {
    return today.tz('Asia/Tokyo').format('YYYY-MM');
  }

  const submitForm = function(objId, monthName) {
    const form = document.createElement('form');
    form.action = `/objectives/${objId}/months/${monthName}`;
    form.method = 'get';
    document.body.appendChild(form);
    form.submit();
  }

  prev.addEventListener('click', function(e) {
    const prevMonth = makePrevMonth(calDate);
    const monthName = prevMonth.tz('Asia/Tokyo').format('YYYY-MM');
    submitForm(objId, monthName);
  }, false);

  next.addEventListener('click', function(e) {
    const nextMonth = makeNextMonth(calDate);
    const monthName = nextMonth.tz('Asia/Tokyo').format('YYYY-MM');
    submitForm(objId, monthName);
  }, false);

  current.addEventListener('click', function(e) {
    const monthName = makeCurrentMonth();
    submitForm(objId, monthName);
  }, false);

  displayCal(calDate);
}

