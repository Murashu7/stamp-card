/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var week = ['日', '月', '火', '水', '木', '金', '土'];
var cal = document.getElementById("calendar");
var prev = document.createElement("button");
var next = document.createElement("button");
prev.id = "prev";
next.id = "next";
prev.innerText = "前の月";
next.innerText = "次の月"; // TODO: ここで必要なデータを取得する
// Server → pug → JS

var today = new Date(cal.dataset.today);
var todayStr = "".concat(today.getFullYear(), "-").concat(today.getMonth() + 1, "-").concat(today.getDate());

var displayCal = function displayCal(date) {
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getDate();
  var firstDay = new Date(date.setDate(1)); // その月の初日

  var lastDay = new Date(year, month, 0); // その月の末日

  var startValue = firstDay.getDay(); // 開始値( 0 - 6 )

  var endValue = startValue + lastDay.getDate(); // 終了値

  var table = document.createElement("table");
  var tHead = document.createElement("thead");
  var tBody = document.createElement("tbody");
  var tr = document.createElement("tr");
  var h5 = document.createElement("h5");
  h5.innerText = "".concat(year, "\u5E74").concat(month, "\u6708"); // 全ての子要素を削除

  while (cal.firstChild) {
    cal.removeChild(cal.firstChild);
  }

  cal.appendChild(h5);
  cal.appendChild(prev);
  cal.appendChild(next);
  cal.appendChild(table);
  table.appendChild(tHead);
  tHead.appendChild(tr);

  for (var i = 0, len = week.length; i < len; i++) {
    var th = document.createElement("th");
    tr.appendChild(th);
    th.innerText = week[i];
  }

  table.appendChild(tBody);
  var count = 0;
  var days = 0;

  for (var _i = 0; _i < 6; _i++) {
    var _tr = document.createElement("tr");

    var _loop = function _loop(j, _len) {
      var td = document.createElement("td");

      if (startValue <= count && count < endValue) {
        days++;
        td.innerText = days;
        var tdDate = "".concat(year, "-").concat(month, "-").concat(td.textContent); // 当日の td に背景色をつける

        if (todayStr === tdDate) {
          td.style.backgroundColor = 'skyblue';
        }

        td.addEventListener('click', function (e) {
          // TODO: 
          if (td.textContent) {
            console.log("".concat(year, "-").concat(month, "-").concat(td.textContent));
          }
        });

        _tr.appendChild(td);
      }

      count++;

      _tr.appendChild(td);
    };

    for (var j = 0, _len = week.length; j < _len; j++) {
      _loop(j, _len);
    }

    tBody.appendChild(_tr);
  }
};

prev.addEventListener('click', function (e) {
  var prevMonth = new Date(today.setDate(0)); // 先月末日

  displayCal(prevMonth);
}, false);
next.addEventListener('click', function (e) {
  var lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate(); // その月の末日

  var nextMonth = new Date(today.setDate(lastDay + 1)); // 次月の初日

  displayCal(nextMonth);
}, false);
displayCal(today);

/***/ })
/******/ ]);