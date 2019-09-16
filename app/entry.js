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
  const deleteBtn = document.getElementById('deleteBtn');
  const deleteForm = document.getElementById('deleteForm');

  deleteBtn.addEventListener('click', function(e) {
    if (confirm('本当に削除しますか？')) {
      deleteForm.submit();
    }
  }, false);

} else if (pathName.match(/objectives/)) {

  const week = ['日', '月', '火', '水', '木', '金', '土'];
  const cal = document.getElementById("calendar");
  const prev = document.createElement("button");
  const next = document.createElement("button");
  prev.id = "prev";
  next.id = "next";
  prev.innerText = "前の月";
  next.innerText = "次の月";

  const achievedNum = document.getElementById('achievedNum');
  const objAchvRate = document.getElementById('objAchvRate');
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
        stampMap.set(json.stampName, json.stampStatus);
      });
    }
    return stampMap;
  }

  let stampMap = setupStampMap(stampStrs);

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
    const tableTitle_btns = document.createElement("div");
    const tableBtns = document.createElement("div");
    
    h5.innerText = moment(calDate).tz('Asia/Tokyo').format('YYYY年MM月');

    // スタイル適用( bootstrap )
    table.classList.add("table");
    table.classList.add("table-bordered");
    table.style.tableLayout = "fixed";
    tableTitle_btns.classList.add("d-flex");
    tableTitle_btns.classList.add("justify-content-between");
    tableTitle_btns.classList.add("mt-5");
    tableTitle_btns.classList.add("mb-1");
    prev.classList.add("mr-2");

    tableBtns.appendChild(prev);
    tableBtns.appendChild(next);
    tableTitle_btns.appendChild(h5);
    tableTitle_btns.appendChild(tableBtns);

    // 全ての子要素を削除
    while (cal.firstChild) {
      cal.removeChild(cal.firstChild);
    }

    cal.appendChild(tableTitle_btns);
    cal.appendChild(table);
    table.appendChild(tHead);
    tHead.appendChild(tr);

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
          const stampName = day;

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

          // TODO:
          if (stampMap.has(stampName)) {
            // if (stampMapMap.get(stampName).get("stampStatus")) {
            if (stampMap.get(stampName)) {
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
  
  // TODO: stamp の属性見直し(status, type, color 不要)
  const initStampMap = function(stampStatus, objId) {
    let stampMap = new Map();
    stampMap.set("stampStatus", stampStatus);
    stampMap.set("objectiveId", objId);
    return stampMap;
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
      // TODO: 
      const day = elem1.dataset.day;
      const stampName = day;
      const tdDate = `${date.year()}-${date.month + 1}-${day}`;
      const monthName = date.tz('Asia/Tokyo').format('YYYY-MM');
      let stampStatus = false;

      if (stampMap.has(stampName)) {
        stampStatus = !stampMap.get(stampName);
        stampMap.set(stampName, stampStatus);
        if (stampStatus) {
          pressStamp(elem2, stampType);
        } else {
          removeStamp(elem2);
        }
      } else {
        stampStatus = !stampStatus;
        stampMap.set(stampName, stampStatus);
        pressStamp(elem2, stampType);
      }
      postData(`/objectives/${objId}/months/${monthName}/stamps/${stampName}`, { stampStatus: stampStatus })
        .then((data) => {
          const num = data["aggregate"]["achievedNum"];
          const rate = data["aggregate"]["objAchvRate"];
          const days = data["aggregate"]["remainingDays"];
          achievedNum.innerText = `${num}`;
          objAchvRate.innerText = `${rate}`;
          remainingDays.innerText = `${days}`;
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

  displayCal(calDate);
}

