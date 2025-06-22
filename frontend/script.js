let currentAnalysis = null;

// 이미지 미리보기
function previewImage() {
  const input = document.getElementById("imageInput");
  const preview = document.getElementById("preview");
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = e => {
      preview.src = e.target.result;
      preview.style.display = "block";
    };
    reader.readAsDataURL(input.files[0]);
  } else {
    preview.style.display = "none";
    preview.src = "";
  }
}

// 이미지 분석
document.getElementById("analyzeBtn").addEventListener("click", async () => {
  const input = document.getElementById("imageInput");
  const status = document.getElementById("statusMessage");
  const analysisResult = document.getElementById("analysisResult");
  const questionSection = document.getElementById("questionSection");
  const answerResult = document.getElementById("answerResult");

  if (!input.files[0]) {
    status.textContent = "파일을 선택하세요.";
    status.style.color = "red";
    return;
  }
  status.textContent = "🔄 이미지 분석 중입니다...";
  status.style.color = "#007BFF";
  analysisResult.textContent = "";
  answerResult.textContent = "";
  questionSection.style.display = "none";
  currentAnalysis = null;

  const formData = new FormData();
  formData.append("chartImage", input.files[0]);

  try {
    const response = await fetch("http://127.0.0.1:5000/api/analyze", {
      method: "POST",
      body: formData,
    });
    if (!response.ok) throw new Error("분석 요청에 실패했습니다.");
    const data = await response.json();
    if (data.status === "success") {
      status.textContent = "✅ 분석 완료!";
      status.style.color = "green";
      analysisResult.textContent = data.analysis;
      currentAnalysis = data.analysis;
      questionSection.style.display = "block";
    } else {
      throw new Error(data.message || "알 수 없는 오류");
    }
  } catch (error) {
    status.textContent = `❌ 오류 발생: ${error.message}`;
    status.style.color = "red";
  }
});

// 분석 결과에 대해 질문하기
document.getElementById("askBtn").addEventListener("click", async () => {
  const userQuestion = document.getElementById("userQuestion").value.trim();
  const answerResult = document.getElementById("answerResult");
  const status = document.getElementById("statusMessage");

  if (!userQuestion) { alert("질문 내용을 입력하세요."); return; }
  if (!currentAnalysis || currentAnalysis.trim() === "") { alert("먼저 이미지를 분석하세요."); return; }

  status.textContent = "🔄 질문 처리 중입니다...";
  answerResult.textContent = "";

  try {
    const response = await fetch("http://127.0.0.1:5000/api/ask", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({analysis_result: currentAnalysis, user_question: userQuestion}),
    });
    if (!response.ok) throw new Error(`질문 처리 실패: ${response.status} ${response.statusText}`);
    const data = await response.json();
    if (data.status === "success") {
      status.textContent = "✅ 질문에 대한 답변입니다.";
      status.style.color = "green";
      answerResult.textContent = data.answer;
    } else {
      throw new Error(data.message || "알 수 없는 오류");
    }
  } catch (error) {
    status.textContent = `❌ 오류 발생: ${error.message}`;
    status.style.color = "red";
  }
});

// 포트폴리오 새로고침
document.getElementById("portfolioRefreshBtn").addEventListener("click", loadPortfolio);
window.addEventListener("DOMContentLoaded", loadPortfolio);

function loadPortfolio() {
  const portfolioInfo = document.getElementById("portfolioInfo");
  portfolioInfo.textContent = "포트폴리오 조회 중...";
  fetch("http://127.0.0.1:5000/api/portfolio")
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        let info = `보유 현금: ${data.portfolio.cash}원\n보유 주식:\n`;
        // stocks가 리스트임을 감안!
        for (const stock of data.portfolio.stocks || []) {
          info += `- ${stock.ticker} (${stock.name}): ${stock.quantity}주\n`;
        }
        portfolioInfo.textContent = info.trim();
      } else {
        portfolioInfo.textContent = `❌ ${data.message}`;
      }
    })
    .catch(err => { portfolioInfo.textContent = `❌ 오류: ${err.message}`; });
}

// 매수/매도 기능
document.getElementById("buyBtn").addEventListener("click", () => tradeStock("buy"));
document.getElementById("sellBtn").addEventListener("click", () => tradeStock("sell"));

function tradeStock(type) {
  const ticker = document.getElementById("tickerInput").value.trim();
  const quantity = document.getElementById("quantityInput").value.trim();
  const tradeStatus = document.getElementById("tradeStatus");
  if (!ticker || !quantity) { tradeStatus.textContent = "종목코드와 수량을 모두 입력하세요."; tradeStatus.style.color = "red"; return; }

  tradeStatus.textContent = (type === "buy" ? "매수" : "매도") + " 처리 중입니다...";
  tradeStatus.style.color = "#007BFF";

  fetch("http://127.0.0.1:5000/api/" + type, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ticker, quantity}),
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        tradeStatus.textContent = "✅ " + data.message;
        tradeStatus.style.color = "green";
        loadPortfolio();
      } else {
        tradeStatus.textContent = "❌ " + (data.message || "알 수 없는 오류");
        tradeStatus.style.color = "red";
      }
    })
    .catch(err => {
      tradeStatus.textContent = `❌ 오류: ${err.message}`;
      tradeStatus.style.color = "red";
    });
}
