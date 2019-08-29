'use strict';
import moment from 'moment-timezone';

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

  const freqAchvRate = document.getElementById('freqAchvRate');
  const objAchvRate = document.getElementById('objAchvRate');

  // TODO: ここで必要なデータを取得する
  // Server → pug → JS
  const calDate = new Date(cal.dataset.calmonth);
  const today = new Date(cal.dataset.today);
  const todayStr = `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;
  const objId = cal.dataset.objid;
  const stampStrs = cal.dataset.stamps;

  // stamp
  const stampTypeObj = {
    map: new Map([["circle", "&#x2b55;"], ["check", "&#x2705;"], ["smile", "&#x1f603;"], ["heart", "&#x2764;"], ["star", "U+2B50"], ["bell", "&#x1f514;"]]),
    defaultType: function() {
      return Array.from(this.map.keys())[0];
    }
  }

  const setupStampMapMap = function(stampStrs) {
    let stampMapMap = new Map();
    let tmp = stampStrs.match(/\{[^\{\}]+\}/g);
    if (tmp) {
      tmp.forEach((t) => {
        let json = JSON.parse(t);
        let stampMap = new Map();
        for (let [key, value] of Object.entries(json)) {
          if (key !== 'stampName') {
            stampMap.set(key, value);
          }
        }
        stampMapMap.set(json.stampName, stampMap);
      });
    }
    return stampMapMap;
  }

  let stampMapMap = setupStampMapMap(stampStrs);

  const displayCal = function(calDate) {
    const year = makeYear(calDate); 
    const month = makeMonth(calDate);
    const day = makeDay(calDate);
    const firstDay = new Date(calDate.setDate(1)); // その月の初日
    const lastDay = new Date(year, month, 0); // その月の末日
    const startValue = firstDay.getDay(); // カレンダーの開始値( 0 - 6 )
    const endValue = startValue + lastDay.getDate(); // カレンダーの終了値

    const table = document.createElement("table");
    const tHead = document.createElement("thead");
    const tBody = document.createElement("tbody");
    const tr = document.createElement("tr");
    const h5 = document.createElement("h5");
    h5.innerText = `${year}年${month}月`;

    // 全ての子要素を削除
    while (cal.firstChild) {
      cal.removeChild(cal.firstChild);
    }

    cal.appendChild(h5);
    cal.appendChild(prev);
    cal.appendChild(next);
    cal.appendChild(table);
    table.appendChild(tHead);
    tHead.appendChild(tr);

    for (let i = 0, len = week.length; i < len; i++) {
      let th = document.createElement("th");
      tr.appendChild(th);
      th.innerText = week[i];
    }
    table.appendChild(tBody);

    let count = 0;
    let days = 1;
    for (let i = 0; i < 6; i++) {
      let tr = document.createElement("tr");
      for (let j = 0, len = week.length; j < len; j++) {
        let td = document.createElement("td");
        if (startValue <= count && count < endValue) {
          // TODO: stamps
          td.innerText = days;
          td.setAttribute('data-day', days);
          const tdDate = `${year}-${month}-${td.dataset.day}`;
          const day = td.dataset.day;
          const stampName = day;
          // 当日の td に背景色をつける
          if (todayStr === tdDate) {
             td.style.backgroundColor = 'skyblue';
          }
          // TODO:
          if (stampMapMap.has(stampName)) {
            if (stampMapMap.get(stampName).get("stampStatus")) {
              pressStamp(td, stampMapMap.get(stampName).get("type"));
            } else {
              removeStamp(td, day);
            }
          }
          addStampEventListener(td, calDate, stampMapMap, objId);
          tr.appendChild(td)  
          days++;
        }
        count++;
        tr.appendChild(td)  
      }
      tBody.appendChild(tr);
    }
  }

  const initStampMap = function(stampStatus, objId) {
    let stampMap = new Map();
    const defaultStampType = stampTypeObj.defaultType();
    stampMap.set("stampStatus", stampStatus);
    stampMap.set("type", defaultStampType);
    stampMap.set("color", 0);
    stampMap.set("objectiveId", objId);
    return stampMap;
  }

  const pressStamp = function(elem, type) {
    if (stampTypeObj.map.has(type)) {
      elem.innerText = '';
      elem.innerHTML = stampTypeObj.map.get(type);
    }
  }

  const removeStamp = function(elem, str) {
    elem.innerHTML = '';
    elem.innerText = str;
  }

  const addStampEventListener = function(elem, date, stampMapMap, objId) {
    elem.addEventListener('click', function(e) {
      // TODO: 
      const day = elem.dataset.day;
      const stampName = day;
      const tdDate = `${makeYear(date)}-${makeMonth(date)}-${day}`;
      const monthName = makeMonthName(date);
      let stampStatus = false;

      if (stampMapMap.has(stampName)) {
        stampStatus = !stampMapMap.get(stampName).get("stampStatus");
        stampMapMap.get(stampName).set("stampStatus", stampStatus);
        if (stampStatus) {
          pressStamp(elem, stampMapMap.get(stampName).get("type"));
        } else {
          removeStamp(elem, day);
        }
      } else {
        stampStatus = !stampStatus;
        stampMapMap.set(stampName, initStampMap(stampStatus, objId));
        pressStamp(elem, stampMapMap.get(stampName).get("type"));
      }
      postData(`/objectives/${objId}/months/${monthName}/stamps/${stampName}`, { stampStatus: stampStatus })
        .then((data) => {
          // console.log(typeof JSON.stringify(data)); // JSON-string from `response.json()` call
          const freqAchvRate_p = data["achvRate"]["freqAchvRate_p"];
          const freqAchvRate_f = data["achvRate"]["freqAchvRate_f"];
          const objAchvRate_p = data["achvRate"]["objAchvRate_p"];
          const objAchvRate_f = data["achvRate"]["objAchvRate_f"];
          freqAchvRate.innerText = `${freqAchvRate_p} % ${freqAchvRate_f}`;
          objAchvRate.innerText = `${objAchvRate_p} % ${objAchvRate_f}`;
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

  const makeYear = function(date) {
    return date.getFullYear();
  }

  const makeMonth = function(date) {
    return date.getMonth() + 1;
  }

  const makeDay = function(date) {
    return date.getDate();
  }

  const makePrevMonth = function(date) {
    return new Date(date.setDate(0)); // 先月末日
  }

  const makeNextMonth = function(date) {
    const lastDay = new Date(makeYear(date), makeMonth(date), 0).getDate(); // その月の末日
    return new Date(date.setDate(lastDay + 1)); // 次月の初日
  }

  const makeMonthName = function(date) {
    return  moment(date).tz('Asia/Tokyo').format('YYYY-MM');
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
    const monthName = makeMonthName(prevMonth);
    submitForm(objId, monthName);
  }, false);

  next.addEventListener('click', function(e) {
    const nextMonth = makeNextMonth(calDate);
    const monthName = makeMonthName(nextMonth);
    submitForm(objId, monthName);
  }, false);

  displayCal(calDate);
}

