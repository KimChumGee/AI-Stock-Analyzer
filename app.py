# app.py (최종 통합 버전)

import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

# AI 및 시뮬레이션 모듈 임포트
from analysis_VLM_LLM import analyze_image, ask_question_with_analysis
from simulation import get_user_portfolio, buy_stock, sell_stock

# Flask 앱 생성 및 CORS 설정
app = Flask(__name__)
CORS(app)

# 파일 업로드를 위한 폴더 설정
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


# API 1: 차트 이미지 분석
@app.route('/api/analyze', methods=['POST']) # type: ignore
def analyze_chart():
    # 요청에 파일이 포함되어 있는지 확인
    if 'chartImage' not in request.files:
        return jsonify({"status": "error", "message": "이미지 파일이 없습니다."}), 400
    
    file = request.files['chartImage']
    
    # 파일 객체나 파일 이름이 유효한지 확인
    if not file or not file.filename:
        return jsonify({"status": "error", "message": "파일이 선택되지 않았습니다."}), 400

    # 안전한 파일명으로 로컬에 저장
    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    # AI 분석 모듈의 함수 호출
    try:
        analysis_result = analyze_image(filepath)
        return jsonify({"status": "success", "analysis": analysis_result})
    except Exception as e:
        return jsonify({"status": "error", "message": f"분석 중 오류 발생: {str(e)}"}), 500

# API 2: AI 분석에 대한 후속 질문
@app.route('/api/ask', methods=['POST']) # type: ignore
def ask_follow_up_question():
    data = request.json
    if not data:
        return jsonify({"status": "error", "message": "요청 데이터(JSON)가 없습니다."}), 400
    
    analysis_result = data.get('analysis_result')
    user_question = data.get('user_question')

    if not analysis_result or not user_question:
        return jsonify({"status": "error", "message": "분석 결과와 질문 내용이 모두 필요합니다."}), 400
    
    try:
        answer = ask_question_with_analysis(analysis_result, user_question)
        return jsonify({"status": "success", "answer": answer})
    except Exception as e:
        print("ask_follow_up_question error:", e)  # ← 여기에 추가
        return jsonify({"status": "error", "message": f"질문 처리 중 오류 발생: {str(e)}"}), 500

# API 3: 포트폴리오 정보 조회
@app.route('/api/portfolio', methods=['GET']) # type: ignore
def get_portfolio_info():
    try:
        portfolio_data = get_user_portfolio()
        return jsonify({"status": "success", "portfolio": portfolio_data})
    except Exception as e:
        return jsonify({"status": "error", "message": f"포트폴리오 조회 중 오류 발생: {str(e)}"}), 500

# API 4: 주식 매수
@app.route('/api/buy', methods=['POST']) # type: ignore
def buy_stock_api():
    data = request.json
    if not data:
        return jsonify({"status": "error", "message": "요청 데이터(JSON)가 없습니다."}), 400

    ticker = data.get('ticker')
    quantity = data.get('quantity')

    if not ticker or not quantity:
        return jsonify({"status": "error", "message": "종목코드(ticker)와 수량(quantity)이 필요합니다."}), 400
    
    try:
        result_message = buy_stock(ticker, int(quantity))
        return jsonify({"status": "success", "message": result_message})
    except Exception as e:
        return jsonify({"status": "error", "message": f"매수 처리 중 오류 발생: {str(e)}"}), 500

# API 5: 주식 매도
@app.route('/api/sell', methods=['POST']) # type: ignore
def sell_stock_api():
    data = request.json
    if not data:
        return jsonify({"status": "error", "message": "요청 데이터(JSON)가 없습니다."}), 400
        
    ticker = data.get('ticker')
    quantity = data.get('quantity')

    if not ticker or not quantity:
        return jsonify({"status": "error", "message": "종목코드(ticker)와 수량(quantity)이 필요합니다."}), 400

    try:
        result_message = sell_stock(ticker, int(quantity))
        return jsonify({"status": "success", "message": result_message})
    except Exception as e:
        return jsonify({"status": "error", "message": f"매도 처리 중 오류 발생: {str(e)}"}), 500

# 서버 실행
if __name__ == '__main__':
    # debug=True는 개발 중에만 사용하고, 실제 배포 시에는 False로 변경해야 합니다.
    app.run(port=5000, debug=True)