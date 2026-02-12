
/**
 * Soccer League Manager Pro - Backend for Google Sheets
 * 
 * データの視認性向上のため、各カテゴリを別々の行に保存します。
 * A列: カテゴリ名 | B列: JSONデータ | C列: 更新日時
 */

const SHEET_NAME = 'MasterData';
const CATEGORIES = ['O-40', 'O-50', 'O-60'];

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  return sheet;
}

function doGet() {
  const sheet = setup();
  const values = sheet.getRange(1, 1, 3, 2).getValues(); // A1:B3 を取得
  
  const allData = {};
  values.forEach(row => {
    const categoryName = row[0];
    const jsonData = row[1];
    if (categoryName && jsonData) {
      try {
        allData[categoryName] = JSON.parse(jsonData);
      } catch (e) {
        console.error("Parse error for " + categoryName);
      }
    }
  });
  
  return ContentService.createTextOutput(JSON.stringify(allData))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const sheet = setup();
    const payload = e.postData.contents;
    if (!payload) throw new Error("No payload");
    
    const data = JSON.parse(payload);
    const timestamp = new Date();
    
    // カテゴリごとに特定の行へ書き込み
    // 1行目: O-40, 2行目: O-50, 3行目: O-60
    CATEGORIES.forEach((cat, index) => {
      const rowIndex = index + 1;
      const categoryData = data[cat] || { teams: [], matches: {} };
      
      sheet.getRange(rowIndex, 1).setValue(cat); // A列: カテゴリ名
      sheet.getRange(rowIndex, 2).setValue(JSON.stringify(categoryData)); // B列: JSON
      sheet.getRange(rowIndex, 3).setValue(timestamp); // C列: 更新日時
    });
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
