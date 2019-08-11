'use strict';

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
const today = new Date(cal.dataset.today);
const todayStr = `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;

const displayCal = function(date) {
  const year = date.getFullYear(); 
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const firstDay = new Date(date.setDate(1)); // その月の初日
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

prev.addEventListener('click', function(e) {
  const prevMonth = new Date(today.setDate(0)); // 先月末日
  displayCal(prevMonth);
}, false);

next.addEventListener('click', function(e) {
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate(); // その月の末日
  const nextMonth = new Date(today.setDate(lastDay + 1)); // 次月の初日
  displayCal(nextMonth);
}, false);

displayCal(today);

