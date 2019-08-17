'use strict';
import moment from 'moment-timezone';

const week = ['日', '月', '火', '水', '木', '金', '土'];
const cal = document.getElementById("calendar");
const prev = document.createElement("button");
const next = document.createElement("button");
prev.id = "prev";
next.id = "next";
prev.innerText = "前の月";
next.innerText = "次の月";

// TODO: ここで必要なデータを取得する
// Server → pug → JS
const calMonth = new Date(cal.dataset.calmonth);
const today = new Date(cal.dataset.today);
const todayStr = `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;
const objId = cal.dataset.objid;

const displayCal = function(calMonth) {
  const year = calMonth.getFullYear(); 
  const month = calMonth.getMonth() + 1;
  const day = calMonth.getDate();
  const firstDay = new Date(calMonth.setDate(1)); // その月の初日
  const lastDay = new Date(year, month, 0); // その月の末日
  const startValue = firstDay.getDay(); // 開始値( 0 - 6 )
  const endValue = startValue + lastDay.getDate(); // 終了値

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
  let days = 0;
  for (let i = 0; i < 6; i++) {
    let tr = document.createElement("tr");
    for (let j = 0, len = week.length; j < len; j++) {
      let td = document.createElement("td");
      if (startValue <= count && count < endValue) {
        days++;
        td.innerText = days;
        const tdDate = `${year}-${month}-${td.textContent}`;
        // 当日の td に背景色をつける
        if (todayStr === tdDate) {
           td.style.backgroundColor = 'skyblue';
        }
        td.addEventListener('click', function(e) {
          // TODO: 
          if (td.textContent) {
            console.log(`${year}-${month}-${td.textContent}`);
          }
        });
        tr.appendChild(td)  
      }
      count++;
      tr.appendChild(td)  
    }
    tBody.appendChild(tr);
  }
}

const makePrevMonth = function() {
  return new Date(calMonth.setDate(0)); // 先月末日
}

const makeNextMonth = function() {
  const lastDay = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate(); // その月の末日
  return new Date(calMonth.setDate(lastDay + 1)); // 次月の初日
}

const makeMonthName = function(month) {
  return  moment(month).tz('Asia/Tokyo').format('YYYY-MM');
} 

const submitForm = function(objId, monthName) {
  const form = document.createElement('form');
  form.action = `/objectives/${objId}/months/${monthName}`;
  form.method = 'get';
  document.body.appendChild(form);
  form.submit();
}

prev.addEventListener('click', function(e) {
  const prevMonth = makePrevMonth();
  const monthName = makeMonthName(prevMonth);
  submitForm(objId, monthName);
}, false);

next.addEventListener('click', function(e) {
  const nextMonth = makeNextMonth();
  const monthName = makeMonthName(nextMonth);
  submitForm(objId, monthName);
}, false);

displayCal(calMonth);

