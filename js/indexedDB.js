//indexedDBの名前などの設定
const dbName = "kakeiboDB";
const storeName = "kakeiboStore";
const dbVersion = 1;

//データベース接続する。データベースが未作成なら新規作成する。
let database = indexedDB.open(dbName, dbVersion);

//データベースとオブジェクトストアの作成
database.onupgradeneeded = (event) =>  {
  let db = event.target.result;
  db.createObjectStore(storeName, { keyPath: "id" });
  console.log("データベースを新規作成しました");
}

//データベースに接続に成功した時に発生するイベント
database.onsuccess =  (event) => {
  let db = event.target.result;
  // 接続を解除する
  db.close();
  console.log("データベースに接続できました");
}
database.onerror = (event) => {
  console.log("データベースに接続できませんでした");
}

//フォームの内容をDBに登録する
function regist () {
  //フォームの入力チェック。falseが返却されたら登録処理を中断
  if (inputCheck() == false) {
    return;
  }
  //ラジオボタンの取得
  let radio = document.getElementsByName("flexRadioDefault");
  let flexRadioDefault;
  for (let i = 0; i < radio.length; i++) {
    if (radio[i].checked == true) {
      flexRadioDefault = radio[i].value;
      break;
    }
  }
  //フォームに入力された値を取得
  let date = document.getElementById("date").value;
  let amount = document.getElementById("amount").value;
  let memo = document.getElementById("memo").value;
  let category = document.getElementById("floatingSelect").value;
  //ラジオボタンが収入を選択時はカテゴリを「収入」とする
  if (flexRadioDefault == "収入") {
    category = "収入";
  }
  //データベースにデータを登録する
  let data = insertData(flexRadioDefault, date, category, amount, memo);
  //データの挿入
  function insertData(flexRadioDefault, date, category, amount, memo) {
    //一意のIDを現在の日時から作成
    let uniqueID = new Date().getTime().toString();
    console.log(uniqueID);
    //DBに登録するための連想配列のデータを作成
    let data = {
      id: uniqueID,
      flexRadioDefault: flexRadioDefault,
      date: String(date),
      category: category,
      amount: amount,
      memo: memo,
    }
    return data;
  }
  //データベースを開く
  let database = indexedDB.open(dbName, dbVersion);

  //データベースの開けなかった時の処理
  database.onerror =  (event) => {
    console.log("データベースに接続できませんでした");
  }

  //データベースを開いたらデータの登録を実行
  database.onsuccess = (event) => {
    let db = event.target.result;
    let transaction = db.transaction(storeName, "readwrite");
    transaction.oncomplete = function (event) {
      console.log("トランザクション完了");
    }
    transaction.onerror = (event) => {
      console.log("トランザクションエラー");
    }
    let store = transaction.objectStore(storeName);
    let addData = store.add(data);
    addData.onsuccess = () => {
      console.log("データが登録できました");
      alert("登録しました");
    }
    addData.onerror = () => {
      console.log("データが登録できませんでした");
    }
    db.close();
  }
  //入手金一覧を作成
  createList();
}
function createList() {
  //データベースからデータを全件取得
  let database = indexedDB.open(dbName);
  database.onsuccess = function (event) {
    let db = event.target.result;
    let transaction = db.transaction(storeName, "readonly");
    let store = transaction.objectStore(storeName);
    store.getAll().onsuccess = function (data) {
      console.log(data);
      let rows = data.target.result;

      let section = document.getElementById("list");
      //入出金一覧のテーブルを作る
      //バッククオートでヒアドキュメント（テンプレートリテラル）
      let table = `
          <table class="table table-dark table-hover">
              <tr>
                  <th>日付</th>
                  <th>収支</th>
                  <th>カテゴリ</th>
                  <th>金額</th>
                  <th>メモ</th>
                  <th>削除
              </th>
          </tr>
      `;
      //入出金のデータを表示
      rows.forEach((element) => {
        console.log(element);
        table += `
          <tr>
            <td>${element.date}</td>
            <td>${element.flexRadioDefault}</td>
            <td>${element.category}</td>
            <td>${element.amount}</td>
            <td>${element.memo}</td>
            <td><button type="button" class="btn btn-danger" onclick="deleteData('${element.id}')">×</button></td>
          </tr>
        `;
      })
      table += `</table>`;
      section.innerHTML = table;
      //円グラフの作成
      createPieChart(rows);
    }
  }
}
//データの削除
function deleteData(id) {
  //データベースを開く
  let database = indexedDB.open(dbName, dbVersion);
  database.onupgradeneeded = (event) => {
    let db = event.target.result;
  }
  //開いたら削除実行
  database.onsuccess = (event) => {
    let db = event.target.result;
    let transaction = db.transaction(storeName, "readwrite");
    transaction.oncomplete = (event) => {
      console.log("トランザクション完了");
    }
    transaction.onerror = (event) => {
      console.log("トランザクションエラー");
    }
    let store = transaction.objectStore(storeName);
    let deleteData = store.delete(id);
    deleteData.onsuccess = (event) => {
        console.log("削除成功");
        createList();
    }
    deleteData.onerror = (event) => {
        console.log("削除失敗");
    }
    db.close();
  }
  //データベースの開けなかった時の処理
  database.onerror = (event) => {
    console.log("データベースに接続できませんでした");
  }
}
